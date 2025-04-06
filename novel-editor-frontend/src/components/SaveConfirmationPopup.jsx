// ---> FILE: ./novel-editor-frontend/src/components/SaveConfirmationPopup.jsx <---

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function SaveConfirmationPopup({
  isVisible,
  message,
  duration = 2000,
  onClose
}) {
  // Auto-close after duration
  useEffect(() => {
    let timer;
    if (isVisible) {
      timer = setTimeout(() => {
        onClose();
      }, duration);
    }
    return () => clearTimeout(timer); // Cleanup timer on unmount or visibility change
  }, [isVisible, duration, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20, transition: { duration: 0.2 } }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 20,
            duration: 0.3
          }}
          // Positioning: Bottom center, fixed
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[1000] px-4 py-2 rounded-md shadow-lg bg-[var(--color-neon-cyan)] text-black"
        >
          <p className="text-sm font-medium font-[var(--font-body)]">
            {message || 'Saved!'}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default SaveConfirmationPopup;
