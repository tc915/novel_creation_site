// src/components/FontFamilyControl.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSlate, ReactEditor } from 'slate-react';
import { Editor, Transforms } from 'slate';
import { motion, AnimatePresence } from 'framer-motion';

// Define defaults here or import them
const AVAILABLE_FONTS = [
  'Open Sans',
  'Orbitron',
  'Lato',
  'Merriweather',
  'Lora',
  'EB Garamond',
  'Source Code Pro'
];
const DEFAULT_FONT_FAMILY = 'Open Sans'; // Match base --font-body in index.css

// Helper to get current font family (based on selection)
const getCurrentFontFamily = (editor) => {
  if (!editor) return DEFAULT_FONT_FAMILY;
  const marks = Editor.marks(editor);
  return marks?.fontFamily || DEFAULT_FONT_FAMILY;
};

// Framer Motion Variants
const listVariants = {
  open: {
    opacity: 1,
    height: 'auto',
    transition: {
      type: 'tween',
      duration: 0.2,
      when: 'beforeChildren',
      staggerChildren: 0.03
    }
  },
  closed: {
    opacity: 0,
    height: 0,
    transition: {
      type: 'tween',
      duration: 0.15,
      when: 'afterChildren',
      staggerChildren: 0.02,
      staggerDirection: -1
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
    y: -10,
    transition: { type: 'tween', duration: 0.1, ease: 'easeIn' }
  }
};
// --- End Helpers and Variants ---

function FontFamilyControl({ updateStickyFormat, stickyFormat }) {
  // Receive props
  const editor = useSlate();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Get the currently applied font family at the selection for display
  const currentFontInSelection = editor
    ? getCurrentFontFamily(editor)
    : DEFAULT_FONT_FAMILY;

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
      if (!editor) return;

      const newStickyValue =
        fontFamily === DEFAULT_FONT_FAMILY ? null : fontFamily;

      // 1. Apply to current selection/editor.marks
      Editor.removeMark(editor, 'fontFamily'); // Remove old mark first
      if (newStickyValue) {
        // Only add mark if not default
        Editor.addMark(editor, 'fontFamily', newStickyValue);
      }

      // 2. Update sticky format state
      updateStickyFormat('fontFamily', newStickyValue); // Pass font or null

      setIsOpen(false);
      // Refocus needed?
      // setTimeout(() => ReactEditor.focus(editor), 0);
    },
    [editor, updateStickyFormat]
  );

  // Toggle dropdown visibility
  const toggleDropdown = (e) => {
    e.preventDefault();
    setIsOpen(!isOpen);
  };

  // Don't render if editor is not available yet
  if (!editor) return null;

  return (
    <div className="relative" ref={containerRef} title="Font Family">
      {/* Button displaying current font and dropdown arrow */}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()} // Prevent focus steal
        onClick={toggleDropdown}
        className="flex items-center justify-between border border-[var(--color-border)] rounded h-[28px] min-w-[120px] px-2 bg-[var(--color-content-bg)] text-xs text-[var(--color-text-base)] focus:outline-none focus:ring-1 focus:ring-[var(--color-neon-cyan)]"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        // Display the font active in the current selection
        style={{ fontFamily: currentFontInSelection }}
      >
        {/* Display current selection's font name */}
        <span className="truncate">{currentFontInSelection}</span>
        {/* Dropdown Arrow */}
        <svg
          className="fill-current h-3 w-3 ml-1 flex-shrink-0 text-[var(--color-text-muted)]"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
        >
          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
        </svg>
      </button>

      {/* Animated Dropdown List */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={listVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="absolute top-full left-0 mt-1 w-full max-h-60 overflow-y-auto bg-gray-900 border border-[var(--color-border)] rounded shadow-lg z-20"
            role="listbox"
          >
            {AVAILABLE_FONTS.map((font) => (
              <motion.button
                key={font}
                variants={itemVariants}
                type="button"
                role="option"
                aria-selected={currentFontInSelection === font}
                className={`block w-full text-left px-3 py-1.5 text-xs transition-colors duration-100 ${
                  currentFontInSelection === font
                    ? 'bg-[var(--color-content-bg)] text-[var(--color-neon-cyan)]'
                    : 'text-[var(--color-text-base)] hover:bg-gray-800 hover:text-[var(--color-neon-cyan)]'
                }`}
                // Apply the font itself to the button text for preview
                style={{ fontFamily: font }}
                onMouseDown={(e) => {
                  // Use onMouseDown for selection
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
    </div>
  );
}

export default FontFamilyControl;
