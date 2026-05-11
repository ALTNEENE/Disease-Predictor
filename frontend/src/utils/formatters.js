export function compactNumber(value, locale) {
  const number = Number(value || 0);
  return new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 }).format(number);
}

export function dateTime(value, locale) {
  if (!value) return "-";
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function metricValue(value) {
  if (value === undefined || value === null || Number.isNaN(Number(value))) return "-";
  return Number(value).toFixed(3);
}
