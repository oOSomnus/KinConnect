const CRON_DAILY_REGEX = /^0\s+(\d{1,2})\s+(\d{1,2})\s+\*\s+\*\s+\?$/;
const CRON_WEEKLY_REGEX = /^0\s+(\d{1,2})\s+(\d{1,2})\s+\?\s+\*\s+([A-Z,]+)$/;

const DAY_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;

export type Frequency = "DAILY" | "WEEKLY";

export type ScheduleInfo = {
  hour: number;
  minute: number;
  frequency: Frequency;
  daysOfWeek: number[];
};

export const defaultSchedule = (): ScheduleInfo => ({
  hour: 9,
  minute: 0,
  frequency: "DAILY",
  daysOfWeek: [1, 2, 3, 4, 5],
});

export const cronToSchedule = (cron: string | undefined | null): ScheduleInfo => {
  if (!cron) return defaultSchedule();

  const trimmed = cron.trim();
  let match = trimmed.match(CRON_DAILY_REGEX);
  if (match) {
    const minute = Number(match[1]);
    const hour = Number(match[2]);
    return {
      hour,
      minute,
      frequency: "DAILY",
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    };
  }

  match = trimmed.match(CRON_WEEKLY_REGEX);
  if (match) {
    const minute = Number(match[1]);
    const hour = Number(match[2]);
    const days = match[3]
      .split(",")
      .map((day) => DAY_NAMES.indexOf(day as typeof DAY_NAMES[number]))
      .filter((idx) => idx >= 0);
    return {
      hour,
      minute,
      frequency: "WEEKLY",
      daysOfWeek: days.length ? days : [1, 2, 3, 4, 5],
    };
  }

  return defaultSchedule();
};

export const scheduleToCron = (schedule: ScheduleInfo): string => {
  const { hour, minute, frequency, daysOfWeek } = schedule;
  const safeHour = Math.min(Math.max(hour, 0), 23);
  const safeMinute = Math.min(Math.max(minute, 0), 59);

  if (frequency === "WEEKLY") {
    const selectedDays = daysOfWeek.length ? daysOfWeek : [1, 2, 3, 4, 5];
    const dayTokens = selectedDays
      .map((idx) => DAY_NAMES[idx] || "MON")
      .join(",");
    return `0 ${safeMinute} ${safeHour} ? * ${dayTokens}`;
  }

  return `0 ${safeMinute} ${safeHour} * * ?`;
};

export const describeSchedule = (schedule: ScheduleInfo): string => {
  const { hour, minute, frequency, daysOfWeek } = schedule;
  const formattedTime = `${hour.toString().padStart(2, "0")}:${minute
    .toString()
    .padStart(2, "0")}`;

  if (frequency === "DAILY") {
    return `${formattedTime} • Every day`;
  }

  const selectedDays = daysOfWeek.length ? daysOfWeek : [1, 2, 3, 4, 5];
  const dayNames = selectedDays
    .sort((a, b) => a - b)
    .map((idx) => DAY_NAMES[idx].slice(0, 3))
    .join(", ");
  return `${formattedTime} • ${dayNames}`;
};
