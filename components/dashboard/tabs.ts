import {
  Activity,
  Brain,
  CalendarClock,
  Lightbulb,
  MessageCircle,
  Timer,
} from "lucide-react";

export type TabId =
  | "overview"
  | "insights"
  | "predict"
  | "triggers"
  | "coach"
  | "timer";

export const TABS: {
  id: TabId;
  label: string;
  icon: typeof Activity;
  blurb: string;
  featured?: boolean;
}[] = [
  {
    id: "timer",
    label: "Timer",
    icon: Timer,
    featured: true,
    blurb: "Set a break first, then go scroll. This is the main tool: start it before any scroll — the alarm rings to pull you back.",
  },
  {
    id: "overview",
    label: "Overview",
    icon: Activity,
    blurb: "Your day at a glance: total sessions, time logged, per-app breakdown and the loop watch.",
  },
  {
    id: "insights",
    label: "Insights",
    icon: Lightbulb,
    blurb: "Patterns found in your own data: peak hours, longest stretches and high-pull apps.",
  },
  {
    id: "predict",
    label: "Predict",
    icon: CalendarClock,
    blurb: "Foresees your riskiest hours for a long run, so you can set a break before they hit.",
  },
  {
    id: "triggers",
    label: "Triggers",
    icon: Brain,
    blurb: "Connects the mood before a session with how it ends, and suggests what to do instead.",
  },
  {
    id: "coach",
    label: "Coach",
    icon: MessageCircle,
    blurb: "An honest companion that answers questions using your own history.",
  },
];
