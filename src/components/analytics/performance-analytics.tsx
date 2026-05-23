import { BarChart2, RefreshCw } from "lucide-react";
import React, { useMemo } from "react";

import {
  IFormattedDuration,
  IPerformanceAnalyticsProps,
} from "@/types/analytics.types";
import { formatDuration } from "@/utils";
import { HOUR_UNIT, MINUTE_UNIT_LONG, MINUTE_UNIT_SHORT } from "@/constants";

const PerformanceAnalytics: React.FC<IPerformanceAnalyticsProps> = ({
  mounted,
  stats,
}) => {
  const formattedDailyAvg = useMemo(
    () => formatDuration(stats.overallAvg),
    [stats.overallAvg],
  );

  const formattedMonthTotal = useMemo(
    () => formatDuration(stats.rolling30Total),
    [stats.rolling30Total],
  );

  const formattedWeekTotal = useMemo(
    () => formatDuration(stats.rolling7Total),
    [stats.rolling7Total],
  );

  const _renderFormattedDuration = (duration: IFormattedDuration) => {
    return (
      <span className="text-sm font-bold text-heading_color">
        {duration.hasHours && (
          <>
            <span>{duration.hours}</span>
            <span className="text-disable_color font-normal">{HOUR_UNIT}</span>
            {duration.hasMinutes && " "}
          </>
        )}
        {duration.hasMinutes && (
          <>
            <span className="ml-1">{duration.minutes}</span>
            <span className="text-disable_color font-normal">
              {duration.hasHours ? MINUTE_UNIT_SHORT : MINUTE_UNIT_LONG}
            </span>
          </>
        )}
      </span>
    );
  };

  return (
    <div className="bg-base_color/50 backdrop-blur-xl rounded-3xl p-6 border border-border_color shadow-xl shadow-base_color/10">
      <h2 className="text-lg font-display font-bold text-heading_color mb-5 flex items-center">
        <BarChart2 className="w-5 h-5 mr-2 text-primary_color" />
        Performance Analytics
      </h2>

      <div className="space-y-5">
        {/* Daily Avg */}
        <div>
          <div className="flex justify-between items-end mb-1.5">
            <span className="text-sm font-semibold text-heading_color_secondary">
              Daily Average
            </span>
            {_renderFormattedDuration(formattedDailyAvg)}
          </div>
          <div className="w-full bg-border_color/30 h-2 rounded-full overflow-hidden">
            <div
              className="bg-primary_color h-full rounded-full transition-all duration-1000"
              style={{ width: mounted ? `${stats.avgPct}%` : "0%" }}
            ></div>
          </div>
        </div>

        {/* Weekly Total */}
        <div>
          <div className="flex justify-between items-end mb-1.5">
            <span className="text-sm font-semibold text-heading_color_secondary">
              This Week Total
            </span>
            {_renderFormattedDuration(formattedWeekTotal)}
          </div>
          <div className="w-full bg-border_color/30 h-2 rounded-full overflow-hidden">
            <div
              className="bg-brand-400 h-full rounded-full transition-all duration-1000 delay-100"
              style={{ width: mounted ? `${stats.weekPct}%` : "0%" }}
            ></div>
          </div>
        </div>

        {/* Monthly Total */}
        <div>
          <div className="flex justify-between items-end mb-1.5">
            <span className="text-sm font-semibold text-heading_color_secondary">
              This Month Total
            </span>
            {_renderFormattedDuration(formattedMonthTotal)}
          </div>
          <div className="w-full bg-border_color/30 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all duration-1000 delay-200"
              style={{ width: mounted ? `${stats.monthPct}%` : "0%" }}
            ></div>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-5 border-t border-border_color text-center">
        <span className="inline-flex items-center text-xs text-heading_color_secondary bg-primary_color/5 px-3 py-1 rounded-full">
          <RefreshCw className="w-3 h-3 mr-1.5" /> Resets at 6:00 AM Bangladesh
          Time
        </span>
      </div>
    </div>
  );
};

export default PerformanceAnalytics;
