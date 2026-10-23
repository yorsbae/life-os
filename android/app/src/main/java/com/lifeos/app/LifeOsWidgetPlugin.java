package com.lifeos.app;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.os.Build;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Jembatan JS -> widget: menyimpan snapshot agenda dan meminta pemasangan widget. */
@CapacitorPlugin(name = "LifeOsWidget")
public class LifeOsWidgetPlugin extends Plugin {

    @PluginMethod
    public void save(PluginCall call) {
        String json = call.getString("json");
        if (json == null || json.isEmpty()) {
            call.reject("json kosong");
            return;
        }
        Context context = getContext();
        context.getSharedPreferences(LifeOsWidgetProvider.PREFS, Context.MODE_PRIVATE)
            .edit().putString(LifeOsWidgetProvider.KEY_SNAPSHOT, json).apply();
        LifeOsWidgetProvider.refreshAll(context);
        call.resolve();
    }

    @PluginMethod
    public void clear(PluginCall call) {
        Context context = getContext();
        context.getSharedPreferences(LifeOsWidgetProvider.PREFS, Context.MODE_PRIVATE)
            .edit().remove(LifeOsWidgetProvider.KEY_SNAPSHOT).apply();
        LifeOsWidgetProvider.refreshAll(context);
        call.resolve();
    }

    @PluginMethod
    public void requestPin(PluginCall call) {
        Context context = getContext();
        JSObject result = new JSObject();
        boolean supported = false;
        boolean requested = false;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            AppWidgetManager manager = AppWidgetManager.getInstance(context);
            supported = manager.isRequestPinAppWidgetSupported();
            if (supported) {
                requested = manager.requestPinAppWidget(
                    new ComponentName(context, LifeOsWidgetProvider.class), null, null);
            }
        }
        result.put("supported", supported);
        result.put("requested", requested);
        call.resolve(result);
    }

    @PluginMethod
    public void count(PluginCall call) {
        JSObject result = new JSObject();
        result.put("count", LifeOsWidgetProvider.widgetCount(getContext()));
        call.resolve(result);
    }
}
