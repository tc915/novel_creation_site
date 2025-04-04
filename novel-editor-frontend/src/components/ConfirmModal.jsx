// src/components/ConfirmModal.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // For animation

function ConfirmModal({ isOpen, onClose, onConfirm, title, message }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
        {isOpen && (
             // Backdrop
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[998]" // High z-index
                onClick={onClose} // Close on backdrop click
            >
            {/* Modal Content - stop propagation so click doesn't close it */}
            <motion.div
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 30, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="bg-gray-900 border border-[var(--color-neon-red)] rounded-lg shadow-lg w-full max-w-md m-4 overflow-hidden" // Using red accent
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-[var(--color-border)]">
                <h2 className="text-xl font-bold font-[var(--font-display)] text-[var(--color-neon-red)]"> {/* Red title */}
                    {title || "Confirm Action"}
                </h2>
                </div>
                {/* Body */}
                <div className="p-6">
                <p className="text-base text-[var(--color-text-base)] font-[var(--font-body)]">
                    {message || "Are you sure?"}
                </p>
                </div>
                {/* Footer with Buttons */}
                <div className="px-6 py-3 bg-gray-800/50 flex justify-end space-x-3">
                 <button
                    onClick={onClose}
                    // Style similar to cancel button in form page
                    className="btn bg-gray-600 hover:bg-gray-700 text-white text-sm px-4 py-1.5"
                 >
                    Cancel
                 </button>
                 <button
                    onClick={onConfirm}
                    // Style as destructive action
                    className="btn bg-red-600 hover:bg-red-700 text-white text-sm px-5 py-1.5"
                 >
                    Confirm Delete
                 </button>
                </div>
            </motion.div>
            </motion.div>
        )}
    </AnimatePresence>
  );
}

export default ConfirmModal;