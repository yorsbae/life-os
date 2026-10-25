import type { SqlDriver, SqlStatement, SqlValue } from "./types";

// Banyak hook di satu layar (mis. Beranda) memanggil SELECT yang persis sama pada saat bersamaan
// (expenses dibaca 3x, incomes 2x, dst). Setiap query harus melewati jembatan Capacitor ke SQLite
// native secara berurutan, jadi pengulangan itu memperlambat layar pertama.
//
// Pembungkus ini menggabungkan SELECT identik yang SEDANG berjalan menjadi satu eksekusi.
// Aman terhadap data basi: setiap penulisan (batch) mengosongkan daftar sebelum dan sesudah
// dijalankan, sehingga pembacaan yang dimulai setelah penulisan selesai selalu query baru.

export function coalesceReads(inner: SqlDriver): SqlDriver {
  const inflight = new Map<string, Promise<Record<string, unknown>[]>>();

  return {
    all(sql: string, params: SqlValue[] = []) {
      const key = `${sql}\u0000${JSON.stringify(params)}`;
      const hit = inflight.get(key);
      if (hit) return hit;
      const p: Promise<Record<string, unknown>[]> = inner.all(sql, params).finally(() => {
        if (inflight.get(key) === p) inflight.delete(key);
      });
      inflight.set(key, p);
      return p;
    },
    async batch(statements: SqlStatement[]) {
      inflight.clear();
      try {
        await inner.batch(statements);
      } finally {
        inflight.clear();
      }
    },
  };
}
