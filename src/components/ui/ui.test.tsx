import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import CurrencyInput from "./CurrencyInput";
import Select from "./Select";
import { DangerButton, DeleteButton } from "./DeleteButton";

describe("CurrencyInput", () => {
  it("prefix Rp hanya satu dan padding kiri lewat inline style (tidak kalah oleh .input-field)", () => {
    const html = renderToStaticMarkup(<CurrencyInput value={1500000} onChange={() => {}} placeholder="Rp 0" className="input-field" />);
    expect(html.match(/Rp/g)).toHaveLength(1); // placeholder "Rp 0" dibersihkan, prefix tinggal satu
    expect(html).toContain("padding-left:2.5rem");
    expect(html).toContain('value="1.500.000"'.replace(/\./g, html.includes("1,500,000") ? "," : "."));
  });
});

describe("Select", () => {
  const opts = [
    <option key="a" value="a">Alpha</option>,
    <option key="b" value="b">Beta</option>,
  ];

  it("menampilkan label opsi terpilih pada tombol, bukan <select> native", () => {
    const html = renderToStaticMarkup(<Select value="b" onChange={() => {}}>{opts}</Select>);
    expect(html).not.toContain("<select");
    expect(html).toContain("Beta");
    expect(html).not.toContain("Alpha"); // daftar baru muncul setelah dibuka
    expect(html).toContain('aria-haspopup="listbox"');
  });

  it("memakai placeholder bila nilai tidak cocok dengan opsi apa pun", () => {
    const html = renderToStaticMarkup(<Select value="" placeholder="Pilih satu" onChange={() => {}}>{opts}</Select>);
    expect(html).toContain("Pilih satu");
  });

  it("opsi dalam array/fragment dan opsi bernilai tersirat terbaca", () => {
    const html = renderToStaticMarkup(
      <Select value="Gamma" onChange={() => {}}>
        <>
          {["Alpha", "Gamma"].map((x) => <option key={x}>{x}</option>)}
        </>
      </Select>,
    );
    expect(html).toContain("Gamma");
  });
});

describe("tombol hapus bertema", () => {
  it("DeleteButton: ikon saja punya aria-label dan target sentuh 44px; tanpa warna red-500 mentah", () => {
    const html = renderToStaticMarkup(<DeleteButton onConfirm={() => {}} />);
    expect(html).toContain('aria-label="Hapus"');
    expect(html).toContain("min-w-11");
    expect(html).toContain("min-h-11");
    expect(html).not.toContain("text-red-500");
  });

  it("DangerButton: tinggi minimal 48px dan memakai nada red-400", () => {
    const html = renderToStaticMarkup(<DangerButton label="Hapus Tugas" onConfirm={() => {}} />);
    expect(html).toContain("min-h-12");
    expect(html).toContain("text-red-400");
    expect(html).toContain("Hapus Tugas");
  });
});
