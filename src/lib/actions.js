// Every button's action. All business rules run inside Postgres functions
// (supabase/migrations/0001_krewgrid.sql), so they can't be bypassed from the browser.
import { rpc } from "./api";

const str = (fd, k) => String(fd.get(k) ?? "").trim();
const num = (fd, k) => {
  const v = str(fd, k);
  return v === "" ? null : Number(v);
};
const list = (fd, k) =>
  fd.getAll(k).map(String).flatMap((s) => s.split(",")).map((s) => s.trim()).filter(Boolean);

/* ---------- onboarding / profile ---------- */
export const completeOnboarding = (fd) =>
  rpc("complete_onboarding", {
    p_role: str(fd, "role"), p_full_name: str(fd, "full_name"), p_phone: str(fd, "phone"), p_area: str(fd, "area"),
    p_skills: list(fd, "skills"), p_languages: list(fd, "languages"),
    p_org_name: str(fd, "org_name") || null, p_about: str(fd, "about") || null,
  }, "Account ready");

export const updateProfile = (fd) =>
  rpc("update_my_profile", {
    p_full_name: str(fd, "full_name"), p_area: str(fd, "area"), p_phone: str(fd, "phone"),
    p_skills: fd.has("skills") ? list(fd, "skills") : null, p_languages: fd.has("languages") ? list(fd, "languages") : null,
    p_avatar_path: str(fd, "avatar_path") || null,
  }, "Profile saved");

/* ---------- client ---------- */
export const postJob = (fd) =>
  rpc("post_job", {
    p_category: num(fd, "category"), p_title: str(fd, "title"), p_description: str(fd, "description"),
    p_venue: str(fd, "venue"), p_area: str(fd, "area"), p_lat: num(fd, "lat"), p_lng: num(fd, "lng"),
    p_date: str(fd, "work_date"), p_start: str(fd, "start_time"), p_hours: num(fd, "hours"), p_pay: num(fd, "pay"),
    p_needed: num(fd, "needed"), p_payment_date: str(fd, "payment_date"), p_mode: str(fd, "mode") || "manual",
    p_min_level: str(fd, "min_level") || "any", p_language: str(fd, "language"), p_photo_approval: fd.get("photo_approval") === "on",
  }, "Work posted");

export const approveBooking = (fd) =>
  rpc("approve_booking", { p_booking: str(fd, "booking") }, (otp) => `Approved. Their OTP is ${otp}.`);
export const rejectBooking = (fd) =>
  rpc("reject_booking", { p_booking: str(fd, "booking") }, "Rejected. Their slot is refunded.");
export const cancelJob = (fd) =>
  rpc("cancel_job", { p_job: str(fd, "job") }, "Work cancelled. Workers are refunded.");
export const releaseAll = (fd) =>
  rpc("release_all", { p_job: str(fd, "job") }, (n) => `Released ${n} worker(s) with full pay.`);
export const decideEarly = (fd) =>
  rpc("decide_early_checkout", { p_booking: str(fd, "booking"), p_approve: str(fd, "decision") === "approve", p_pay_mode: str(fd, "pay_mode") || "full" },
    str(fd, "decision") === "approve" ? "Approved. The worker can check out now." : "Request declined.");
export const reportNoShow = (fd) =>
  rpc("report_no_show", { p_booking: str(fd, "booking") }, (r) =>
    r === "banned" ? "No-show recorded. Third no-show: the worker is banned." : r === "suspended" ? "No-show recorded. Second no-show: 30-day suspension." : "No-show recorded. The worker loses 10 slots.");
export const reportLeftEarly = (fd) =>
  rpc("report_left_early", { p_booking: str(fd, "booking") }, "Marked as left early.");
export const markPaid = (fd) =>
  rpc("mark_paid", { p_booking: str(fd, "booking") }, "Marked as paid.");

/* ---------- worker ---------- */
export const applyToJob = (fd) =>
  rpc("apply_to_job", { p_job: str(fd, "job") }, (s) => (s === "approved" ? "Booked. You're on the crew." : "Applied. The client will review it."));
export const checkIn = (fd) =>
  rpc("check_in", { p_booking: str(fd, "booking"), p_otp: str(fd, "otp"), p_lat: num(fd, "lat"), p_lng: num(fd, "lng") }, "Checked in.");
export const requestEarly = (fd) =>
  rpc("request_early_checkout", { p_booking: str(fd, "booking"), p_reason: str(fd, "reason") }, "Request sent to the client.");
export const checkOut = (fd) =>
  rpc("check_out", { p_booking: str(fd, "booking"), p_lat: num(fd, "lat"), p_lng: num(fd, "lng"), p_photo: str(fd, "photo") },
    (pay) => `Checked out. Pay for this job: ₹${Number(pay).toLocaleString("en-IN")}.`);
export const paymentNotReceived = (fd) =>
  rpc("report_payment_not_received", { p_booking: str(fd, "booking"), p_note: str(fd, "note") }, "Case opened. krewgrid will contact the client.");
export const addDocument = (fd) =>
  rpc("add_document", { p_type: str(fd, "doc_type"), p_number: str(fd, "doc_number"), p_expires: str(fd, "expires_on"), p_photo: str(fd, "photo") },
    "Sent for review. Usually approved within a day.");

/* ---------- both ---------- */
export const rateBooking = (fd) =>
  rpc("rate_booking", { p_booking: str(fd, "booking"), p_stars: num(fd, "stars"), p_comment: str(fd, "comment") }, "Thanks, rating saved.");
export const raiseDispute = (fd) =>
  rpc("raise_dispute", {
    p_booking: str(fd, "booking"), p_kind: str(fd, "kind"), p_description: str(fd, "description"),
    p_photo: str(fd, "photo") || null, p_lat: num(fd, "lat"), p_lng: num(fd, "lng"),
  }, "Dispute raised. krewgrid will review it.");

/* ---------- admin ---------- */
export const adminSetBan = (fd) =>
  rpc("admin_set_ban", { p_user: str(fd, "user"), p_banned: str(fd, "banned") === "true", p_reason: str(fd, "reason") || null }, "Saved.");
export const adminVerifyClient = (fd) =>
  rpc("admin_verify_client", { p_client: str(fd, "client"), p_verified: str(fd, "verified") === "true" }, "Saved.");
export const adminClearFlags = (fd) =>
  rpc("admin_clear_flags", { p_client: str(fd, "client") }, "Flags cleared.");
export const adminResolveDispute = (fd) =>
  rpc("admin_resolve_dispute", {
    p_dispute: str(fd, "dispute"), p_outcome: str(fd, "outcome") || "Resolved",
    p_flag_client: fd.get("flag_client") === "on", p_reverse_noshow: fd.get("reverse_noshow") === "on",
  }, "Dispute resolved.");
export const adminReviewDocument = (fd) =>
  rpc("admin_review_document", { p_doc: str(fd, "doc"), p_approve: str(fd, "decision") === "approve", p_note: str(fd, "note") || null }, "Saved.");
export const adminSaveCategory = (fd) =>
  rpc("admin_save_category", {
    p_id: num(fd, "id"), p_name: str(fd, "name"), p_photo: fd.get("needs_photo") === "on",
    p_manual: fd.get("needs_manual_approval") === "on", p_licence: fd.get("needs_driving_licence") === "on",
    p_police: fd.get("needs_police_clearance") === "on", p_note: str(fd, "optional_note"), p_active: fd.get("active") !== "off",
  }, "Category saved.");
export const adminAdjustSlots = (fd) =>
  rpc("admin_adjust_slots", { p_worker: str(fd, "worker"), p_delta: num(fd, "delta"), p_reason: str(fd, "reason") || "adjustment" }, "Slots adjusted.");
export const adminSetSetting = (fd) => {
  const raw = str(fd, "value");
  let value = raw;
  if (raw === "true" || raw === "false") value = raw === "true";
  else if (raw !== "" && !isNaN(Number(raw))) value = Number(raw);
  return rpc("admin_set_setting", { p_key: str(fd, "key"), p_value: value }, "Setting saved.");
};
