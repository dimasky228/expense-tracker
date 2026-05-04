export type NotificationType =
  | "budget_warning"
  | "budget_exceeded"
  | "recurring_due"
  | "recurring_overdue"
  | "goal_milestone"
  | "goal_deadline"
  | "spending_spike"
  | "savings_positive"
  | "weekly_summary";

export type AppNotification = {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
};

export const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  budget_warning: "⚠️",
  budget_exceeded: "🚨",
  recurring_due: "📅",
  recurring_overdue: "❗",
  goal_milestone: "🎯",
  goal_deadline: "⏰",
  spending_spike: "📈",
  savings_positive: "💚",
  weekly_summary: "📊",
};

export const NOTIFICATION_COLORS: Record<NotificationType, string> = {
  budget_warning: "text-amber-400",
  budget_exceeded: "text-red-400",
  recurring_due: "text-cyan-400",
  recurring_overdue: "text-red-400",
  goal_milestone: "text-emerald-400",
  goal_deadline: "text-amber-400",
  spending_spike: "text-orange-400",
  savings_positive: "text-emerald-400",
  weekly_summary: "text-zinc-400",
};

export type NotificationPref = {
  budget_alerts: boolean;
  recurring_reminders: boolean;
  goal_updates: boolean;
  spending_insights: boolean;
};

export const DEFAULT_PREFS: NotificationPref = {
  budget_alerts: true,
  recurring_reminders: true,
  goal_updates: true,
  spending_insights: true,
};

export function prefToTypes(prefs: Partial<NotificationPref>): NotificationType[] {
  const merged = { ...DEFAULT_PREFS, ...prefs };
  const types: NotificationType[] = [];
  if (merged.budget_alerts) types.push("budget_warning", "budget_exceeded");
  if (merged.recurring_reminders) types.push("recurring_due", "recurring_overdue");
  if (merged.goal_updates) types.push("goal_milestone", "goal_deadline");
  if (merged.spending_insights) types.push("spending_spike", "savings_positive");
  return types;
}

export function groupByDate(notifications: AppNotification[]): { label: string; items: AppNotification[] }[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const groups: Record<string, AppNotification[]> = {
    Today: [],
    Yesterday: [],
    "This Week": [],
    Earlier: [],
  };

  for (const n of notifications) {
    const d = new Date(n.created_at);
    d.setHours(0, 0, 0, 0);
    if (d.getTime() === today.getTime()) groups["Today"].push(n);
    else if (d.getTime() === yesterday.getTime()) groups["Yesterday"].push(n);
    else if (d >= weekAgo) groups["This Week"].push(n);
    else groups["Earlier"].push(n);
  }

  return Object.entries(groups)
    .filter(([, items]) => items.length > 0)
    .map(([label, items]) => ({ label, items }));
}
