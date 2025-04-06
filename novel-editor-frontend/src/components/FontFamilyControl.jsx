// ---> FILE: ./novel-editor-frontend/src/components/FontFamilyControl.jsx <---

import React, { useState, useEffect, useCallback, useRef } from 'react';
// Removed Slate hooks as this controls novel defaults
import {
  AVAILABLE_FONTS,
  DEFAULT_FONT_FAMILY
} from '../utils/slateEditorUtils';
// ---> CHANGE START <---
// Ensure Framer Motion is imported
import { motion, AnimatePresence } from 'framer-motion';
// ---> CHANGE END <---

// ---> CHANGE START <---
// Framer Motion Variants (Define or ensure they exist)
const listVariants = {
  open: {
    opacity: 1,
    height: 'auto',
    transition: {
      type: 'tween', // Use tween for smoother height/opacity
      duration: 0.2,
      when: 'beforeChildren', // Animate container before children appear
      staggerChildren: 0.03 // Stagger children animation
    }
  },
  closed: {
    opacity: 0,
    height: 0,
    transition: {
      type: 'tween',
      duration: 0.15,
      when: 'afterChildren', // Animate container after children disappear
      staggerChildren: 0.02, // Stagger children disappearance
      staggerDirection: -1 // Reverse stagger on exit
    }
  }
};

const itemVariants = {
  open: {
    opacity: 1,
    y: 0,
    transition: { type: 'tween', duration: 0.15, ease: 'easeOut' }
  },
  closed: {
    opacity: 0,
    y: -10, // Animate slightly upwards on close
    transition: { type: 'tween', duration: 0.1, ease: 'easeIn' }
  }
};
// ---> CHANGE END <---

// Receive currentNovelDefault and the change handler
function FontFamilyControl({ currentNovelDefault, onNovelDefaultsChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // The value displayed is the novel default passed in
  const displayValue = currentNovelDefault || DEFAULT_FONT_FAMILY;

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle selecting font from dropdown list
  const handleDropdownSelect = useCallback(
    (fontFamily) => {
      if (onNovelDefaultsChange) {
        onNovelDefaultsChange('fontFamily', fontFamily);
      }
      setIsOpen(false);
    },
    [onNovelDefaultsChange]
  );

  // Toggle dropdown visibility
  const toggleDropdown = (e) => {
    e.preventDefault();
    setIsOpen(!isOpen);
  };

  return (
    <div
      className="relative"
      ref={containerRef}
      title="Novel Default Font Family"
    >
      {/* Button displays current novel default font */}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()} // Prevent focus steal
        onClick={toggleDropdown}
        className="flex items-center justify-between border border-[var(--color-border)] rounded h-[28px] min-w-[120px] px-2 bg-[var(--color-content-bg)] text-xs text-[var(--color-text-base)] focus:outline-none focus:ring-1 focus:ring-[var(--color-neon-cyan)]"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        style={{ fontFamily: displayValue }}
      >
        <span className="truncate">{displayValue}</span>
        <svg
          className="fill-current h-3 w-3 ml-1 flex-shrink-0 text-[var(--color-text-muted)]"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
        >
          {' '}
          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />{' '}
        </svg>
      </button>

      {/* ---> CHANGE START <--- */}
      {/* Wrap the dropdown list with AnimatePresence */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            // Apply variants and animation props
            variants={listVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="absolute top-full left-0 mt-1 w-full max-h-60 overflow-y-auto bg-gray-900 border border-[var(--color-border)] rounded shadow-lg z-20"
            role="listbox"
          >
            {AVAILABLE_FONTS.map((font) => (
              // Apply item variants to each button
              <motion.button
                key={font}
                variants={itemVariants} // Apply item variants
                type="button"
                role="option"
                aria-selected={displayValue === font}
                className={`block w-full text-left px-3 py-1.5 text-xs transition-colors duration-100 ${
                  displayValue === font
                    ? 'bg-[var(--color-content-bg)] text-[var(--color-neon-cyan)]'
                    : 'text-[var(--color-text-base)] hover:bg-gray-800 hover:text-[var(--color-neon-cyan)]'
                }`}
                style={{ fontFamily: font }}
                onMouseDown={(e) => {
                  // Use onMouseDown for selection to avoid focus issues
                  e.preventDefault();
                  handleDropdownSelect(font);
                }}
              >
                {font}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      {/* ---> CHANGE END <--- */}
    </div>
  );
}

export default FontFamilyControl;
