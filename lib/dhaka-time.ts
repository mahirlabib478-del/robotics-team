export function formatDhakaDateTimeLocal(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values: Record<string, string> = {};
  for (const part of parts) if (part.type !== "literal") values[part.type] = part.value;
  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
}

export function parseDhakaDateTimeLocal(value: string): Date | null {
  if (!/^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}$/.test(value)) return null;
  const parsed = new Date(`${value}:00+06:00`);
  if (Number.isNaN(parsed.getTime()) || formatDhakaDateTimeLocal(parsed) !== value) return null;
  return parsed;
}
