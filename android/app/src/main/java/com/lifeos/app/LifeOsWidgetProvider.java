package com.lifeos.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;
import java.util.Locale;

/**
 * Widget Home Screen: agenda hari ini, tugas, dan ringkasan kebiasaan.
 *
 * Datanya berasal dari JSON snapshot yang ditulis aplikasi (LifeOsWidgetPlugin) ke SharedPreferences
 * privat; widget tidak pernah membuka database. Snapshot memuat 7 hari ke depan sehingga widget tetap
 * benar setelah pergantian hari walau aplikasi belum dibuka; alarm tengah malam memicu render ulang.
 */
public class LifeOsWidgetProvider extends AppWidgetProvider {
    static final String PREFS = "lifeos_widget";
    static final String KEY_SNAPSHOT = "snapshot";
    static final String ACTION_MIDNIGHT = "com.lifeos.app.WIDGET_MIDNIGHT";

    private static final int[] ROW_IDS = {
        R.id.widget_row1, R.id.widget_row2, R.id.widget_row3,
        R.id.widget_row4, R.id.widget_row5, R.id.widget_row6,
    };

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] appWidgetIds) {
        for (int id : appWidgetIds) render(context, manager, id);
        scheduleMidnight(context);
    }

    @Override
    public void onAppWidgetOptionsChanged(Context context, AppWidgetManager manager, int id, Bundle newOptions) {
        render(context, manager, id); // ukuran berubah -> jumlah baris berubah
    }

    @Override
    public void onEnabled(Context context) {
        scheduleMidnight(context);
    }

    @Override
    public void onDisabled(Context context) {
        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (am != null) am.cancel(midnightIntent(context));
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        String action = intent == null ? null : intent.getAction();
        if (ACTION_MIDNIGHT.equals(action)
            || Intent.ACTION_DATE_CHANGED.equals(action)
            || Intent.ACTION_TIME_CHANGED.equals(action)
            || Intent.ACTION_TIMEZONE_CHANGED.equals(action)) {
            refreshAll(context);
            scheduleMidnight(context);
        }
    }

    /** Render ulang semua widget yang terpasang. */
    static void refreshAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, LifeOsWidgetProvider.class));
        for (int id : ids) render(context, manager, id);
    }

    static int widgetCount(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        return manager.getAppWidgetIds(new ComponentName(context, LifeOsWidgetProvider.class)).length;
    }

    // ------------------------------------------------------------------ render

    private static void render(Context context, AppWidgetManager manager, int widgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_lifeos);

        Bundle options = manager.getAppWidgetOptions(widgetId);
        int minHeightDp = options == null ? 110 : options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT, 110);
        // ~64dp untuk header + footer, ~20dp per baris.
        int maxRows = Math.max(2, Math.min(ROW_IDS.length, (minHeightDp - 64) / 20));

        Calendar now = Calendar.getInstance();
        String today = ymd(now);
        views.setTextViewText(R.id.widget_date,
            new SimpleDateFormat("EEE, d MMM", Locale.getDefault()).format(now.getTime()));
        views.setOnClickPendingIntent(R.id.widget_root, link(context, "calendar", 1));
        views.setOnClickPendingIntent(R.id.widget_footer, link(context, "habits", 2));

        List<String> lines = new ArrayList<>();
        String empty = null;
        String footer = "";

        JSONObject snap = loadSnapshot(context);
        if (snap == null) {
            empty = context.getString(R.string.widget_setup);
        } else {
            JSONObject labels = snap.optJSONObject("labels");
            JSONObject day = findDay(snap, today);
            if (day == null) {
                empty = label(labels, "setup", context.getString(R.string.widget_setup));
            } else {
                fillLines(context, snap, labels, day, maxRows, lines);
                if (lines.isEmpty()) empty = label(labels, "empty", context.getString(R.string.widget_empty));
            }
            // Habit dan tugas terlambat dihitung saat snapshot dibuat: hanya valid bila dibuat hari ini.
            if (day != null && today.equals(snap.optString("date"))) footer = buildFooter(snap, labels);
        }

        for (int i = 0; i < ROW_IDS.length; i++) {
            if (i < lines.size()) {
                views.setTextViewText(ROW_IDS[i], lines.get(i));
                views.setViewVisibility(ROW_IDS[i], View.VISIBLE);
            } else {
                views.setViewVisibility(ROW_IDS[i], View.GONE);
            }
        }
        if (empty != null) {
            views.setTextViewText(R.id.widget_empty, empty);
            views.setViewVisibility(R.id.widget_empty, View.VISIBLE);
        } else {
            views.setViewVisibility(R.id.widget_empty, View.GONE);
        }
        if (footer.isEmpty()) {
            views.setViewVisibility(R.id.widget_footer, View.GONE);
        } else {
            views.setTextViewText(R.id.widget_footer, footer);
            views.setViewVisibility(R.id.widget_footer, View.VISIBLE);
        }

        manager.updateAppWidget(widgetId, views);
    }

    private static void fillLines(Context context, JSONObject snap, JSONObject labels, JSONObject day,
                                  int maxRows, List<String> out) {
        JSONArray items = day.optJSONArray("items");
        int count = items == null ? 0 : items.length();
        int hiddenByCap = day.optInt("more", 0);
        int total = count + hiddenByCap;
        // Bila tidak muat, sisakan satu baris untuk "+N lagi".
        int show = total <= maxRows ? count : Math.min(count, maxRows - 1);

        String eventLabel = label(labels, "event", context.getString(R.string.widget_label_event));
        String taskLabel = label(labels, "task", context.getString(R.string.widget_label_task));

        for (int i = 0; i < show; i++) {
            JSONObject it = items.optJSONObject(i);
            if (it == null) continue;
            boolean isTask = "t".equals(it.optString("k"));
            String title = it.optString("title", "");
            if (title.isEmpty()) title = isTask ? taskLabel : eventLabel; // judul disembunyikan
            String time = it.optString("time", "");
            StringBuilder line = new StringBuilder();
            if (isTask) line.append("☐ ");
            if (!time.isEmpty()) line.append(time).append("  ");
            line.append(title);
            out.add(line.toString());
        }
        int remaining = total - show;
        if (remaining > 0) {
            out.add(label(labels, "more", "+{0}").replace("{0}", String.valueOf(remaining)));
        }
    }

    private static String buildFooter(JSONObject snap, JSONObject labels) {
        List<String> parts = new ArrayList<>();
        JSONObject habits = snap.optJSONObject("habits");
        if (habits != null && habits.optInt("total", 0) > 0) {
            parts.add(label(labels, "habit", "{0}/{1}")
                .replace("{0}", String.valueOf(habits.optInt("done", 0)))
                .replace("{1}", String.valueOf(habits.optInt("total", 0))));
        }
        int overdue = snap.optInt("overdue", 0);
        if (overdue > 0) {
            parts.add(label(labels, "overdue", "{0}").replace("{0}", String.valueOf(overdue)));
        }
        StringBuilder sb = new StringBuilder();
        for (String p : parts) {
            if (sb.length() > 0) sb.append("  ·  ");
            sb.append(p);
        }
        return sb.toString();
    }

    // ----------------------------------------------------------------- helpers

    private static JSONObject loadSnapshot(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String raw = prefs.getString(KEY_SNAPSHOT, null);
        if (raw == null) return null;
        try {
            return new JSONObject(raw);
        } catch (JSONException e) {
            return null; // data rusak: tampilkan keadaan awal, jangan crash
        }
    }

    private static JSONObject findDay(JSONObject snap, String date) {
        JSONArray days = snap.optJSONArray("days");
        if (days == null) return null;
        for (int i = 0; i < days.length(); i++) {
            JSONObject d = days.optJSONObject(i);
            if (d != null && date.equals(d.optString("date"))) return d;
        }
        return null;
    }

    private static String label(JSONObject labels, String key, String fallback) {
        if (labels == null) return fallback;
        String v = labels.optString(key, "");
        return v.isEmpty() ? fallback : v;
    }

    private static String ymd(Calendar c) {
        return String.format(Locale.US, "%04d-%02d-%02d",
            c.get(Calendar.YEAR), c.get(Calendar.MONTH) + 1, c.get(Calendar.DAY_OF_MONTH));
    }

    /** Ketukan membuka aplikasi pada halaman tertentu lewat deep link lifeos://<rute>. */
    private static PendingIntent link(Context context, String route, int requestCode) {
        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse("lifeos://" + route));
        intent.setClass(context, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        return PendingIntent.getActivity(context, requestCode, intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private static PendingIntent midnightIntent(Context context) {
        Intent intent = new Intent(context, LifeOsWidgetProvider.class).setAction(ACTION_MIDNIGHT);
        return PendingIntent.getBroadcast(context, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    /** Alarm tidak-presisi (tanpa izin khusus) sesaat setelah tengah malam agar tanggal widget berganti. */
    static void scheduleMidnight(Context context) {
        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        Calendar next = Calendar.getInstance();
        next.add(Calendar.DAY_OF_YEAR, 1);
        next.set(Calendar.HOUR_OF_DAY, 0);
        next.set(Calendar.MINUTE, 1);
        next.set(Calendar.SECOND, 0);
        next.set(Calendar.MILLISECOND, 0);
        am.set(AlarmManager.RTC, next.getTimeInMillis(), midnightIntent(context));
    }
}
