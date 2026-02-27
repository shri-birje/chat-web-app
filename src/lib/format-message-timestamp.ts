const DAY_MS = 24 * 60 * 60 * 1000;

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "2-digit",
});

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function formatMessageTimestamp(ts: number) {
  const messageDate = new Date(ts);
  const now = new Date();

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMessageDay = new Date(
    messageDate.getFullYear(),
    messageDate.getMonth(),
    messageDate.getDate()
  );

  const dayDiff = Math.round((startOfToday.getTime() - startOfMessageDay.getTime()) / DAY_MS);

  if (dayDiff === 0) return timeFormatter.format(messageDate);
  if (dayDiff === 1) return `Yesterday, ${timeFormatter.format(messageDate)}`;
  return dateTimeFormatter.format(messageDate);
}
