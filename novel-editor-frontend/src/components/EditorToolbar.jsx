// ---> FILE: ./novel-editor-frontend/src/components/EditorToolbar.jsx <---

import React, { useCallback } from 'react';
// ---> CHANGE START <---
// Remove Slate hooks unless needed for block formatting later
import { useSlate, ReactEditor } from 'slate-react';
import { Editor } from 'slate';
// ---> CHANGE END <---
import FontSizeControl from './FontSizeControl'; // Adjust path if needed
import FontFamilyControl from './FontFamilyControl'; // Adjust path if needed
// ---> CHANGE START <---
// Use centralized defaults
import { DEFAULT_COLOR } from '../utils/slateEditorUtils';
// Remove local defaults
// ---> CHANGE END <---

// --- Reusable Toolbar Button ---
// This button still modifies the *selection's* marks directly.
// It does NOT affect novel defaults. Keep this as is for bold/italic.
const MarkButton = React.memo(({ format, children }) => {
  // ---> CHANGE START <---
  // Need useSlate here to interact with selection marks
  const editor = useSlate();
  if (!editor) return null;
  const isActive = Editor.marks(editor)?.[format] === true;
  const handleMouseDown = useCallback(
    (event) => {
      event.preventDefault();
      if (isActive) {
        Editor.removeMark(editor, format);
      } else {
        Editor.addMark(editor, format, true);
      }
      // No need to update sticky format anymore
      // updateStickyFormat(format, willBeActive ? true : null);
      setTimeout(() => ReactEditor.focus(editor), 0); // Keep focus deferral
    },
    [editor, isActive, format]
  );
  // ---> CHANGE END <---

  return (
    <button
      type="button"
      aria-pressed={isActive}
      onMouseDown={handleMouseDown}
      className={`p-1.5 rounded text-sm transition duration-100 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-offset-gray-900 focus:ring-[var(--color-neon-cyan)] ${
        isActive
          ? 'bg-[var(--color-neon-cyan)] text-black hover:bg-cyan-300'
          : 'text-[var(--color-text-muted)] hover:bg-[var(--color-content-bg)] hover:text-[var(--color-neon-cyan)]'
      }`}
    >
      {children}
    </button>
  );
});
MarkButton.displayName = 'MarkButton';

// --- Color Picker Component ---
// This component *could* control the novel's default color OR selection color.
// For now, let's make it control the SELECTION color, similar to Bold/Italic.
// To control novel default, it would need `novelDefaults` and `onNovelDefaultsChange` props.
const ColorPicker = React.memo(() => {
  // ---> CHANGE START <---
  // Get editor to modify selection marks
  const editor = useSlate();
  if (!editor) return null;
  // Determine color based on current SELECTION or CSS default
  const currentColorInSelection = (
    Editor.marks(editor)?.color || DEFAULT_COLOR
  ).toUpperCase();

  const handleColorChange = useCallback(
    (e) => {
      const newColor = e.target.value.toUpperCase();
      // Apply/remove color mark from current SELECTION
      Editor.removeMark(editor, 'color');
      if (newColor !== DEFAULT_COLOR) {
        Editor.addMark(editor, 'color', newColor);
      }
      // No sticky format update
      // updateStickyFormat('color', newColor === DEFAULT_COLOR ? null : newColor);
      setTimeout(() => ReactEditor.focus(editor), 0); // Keep focus deferral
    },
    [editor]
  ); // Update dependencies
  // ---> CHANGE END <---

  return (
    <div
      onMouseDown={(e) => e.preventDefault()}
      className="p-0 border border-[var(--color-border)] rounded hover:ring-1 hover:ring-[var(--color-neon-pink)] focus-within:ring-1 focus-within:ring-[var(--color-neon-pink)] w-[28px] h-[28px] flex items-center justify-center"
      style={{ backgroundColor: currentColorInSelection }}
      title="Text Color (Selection)"
    >
      <input
        type="color"
        value={currentColorInSelection}
        onChange={handleColorChange}
        className="w-full h-full opacity-0 cursor-pointer"
      />
    </div>
  );
});
ColorPicker.displayName = 'ColorPicker';

// --- Main Toolbar Component ---
// ---> CHANGE START <---
// Receive novel defaults and change handler
function EditorToolbar({ novelDefaults, onNovelDefaultsChange }) {
  // ---> CHANGE END <---
  return (
    <div className="flex flex-wrap items-center space-x-1 border-b border-[var(--color-border)] p-2 bg-gray-900 flex-shrink-0 sticky top-0 z-10">
      {/* ---> CHANGE START <--- */}
      {/* Pass novel defaults and change handler to Font controls */}
      <FontFamilyControl
        currentNovelDefault={novelDefaults?.fontFamily}
        onNovelDefaultsChange={onNovelDefaultsChange}
      />
      <div className="w-px h-4 bg-[var(--color-border)] mx-1 self-center"></div>
      <FontSizeControl
        currentNovelDefault={novelDefaults?.fontSize}
        onNovelDefaultsChange={onNovelDefaultsChange}
      />
      <div className="w-px h-4 bg-[var(--color-border)] mx-1 self-center"></div>
      {/* MarkButtons affect selection, don't need novel props */}
      <MarkButton format="bold">
        {' '}
        <span className="font-bold text-base leading-none">B</span>{' '}
      </MarkButton>
      <MarkButton format="italic">
        {' '}
        <span className="italic text-base leading-none">I</span>{' '}
      </MarkButton>
      <div className="w-px h-4 bg-[var(--color-border)] mx-1 self-center"></div>
      {/* ColorPicker affects selection */}
      <ColorPicker />
      {/* ---> CHANGE END <--- */}
    </div>
  );
}

export default EditorToolbar;
