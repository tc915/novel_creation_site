// ---> FILE: ./novel-editor-frontend/src/components/FontSizeControl.jsx <---

import React, { useState, useEffect, useCallback, useRef } from 'react';
// Removed Slate hooks
import {
  POPULAR_FONT_SIZES,
  DEFAULT_FONT_SIZE_NUM,
  DEFAULT_FONT_SIZE_STR,
  MIN_FONT_SIZE,
  MAX_FONT_SIZE
} from '../utils/slateEditorUtils';
// ---> CHANGE START <---
// Ensure Framer Motion is imported
import { motion, AnimatePresence } from 'framer-motion';
// ---> CHANGE END <---

// Helper to extract number from size string
const parseSizeString = (sizeStr) => {
  if (!sizeStr) return '';
  const match = sizeStr.match(/^(\d+)/);
  return match ? match[1] : '';
};

// ---> CHANGE START <---
// Framer Motion Variants (Define or ensure they exist - can be same as FontFamilyControl)
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
// ---> CHANGE END <---

// --- Component ---
// Receive currentNovelDefault and the change handler
function FontSizeControl({ currentNovelDefault, onNovelDefaultsChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [internalInputValue, setInternalInputValue] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Sync input value with novel default prop
  useEffect(() => {
    const defaultSizeNumStr = parseSizeString(
      currentNovelDefault || DEFAULT_FONT_SIZE_STR
    );
    if (document.activeElement !== inputRef.current) {
      setInternalInputValue(defaultSizeNumStr);
    }
  }, [currentNovelDefault]);

  // Handle clicks outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        const defaultSizeNumStr = parseSizeString(
          currentNovelDefault || DEFAULT_FONT_SIZE_STR
        );
        setInternalInputValue(defaultSizeNumStr);
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
  }, [isOpen, currentNovelDefault]);

  // Apply Font Size Logic
  const applySize = useCallback(
    (sizeInputValue) => {
      if (!onNovelDefaultsChange) return;
      let finalSizeStr = DEFAULT_FONT_SIZE_STR;
      const sizeNum = parseInt(sizeInputValue, 10);
      if (
        !isNaN(sizeNum) &&
        sizeNum >= MIN_FONT_SIZE &&
        sizeNum <= MAX_FONT_SIZE
      ) {
        finalSizeStr = `${sizeNum}px`;
      } else {
        console.warn(
          'Invalid font size input, reverting to default:',
          sizeInputValue
        );
        finalSizeStr = DEFAULT_FONT_SIZE_STR;
      }
      onNovelDefaultsChange('fontSize', finalSizeStr);
      setInternalInputValue(parseSizeString(finalSizeStr));
    },
    [onNovelDefaultsChange]
  );

  // --- Event Handlers ---
  const handleInputChange = (e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value) && value.length <= 2) {
      setInternalInputValue(value);
    }
  };
  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      applySize(internalInputValue);
      setIsOpen(false);
      e.target.blur();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      const defaultSizeNumStr = parseSizeString(
        currentNovelDefault || DEFAULT_FONT_SIZE_STR
      );
      setInternalInputValue(defaultSizeNumStr);
      setIsOpen(false);
      e.target.blur();
    }
  };
  const handleInputBlur = (e) => {
    if (!containerRef.current?.contains(e.relatedTarget) && !isOpen) {
      applySize(internalInputValue);
    }
  };
  const handleDropdownSelect = (size) => {
    applySize(parseSizeString(size));
    setIsOpen(false);
  };
  const toggleDropdown = (e) => {
    e.preventDefault();
    setIsOpen(!isOpen);
  };

  const placeholderSize = DEFAULT_FONT_SIZE_NUM.toString();

  return (
    <div
      className="relative"
      ref={containerRef}
      title={`Novel Default Font Size (${MIN_FONT_SIZE}-${MAX_FONT_SIZE})`}
    >
      <div className="flex items-center border border-[var(--color-border)] rounded h-[28px] w-[75px] bg-[var(--color-content-bg)] focus-within:ring-1 focus-within:ring-[var(--color-neon-cyan)]">
        <input
          ref={inputRef}
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
          tabIndex={-1}
        >
          <svg
            className="fill-current h-3 w-3"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
          >
            {' '}
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />{' '}
          </svg>
        </button>
      </div>

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
            className="absolute top-full left-0 mt-1 w-full max-h-48 overflow-y-auto bg-gray-900 border border-[var(--color-border)] rounded shadow-lg z-20"
            role="listbox"
          >
            {POPULAR_FONT_SIZES.map((size) => (
              // Apply item variants to each button
              <motion.button
                key={size}
                variants={itemVariants} // Apply item variants
                type="button"
                role="option"
                aria-selected={internalInputValue === parseSizeString(size)}
                className={`block w-full text-left px-3 py-1.5 text-xs font-mono transition-colors duration-100 ${
                  internalInputValue === parseSizeString(size)
                    ? 'bg-[var(--color-content-bg)] text-[var(--color-neon-cyan)]'
                    : 'text-[var(--color-text-base)] hover:bg-gray-800 hover:text-[var(--color-neon-cyan)]'
                }`}
                onMouseDown={(e) => {
                  // Use onMouseDown for selection
                  e.preventDefault();
                  handleDropdownSelect(size);
                }}
              >
                {parseSizeString(size)}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      {/* ---> CHANGE END <--- */}
    </div>
  );
}

export default FontSizeControl;
