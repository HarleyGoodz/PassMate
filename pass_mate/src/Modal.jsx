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
}) {
  if (!open) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal">
        <header className="modal-header">
          <h3>{title}</h3>
        </header>
        <div className="modal-body">
          <p>{message}</p>
        </div>
        <footer className="modal-footer">
          {showCancel && (
            <button className="modal-btn modal-btn-cancel" onClick={onClose}>
              {cancelText}
            </button>
          )}
          <button
            className="modal-btn modal-btn-confirm"
            onClick={() => {
              if (onConfirm) onConfirm();
            }}
          >
            {confirmText}
          </button>
        </footer>
      </div>
    </div>
  );
}
