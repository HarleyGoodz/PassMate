// src/js/MyTickets.jsx
import React, { useEffect, useState } from "react";
import "../css/myTickets_styles.css";
import { Link } from "react-router-dom";

/* Helper to format 12-hour times */
const formatTo12Hour = (time) => {
  if (!time) return "";
  const parts = String(time).split(":");
  if (parts.length < 2) return time;
  let [hour, minute] = parts;
  hour = Number(hour);
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${hour}:${minute}${ampm}`;
};

export default function MyTickets() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [ticketFilter, setTicketFilter] = useState("ALL"); // ALL / AVAILABLE / STARTED / FINISHED / PENDING_REFUND / REFUNDED / CANCELLED
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsData, setDetailsData] = useState(null);

  // Modal state (matches EventDetails style)
  const [modal, setModal] = useState({
    show: false,
    title: "",
    message: "",
    onConfirm: null,
    loading: false,
  });

  const pushMessage = (m) => setMessages((prev) => [...prev, m]);

  // ----------------------
  // API helpers
  // ----------------------
  async function fetchUser() {
    try {
      const res = await fetch("http://localhost:8080/api/user/me", { credentials: "include" });
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.error("fetchUser error", err);
      return null;
    }
  }

  async function fetchMyPayments(currentUser) {
    try {
      const res = await fetch("http://localhost:8080/api/payment/get-all", { credentials: "include" });
      if (!res.ok) throw new Error(`Failed to load payments (${res.status})`);
      const payments = await res.json();

      const myPayments = payments.filter((p) => {
        try {
          const uid = currentUser?.userId ?? currentUser?.id ?? currentUser?.user_id;
          if (!uid) return false;
          if (p.user && (p.user.userId === uid || p.user.user_id === uid || p.user.id === uid)) return true;
          if (p.userId === uid || p.user_id === uid) return true;
          return false;
        } catch {
          return false;
        }
      });

      return myPayments.map((p) => {
        const paymentId = p.id ?? p.paymentId ?? p.payment_id ?? null;
        const ticket = p.ticket ?? p.tickets ?? null;
        let ticketObj = null;
        if (ticket) {
          ticketObj = {
            id: ticket.ticketId ?? ticket.id ?? ticket.ticket_id ?? null,
            price: ticket.ticketPrice ?? ticket.ticket_price ?? ticket.price ?? null,
            type: ticket.ticketType ?? ticket.ticket_type ?? ticket.type ?? null,
            availability: ticket.availability ?? ticket.available ?? null,
            event: ticket.event ?? ticket.eventObj ?? null,
            rawTicket: ticket,
          };
        }

        let event = null;
        const ev = ticketObj?.event ?? p.event ?? p.eventSnapshot ?? null;
        if (ev) {
          event = {
            id: ev.eventId ?? ev.id ?? ev.event_id ?? null,
            event_name: ev.eventName ?? ev.event_name ?? "",
            event_venue: ev.eventVenue ?? ev.event_venue ?? "",
            event_date: ev.eventStartTime ?? ev.event_date ?? null,
            event_time_in: ev.eventStartTime ? String(ev.eventStartTime).split("T")[1]?.slice(0, 5) : ev.event_time_in ?? "",
            event_time_out: ev.eventEndTime ? String(ev.eventEndTime).split("T")[1]?.slice(0, 5) : ev.event_time_out ?? "",
            rawEvent: ev,
            event_status: (ev.eventStatus ?? ev.event_status ?? "").toString(),
          };
        }

        const paymentStatusRaw = (p.payment_status ?? p.paymentStatus ?? "").toString().toUpperCase() ?? "";

        return {
          paymentId,
          payment_amount: p.payment_amount ?? p.paymentAmount ?? null,
          payment_method: p.payment_method ?? p.paymentMethod ?? null,
          payment_status: paymentStatusRaw || null,
          payment_timestamp: p.payment_timestamp ?? p.paymentTimestamp ?? null,
          reference_code: p.reference_code ?? p.referenceCode ?? null,
          ticket: ticketObj,
          event,
          raw: p,
        };
      });
    } catch (err) {
      throw err;
    }
  }

  // ----------------------
  // lifecycle: load user + tickets
  // ----------------------
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const u = await fetchUser();
        if (!mounted) return;
        setUser(u);

        if (!u) {
          setTickets([]);
          setMessages([{ text: "Please login to see your tickets.", type: "info" }]);
          setLoading(false);
          return;
        }

        const mapped = await fetchMyPayments(u);
        if (!mounted) return;
        setTickets(mapped);
        if (mapped.length === 0) setMessages([{ text: "You don't own any tickets yet.", type: "info" }]);
      } catch (err) {
        console.error("load tickets error", err);
        setError(err.message || "Failed to load tickets");
        setMessages([{ text: "Failed to load your tickets. Please try again later.", type: "error" }]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // ----------------------
  // util helpers
  // ----------------------
  const getPaymentId = (t) =>
    t.paymentId ?? t.payment_id ?? t.id ?? t.raw?.paymentId ?? null;

  const deriveTicketType = (t) => {
    const maybe =
      t?.ticket?.type ??
      t?.ticket?.ticketType ??
      t?.ticket?.ticket_type ??
      t?.raw?.ticketType ??
      t?.raw?.type ??
      null;
    return maybe ? String(maybe) : "Unknown";
  };

  const formatDate = (d) => {
    if (!d) return "";
    try {
      const dt = new Date(d);
      if (isNaN(dt)) return String(d).split("T")[0];
      return dt.toLocaleDateString();
    } catch {
      return String(d);
    }
  };

  const isEventFinished = (ev) => {
    if (!ev || !ev.rawEvent) return false;
    try {
      const endRaw = ev.rawEvent.eventEndTime ?? ev.event_date ?? null;
      if (!endRaw) return false;
      const end = new Date(endRaw);
      const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }));
      return end < now;
    } catch {
      return false;
    }
  };

  const isEventStarted = (ev) => {
    if (!ev || !ev.rawEvent) return false;
    try {
      const startRaw = ev.rawEvent.eventStartTime ?? ev.event_date ?? null;
      const endRaw = ev.rawEvent.eventEndTime ?? ev.event_date ?? null;
      if (!startRaw || !endRaw) return false;
      const start = new Date(startRaw);
      const end = new Date(endRaw);
      const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }));
      return now >= start && now < end;
    } catch {
      return false;
    }
  };

  const detectEventSnapshotOnPayment = (paymentRaw) => {
    if (!paymentRaw) return null;
    const candidates = [
      paymentRaw.eventSnapshot,
      paymentRaw.event_snapshot,
      paymentRaw.purchasedEventSnapshot,
      paymentRaw.eventAtPurchase,
      paymentRaw.event_at_purchase,
      paymentRaw.snapshotEvent,
      paymentRaw.eventSnapshotJson,
      paymentRaw.event,
    ];
    for (const c of candidates) if (c && typeof c === "object") return c;
    return null;
  };

  const isEventModified = (payment) => {
    const snapshot = detectEventSnapshotOnPayment(payment.raw);
    if (!snapshot) return false;
    const nowEv = payment.event?.rawEvent ?? payment.ticket?.rawTicket?.event ?? null;
    if (!nowEv) return true;
    const fieldsToCompare = [
      ["eventName", "eventName"],
      ["eventName", "event_name"],
      ["eventVenue", "eventVenue"],
      ["eventVenue", "event_venue"],
      ["eventDescription", "eventDescription"],
      ["eventDescription", "event_description"],
      ["eventStartTime", "eventStartTime"],
      ["eventStartTime", "event_start_time"],
      ["eventEndTime", "eventEndTime"],
      ["eventEndTime", "event_end_time"],
    ];
    for (const [keyA, keyB] of fieldsToCompare) {
      const valSnapshot = snapshot[keyA] ?? snapshot[keyB] ?? null;
      const valNow = nowEv[keyA] ?? nowEv[keyB] ?? null;
      if (String(valSnapshot).trim() !== String(valNow).trim()) {
        return true;
      }
    }
    return false;
  };

  // ----------------------
  // Refund: open confirmation modal and perform refund
  // ----------------------
  function handleRequestRefund(paymentId) {
    setModal({
      show: true,
      title: "Request Refund",
      message: "Request a refund for this ticket?",
      onConfirm: () => performRefund(paymentId),
      loading: false
    });
  }

  async function performRefund(paymentId) {
    if (!paymentId) {
      setMessages([{ text: "Missing payment id", type: "error" }]);
      setModal({ show: false, title: "", message: "", onConfirm: null, loading: false });
      return;
    }

    setModal((m) => ({ ...m, loading: true }));

    try {
      const resp = await fetch(`http://localhost:8080/api/payment/refund/${paymentId}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      const text = await resp.text().catch(() => "");
      if (!resp.ok) {
        setMessages([{ text: `Failed to request refund: ${resp.status} ${text}`, type: "error" }]);
        setModal({ show: false, title: "", message: "", onConfirm: null, loading: false });
        return;
      }

      const normalized = (text || "").toLowerCase();
      const didRefundNow = normalized.includes("refunded") || normalized.includes("credited") || normalized.includes("wallet");

      setTickets((prev) =>
        prev.map((t) => {
          if (getPaymentId(t) === paymentId) {
            return { ...t, payment_status: didRefundNow ? "REFUNDED" : "PENDING_REFUND" };
          }
          return t;
        })
      );

      setMessages([{ text: didRefundNow ? "Refund processed and credited to your wallet." : "Refund requested. You will be notified about the refund status.", type: "success" }]);
    } catch (err) {
      console.error("refund error", err);
      setMessages([{ text: "Failed to request refund. Try again.", type: "error" }]);
    } finally {
      setModal({ show: false, title: "", message: "", onConfirm: null, loading: false });
    }
  }

  // ----------------------
  // Derived UI filtering
  // ----------------------
  const applyTicketFilter = (list) => {
    if (ticketFilter === "ALL") return list;

    return list.filter((t) => {
      const ev = t.event ?? t.ticket?.event ?? null;
      const finished = isEventFinished(ev);
      const started = !finished && isEventStarted(ev);
      const s = (t.payment_status ?? "").toString().toUpperCase();

      if (ticketFilter === "FINISHED") return finished;
      if (ticketFilter === "STARTED") return started;
      if (ticketFilter === "AVAILABLE") return !finished && !started && s !== "REFUNDED" && s !== "PENDING_REFUND";
      if (ticketFilter === "PENDING_REFUND") return s === "PENDING_REFUND";
      if (ticketFilter === "REFUNDED") return s === "REFUNDED";
      if (ticketFilter === "CANCELLED") {
        const evStatus = (ev?.event_status ?? "").toString().toUpperCase();
        return !ev || evStatus === "CANCELLED";
      }
      return true;
    });
  };

  const filteredTickets = applyTicketFilter(
    tickets.filter((t) => {
      const ev = t.event ?? t.ticket?.event ?? {};
      const ticketType = deriveTicketType(t);
      const text = `${ev?.event_name ?? ""} ${ev?.event_venue ?? ""} ${ticketType}`.toLowerCase();
      return text.includes(search.toLowerCase());
    })
  );

  // ----------------------
  // small UI styles used inline
  // ----------------------
  const bannerStyle = (bg) => ({
    backgroundColor: bg, color: "#fff", padding: "6px 10px", textAlign: "center", borderRadius: 6, marginBottom: 10, fontWeight: 700
  });

  // Modal component (EventDetails style with orange confirm)
  const Modal = ({ show, title, message, onClose, onConfirm, loading }) => {
    if (!show) return null;
    return (
      <div style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999
      }}>
        <div style={{
          width: 360, background: "#fff", padding: 20,
          borderRadius: 12, boxShadow: "0 8px 30px rgba(0,0,0,0.2)"
        }}>
          <h3 style={{ margin: "0 0 8px 0", textAlign: "center", color: "#222", fontWeight: 650 }}>{title}</h3>
          <div style={{ marginBottom: 16, color: "#333", whiteSpace: "pre-line", textAlign: "center", fontWeight: 100, fontSize: 16 }}>{message}</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={onClose}
              disabled={loading}
              style={{
                flex: 1, padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd",
                background: "#f5f5f5", cursor: loading ? "not-allowed" : "pointer"
              }}>
              Close
            </button>
            {onConfirm && (
              <button
                onClick={onConfirm}
                disabled={loading}
                style={{
                  flex: 1, padding: "8px 10px", borderRadius: 8, border: "none",
                  background: loading ? "#f0a86b" : "#ff8a00", color: "#fff",
                  cursor: loading ? "not-allowed" : "pointer", fontWeight: "700"
                }}>
                {loading ? "Processing..." : "Confirm"}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const DetailsModal = ({ open, onClose, children, title = "Details" }) => {
    useEffect(() => {
      if (!open) return;
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }, [open]);
    if (!open) return null;
    return (
      <div className="my-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="my-modal-panel" role="dialog" aria-modal="true" aria-label={title}>
          <div className="my-modal-header"><h3 style={{ color: "#222" }}>{title}</h3><button onClick={onClose} className="my-modal-close-btn">✕</button></div>
          <div className="my-modal-content">{children}</div>
        </div>
      </div>
    );
  };

  const openDetails = (t) => { setDetailsData(t); setDetailsOpen(true); };

  // ----------------------
  // render
  // ----------------------
  return (
    <div className="ticket-page">
      <div className="tickets-header">
        <Link to="/home" className="btn-back-home">Back to home</Link>
        <h1 className="tickets-title">My Tickets</h1>
      </div>

      <div className="search-bar-container">
        <input
          type="text"
          className="ticket-search-input"
          placeholder="Search by event name, venue, or type..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="filter-buttons" style={{ margin: "18px 0" }}>
        <button className={`filter-btn ${ticketFilter === "ALL" ? "active-filter" : ""}`} onClick={() => setTicketFilter("ALL")}>All</button>
        <button className={`filter-btn ${ticketFilter === "AVAILABLE" ? "active-filter" : ""}`} onClick={() => setTicketFilter("AVAILABLE")}>Available</button>
        <button className={`filter-btn ${ticketFilter === "STARTED" ? "active-filter" : ""}`} onClick={() => setTicketFilter("STARTED")}>Started</button>
        <button className={`filter-btn ${ticketFilter === "FINISHED" ? "active-filter" : ""}`} onClick={() => setTicketFilter("FINISHED")}>Finished</button>
        <button className={`filter-btn ${ticketFilter === "REFUNDED" ? "active-filter" : ""}`} onClick={() => setTicketFilter("REFUNDED")}>Refunded</button>
        <button className={`filter-btn ${ticketFilter === "CANCELLED" ? "active-filter" : ""}`} onClick={() => setTicketFilter("CANCELLED")}>Cancelled</button>
      </div>

      {loading ? (
        <div style={{ padding: 30, textAlign: "center" }}>Loading your tickets…</div>
      ) : (
        <>
          {messages.length > 0 && (
            <div className="messages" style={{ maxWidth: 900, margin: "12px auto" }}>
              {messages.map((msg, idx) => (
                <div key={idx} className={`alert ${msg.type}`} style={{ marginBottom: 8 }}>{msg.text}</div>
              ))}
            </div>
          )}

          {error && <div style={{ color: "crimson", textAlign: "center", marginTop: 10 }}>{error}</div>}

          <div className="tickets-container">
            {filteredTickets.length > 0 ? (
              <div className="tickets-grid">
                {filteredTickets.map((t) => {
                  const ev = t.event ?? t.ticket?.event ?? null;
                  const price = t.payment_amount ?? t.ticket?.price ?? t.ticket?.ticketPrice ?? 0;
                  const ticketType = deriveTicketType(t);
                  const finished = isEventFinished(ev);
                  const started = !finished && isEventStarted(ev);
                  const cancelled = !ev || (ev.event_status && ev.event_status.toString().toUpperCase() === "CANCELLED");
                  const modified = !cancelled && !finished && !started && isEventModified(t);
                  const status = (t.payment_status ?? "").toString().toUpperCase();

                  // NEW: precedence: cancelled > refunded > pending_refund > finished/started/modified/available
                  let banner = { style: bannerStyle("#9e9e9e"), text: "TICKET AVAILABLE" };

                  if (cancelled) {
                    banner = { style: bannerStyle("#b71c1c"), text: "EVENT CANCELLED" };
                  } else if (status === "REFUNDED") {
                    banner = { style: bannerStyle("#2e7d32"), text: "TICKET REFUNDED" };
                  } else if (status === "PENDING_REFUND") {
                    banner = { style: bannerStyle("#ffb300"), text: "REFUND PENDING" };
                  } else if (finished) {
                    banner = { style: bannerStyle("#e53935"), text: "EVENT FINISHED" };
                  } else if (started) {
                    banner = { style: bannerStyle("#fb8c00"), text: "EVENT STARTED" };
                  } else if (modified) {
                    banner = { style: bannerStyle("#2e7d32"), text: "EVENT MODIFIED" };
                  }

                  const refundAllowed = !finished && !cancelled && status !== "PENDING_REFUND" && status !== "REFUNDED";

                  return (
                    <div key={getPaymentId(t) ?? Math.random()} className="ticket-card-new">
                      {banner && <div style={banner.style}>{banner.text}</div>}

                      <div className="ticket-info-section">
                        <h3 className="ticket-event">{ev?.event_name ?? "Event"}</h3>
                        <p><strong>Venue:</strong> {ev?.event_venue ?? "—"}</p>
                        <p><strong>Date:</strong> {formatDate(ev?.event_date)}</p>
                        <p><strong>Time:</strong> {`${formatTo12Hour(ev?.event_time_in)} — ${formatTo12Hour(ev?.event_time_out)}`}</p>
                        <p><strong>Price:</strong> ₱{Number(price || 0).toFixed(2)}</p>
                        <p><strong>Type:</strong> {ticketType}</p>

                        {status === "PENDING_REFUND" && <div className="ticket-status pending">Refund Pending</div>}
                        {status === "REFUNDED" && <div className="ticket-status refunded">Refunded</div>}
                      </div>

                      <div className="ticket-actions">
                        {status === "PENDING_REFUND" ? (
                          <button className="btn-disabled" disabled>Refund Requested</button>
                        ) : status === "REFUNDED" ? (
                          <button className="btn-disabled" disabled>Refunded</button>
                        ) : refundAllowed ? (
                          <>
                            <button className="btn-delete-refund" onClick={() => handleRequestRefund(getPaymentId(t))}>Request Refund</button>
                            <button className="btn-show-raw" onClick={() => openDetails(t)}>View Details</button>
                          </>
                        ) : (
                          <>
                            <button className="btn-delete-only" disabled>Refund Unavailable</button>
                            <button className="btn-show-raw" onClick={() => openDetails(t)}>View Details</button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="no-tickets" style={{ padding: 30, textAlign: "center" }}>
                No tickets match your search.
              </p>
            )}
          </div>
        </>
      )}

      {/* Details modal */}
      <DetailsModal open={detailsOpen} onClose={() => setDetailsOpen(false)} title="Ticket & Payment Details">
        {!detailsData ? (
          <div style={{ padding: 12, textAlign: "center" }}>Loading details…</div>
        ) : (
          <div className="modal-details-grid two-row-layout" style={{ textAlign: "left" }}>
            <div className="modal-detail-section ticket">
              <h4>🎟️ Ticket Info</h4>
              <p><strong>Ticket ID:</strong> {detailsData.ticket?.id ?? detailsData.ticket?.ticketId ?? "-"}</p>
              <p><strong>Type:</strong> {deriveTicketType(detailsData)}</p>
              <p><strong>Price:</strong> ₱{Number(detailsData.payment_amount ?? detailsData.ticket?.price ?? 0).toFixed(2)}</p>
            </div>

            <div className="modal-detail-section payment">
              <h4>💳 Payment Info</h4>
              <p><strong>Payment ID:</strong> {detailsData.paymentId ?? "-"}</p>
              <p><strong>Method:</strong> {detailsData.payment_method ?? "-"}</p>
              <p><strong>Amount:</strong> ₱{Number(detailsData.payment_amount ?? 0).toFixed(2)}</p>
              <p><strong>Status:</strong> {detailsData.payment_status ?? "-"}</p>
              <p><strong>Reference:</strong> {detailsData.reference_code ?? "-"}</p>
            </div>

            <div className="modal-detail-section event full">
              <h4>📍 Event Details</h4>
              <p><strong>Event Name:</strong> {detailsData.event?.event_name ?? "-"}</p>
              <p><strong>Venue:</strong> {detailsData.event?.event_venue ?? "-"}</p>
              <p><strong>Date:</strong> {detailsData.event?.event_date ? String(detailsData.event.event_date).split("T")[0] : "-"}</p>
              <p><strong>Time:</strong> {`${formatTo12Hour(detailsData.event?.event_time_in)} — ${formatTo12Hour(detailsData.event?.event_time_out)}`}</p>
            </div>
          </div>
        )}
      </DetailsModal>

      {/* Confirmation / message modal (EventDetails style) */}
      <Modal
        show={modal.show}
        title={modal.title}
        message={modal.message}
        loading={modal.loading}
        onClose={() => setModal({ ...modal, show: false, loading: false })}
        onConfirm={modal.onConfirm}
      />
    </div>
  );
}
