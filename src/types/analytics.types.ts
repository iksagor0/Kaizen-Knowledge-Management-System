export interface IAnalyticsStats {
  readonly activeDays: number;
  readonly avgPct: number;
  readonly completedCount: number;
  readonly lifetimeHours: number;
  readonly lifetimeMins: number;
  readonly monthPct: number;
  readonly overallAvg: number;
  readonly percentage: number;
  readonly rolling30Total: number;
  readonly rolling7Total: number;
  readonly todayTime: number;
  readonly totalTasks: number;
  readonly weekPct: number;
}

export interface ITodayProgressCardProps {
  readonly mounted: boolean;
  readonly stats: IAnalyticsStats;
}

export interface IPerformanceAnalyticsProps {
  readonly mounted: boolean;
  readonly stats: IAnalyticsStats;
}

export interface ILifetimeMilestonesProps {
  readonly stats: IAnalyticsStats;
}

export interface IFormattedDuration {
  readonly hours: number;
  readonly minutes: number;
  readonly hasHours: boolean;
  readonly hasMinutes: boolean;
}
