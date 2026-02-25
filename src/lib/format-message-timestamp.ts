import { format, isSameYear, isToday } from "date-fns";

export function formatMessageTimestamp(ts: number) {
  const d = new Date(ts);
  if (isToday(d)) return format(d, "h:mm a");
  if (isSameYear(d, new Date())) return format(d, "MMM d, h:mm a");
  return format(d, "MMM d, yyyy, h:mm a");
}
