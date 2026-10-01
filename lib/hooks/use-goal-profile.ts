"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  type GoalProfile,
  loadGoalProfile,
  monthKey,
  monthLabel,
  normalizeGoals,
  onProfileChange,
  previousMonthKey,
  saveGoals,
  saveProfile,
} from "@/lib/data/goals";

export interface GoalProfileState {
  /** False until localStorage has been read, to avoid a first-paint flash. */
  hydrated: boolean;
  name: string;
  month: string;
  monthName: string;
  goals: string[];
  /** Last month's goals, offered as an editable starting point. */
  carriedGoals: string[];
  /** A name plus at least one goal for the current month. */
  complete: boolean;
  saveProfile: (name: string, goals: string[]) => void;
  saveGoals: (goals: string[]) => void;
}

export function useGoalProfile(): GoalProfileState {
  const [hydrated, setHydrated] = useState(false);
  const [profile, setProfile] = useState<GoalProfile>({ name: "", months: {} });
  // Pinned once so a month rollover mid-session can't relabel saved goals.
  const [month] = useState(() => monthKey());

  useEffect(() => {
    setProfile(loadGoalProfile());
    setHydrated(true);
    return onProfileChange(() => setProfile(loadGoalProfile()));
  }, []);

  const goals = useMemo(
    () => normalizeGoals(profile.months[month] ?? []),
    [profile, month],
  );

  const carriedGoals = useMemo(() => {
    const previous = previousMonthKey(month);
    if (profile.months[previous] === undefined) return [];
    return normalizeGoals(profile.months[previous]);
  }, [profile, month]);

  const persist = useCallback((name: string, nextGoals: string[]) => {
    setProfile(saveProfile(name, nextGoals));
  }, []);

  const patchGoals = useCallback((nextGoals: string[]) => {
    setProfile(saveGoals(nextGoals));
  }, []);

  return {
    hydrated,
    name: profile.name,
    month,
    monthName: monthLabel(month),
    goals,
    carriedGoals,
    complete: profile.name.trim().length > 0 && goals.length > 0,
    saveProfile: persist,
    saveGoals: patchGoals,
  };
}