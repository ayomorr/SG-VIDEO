import type { Category, Mood } from "@/lib/engine/types";

export interface AppDefinition {
  name: string;
  category: Category;
  /** Roughly how "infinite" the feed is, 0–1. Feeds doomscrolling more. */
  feedPull: number;
}

/** Apps the demo dataset and manual logger know about. */
export const APP_CATALOG: AppDefinition[] = [
  { name: "Instagram", category: "social", feedPull: 0.9 },
  { name: "Live feed", category: "social", feedPull: 0.9 },
  { name: "TikTok", category: "shorts", feedPull: 1 },
  { name: "YouTube", category: "video", feedPull: 0.85 },
  { name: "X (Twitter)", category: "news", feedPull: 0.95 },
  { name: "Reddit", category: "social", feedPull: 0.8 },
  { name: "Facebook", category: "social", feedPull: 0.6 },
  { name: "Netflix", category: "video", feedPull: 0.4 },
  { name: "WhatsApp", category: "messaging", feedPull: 0.2 },
  { name: "Messages", category: "messaging", feedPull: 0.1 },
  { name: "Chrome", category: "other", feedPull: 0.5 },
  { name: "LinkedIn", category: "social", feedPull: 0.4 },
  { name: "Threads", category: "social", feedPull: 0.85 },
];

export function appDefinition(name: string): AppDefinition {
  return (
    APP_CATALOG.find((app) => app.name === name) ?? {
      name,
      category: "other",
      feedPull: 0.5,
    }
  );
}

export const CATEGORY_LABELS: Record<Category, string> = {
  social: "Social",
  video: "Video",
  news: "News & feed",
  shorts: "Short-form video",
  messaging: "Messaging",
  shopping: "Shopping",
  gaming: "Gaming",
  other: "Other",
};

export const MOOD_LABELS: Record<Mood, string> = {
  bored: "Bored",
  anxious: "Anxious",
  stressed: "Stressed",
  tired: "Tired",
  lonely: "Lonely",
  curious: "Curious",
  restless: "Restless",
  okay: "Okay",
  good: "Good",
};

export const MOODS: Mood[] = [
  "bored",
  "restless",
  "anxious",
  "stressed",
  "tired",
  "lonely",
  "curious",
  "okay",
  "good",
];

/** Healthier alternatives the coach suggests for a given pre-scroll mood. */
export const MOOD_ALTERNATIVES: Record<Mood, string[]> = {
  bored: [
    "Take a 5-minute stretch or walk around the block",
    "Put on one song and listen without doing anything else",
    "Drink a glass of water — thirst often feels like boredom",
    "Text a friend something you actually mean",
  ],
  restless: [
    "Do 20 jumping jacks or shake out your limbs",
    "Step outside for 3 minutes of fresh air",
    "Tidy one small surface — motion beats scrolling",
  ],
  anxious: [
    "Try 4-7-8 breathing for one minute",
    "Write the anxious thought down, then close the note",
    "Name 5 things you can see right now",
  ],
  stressed: [
    "Stand up and roll your shoulders for 60 seconds",
    "Pick the single next task and do only that for 10 minutes",
    "Make a cup of tea and drink it away from your phone",
  ],
  tired: [
    "Dim the lights and stop bright feeds for the night",
    "If you're tired, sleep beats scrolling — the feed will wait",
    "Read a few pages of something on paper instead",
  ],
  lonely: [
    "Send a message to one person you like talking to",
    "Call someone instead of watching strangers' lives",
    "Write down one thing you'd like to do together this week",
  ],
  curious: [
    "Save the rabbit hole for tomorrow — note what you wanted to look up",
    "Watch or read one thing on purpose, then stop",
    "Write down the question so it stops looping",
  ],
  okay: ["You're in a good spot — enjoy a short, intentional session"],
  good: ["Ride the good mood offline for a while if you can"],
};

export function alternativeFor(mood: Mood, count = 3): string[] {
  const pool = MOOD_ALTERNATIVES[mood] ?? MOOD_ALTERNATIVES.bored;
  return pool.slice(0, Math.max(1, count));
}
