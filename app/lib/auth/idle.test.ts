import { describe, expect, it } from "vitest";
import { IDLE_LIMIT_MS, markActivity, msSinceActivity } from "./idle";

describe("inactividad", () => {
  it("mide el tiempo desde la última actividad", () => {
    markActivity(1_000);
    expect(msSinceActivity(1_000 + IDLE_LIMIT_MS)).toBe(IDLE_LIMIT_MS);
  });
});
