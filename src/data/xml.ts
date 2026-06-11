type DateInput = string | number | Date;

export const escapeXml = (value: string | number) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

export const toDate = (value: DateInput) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

export const toRssDate = (value: DateInput) =>
  toDate(value)?.toUTCString() ?? new Date(0).toUTCString();

export const toSitemapDate = (value: DateInput) =>
  toDate(value)?.toISOString().slice(0, 10);
