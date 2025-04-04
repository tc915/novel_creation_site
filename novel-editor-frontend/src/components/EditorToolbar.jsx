// src/components/EditorToolbar.jsx
import React, { useCallback, useState, useEffect } from 'react';
import { useSlate, ReactEditor } from 'slate-react';
import { Editor } from 'slate'; // Keep Editor import if needed directly
import FontSizeControl from './FontSizeControl'; // Assuming this uses the utils now
import FontFamilyControl from './FontFamilyControl'; // Assuming this uses the utils now
// --- Import Helpers ---
import {
    isMarkActive,
    toggleMark,
    getCurrentMarkValue,
    applyMark,
    DEFAULT_COLOR
} from '../utils/slateEditorUtils'; // Adjust path if needed
// --- End Import ---


// --- Toolbar Components ---

const MarkButton = React.memo(({ format, children }) => {
    const editor = useSlate();
    if (!editor) return null;
    // Use imported helper
    const isActive = isMarkActive(editor, format);
    return (
        <button
            type="button" aria-pressed={isActive}
            onMouseDown={(event) => {
                event.preventDefault();
                toggleMark(editor, format); // Use imported helper
            }}
            className={`p-1.5 rounded text-sm transition duration-100 ${isActive ? 'bg-[var(--color-neon-cyan)] text-black' : 'text-[var(--color-text-muted)] hover:bg-[var(--color-content-bg)] hover:text-[var(--color-neon-cyan)]'}`}
        > {children} </button>
    );
});
MarkButton.displayName = 'MarkButton';


const ColorPicker = React.memo(() => {
    const editor = useSlate();
    if (!editor) return null;
    // Use imported helpers
    const currentColor = getCurrentMarkValue(editor, 'color', DEFAULT_COLOR);
    const handleColorChange = useCallback((e) => {
        applyMark(editor, 'color', e.target.value, DEFAULT_COLOR);
    }, [editor]);
    return (
        <div onMouseDown={(e) => e.preventDefault()} className="p-0 border border-[var(--color-border)] rounded hover:ring-1 hover:ring-[var(--color-neon-pink)] w-[28px] h-[28px]" style={{ backgroundColor: currentColor }} title="Text Color">
            <input type="color" value={currentColor} onChange={handleColorChange} className="w-full h-full opacity-0 cursor-pointer" />
        </div>
    );
});
ColorPicker.displayName = 'ColorPicker';

// --- Main Toolbar Component ---
function EditorToolbar() {
  return (
    <div className="flex flex-wrap items-center space-x-1 border-b border-[var(--color-border)] p-2 bg-gray-900 flex-shrink-0 sticky top-0 z-10">
      {/* Font Family Control (Assumes it uses imported helpers internally) */}
      <FontFamilyControl />

      <div className="w-px h-4 bg-[var(--color-border)] mx-1"></div>

      {/* Font Size Control (Assumes it uses imported helpers internally) */}
      <FontSizeControl />

      <div className="w-px h-4 bg-[var(--color-border)] mx-1"></div>

      {/* Mark Buttons */}
      <MarkButton format="bold"> <span className="font-bold">B</span> </MarkButton>
      <MarkButton format="italic"> <span className="italic">I</span> </MarkButton>

      <div className="w-px h-4 bg-[var(--color-border)] mx-1"></div>

      {/* Color Picker */}
      <ColorPicker />

      {/* Add more buttons/controls here */}
    </div>
  );
}

export default EditorToolbar;