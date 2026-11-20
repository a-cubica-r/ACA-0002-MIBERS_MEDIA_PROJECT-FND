export function isPublicationUrl(value: string): boolean {
  if (!value.trim() || value.trim().length > 500) return false;
  try {
    const url = new URL(value.trim());
    return (
      ["http:", "https:"].includes(url.protocol) &&
      url.hostname.includes(".") &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}
