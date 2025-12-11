// components/Modal.jsx
import React from "react";
import "./modal.css";

export default function Modal({
  open,
  title,
  message,
  showCancel = false,
  onConfirm,
  onClose,
  confirmText = "OK",
  cancelText = "Cancel",

  // NEW OVERRIDES
  headerClass = "",
  panelClass = "",
  confirmClass = "",
  cancelClass = "",

  // Allow HTML string for message
  html = false,
}) {
  if (!open) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className={`modal ${panelClass}`}>
        
        {/* HEADER */}
        <header className={`modal-header ${headerClass}`}>
          <h3>{title}</h3>
        </header>

        {/* BODY */}
        <div className="modal-body">
          {html ? (
            <div dangerouslySetInnerHTML={{ __html: message }} />
          ) : (
            <>{message}</>
          )}
        </div>

        {/* FOOTER BUTTONS */}
        <footer className="modal-footer">
          {showCancel && (
            <button
              className={`modal-btn modal-btn-cancel ${cancelClass}`}
              onClick={onClose}
            >
              {cancelText}
            </button>
          )}

          <button
            className={`modal-btn modal-btn-confirm ${confirmClass}`}
            onClick={() => onConfirm && onConfirm()}
          >
            {confirmText}
          </button>
        </footer>

      </div>
    </div>
  );
}
