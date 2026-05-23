"use client";

import confetti from "canvas-confetti";
import { useEffect, useMemo, useRef, useState } from "react";

import { ACHIEVEMENTS, IAchievementDef } from "@/constants";
import { useAppContext } from "@/context/app-context";
import { IStats } from "@/models";
import { getEffectiveBDDateStr } from "@/utils/time";

import { useAnalyticsStats } from "./use-analytics-stats";

export const useAchievements = () => {
  const analyticsStats = useAnalyticsStats();
  const { state } = useAppContext();
  const [activeToast, setActiveToast] = useState<IAchievementDef | null>(null);
  const shownRef = useRef<Set<string>>(new Set());

  const achievementStats = useMemo<IStats>(() => {
    return {
      todayTime: analyticsStats.todayTime,
      todayCompleted: analyticsStats.completedCount,
      todayTotal: analyticsStats.totalTasks,
      weeklyTime: analyticsStats.rolling7Total,
      monthlyTime: analyticsStats.rolling30Total,
    };
  }, [analyticsStats]);

  // Restore localStorage shown state
  useEffect(() => {
    try {
      const stored = localStorage.getItem("shownAchievements");
      if (stored) {
        shownRef.current = new Set(JSON.parse(stored));
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!state.isLoaded) return;

    const dateStr = getEffectiveBDDateStr();
    const monthStr = dateStr.substring(0, 7);

    // Simple week key: find the most recent Monday
    const dateObj = new Date(dateStr);
    const day = dateObj.getDay();
    const diff = dateObj.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(dateObj.setDate(diff));
    const weekStr = monday.toISOString().split("T")[0];

    for (const achievement of ACHIEVEMENTS) {
      // Generate type-aware key
      let trackingKey = achievement.id;
      if (achievement.type === "daily") trackingKey += `_${dateStr}`;
      else if (achievement.type === "weekly") trackingKey += `_${weekStr}`;
      else if (achievement.type === "monthly") trackingKey += `_${monthStr}`;

      if (shownRef.current.has(trackingKey)) continue;

      if (achievement.check(achievementStats)) {
        shownRef.current.add(trackingKey);
        try {
          localStorage.setItem(
            "shownAchievements",
            JSON.stringify([...shownRef.current]),
          );
        } catch {}

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setActiveToast(achievement);
        fireConfettiBurst();
        break; // Show one at a time per render
      }
    }
  }, [achievementStats, state.isLoaded]);

  return { activeToast };
};

// confetti animation burst
function fireConfettiBurst() {
  const BURST_COLORS = [
    ["#ff0000", "#ff6600", "#ffcc00"],
    ["#00ccff", "#0066ff", "#6600ff"],
    ["#ff00cc", "#ff0066", "#ff3399"],
    ["#00ff66", "#00cc44", "#66ff00"],
    ["#ffcc00", "#ff9900", "#ff6600"],
  ];

  const defaults = {
    spread: 360,
    ticks: 100,
    gravity: 0.6,
    decay: 0.94,
    startVelocity: 30,
    zIndex: 9999,
  };

  const burst = (
    x: number,
    y: number,
    count: number,
    colors: string[],
    velocity = 30,
    size = 1,
  ) => {
    confetti({
      ...defaults,
      particleCount: count,
      origin: { x, y },
      colors,
      startVelocity: velocity,
      scalar: size,
    });
  };

  burst(0.5, 0.4, 80, BURST_COLORS[0], 35, 1.2);
  setTimeout(() => burst(0.2, 0.5, 50, BURST_COLORS[1], 30, 1), 300);
  setTimeout(() => burst(0.8, 0.5, 50, BURST_COLORS[2], 30, 1), 600);
  setTimeout(() => burst(0.1, 0.2, 40, BURST_COLORS[3], 25, 0.8), 900);
  setTimeout(() => burst(0.9, 0.2, 40, BURST_COLORS[4], 25, 0.8), 1200);
  setTimeout(() => burst(0.3, 0.3, 60, BURST_COLORS[2], 30, 1.1), 1500);
  setTimeout(() => burst(0.7, 0.7, 60, BURST_COLORS[3], 30, 1.1), 2000);
  setTimeout(() => burst(0.15, 0.7, 35, BURST_COLORS[0], 28, 0.9), 2300);
  setTimeout(() => burst(0.85, 0.3, 35, BURST_COLORS[4], 28, 0.9), 2600);
  setTimeout(() => burst(0.5, 0.6, 50, BURST_COLORS[1], 32, 1), 2900);
  setTimeout(() => burst(0.4, 0.2, 40, BURST_COLORS[2], 26, 0.85), 3200);
}
