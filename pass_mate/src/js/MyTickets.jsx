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
  const [error, setError] = useState(null);

  // Custom popup notification state
  const [notification, setNotification] = useState(null);

  // Modal state for showing a single ticket's details
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsData, setDetailsData] = useState(null);

  // Show notification helper
  const showNotification = (message, type = "info") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Helper: read user session
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

  // Fetch payments belonging to current user
  async function fetchMyPayments(currentUser) {
    try {
      const res = await fetch("http://localhost:8080/api/payment/get-all", { credentials: "include" });
      if (!res.ok) {
        throw new Error(`Failed to load payments (${res.status})`);
      }
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
          } else if (p.ticket_id || p.ticketId) {
            ticketObj = {
              id: p.ticketId ?? p.ticket_id ?? p.ticketId,
              price: null,
              type: null,
              availability: null,
              event: null,
            };
          }

          let event = null;
          if (ticketObj && ticketObj.event) {
            const ev = ticketObj.event;
            event = {
              id: ev.eventId ?? ev.id ?? ev.event_id ?? null,
              event_name: ev.eventName ?? ev.event_name ?? ev.name ?? "",
              event_venue: ev.eventVenue ?? ev.event_venue ?? ev.venue ?? "",
              event_date: ev.eventStartTime ?? ev.event_date ?? ev.date ?? null,
              event_time_in: ev.eventStartTime
                ? String(ev.eventStartTime).split("T")[1]?.slice(0, 5)
                : ev.event_time_in ?? ev.time_in ?? "",
              event_time_out: ev.eventEndTime
                ? String(ev.eventEndTime).split("T")[1]?.slice(0, 5)
                : ev.event_time_out ?? ev.time_out ?? "",
            };
          } else if (p.event && (p.event.eventId || p.event.id)) {
            const ev = p.event;
            event = {
              id: ev.eventId ?? ev.id ?? ev.event_id ?? null,
              event_name: ev.eventName ?? ev.event_name ?? ev.name ?? "",
              event_venue: ev.eventVenue ?? ev.event_venue ?? ev.venue ?? "",
              event_date: ev.eventStartTime ?? ev.event_date ?? ev.date ?? null,
              event_time_in: ev.eventStartTime
                ? String(ev.eventStartTime).split("T")[1]?.slice(0, 5)
                : ev.event_time_in ?? ev.time_in ?? "",
              event_time_out: ev.eventEndTime
                ? String(ev.eventEndTime).split("T")[1]?.slice(0, 5)
                : ev.event_time_out ?? ev.time_out ?? "",
            };
          }

          return {
            paymentId,
            payment_amount: p.payment_amount ?? p.paymentAmount ?? p.paymentAmount ?? null,
            payment_method: p.payment_method ?? p.paymentMethod ?? null,
            payment_status: (p.payment_status ?? p.paymentStatus ?? "SUCCESS")?.toUpperCase() ?? "SUCCESS",
            payment_timestamp: p.payment_timestamp ?? p.paymentTimestamp ?? null,
            reference_code: p.reference_code ?? p.referenceCode ?? null,
            ticket: ticketObj,
            event,
            raw: p,
          };
        }

      const needsEvent = mapped.filter((m) => m.event == null && m.ticket && m.ticket.id);
      if (needsEvent.length > 0) {
        try {
          const tRes = await fetch("http://localhost:8080/api/ticket/all", { credentials: "include" });
          if (tRes.ok) {
            const allTickets = await tRes.json();
            const byId = {};
            allTickets.forEach((t) => {
              const tid = t.ticketId ?? t.id ?? t.ticket_id;
              if (tid) byId[Number(tid)] = t;
            });
            const withEvent = mapped.map((m) => {
              if (!m.event && m.ticket && m.ticket.id && byId[Number(m.ticket.id)]) {
                const t = byId[Number(m.ticket.id)];
                const ev = t.event ?? t.eventObj ?? null;
                if (ev) {
                  m.event = {
                    id: ev.eventId ?? ev.id ?? ev.event_id ?? null,
                    event_name: ev.eventName ?? ev.event_name ?? ev.name ?? "",
                    event_venue: ev.eventVenue ?? ev.event_venue ?? ev.venue ?? "",
                    event_date: ev.eventStartTime ?? ev.event_date ?? ev.date ?? null,
                    event_time_in: ev.eventStartTime
                      ? String(ev.eventStartTime).split("T")[1]?.slice(0, 5)
                      : ev.event_time_in ?? "",
                    event_time_out: ev.eventEndTime
                      ? String(ev.eventEndTime).split("T")[1]?.slice(0, 5)
                      : ev.event_time_out ?? "",
                  };
                }
                m.ticket.price = t.ticketPrice ?? t.ticket_price ?? m.ticket.price;
              }
              return m;
            });
            return withEvent;
          }
        } catch (err) {
          console.warn("Could not fetch ticket/all fallback", err);
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
      });

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
          showNotification("Please login to see your tickets.", "info");
          setLoading(false);
          return;
        }

        const mapped = await fetchMyPayments(u);
        if (!mounted) return;

        setTickets(mapped);
        if (mapped.length === 0) showNotification("You don't own any tickets yet.", "info");
      } catch (err) {
        console.error("load tickets error", err);
        setError(err.message || "Failed to load tickets");
        showNotification("Failed to load your tickets. Please try again later.", "error");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false };
  }, []);

  async function handleRequestRefund(paymentId) {
    if (!window.confirm("Request a refund for this ticket?")) return;

    try {
      const resp = await fetch(`http://localhost:8080/api/payment/refund/${paymentId}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" }
      });

      if (!resp.ok) {
        const text = await resp.text().catch(() => "");
        showNotification(`Failed to request refund: ${resp.status} ${text}`, "error");
        return;
      }

      const resultText = await resp.text().catch(() => "Refund processed");

      setTickets(prev =>
        prev.map(t => {
          const id = t.paymentId ?? t.paymentId ?? null;
          if (id == paymentId) {
            return { ...t, payment_status: "REFUNDED" };
          }
          return t;
        })
      );

      try {
        const userRes = await fetch("http://localhost:8080/api/user/me", { credentials: "include" });
        if (userRes.ok) {
          const u = await userRes.json();
          setUser(u);
        }
      } catch (e) {
        console.warn("Failed to refresh user after refund", e);
      }

      showNotification(resultText || "Refund processed and credited to your wallet.", "success");
    } catch (err) {
      console.error("refund error", err);
      showNotification("Failed to request refund. Try again.", "error");
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
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }, [open]);

    if (!open) return null;

    return (
      <div
        className="my-modal-backdrop"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="my-modal-panel" role="dialog" aria-modal="true" aria-label={title}>
          <div className="my-modal-header">
            <h3>{title}</h3>
            <button onClick={onClose} className="my-modal-close-btn">✕</button>
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

  const renderStatusBadge = (status, eventObj) => {
    const s = (status ?? "").toString().toUpperCase();
    const evStatus = (eventObj?.event_status ?? eventObj?.eventStatus ?? "").toString().toUpperCase();
    const isEventCancelled = evStatus === "CANCELLED" || evStatus === "CANCELLED_BY_ORGANIZER";

    if (isEventCancelled) {
      return <div className="ticket-status cancelled">Event Cancelled</div>;
    }
    if (s === "PENDING_REFUND") return <div className="ticket-status pending">Refund Pending</div>;
    if (s === "REFUNDED") return <div className="ticket-status refunded">Refunded</div>;
    if (s === "CANCELLED") return <div className="ticket-status cancelled">Cancelled</div>;
    return null;
  };

  // Custom Notification Component
  const CustomNotification = ({ message, type, onClose }) => {
    useEffect(() => {
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }, [onClose]);

    return (
      <div className={`custom-notification ${type}`}>
        <div className="notification-icon">
          {type === "success" && "✓"}
          {type === "error" && "✕"}
          {type === "info" && "ℹ"}
        </div>
        <div className="notification-message">{message}</div>
        <button className="notification-close" onClick={onClose}>×</button>
      </div>
    );
  };

  return (
    <div className="ticket-page">
      {/* Custom Notification Popup */}
      {notification && (
        <CustomNotification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="tickets-header">
        <Link to="/home" className="btn-back-home">Back to home</Link>
      </div>

      <h1 className="tickets-title">My Tickets</h1>

      {loading ? (
        <div className="tickets-container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading your tickets…</p>
          </div>
        </div>
      ) : (
        <>
          {error && <div style={{ color: "crimson", textAlign: "center", marginTop: 10 }}>{error}</div>}

          <div className="tickets-container">
            {filteredTickets.length > 0 ? (
              <div className="tickets-grid">
                {filteredTickets.map((t) => {
                  const ev = t.event ?? t.ticket?.event ?? null;
                  const price = t.payment_amount ?? t.ticket?.price ?? t.ticket?.ticketPrice ?? 0;
                  const ticketType = deriveTicketType(t);
                  const status = t.payment_status ?? "SUCCESS";

                  const finished = isEventFinished(ev);
                  const started = !finished && isEventStarted(ev);
                  const cancelled = !ev || !ev.id;
                  const modified = !cancelled && !finished && !started && isEventModified(t);

                  let banner = null;
                  if (finished)
                    banner = { style: finishedBannerStyle, text: "EVENT FINISHED" };
                  else if (started)
                    banner = { style: startedBannerStyle, text: "EVENT STARTED" };
                  else if (cancelled)
                    banner = { style: cancelledStyle, text: "EVENT CANCELLED" };
                  else if (modified)
                    banner = { style: modifiedStyle, text: "EVENT MODIFIED" };
                  else
                    banner = { style: neutralStyle, text: "TICKET AVAILABLE" };

                  const refundAllowed = !finished && !cancelled;

                  return (
                    <div key={t.paymentId ?? `${t.ticket?.id ?? "t"}-${Math.random()}`} className="ticket-card-new">
                      <div className="ticket-card-header">
                        <div className="ticket-icon">🎫</div>
                        {renderStatusBadge(status, ev)}
                      </div>

                      <div className="ticket-info-section">
                        <h3 className="ticket-event">{ev?.event_name ?? "Event"}</h3>
                        
                        <div className="ticket-detail-row">
                          <span className="detail-icon">📍</span>
                          <span className="detail-text">{ev?.event_venue ?? "—"}</span>
                        </div>

                        <div className="ticket-detail-row">
                          <span className="detail-icon">📅</span>
                          <span className="detail-text">{formatDate(ev?.event_date)}</span>
                        </div>

                        <div className="ticket-detail-row">
                          <span className="detail-icon">⏰</span>
                          <span className="detail-text">{formatTime(ev?.event_time_in, ev?.event_time_out)}</span>
                        </div>

                        <div className="ticket-price-section">
                          <span className="price-label">Price</span>
                          <span className="price-amount">₱{Number(price || 0).toFixed(2)}</span>
                        </div>

                        <div className="ticket-type-badge">{ticketType}</div>
                      </div>

                      <div className="ticket-actions">
                        {status === "PENDING_REFUND" ? (
                          <button className="btn-disabled" disabled>Refund Requested</button>
                        ) : status === "REFUNDED" ? (
                          <button className="btn-disabled" disabled>Refunded</button>
                        ) : (
                          <button className="btn-refund" onClick={() => handleRequestRefund(t.paymentId)}>
                            <span className="btn-icon">↺</span> Request Refund
                          </button>
                        )}

                        <button className="btn-details" onClick={() => openDetails(t)}>
                          <span className="btn-icon">📋</span> View Details
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="no-tickets">
                <div className="no-tickets-icon">🎟️</div>
                <p>You don't own any tickets yet.</p>
                <Link to="/home" className="btn-browse">Browse Events</Link>
              </div>
            )}
          </div>
        </>
      )}

      <Modal open={detailsOpen} onClose={() => setDetailsOpen(false)} title="Ticket & Payment Details">
        {!detailsData ? (
          <div style={{ padding: 12, textAlign: "center" }}>Loading details…</div>
        ) : (
          <div className="modal-details-grid" role="presentation">
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
              <p>
                <strong>Time:</strong>{" "}
                {formatTo12Hour(detailsData.event?.event_time_in)} —
                {formatTo12Hour(detailsData.event?.event_time_out)}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}