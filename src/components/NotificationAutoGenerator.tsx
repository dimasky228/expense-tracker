"use client";

import { useEffect } from "react";
import { prefToTypes } from "@/src/lib/notifications";
import type { NotificationPref } from "@/src/lib/notifications";

export default function NotificationAutoGenerator() {
  useEffect(() => {
    const SESSION_KEY = "notifications_generated_v1";
    if (sessionStorage.getItem(SESSION_KEY)) return;

    let prefs: Partial<NotificationPref> = {};
    try {
      prefs = JSON.parse(localStorage.getItem("notification_prefs") ?? "{}") as Partial<NotificationPref>;
    } catch {
      // use defaults
    }

    const enabled = prefToTypes(prefs);

    fetch("/api/notifications/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    })
      .then(() => {
        sessionStorage.setItem(SESSION_KEY, "1");
        window.dispatchEvent(new CustomEvent("notificationsRefresh"));
      })
      .catch(() => {
        // silently ignore if notifications table not yet created
      });
  }, []);

  return null;
}
