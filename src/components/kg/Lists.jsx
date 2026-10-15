// Dispute list, worker's works table, Razorpay slot checkout and live job chat.
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { api } from "../../lib/api";
import { adminResolveDispute } from "../../lib/actions";
import { bookingStatus, clock, dateTime, day, disputeKinds, money, todayIST } from "../../lib/format";
import { ActionForm, Empty, H, Pill } from "./ui";

export function DisputeList({ rows, urls = {}, admin = false, names = {}, onDone }) {
  return (
    <div className="stack">{rows.map((d) => (
      <div key={d.id} className="card stack">
        <div className="row between">
          <div className="row"><b>{disputeKinds[d.kind] ?? d.kind}</b><Pill tone={d.status === "open" ? "warn" : "good"}>{d.status === "open" ? "Open" : "Resolved"}</Pill></div>
          <span className="faint num">{dateTime(d.created_at)}</span>
        </div>
        <p className="muted" style={{ fontSize: 13.5 }}>{d.bookings?.jobs?.title}{names[d.raised_by] && ` · raised by ${names[d.raised_by]}`}</p>
        <p>{d.description}</p>
        {d.photo_path && urls[d.photo_path] && <img src={urls[d.photo_path]} alt="Photo proof" className="photo-img" style={{ maxWidth: 280 }} />}
        {d.photo_lat != null && <p className="note mono">Photo GPS {d.photo_lat.toFixed(5)}, {d.photo_lng?.toFixed(5)}</p>}
        {d.outcome && <p className="note">Decision: {d.outcome}</p>}
        {admin && d.status === "open" && (
          <ActionForm run={adminResolveDispute} className="stack" onDone={onDone}>
            <H name="dispute" value={d.id} />
            <input name="outcome" placeholder="Decision, e.g. Worker was at the venue" required />
            <div className="row">
              <label className="check"><input type="checkbox" name="reverse_noshow" /> Reverse no-show penalty</label>
              <label className="check"><input type="checkbox" name="flag_client" /> Flag the client</label>
            </div>
            <div><button className="btn p sm">Resolve</button></div>
          </ActionForm>
        )}
      </div>
    ))}</div>
  );
}

export function WorksTable({ rows, cname }) {
  if (!rows.length) return <Empty>Nothing yet.</Empty>;
  const today = todayIST();
  return (
    <div className="tw"><table>
      <thead><tr><th>Work</th><th>Date</th><th>Time</th><th>Pay</th><th>Status</th><th>Payment</th></tr></thead>
      <tbody>{rows.map((r) => {
        const [label, tone] = bookingStatus(r, r.jobs);
        const pay = r.status !== "approved" || r.no_show ? <span className="faint">—</span>
          : r.paid_at ? <Pill tone="good">Credited</Pill>
          : r.jobs.payment_date < today && r.check_out_at ? <Pill tone="bad">Overdue</Pill>
          : <Pill>Due {day(r.jobs.payment_date)}</Pill>;
        return (
          <tr key={r.id}>
            <td><Link to={`/worker/job/${r.id}`}><b>{r.jobs.title}</b></Link><div className="faint" style={{ fontSize: 12.5 }}>{cname[r.jobs.client_id]}</div></td>
            <td className="num">{day(r.jobs.work_date)}</td><td className="num">{clock(r.jobs.start_time)} · {r.jobs.hours} hrs</td>
            <td className="num">{money(r.final_pay ?? r.jobs.pay)}</td><td><Pill tone={tone}>{label}</Pill></td><td>{pay}</td>
          </tr>
        );
      })}</tbody>
    </table></div>
  );
}

function loadCheckout() {
  return new Promise((res) => {
    if (window.Razorpay) return res(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => res(true);
    s.onerror = () => res(false);
    document.body.appendChild(s);
  });
}

/** Razorpay checkout for a slot pack. Slots are credited by the server after the signature is verified. */
export function BuySlots({ pack, price, name, phone, onDone }) {
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  async function buy() {
    setBusy(true); setMsg(null);
    if (!(await loadCheckout())) { setBusy(false); setMsg({ error: "Could not load Razorpay. Check your internet and try again." }); return; }
    const order = await api("/api/razorpay/order");
    if (!order.ok) { setBusy(false); setMsg({ error: order.error ?? "Could not start payment" }); return; }
    const rz = new window.Razorpay({
      key: order.keyId, amount: order.amount, currency: "INR", order_id: order.orderId,
      name: "krewgrid", description: `${pack} slots`, prefill: { name, contact: (phone ?? "").replace(/\s/g, "") },
      theme: { color: "#1DBC60" },
      modal: { ondismiss: () => setBusy(false) },
      handler: async (resp) => {
        const v = await api("/api/razorpay/verify", resp);
        setBusy(false);
        setMsg(v.ok && v.status === 200 ? { ok: `${pack} slots added.` } : { error: v.error ?? "Payment received but not confirmed yet. Slots will appear shortly." });
        onDone?.();
      },
    });
    rz.on("payment.failed", () => { setBusy(false); setMsg({ error: "Payment failed. No money was taken for slots." }); });
    rz.open();
  }

  return (
    <div className="stack">
      <button className="btn p" onClick={buy} disabled={busy}>{busy ? "Opening Razorpay…" : `Pay ₹${price} with Razorpay`}</button>
      {msg?.ok && <p className="msg ok">{msg.ok}</p>}
      {msg?.error && <p className="msg err">{msg.error}</p>}
    </div>
  );
}

export function ChatRoom({ jobId, me, names, initial, open }) {
  const [msgs, setMsgs] = useState(initial);
  const [text, setText] = useState("");
  const [err, setErr] = useState(null);
  const box = useRef(null);

  useEffect(() => {
    const ch = supabase
      .channel(`chat-${jobId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `job_id=eq.${jobId}` },
        (p) => setMsgs((m) => (m.some((x) => x.id === p.new.id) ? m : [...m, p.new])))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [jobId]);

  useEffect(() => { box.current?.scrollTo(0, box.current.scrollHeight); }, [msgs]);

  async function send(e) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setErr(null);
    const { data, error } = await supabase.from("messages").insert({ job_id: jobId, sender_id: me, body }).select().single();
    if (error) { setErr(error.message); return; }
    setText("");
    setMsgs((m) => (m.some((x) => x.id === data.id) ? m : [...m, data]));
  }

  return (
    <div className="card stack">
      <div className="msgs" ref={box}>
        {msgs.length === 0 && <p className="muted">No messages yet. Say where to report and what to wear.</p>}
        {msgs.map((m) => (
          <div key={m.id} className={"m" + (m.sender_id === me ? " me" : "")}>
            <small>{names[m.sender_id] ?? "Member"} · {new Date(m.created_at).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" })}</small>
            {m.body}
          </div>
        ))}
      </div>
      {open ? (
        <form className="row nowrap" onSubmit={send}>
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Message the crew" maxLength={1000} aria-label="Message" />
          <button className="btn p">Send</button>
        </form>
      ) : <p className="note">This chat is closed. Chats lock 3 days after the job.</p>}
      {err && <p className="msg err">{err}</p>}
    </div>
  );
}
