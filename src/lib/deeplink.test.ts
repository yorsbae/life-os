import { describe, it, expect } from "vitest";
import { routeFromUrl } from "./deeplink";

describe("routeFromUrl", () => {
  it("menerima rute pada daftar putih", () => {
    expect(routeFromUrl("lifeos://calendar")).toBe("/calendar");
    expect(routeFromUrl("lifeos://money/add")).toBe("/money/add");
    expect(routeFromUrl("lifeos:///plan")).toBe("/plan");
    expect(routeFromUrl("LIFEOS://Habits/")).toBe("/habits");
    expect(routeFromUrl("lifeos://calendar?x=1#y")).toBe("/calendar");
  });

  it("menolak rute lain, skema lain, dan input kosong", () => {
    expect(routeFromUrl("lifeos://profile")).toBeNull();
    expect(routeFromUrl("lifeos://plan/123")).toBeNull();
    expect(routeFromUrl("lifeos://../profile")).toBeNull();
    expect(routeFromUrl("https://calendar")).toBeNull();
    expect(routeFromUrl("javascript:alert(1)")).toBeNull();
    expect(routeFromUrl("")).toBeNull();
    expect(routeFromUrl(null)).toBeNull();
    expect(routeFromUrl(undefined)).toBeNull();
  });
});
