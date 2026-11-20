import { describe, expect, it } from "vitest";
import { formatDate, formatDateTime, fullName } from "./format";
describe("Colombian formatting", () => {
  it("converts instants to Bogotá time", () => {
    expect(formatDate("2026-01-02T02:00:00Z")).toBe(formatDate("2026-01-01"));
    expect(formatDateTime("2026-01-02T02:00:00Z")).toBe(
      new Intl.DateTimeFormat("es-CO", {
        timeZone: "America/Bogota",
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date("2026-01-01T21:00:00-05:00")),
    );
  });
  it("keeps pure dates on their calendar day", () => {
    expect(formatDate("2026-01-02")).toBe(
      new Intl.DateTimeFormat("es-CO", { timeZone: "UTC", dateStyle: "medium" }).format(
        new Date("2026-01-02T12:00:00Z"),
      ),
    );
    expect(formatDate("2026-01-02")).not.toBe(formatDate("2026-01-01"));
  });
  it("falls back to username when the name is empty", () => {
    expect(fullName({ first_name: "Ana", last_name: "Díaz", username: "ana" })).toBe("Ana Díaz");
    expect(fullName({ first_name: "", last_name: "", username: "ana" })).toBe("ana");
  });
});
