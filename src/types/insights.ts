export type InsightType =
  | "subscription"
  | "anomaly"
  | "pattern"
  | "saving"
  | "positive";

export type InsightPriority = "high" | "medium" | "low";

export type Insight = {
  type: InsightType;
  title: string;
  description: string;
  amount: number | null;
  priority: InsightPriority;
};
