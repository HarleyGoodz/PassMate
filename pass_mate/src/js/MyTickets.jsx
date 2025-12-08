// src/js/MyTickets.jsx
import React, { useEffect, useState } from "react";
import "../css/myTickets_styles.css";
import { Link } from "react-router-dom";

const formatTo12Hour = (time) => {
  if (!time) return "";

  let [hour, minute] = time.split(":");
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

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsData, setDetailsData] = useState(null);

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
      const res = await fetch("http://localhost:8080/api/payment/get-all");
      if (!res.ok) throw new Error(`Failed to load payments (${res.status})`);

      const payments = await res.json();

      const myPayments = payments.filter((p) => {
        try {
          const uid = currentUser?.userId ?? currentUser?.id ?? currentUser?.user_id;
          if (!uid) return false;

          if (p.user && (p.user.userId === uid || p.user.user_id === uid)) return true;
          if (p.userId === uid || p.user_id === uid) return true;

          return false;
        } catch {
          return false;
        }
      });

      const mapped = await Promise.all(
        myPayments.map(async (p) => {
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
            };
          }

          let event = null;
          const ev = ticketObj?.event ?? p.event;
          if (ev) {
            event = {
              id: ev.eventId ?? ev.id ?? ev.event_id ?? null,
              event_name: ev.eventName ?? ev.event_name ?? "",
              event_venue: ev.eventVenue ?? ev.event_venue ?? "",
              event_date: ev.eventStartTime ?? ev.event_date ?? null,
              event_time_in: ev.eventStartTime
                ? String(ev.eventStartTime).split("T")[1]?.slice(0, 5)
                : ev.event_time_in ?? "",
              event_time_out: ev.eventEndTime
                ? String(ev.eventEndTime).split("T")[1]?.slice(0, 5)
                : ev.event_time_out ?? "",
            };
          }

          return {
            paymentId,
            payment_amount: p.payment_amount ?? p.paymentAmount ?? null,
            payment_method: p.payment_method ?? p.paymentMethod ?? null,
            payment_status: p.payment_status ?? p.paymentStatus ?? null,
            payment_timestamp: p.payment_timestamp ?? p.paymentTimestamp ?? null,
            reference_code: p.reference_code ?? p.referenceCode ?? null,
            ticket: ticketObj,
            event,
            raw: p,
          };
        })
      );

      return mapped;
    } catch (err) {
      throw err;
    }
  }

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
        if (mapped.length === 0)
          setMessages([{ text: "You don't own any tickets yet.", type: "info" }]);
      } catch (err) {
        console.error("load tickets error", err);
        setError(err.message || "Failed to load tickets");
        setMessages([{ text: "Failed to load your tickets. Please try again later.", type: "error" }]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false };
  }, []);

  // ⭐ FIX: Helper to safely get paymentId
  const getPaymentId = (t) =>
    t.paymentId ??
    t.payment_id ??
    t.id ??
    t.raw?.paymentId ??
    null;

  async function handleDelete(paymentId) {
    if (!paymentId) {
      alert("Unable to delete this ticket. Missing payment ID.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this ticket and request a refund?")) return;

    try {
      const resp = await fetch(`http://localhost:8080/api/payment/delete/${paymentId}`, {
        method: "DELETE",
      });

      if (!resp.ok) {
        const txt = await resp.text().catch(() => "");
        setMessages([{ text: `Failed to delete: ${resp.status} ${txt}`, type: "error" }]);
        return;
      }

      setTickets((prev) => prev.filter((t) => getPaymentId(t) !== paymentId));
      setMessages([{ text: "Ticket deleted and refunded!", type: "success" }]);
    } catch (err) {
      console.error("delete error", err);
      setMessages([{ text: "Failed to delete ticket. Try again.", type: "error" }]);
    }
  }

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

  const Modal = ({ open, onClose, children, title = "Details" }) => {
    useEffect(() => {
      if (!open) return;
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev };
    }, [open]);

    if (!open) return null;

    return (
      <div className="my-modal-backdrop" onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}>
        <div className="my-modal-panel" role="dialog" aria-modal="true" aria-label={title}>
          <div className="my-modal-header">
            <h3>{title}</h3>
            <button onClick={onClose} aria-label="Close details" className="my-modal-close-btn">✕</button>
          </div>
          <div className="my-modal-content">
            {children}
          </div>
        </div>
      </div>
    );
  };

  const openDetails = (t) => {
    setDetailsData(t);
    setDetailsOpen(true);
  };

  const filteredTickets = tickets.filter((t) => {
    const ev = t.event ?? t.ticket?.event ?? {};
    const ticketType = deriveTicketType(t);
    const text = `${ev.event_name ?? ""} ${ev.event_venue ?? ""} ${ticketType}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

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

      {loading ? (
        <div style={{ padding: 30, textAlign: "center" }}>Loading your tickets…</div>
      ) : (
        <>
          {messages.length > 0 && (
            <div className="messages" style={{ maxWidth: 900, margin: "12px auto" }}>
              {messages.map((msg, idx) => (
                <div key={idx} className={`alert ${msg.type}`} style={{ marginBottom: 8 }}>
                  {msg.text}
                </div>
              ))}
            </div>
          )}

          {error && (
            <div style={{ color: "crimson", textAlign: "center", marginTop: 10 }}>
              {error}
            </div>
          )}

          <div className="tickets-container">
            {filteredTickets.length > 0 ? (
              <div className="tickets-grid">
                {filteredTickets.map((t) => {
                  console.log("TICKET DEBUG:", t);
                  const ev = t.event ?? t.ticket?.event ?? null;
                  const price = t.payment_amount ?? t.ticket?.price ?? t.ticket?.ticketPrice ?? 0;
                  const ticketType = deriveTicketType(t);

                  return (
                    <div key={getPaymentId(t)} className="ticket-card-new">
                      <div className="ticket-info-section">
                        <h3 className="ticket-event">{ev?.event_name ?? "Event"}</h3>
                        <p><strong>Venue:</strong> {ev?.event_venue ?? "—"}</p>
                        <p><strong>Date:</strong> {formatDate(ev?.event_date)}</p>
                        <p><strong>Time:</strong> {`${formatTo12Hour(ev?.event_time_in)} — ${formatTo12Hour(ev?.event_time_out)}`}</p>
                        <p><strong>Price:</strong> ₱{Number(price || 0).toFixed(2)}</p>
                        <p><strong>Type:</strong> {ticketType}</p>
                      </div>

                      <div className="ticket-actions">
                        <button className="btn-delete-refund" onClick={() => handleDelete(getPaymentId(t))}>
                          Delete & Refund
                        </button>

                        <button className="btn-show-raw" onClick={() => openDetails(t)}>
                          View Details
                        </button>
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

      {/* MODAL */}
      <Modal open={detailsOpen} onClose={() => setDetailsOpen(false)} title="Ticket & Payment Details">
        {!detailsData ? (
          <div style={{ padding: 12, textAlign: "center" }}>Loading details…</div>
        ) : (
          <div className="modal-details-grid two-row-layout" role="presentation" style={{ textAlign: "left" }}>
            <div className="modal-detail-section ticket">
              <h4>🎟️ Ticket Info</h4>
              <p><strong>Ticket ID:</strong> {detailsData.ticket?.id ?? detailsData.ticket?.ticketId ?? "-"}</p>
              <p><strong>Type:</strong> {deriveTicketType(detailsData)}</p>
              <p><strong>Price:</strong> ₱{Number(detailsData.payment_amount ?? detailsData.ticket?.price ?? 0).toFixed(2)}</p>
            </div>

            <div className="modal-detail-section payment">
              <h4>💳 Payment Info</h4>
              <p><strong>Payment ID:</strong> {detailsData.paymentId ?? "-"}</p>
              <p><strong>Method:</strong> {detailsData.payment_method ?? detailsData.paymentMethod ?? "-"}</p>
              <p><strong>Amount:</strong> ₱{Number(detailsData.payment_amount ?? detailsData.ticket?.price ?? 0).toFixed(2)}</p>
              <p><strong>Status:</strong> {detailsData.payment_status ?? detailsData.paymentStatus ?? "-"}</p>
              <p><strong>Reference:</strong> {detailsData.reference_code ?? detailsData.referenceCode ?? "-"}</p>
            </div>

            <div className="modal-detail-section event full">
              <h4>📍 Event Details</h4>
              <p><strong>Event Name:</strong> {detailsData.event?.event_name ?? detailsData.ticket?.event?.eventName ?? "-"}</p>
              <p><strong>Venue:</strong> {detailsData.event?.event_venue ?? detailsData.ticket?.event?.eventVenue ?? "-"}</p>
              <p><strong>Date:</strong> {detailsData.event?.event_date ? String(detailsData.event.event_date).split("T")[0] : (detailsData.ticket?.event?.eventStartTime ? String(detailsData.ticket.event.eventStartTime).split("T")[0] : "-")}</p>
              <p><strong>Time:</strong>{" "}{formatTo12Hour(detailsData.event?.event_time_in)} — {formatTo12Hour(detailsData.event?.event_time_out)}
            </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
