import { IStats } from "@/models";

export interface IAchievementDef {
  readonly id: string;
  readonly type: "daily" | "weekly" | "monthly";
  readonly label: string;
  readonly desc: string;
  readonly check: (stats: Readonly<IStats>) => boolean;
}

export const ACHIEVEMENTS: readonly IAchievementDef[] = [
  {
    id: "daily_all_done",
    type: "daily",
    label: "🏆 All Tasks Done!",
    desc: "You completed every task today!",
    check: (stats) =>
      stats.todayCompleted > 0 && stats.todayCompleted === stats.todayTotal,
  },
  {
    id: "daily_100",
    type: "daily",
    label: "💪 100 Min Today!",
    desc: "You hit 100 minutes of practice!",
    check: (stats) => stats.todayTime >= 100,
  },
  {
    id: "daily_200",
    type: "daily",
    label: "🔥 200 Min Today!",
    desc: "An incredible 200 minutes today!",
    check: (stats) => stats.todayTime >= 200,
  },
  {
    id: "daily_300",
    type: "daily",
    label: "⚡ 300 Min Today!",
    desc: "Legendary 300 minutes in a single day!",
    check: (stats) => stats.todayTime >= 300,
  },
  {
    id: "weekly_300",
    type: "weekly",
    label: "📅 300 Min This Week!",
    desc: "Great weekly consistency!",
    check: (stats) => stats.weeklyTime >= 300,
  },
  {
    id: "weekly_500",
    type: "weekly",
    label: "🚀 500 Min This Week!",
    desc: "Half a thousand minutes this week!",
    check: (stats) => stats.weeklyTime >= 500,
  },
  {
    id: "weekly_700",
    type: "weekly",
    label: "🌟 700 Min This Week!",
    desc: "Amazing weekly dedication!",
    check: (stats) => stats.weeklyTime >= 700,
  },
  {
    id: "weekly_1000",
    type: "weekly",
    label: "👑 1000 Min This Week!",
    desc: "A thousand minutes of pure effort!",
    check: (stats) => stats.weeklyTime >= 1000,
  },
  {
    id: "monthly_1000",
    type: "monthly",
    label: "🎯 1K Min This Month!",
    desc: "1,000 minutes this month!",
    check: (stats) => stats.monthlyTime >= 1000,
  },
  {
    id: "monthly_2000",
    type: "monthly",
    label: "💎 2K Min This Month!",
    desc: "2,000 minutes of mastery!",
    check: (stats) => stats.monthlyTime >= 2000,
  },
  {
    id: "monthly_3000",
    type: "monthly",
    label: "🏅 3K Min This Month!",
    desc: "3,000 minutes — unstoppable!",
    check: (stats) => stats.monthlyTime >= 3000,
  },
  {
    id: "monthly_5000",
    type: "monthly",
    label: "🌈 5K Min This Month!",
    desc: "5,000 minutes — you're a legend!",
    check: (stats) => stats.monthlyTime >= 5000,
  },
];

export const MINUTES_IN_HOUR = 60;
export const ZERO_VALUE = 0;

export const HOUR_UNIT = "h";
export const MINUTE_UNIT_SHORT = "m";
export const MINUTE_UNIT_LONG = "min";
