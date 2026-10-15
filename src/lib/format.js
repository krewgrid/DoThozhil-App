// Formatting helpers and status labels (ported from the new Krewgrid app).
const TZ = "Asia/Kolkata";

export const money = (n) => "₹" + Math.round(n ?? 0).toLocaleString("en-IN");

/** "Sun, 11 Oct" from a yyyy-mm-dd date */
export function day(d) {
  if (!d) return "—";
  return new Date(d + "T00:00:00+05:30").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: TZ });
}

/** "5:00 PM" from a timestamp */
export function time(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: TZ }).toUpperCase();
}

/** "5:00 PM" from "17:00:00" */
export function clock(t) {
  if (!t) return "—";
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

export function dateTime(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true, timeZone: TZ });
}

/** Today in India as yyyy-mm-dd */
export function todayIST() {
  return new Date().toLocaleDateString("en-CA", { timeZone: TZ });
}

export const initials = (n) =>
  (n || "?").split(/\s+/).filter(Boolean).slice(0, 2).map((x) => x[0]).join("").toUpperCase();

export const levelName = (n) => (n >= 100 ? "Gold" : n >= 50 ? "Silver" : n >= 10 ? "Blue" : "New");
export const nextLevel = (n) =>
  n < 10 ? { name: "Blue", at: 10 } : n < 50 ? { name: "Silver", at: 50 } : n < 100 ? { name: "Gold", at: 100 } : null;

/** Label + tone for a booking, used everywhere a status pill appears. */
export function bookingStatus(b, job) {
  if (b.status === "applied") return ["Waiting for approval", "info"];
  if (b.status === "rejected") return ["Not selected · slot refunded", "muted"];
  if (b.status === "cancelled") return ["Cancelled · slot refunded", "muted"];
  if (b.no_show) return ["No-show", "bad"];
  if (b.left_early) return ["Left early (not approved)", "bad"];
  if (b.check_out_at) return [b.early_status === "approved" ? "Left early (approved)" : "Checked out", "good"];
  if (b.early_status === "pending") return ["Early check-out requested", "warn"];
  if (b.check_in_at) return ["Checked in", "good"];
  if (job && new Date(job.ends_at) < new Date()) return ["Booked, no check-in", "warn"];
  return ["Booked", "accent"];
}

export const disputeKinds = {
  noshow_wrong: "No-show report is wrong",
  payment_not_received: "Payment not received",
  job_changed: "Client changed the job",
  other: "Other",
};

export function suspension(p) {
  if (!p) return null;
  if (p.banned) return "Your account is banned. Contact krewgrid support.";
  if (p.banned_until && new Date(p.banned_until) > new Date())
    return `Your account is suspended until ${new Date(p.banned_until).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} (${p.ban_reason ?? "policy"}).`;
  return null;
}

/** Distance in km between two lat/lng points. */
export function km(a, b, c, d) {
  const r = (x) => (x * Math.PI) / 180;
  const h = Math.sin(r(c - a) / 2) ** 2 + Math.cos(r(a)) * Math.cos(r(c)) * Math.sin(r(d - b) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}

export const byId = (rows, key = "id") => Object.fromEntries((rows ?? []).map((r) => [r[key], r]));
