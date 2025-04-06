// src/components/FontSizeControl.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSlate, ReactEditor } from 'slate-react';
import { Editor, Transforms } from 'slate';
import { motion, AnimatePresence } from 'framer-motion';

// Define defaults here or import them
const POPULAR_FONT_SIZES = [
  '10px',
  '12px',
  '14px',
  '16px',
  '18px',
  '24px',
  '36px',
  '48px',
  '72px'
];
const DEFAULT_FONT_SIZE_NUM = 16;
const DEFAULT_FONT_SIZE_STR = `${DEFAULT_FONT_SIZE_NUM}px`;
const MIN_FONT_SIZE = 10;
const MAX_FONT_SIZE = 75;

// Helper to get current font size for input display (based on selection)
const getCurrentFontSizeForInput = (editor) => {
  if (!editor) return '';
  const currentSizeMark = Editor.marks(editor)?.fontSize;
  if (currentSizeMark && currentSizeMark !== DEFAULT_FONT_SIZE_STR) {
    const sizeNum = parseInt(currentSizeMark, 10);
    return isNaN(sizeNum) ? '' : sizeNum.toString();
  }
  return ''; // Return empty if default or no mark applied
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

// --- Component ---
function FontSizeControl({ updateStickyFormat, stickyFormat }) {
  // Receive props
  const editor = useSlate();
  const [isOpen, setIsOpen] = useState(false);
  // Input value reflects current SELECTION's format, or empty for default
  const [internalInputValue, setInternalInputValue] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null); // Ref for the input element

  // --- Sync input value with editor selection ---
  useEffect(() => {
    if (editor) {
      const currentEditorSize = getCurrentFontSizeForInput(editor);
      // Update input only if it's not currently focused
      if (document.activeElement !== inputRef.current) {
        setInternalInputValue(currentEditorSize);
      }
    } else {
      setInternalInputValue('');
    }
    // Depend on editor marks stringified to detect changes
  }, [editor, editor?.selection, JSON.stringify(Editor.marks(editor))]);

  // --- Handle clicks outside ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        // Revert input value to match editor state when closing dropdown by clicking outside
        if (editor) {
          setInternalInputValue(getCurrentFontSizeForInput(editor));
        }
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
  }, [isOpen, editor]);

  // --- Apply Font Size Logic (Helper inside or call external) ---
  const applySize = useCallback(
    (sizeString) => {
      if (!editor) return;

      let newSizeMark = null; // Will be null if default
      const sizeNum = parseInt(sizeString, 10);

      // Validate and format the mark value
      if (
        !isNaN(sizeNum) &&
        sizeNum >= MIN_FONT_SIZE &&
        sizeNum <= MAX_FONT_SIZE
      ) {
        if (sizeNum !== DEFAULT_FONT_SIZE_NUM) {
          newSizeMark = `${sizeNum}px`;
        }
      } else {
        console.warn('Invalid font size applied or cleared:', sizeString);
        // Keep newSizeMark as null (default)
      }

      // 1. Apply to current selection/editor.marks
      Editor.removeMark(editor, 'fontSize'); // Remove old mark first
      if (newSizeMark) {
        Editor.addMark(editor, 'fontSize', newSizeMark);
      }

      // 2. Update sticky format state
      updateStickyFormat('fontSize', newSizeMark); // Pass mark value (or null)

      // Update input display to reflect selection (might be empty if default)
      setInternalInputValue(getCurrentFontSizeForInput(editor));

      // Refocus editor needed?
      // setTimeout(() => { if (!ReactEditor.isFocused(editor)) ReactEditor.focus(editor) }, 0);
    },
    [editor, updateStickyFormat]
  );

  // --- Event Handlers ---
  const handleInputChange = (e) => {
    const value = e.target.value;
    // Allow only digits, max 2 chars
    if (/^\d*$/.test(value) && value.length <= 2) {
      setInternalInputValue(value);
    }
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      applySize(internalInputValue); // Apply from input value
      setIsOpen(false);
      e.target.blur();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      if (editor) setInternalInputValue(getCurrentFontSizeForInput(editor)); // Revert input
      setIsOpen(false);
      e.target.blur();
    }
  };

  const handleInputBlur = (e) => {
    // Apply only if focus moves outside the component AND dropdown is not open
    if (!containerRef.current?.contains(e.relatedTarget) && !isOpen) {
      applySize(internalInputValue);
    }
  };

  const handleDropdownSelect = (size) => {
    applySize(size); // Apply directly from dropdown value (e.g., "14px")
    setIsOpen(false);
  };

  const toggleDropdown = (e) => {
    e.preventDefault();
    setIsOpen(!isOpen);
  };

  const placeholderSize = DEFAULT_FONT_SIZE_NUM.toString();

  // Don't render if editor not ready
  if (!editor) return null;

  return (
    <div
      className="relative"
      ref={containerRef}
      title={`Font Size (${MIN_FONT_SIZE}-${MAX_FONT_SIZE})`}
    >
      <div className="flex items-center border border-[var(--color-border)] rounded h-[28px] w-[75px] bg-[var(--color-content-bg)] focus-within:ring-1 focus-within:ring-[var(--color-neon-cyan)]">
        <input
          ref={inputRef} // Attach ref
          type="text"
          value={internalInputValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          onBlur={handleInputBlur}
          placeholder={placeholderSize}
          className="bg-transparent text-xs text-center text-[var(--color-text-base)] focus:outline-none w-full h-full pl-2 pr-1"
          maxLength="2"
          pattern="[0-9]*"
          inputMode="numeric"
        />
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={toggleDropdown}
          className="flex items-center justify-center h-full px-1 border-l border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-neon-cyan)] focus:outline-none"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          tabIndex={-1} // Prevent tabbing to button itself
        >
          <svg
            className="fill-current h-3 w-3"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
          >
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
          </svg>
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={listVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="absolute top-full left-0 mt-1 w-full max-h-48 overflow-y-auto bg-gray-900 border border-[var(--color-border)] rounded shadow-lg z-20"
            role="listbox"
          >
            {POPULAR_FONT_SIZES.map((size) => (
              <motion.button
                key={size}
                variants={itemVariants}
                type="button"
                role="option"
                // Visually indicate selection if input matches dropdown value (ignoring 'px')
                aria-selected={internalInputValue === size.replace('px', '')}
                className={`block w-full text-left px-3 py-1.5 text-xs font-mono transition-colors duration-100 ${
                  internalInputValue === size.replace('px', '')
                    ? 'bg-[var(--color-content-bg)] text-[var(--color-neon-cyan)]'
                    : 'text-[var(--color-text-base)] hover:bg-gray-800 hover:text-[var(--color-neon-cyan)]'
                }`}
                onMouseDown={(e) => {
                  // Use onMouseDown for selection
                  e.preventDefault();
                  handleDropdownSelect(size);
                }}
              >
                {size.replace('px', '')}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default FontSizeControl;
