import { describe, expect, it } from "vitest";
import { isPublicationUrl } from "./validation";
describe("enlace de publicación", () => {
  it.each(["https://www.instagram.com/p/abc/", " http://facebook.com/post/123 "])(
    "acepta %s",
    (value) => expect(isPublicationUrl(value)).toBe(true),
  );
  it.each([
    "",
    "no es url",
    "javascript:alert(1)",
    "ftp://example.com/a",
    "https://",
    "https://usuario:clave@example.com",
    `https://example.com/${"a".repeat(500)}`,
  ])("rechaza %s", (value) => expect(isPublicationUrl(value)).toBe(false));
});
