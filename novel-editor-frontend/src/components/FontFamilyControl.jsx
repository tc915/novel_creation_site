// src/components/FontFamilyControl.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSlate, ReactEditor } from 'slate-react';
import { Editor, Transforms } from 'slate'; // Import Transforms if needed for selection setting
import { motion, AnimatePresence } from 'framer-motion';

// --- Constants and Helpers ---
// Define the fonts available in the dropdown
const AVAILABLE_FONTS = [
    "Open Sans", // Default
    "Orbitron",
    "Lato",
    "Merriweather",
    "Lora",
    "EB Garamond",
    "Source Code Pro"
];
// Define a default/fallback font (should match base --font-body in index.css)
const DEFAULT_FONT_FAMILY = "Open Sans";

// Get current font family mark
const getCurrentFontFamily = (editor) => {
    if (!editor || !editor.selection) return DEFAULT_FONT_FAMILY;
    const marks = Editor.marks(editor);
    return marks?.fontFamily || DEFAULT_FONT_FAMILY;
};

// Apply font family mark
const applyFontFamily = (editor, fontFamily) => {
    if (!editor) return;
    // If no selection, select start before applying
    if (!editor.selection) {
        Transforms.select(editor, Editor.start(editor, []));
    }
    Editor.removeMark(editor, 'fontFamily'); // Remove old mark
    if (fontFamily && fontFamily !== DEFAULT_FONT_FAMILY) { // Only add if not default
        Editor.addMark(editor, 'fontFamily', fontFamily);
    }
    setTimeout(() => ReactEditor.focus(editor), 0); // Refocus editor deferred
};

// Framer Motion Variants (same as FontSizeControl for consistency)
const listVariants = {
  open: {
    opacity: 1,
    height: 'auto',
    transition: {
      type: "tween",
      duration: 0.2,
      when: "beforeChildren",
      staggerChildren: 0.03
    }
  },
  closed: {
    opacity: 0,
    height: 0,
    transition: {
      type: "tween",
      duration: 0.15,
      when: "afterChildren",
      staggerChildren: 0.02,
      staggerDirection: -1
    }
  }
};

const itemVariants = {
  open: {
    opacity: 1,
    y: 0,
    transition: { type: "tween", duration: 0.15, ease: "easeOut" }
  },
  closed: {
    opacity: 0,
    y: -10,
    transition: { type: "tween", duration: 0.1, ease: "easeIn" }
  }
};
// --- End Helpers and Variants ---


function FontFamilyControl() {
    const editor = useSlate();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);
    // Get the currently applied font family at the selection
    // Handle potential null editor on initial renders
    const currentFont = editor ? getCurrentFontFamily(editor) : DEFAULT_FONT_FAMILY;

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        if (isOpen) { document.addEventListener("mousedown", handleClickOutside); }
        else { document.removeEventListener("mousedown", handleClickOutside); }
        return () => { document.removeEventListener("mousedown", handleClickOutside); };
    }, [isOpen]);

    // Handle selecting font from dropdown list
    const handleDropdownSelect = (font) => {
        applyFontFamily(editor, font);
        setIsOpen(false);
    };

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
                className="flex items-center justify-between border border-[var(--color-border)] rounded h-[28px] min-w-[100px] px-2 bg-[var(--color-content-bg)] text-xs text-[var(--color-text-base)] focus:outline-none focus:ring-1 focus:ring-[var(--color-neon-cyan)]"
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                style={{ fontFamily: currentFont }} // Apply current font for preview
            >
                {/* Display current font name */}
                <span className="truncate">{currentFont}</span>
                {/* Dropdown Arrow */}
                <svg className="fill-current h-3 w-3 ml-1 flex-shrink-0 text-[var(--color-text-muted)]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
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
                        {AVAILABLE_FONTS.map(font => (
                            <motion.button
                                key={font}
                                variants={itemVariants}
                                type="button"
                                role="option"
                                aria-selected={currentFont === font}
                                className="block w-full text-left px-3 py-1.5 text-xs text-[var(--color-text-base)] hover:bg-[var(--color-content-bg)] hover:text-[var(--color-neon-cyan)]"
                                // Apply the font itself to the button text for preview
                                style={{ fontFamily: font }}
                                onMouseDown={(e) => { // Use onMouseDown for selection
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