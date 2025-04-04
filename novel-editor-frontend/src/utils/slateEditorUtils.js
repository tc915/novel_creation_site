// src/utils/slateEditorUtils.js
import { Editor, Transforms, Text, Range } from 'slate';
import { ReactEditor } from 'slate-react';

// --- Constants ---
export const MIN_FONT_SIZE = 10;
export const MAX_FONT_SIZE = 75;
export const DEFAULT_FONT_SIZE_NUM = 16;
export const DEFAULT_FONT_SIZE_STR = `${DEFAULT_FONT_SIZE_NUM}px`;
export const DEFAULT_FONT_FAMILY = "Open Sans"; // Match index.css --font-body
export const DEFAULT_COLOR = '#CBD5E1'; // Match --color-text-base

export const POPULAR_FONT_SIZES = [
    "10px", "12px", "14px", "16px", "18px",
    "24px", "36px", "48px", "72px"
];
export const AVAILABLE_FONTS = [
    "Open Sans", "Orbitron", "Lato", "Merriweather",
    "Lora", "EB Garamond", "Source Code Pro"
];
// --- End Constants ---


// --- Helper Functions ---

// Check if a mark is active at the current selection
export const isMarkActive = (editor, format) => {
    if (!editor || !editor.selection) return false;
    const marks = Editor.marks(editor);
    return marks ? marks[format] === true : false;
};

// Toggle basic marks like bold, italic
export const toggleMark = (editor, format) => {
    if (!editor) return;
    // If no selection, select start before toggling
    if (!editor.selection) {
        Transforms.select(editor, Editor.start(editor, []));
    }
    // Now selection should exist (or be at start)
    const isActive = isMarkActive(editor, format); // Check current state
    if (isActive) {
        Editor.removeMark(editor, format);
    } else {
        Editor.addMark(editor, format, true);
    }
    setTimeout(() => ReactEditor.focus(editor), 0); // Defer focus
};

// Get current value of a specific mark, or a default
export const getCurrentMarkValue = (editor, format, defaultValue) => {
    if (!editor || !editor.selection) return defaultValue;
    const marks = Editor.marks(editor);
    const value = marks ? marks[format] : null;
    if (format === 'color' && typeof value === 'string') return value.toUpperCase();
    return value || defaultValue;
};

// Apply a specific mark with a value (like fontSize, fontFamily, color)
export const applyMark = (editor, format, value, defaultValue) => {
    if (!editor) return;
     // If no selection, select start before applying
    if (!editor.selection) {
        Transforms.select(editor, Editor.start(editor, []));
    }
    Editor.removeMark(editor, format); // Always remove old mark

    // Normalize default color check if needed
    const isDefaultColor = format === 'color' && typeof value === 'string' && typeof defaultValue === 'string' && value.toUpperCase() === defaultValue.toUpperCase();
    const isDefaultSize = format === 'fontSize' && value === defaultValue;
    const isDefaultFont = format === 'fontFamily' && value === defaultValue;

    // Add mark only if it's not the default value for that format
    if (value && value !== defaultValue && !isDefaultColor && !isDefaultSize && !isDefaultFont) {
        Editor.addMark(editor, format, value);
    }
    setTimeout(() => ReactEditor.focus(editor), 0); // Defer focus
};

// Specific helper for parsing size input and applying mark
export const applyFontSizeFromInput = (editor, sizeString) => {
    if (!editor) return;
    const sizeNum = parseInt(sizeString, 10);
    let newSizeMark = DEFAULT_FONT_SIZE_STR; // Default to default string

    if (!isNaN(sizeNum) && sizeNum >= MIN_FONT_SIZE && sizeNum <= MAX_FONT_SIZE) {
         newSizeMark = `${sizeNum}px`;
    } else if (sizeString !== '') {
        console.warn("Invalid font size input:", sizeString);
        // If invalid but not empty, revert to default string? Or do nothing?
        // Let's revert to default size string for safety
         newSizeMark = DEFAULT_FONT_SIZE_STR;
    } else {
        // If input is cleared, apply default size string (which results in removing the mark)
         newSizeMark = DEFAULT_FONT_SIZE_STR;
    }
    applyMark(editor, 'fontSize', newSizeMark, DEFAULT_FONT_SIZE_STR);
};

// Specific helper for getting size for input field
export const getCurrentFontSizeForInput = (editor) => {
   const currentSizeMark = getCurrentMarkValue(editor, 'fontSize', null);
   if (currentSizeMark && currentSizeMark !== DEFAULT_FONT_SIZE_STR) {
       const sizeNum = parseInt(currentSizeMark, 10);
       return isNaN(sizeNum) ? '' : sizeNum.toString();
   }
   return ''; // Return empty if no mark or default applied
};

// --- End Helper Functions ---