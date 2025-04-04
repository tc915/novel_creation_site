// src/components/AlertModal.jsx
import React from 'react';

function AlertModal({ alert_message, onClose, title = "Alert" }) {
  if (!alert_message) return null; // Don't render if no message

  return (
    // Backdrop
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[999]">
      {/* Modal Content */}
      <div className="bg-gray-900 border border-[var(--color-neon-pink)] rounded-lg shadow-lg w-full max-w-md m-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-3 border-b border-[var(--color-border)]">
          <h2 className="text-xl font-[var(--font-display)] text-[var(--color-neon-pink)]">
            {title}
          </h2>
        </div>
        {/* Body */}
        <div className="p-6">
          <p className="text-base text-[var(--color-text-base)] font-[var(--font-body)]">
            {alert_message}
          </p>
        </div>
        {/* Footer */}
        <div className="px-6 py-3 bg-gray-800/50 text-right">
          <button
            onClick={onClose}
            className="btn-primary-pink text-sm px-4 py-1.5" // Use component class
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

export default AlertModal;