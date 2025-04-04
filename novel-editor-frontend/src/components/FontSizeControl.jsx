// src/components/FontSizeControl.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSlate, ReactEditor } from 'slate-react';
// Import Transforms and Editor for selection manipulation
import { Editor, Transforms } from 'slate';
import { motion, AnimatePresence } from 'framer-motion';

// --- Constants and Helpers ---
const POPULAR_FONT_SIZES = [
    "10px", "12px", "14px", "16px", "18px",
    "24px", "36px", "48px", "72px"
];
const DEFAULT_FONT_SIZE_NUM = 16;
const DEFAULT_FONT_SIZE_STR = `${DEFAULT_FONT_SIZE_NUM}px`;
const MIN_FONT_SIZE = 10;
const MAX_FONT_SIZE = 75;

// Get current value of a specific mark, or a default
const getCurrentMarkValue = (editor, format, defaultValue) => {
    // Check if editor exists before accessing marks or selection
    if (!editor) return defaultValue;
    const marks = Editor.marks(editor);
    // Return default if selection is null OR if the specific mark doesn't exist
    return marks?.[format] ?? defaultValue;
};

// Gets size mark, returns number string or empty string if default/mixed
const getCurrentFontSizeForInput = (editor) => {
   const currentSizeMark = getCurrentMarkValue(editor, 'fontSize', null);
   // Check if the mark exists and is not the default string value
   if (currentSizeMark && currentSizeMark !== DEFAULT_FONT_SIZE_STR) {
       const sizeNum = parseInt(currentSizeMark, 10);
       // Return number as string if valid, otherwise empty string
       return isNaN(sizeNum) ? '' : sizeNum.toString();
   }
   // Return empty if default or no mark applied, allows placeholder to show default
   return '';
};

// Applies size from number input/selection, validates, adds 'px'
const applyFontSize = (editor, sizeString) => {
    if (!editor) return; // Guard clause

    // --- FIX: Handle null selection ---
    // Store current selection (could be null)
    const { selection } = editor;
    let hadSelection = !!selection; // Check if there was a selection initially

    if (!selection) {
        // Select the start of the document if nothing is selected
        Transforms.select(editor, Editor.start(editor, []));
        console.log("Selection was null, set to start for font size change.");
    }
    // --- End Fix ---

    const sizeNum = parseInt(sizeString, 10);
    Editor.removeMark(editor, 'fontSize'); // Always remove old mark first

    // Check if the parsed number is valid and within range
    if (!isNaN(sizeNum) && sizeNum >= MIN_FONT_SIZE && sizeNum <= MAX_FONT_SIZE) {
        // Add mark only if it's not the default numeric size
        if (sizeNum !== DEFAULT_FONT_SIZE_NUM) {
            Editor.addMark(editor, 'fontSize', `${sizeNum}px`);
        }
        // If sizeNum IS the default, the mark remains removed (correct)
    } else if (sizeString === '') {
         // Mark already removed if input is cleared
         console.log("Font size mark cleared (reverted to default).");
    }
     else {
        console.warn("Invalid font size applied:", sizeString);
    }

    // If we had to temporarily select the start, deselect it again
    // UNLESS the user's original intent was likely to format future typing
    // For simplicity now, we leave the selection at the start if it was null
    // if (!hadSelection) {
    //     Transforms.deselect(editor);
    // }

    // Refocus editor after applying, deferred
    setTimeout(() => {
        if (editor && !ReactEditor.isFocused(editor)) {
            try { ReactEditor.focus(editor) } catch(e) { console.warn("Refocus failed after font size change", e)}
        }
    }, 0);
};
// --- End Helpers ---


// --- Framer Motion Variants ---
const listVariants = {
  open: { opacity: 1, height: 'auto', transition: { type: "tween", duration: 0.2, when: "beforeChildren", staggerChildren: 0.03 } },
  closed: { opacity: 0, height: 0, transition: { type: "tween", duration: 0.15, when: "afterChildren", staggerChildren: 0.02, staggerDirection: -1 } }
};

const itemVariants = {
  open: { opacity: 1, y: 0, transition: { type: "tween", duration: 0.15, ease: "easeOut" } },
  closed: { opacity: 0, y: -10, transition: { type: "tween", duration: 0.1, ease: "easeIn" } }
};
// --- End Variants ---


function FontSizeControl() {
    const editor = useSlate();
    const [isOpen, setIsOpen] = useState(false);
    const [internalInputValue, setInternalInputValue] = useState(() => getCurrentFontSizeForInput(editor));
    const containerRef = useRef(null);

    // Effect to sync internal input value when editor state changes
    useEffect(() => {
        // Ensure editor exists before accessing selection/marks
        if (editor) {
             const currentEditorSize = getCurrentFontSizeForInput(editor);
             // Update input only if it's not currently focused by the user
             if (document.activeElement !== containerRef.current?.querySelector('input')) {
                setInternalInputValue(currentEditorSize);
             }
        } else {
             setInternalInputValue(''); // Clear if no editor
        }
    // Use marks as dependency to react to toolbar changes affecting selection marks
    }, [editor, editor?.selection]);

    // Handle clicks outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
                // Revert input value to match editor state when closing dropdown by clicking outside
                setInternalInputValue(getCurrentFontSizeForInput(editor));
            }
        };
        if (isOpen) { document.addEventListener("mousedown", handleClickOutside); }
        else { document.removeEventListener("mousedown", handleClickOutside); }
        return () => { document.removeEventListener("mousedown", handleClickOutside); };
    }, [isOpen, editor]); // Add editor dependency


    // Handle text input changes (only allow numbers up to 2 digits)
    const handleInputChange = (e) => {
        const value = e.target.value;
        if (/^\d*$/.test(value) && value.length <= 2) {
             setInternalInputValue(value);
        }
    };

    // Apply size change on Enter key
    const handleInputKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            applyFontSize(editor, internalInputValue);
            setIsOpen(false);
            e.target.blur();
        }
        if (e.key === 'Escape') {
            e.preventDefault();
            setInternalInputValue(getCurrentFontSizeForInput(editor)); // Revert
            setIsOpen(false);
            e.target.blur();
        }
    };

     // Apply size change when input loses focus
     const handleInputBlur = (e) => {
         if (!containerRef.current?.contains(e.relatedTarget)) {
              setTimeout(() => {
                  if (!isOpen) {
                      applyFontSize(editor, internalInputValue);
                      // Sync input value back after applying, in case it was invalid and reverted
                      setInternalInputValue(getCurrentFontSizeForInput(editor));
                  }
              }, 150);
         }
     };

    // Handle selecting size from dropdown list
    const handleDropdownSelect = (size) => {
        setInternalInputValue(size.replace('px', ''));
        applyFontSize(editor, size); // Apply the change
        setIsOpen(false);
    };

    // Toggle dropdown visibility
    const toggleDropdown = (e) => {
        e.preventDefault();
        setIsOpen(!isOpen);
    };

    const placeholderSize = DEFAULT_FONT_SIZE_NUM.toString();

    // Don't render if editor not ready
    if (!editor) return null;

    return (
        <div className="relative" ref={containerRef} title={`Font Size (${MIN_FONT_SIZE}-${MAX_FONT_SIZE})`}>
            {/* Input and Dropdown Button Wrapper */}
            <div className="flex items-center border border-[var(--color-border)] rounded h-[28px] w-[80px] bg-[var(--color-content-bg)] focus-within:ring-1 focus-within:ring-[var(--color-neon-cyan)]">
                <input
                    type="text" // Use text for better control
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
                    onMouseDown={(e) => e.preventDefault()} // Prevent focus steal
                    onClick={toggleDropdown}
                    className="flex items-center justify-center h-full px-1 border-l border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-neon-cyan)]"
                    aria-haspopup="listbox"
                    aria-expanded={isOpen}
                >
                    <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </button>
            </div>

            {/* Animated Dropdown List */}
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
                        {POPULAR_FONT_SIZES.map(size => (
                            <motion.button
                                key={size}
                                variants={itemVariants}
                                type="button"
                                role="option"
                                aria-selected={internalInputValue === size.replace('px','')}
                                className="block w-full text-left px-3 py-1.5 text-xs font-mono text-[var(--color-text-base)] hover:bg-[var(--color-content-bg)] hover:text-[var(--color-neon-cyan)]"
                                onMouseDown={(e) => { // Use onMouseDown for selection
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

// It's often better practice to define helpers outside if they don't rely on component state/props directly
// Or move them to the slateEditorUtils.js file we discussed earlier
// For now, keeping them internal for simplicity based on previous code structure.

export default FontSizeControl;