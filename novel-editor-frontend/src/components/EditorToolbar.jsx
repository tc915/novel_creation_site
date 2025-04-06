// src/components/EditorToolbar.jsx
import React, { useCallback } from 'react';
import { useSlate, ReactEditor } from 'slate-react';
import { Editor } from 'slate';
import FontSizeControl from './FontSizeControl'; // Adjust path if needed
import FontFamilyControl from './FontFamilyControl'; // Adjust path if needed

// Define defaults here or import them
const DEFAULT_COLOR = '#CBD5E1'; // Match index.css --color-text-base
const DEFAULT_FONT_SIZE_STR = '16px';
const DEFAULT_FONT_FAMILY = 'Open Sans'; // Match index.css --font-body

// --- Reusable Toolbar Button ---
const MarkButton = React.memo(({ format, children, updateStickyFormat }) => {
  const editor = useSlate();
  if (!editor) return null;

  // Visual state based on current selection's marks
  const isActive = Editor.marks(editor)?.[format] === true;

  const handleMouseDown = useCallback(
    (event) => {
      event.preventDefault();
      const willBeActive = !isActive;

      // Apply/remove mark from current selection
      if (willBeActive) {
        Editor.addMark(editor, format, true);
      } else {
        Editor.removeMark(editor, format);
      }

      // Update the sticky format state in the parent component
      updateStickyFormat(format, willBeActive ? true : null); // Send true or null

      // Refocus might not be needed if editor retains focus
      // setTimeout(() => ReactEditor.focus(editor), 0);
    },
    [editor, isActive, format, updateStickyFormat]
  ); // Add dependencies

  return (
    <button
      type="button"
      aria-pressed={isActive} // Reflects current selection state
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
MarkButton.displayName = 'MarkButton'; // For React DevTools

// --- Color Picker Component ---
const ColorPicker = React.memo(({ updateStickyFormat }) => {
  const editor = useSlate();
  if (!editor) return null;

  // Determine color based on current selection or default
  const currentColorInSelection = (
    Editor.marks(editor)?.color || DEFAULT_COLOR
  ).toUpperCase();

  const handleColorChange = useCallback(
    (e) => {
      const newColor = e.target.value.toUpperCase(); // Normalize to uppercase

      // Apply/remove color mark from current selection
      Editor.removeMark(editor, 'color'); // Remove old color mark first
      if (newColor !== DEFAULT_COLOR) {
        Editor.addMark(editor, 'color', newColor);
      }

      // Update the sticky format state
      updateStickyFormat('color', newColor === DEFAULT_COLOR ? null : newColor); // Send color or null

      // setTimeout(() => ReactEditor.focus(editor), 0); // Refocus if needed
    },
    [editor, updateStickyFormat]
  );

  return (
    <div
      onMouseDown={(e) => e.preventDefault()} // Prevent editor blur
      className="p-0 border border-[var(--color-border)] rounded hover:ring-1 hover:ring-[var(--color-neon-pink)] focus-within:ring-1 focus-within:ring-[var(--color-neon-pink)] w-[28px] h-[28px] flex items-center justify-center"
      style={{ backgroundColor: currentColorInSelection }} // Show selection's color
      title="Text Color"
    >
      <input
        type="color"
        value={currentColorInSelection} // Bind to selection's color
        onChange={handleColorChange}
        className="w-full h-full opacity-0 cursor-pointer"
      />
    </div>
  );
});
ColorPicker.displayName = 'ColorPicker'; // For React DevTools

// --- Main Toolbar Component ---
function EditorToolbar({ updateStickyFormat, stickyFormat }) {
  // Receive props
  return (
    <div className="flex flex-wrap items-center space-x-1 border-b border-[var(--color-border)] p-2 bg-gray-900 flex-shrink-0 sticky top-0 z-10">
      {/* Pass props down to child controls */}
      <FontFamilyControl
        updateStickyFormat={updateStickyFormat}
        stickyFormat={stickyFormat}
      />
      <div className="w-px h-4 bg-[var(--color-border)] mx-1 self-center"></div>{' '}
      {/* Divider */}
      <FontSizeControl
        updateStickyFormat={updateStickyFormat}
        stickyFormat={stickyFormat}
      />
      <div className="w-px h-4 bg-[var(--color-border)] mx-1 self-center"></div>{' '}
      {/* Divider */}
      {/* Pass props down */}
      <MarkButton format="bold" updateStickyFormat={updateStickyFormat}>
        <span className="font-bold text-base leading-none">B</span>
      </MarkButton>
      <MarkButton format="italic" updateStickyFormat={updateStickyFormat}>
        <span className="italic text-base leading-none">I</span>
      </MarkButton>
      {/* Add Underline, Strikethrough etc. similarly */}
      <div className="w-px h-4 bg-[var(--color-border)] mx-1 self-center"></div>{' '}
      {/* Divider */}
      {/* Pass props down */}
      <ColorPicker updateStickyFormat={updateStickyFormat} />
      {/* Add more buttons/controls here (e.g., lists, alignment) */}
    </div>
  );
}

export default EditorToolbar;
