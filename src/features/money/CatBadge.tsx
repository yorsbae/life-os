import type { CatMeta } from "./categories";

/** Lingkaran ikon berwarna per kategori. */
export default function CatBadge({ meta, size = 36 }: { meta: Pick<CatMeta, "icon" | "color">; size?: number }) {
  const Icon = meta.icon;
  return (
    <span
      className="shrink-0 rounded-full flex items-center justify-center"
      style={{ width: size, height: size, background: `${meta.color}26`, color: meta.color }}
    >
      <Icon size={size * 0.5} />
    </span>
  );
}
