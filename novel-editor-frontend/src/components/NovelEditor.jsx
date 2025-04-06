// src/components/NovelEditor.jsx
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { createEditor, Editor, Transforms, Text, Range, Node } from 'slate';
import { Slate, Editable, withReact, ReactEditor } from 'slate-react';
import EditorToolbar from './EditorToolbar'; // Adjust path if needed

// Default values matching utils/constants or parent state
const DEFAULT_FONT_SIZE_STR = '16px';
const DEFAULT_FONT_FAMILY = 'Open Sans'; // Match index.css --font-body
const DEFAULT_COLOR = '#CBD5E1'; // Match --color-text-base
const MIN_FONT_SIZE = 10;
const MAX_FONT_SIZE = 75;

// --- RENDERERS ---
const Element = React.memo(({ attributes, children, element }) => {
  const baseClasses =
    'prose prose-sm prose-invert max-w-none font-[var(--font-body)] text-[var(--color-text-base)]';
  switch (element.type) {
    case 'heading-one':
      return (
        <h1
          {...attributes}
          className={`${baseClasses} text-2xl font-bold mt-4 mb-1`}
        >
          {children}
        </h1>
      );
    case 'heading-two':
      return (
        <h2
          {...attributes}
          className={`${baseClasses} text-xl font-semibold mt-3 mb-1`}
        >
          {children}
        </h2>
      );
    case 'list-item':
      return (
        <li {...attributes} className={`${baseClasses} ml-4`}>
          {children}
        </li>
      );
    case 'bulleted-list':
      return (
        <ul {...attributes} className={`${baseClasses} list-disc pl-5 my-2`}>
          {children}
        </ul>
      );
    case 'numbered-list':
      return (
        <ol {...attributes} className={`${baseClasses} list-decimal pl-5 my-2`}>
          {children}
        </ol>
      );
    case 'paragraph':
    default:
      return (
        <p {...attributes} className={`${baseClasses} mb-2`}>
          {children}
        </p>
      );
  }
});
Element.displayName = 'ElementRenderer'; // Add display name for debugging

const Leaf = React.memo(({ attributes, children, leaf }) => {
  let styles = {};
  if (leaf.bold) {
    children = <strong>{children}</strong>;
  }
  if (leaf.italic) {
    children = <em>{children}</em>;
  }
  if (leaf.fontSize) {
    styles.fontSize = leaf.fontSize;
  }
  if (leaf.color) {
    styles.color = leaf.color;
  }
  // Apply custom font family or fallback to default CSS variable
  styles.fontFamily =
    leaf.fontFamily || `var(--font-body, ${DEFAULT_FONT_FAMILY})`; // Added fallback font

  if (Object.keys(styles).length > 0) {
    return (
      <span {...attributes} style={styles}>
        {children}
      </span>
    );
  }
  return <span {...attributes}>{children}</span>;
});
Leaf.displayName = 'LeafRenderer'; // Add display name for debugging
// --- END RENDERERS ---

// --- MAIN EDITOR COMPONENT ---
function NovelEditor({
  chapterId,
  title,
  initialContent,
  onTitleChange,
  onContentChange,
  onSave,
  isSaving,
  stickyFormat,
  updateStickyFormat
}) {
  const editor = useMemo(() => withReact(createEditor()), [chapterId]);
  const [value, setValue] = useState(initialContent);

  // Effect to reset local value and apply sticky format when chapter changes
  useEffect(() => {
    setValue(initialContent);
    // Apply sticky format to editor.marks when chapter loads/changes
    // Use setTimeout to ensure editor is ready
    setTimeout(() => {
      if (editor && stickyFormat) {
        // Clear existing editor marks before applying sticky ones? Or merge? Merge seems better.
        editor.marks = { ...stickyFormat };
        console.log(
          `Applied sticky format to editor.marks on chapter ${chapterId} load:`,
          editor.marks
        );
      } else if (editor) {
        // If no sticky format, ensure editor marks are clear
        editor.marks = {};
      }
    }, 0);
  }, [initialContent, editor, chapterId, stickyFormat]); // Dependencies

  const renderElement = useCallback((props) => <Element {...props} />, []);
  const renderLeaf = useCallback((props) => <Leaf {...props} />, []);

  // Update local value, propagate content change
  const handleChange = useCallback(
    (newValue) => {
      // Prevent updates if the content hasn't actually changed (deep comparison might be slow)
      // Basic check:
      if (newValue === value) return;

      setValue(newValue);
      onContentChange(newValue);

      // Attempt to re-apply sticky format if selection collapses without typing
      // This is experimental and might need adjustment
      if (editor.selection && Range.isCollapsed(editor.selection)) {
        const currentMarks = editor.marks || {};
        // Only update if editor marks don't match sticky format
        if (
          JSON.stringify(currentMarks) !== JSON.stringify(stickyFormat || {})
        ) {
          editor.marks = { ...stickyFormat };
          // console.log("Synced editor.marks with stickyFormat on change (collapsed selection)");
        }
      }
    },
    [onContentChange, editor, stickyFormat, value]
  ); // Add value dependency

  // --- Keyboard shortcut handler ---
  const handleKeyDown = useCallback(
    (event) => {
      if (!editor) return;
      const isModKey = event.ctrlKey || event.metaKey;
      if (!isModKey) return;

      // Helpers for shortcuts
      const toggleStickyMark = (format) => {
        const currentStickyValue = !!stickyFormat?.[format];
        const willBeActive = !currentStickyValue;
        // Update sticky state via parent
        updateStickyFormat(format, willBeActive ? true : null); // Use null to remove from sticky
        // Also apply immediately to current selection if any
        if (editor.selection) {
          if (willBeActive) Editor.addMark(editor, format, true);
          else Editor.removeMark(editor, format);
        } else {
          // If no selection, just update editor.marks (pending marks)
          editor.marks = editor.marks || {};
          if (willBeActive) editor.marks[format] = true;
          else delete editor.marks[format];
        }
      };

      const applyStickyFontSize = (newSizeNum) => {
        const newSizeStr = `${newSizeNum}px`;
        const newStickyValue =
          newSizeStr === DEFAULT_FONT_SIZE_STR ? null : newSizeStr;
        updateStickyFormat('fontSize', newStickyValue);
        // Also apply immediately to current selection or editor.marks
        if (editor.selection) {
          Editor.removeMark(editor, 'fontSize');
          if (newStickyValue)
            Editor.addMark(editor, 'fontSize', newStickyValue);
        } else {
          editor.marks = editor.marks || {};
          if (newStickyValue) editor.marks.fontSize = newStickyValue;
          else delete editor.marks.fontSize;
        }
      };

      switch (event.key.toLowerCase()) {
        case 'b':
          event.preventDefault();
          toggleStickyMark('bold');
          break;
        case 'i':
          event.preventDefault();
          toggleStickyMark('italic');
          break;
        case ',':
        case '<': {
          event.preventDefault();
          // Calculate based on current sticky or default
          const currentSizeStr =
            stickyFormat?.fontSize || DEFAULT_FONT_SIZE_STR;
          let currentSizeNum = parseInt(currentSizeStr, 10) || 16;
          const newSizeNum = Math.max(MIN_FONT_SIZE, currentSizeNum - 1);
          applyStickyFontSize(newSizeNum);
          break;
        }
        case '.':
        case '>': {
          event.preventDefault();
          const currentSizeStr =
            stickyFormat?.fontSize || DEFAULT_FONT_SIZE_STR;
          let currentSizeNum = parseInt(currentSizeStr, 10) || 16;
          const newSizeNum = Math.min(MAX_FONT_SIZE, currentSizeNum + 1);
          applyStickyFontSize(newSizeNum);
          break;
        }
        // Add other shortcuts as needed
      }
    },
    [editor, stickyFormat, updateStickyFormat]
  );

  return (
    <div className="flex flex-col h-full">
      <Slate
        editor={editor}
        initialValue={value}
        onChange={handleChange}
        key={chapterId} // Force full component remount on chapter change
      >
        {/* Pass sticky state updater to Toolbar */}
        <EditorToolbar
          updateStickyFormat={updateStickyFormat}
          stickyFormat={stickyFormat}
        />

        <div className="flex-grow overflow-y-auto">
          <div className="p-6 md:p-8 max-w-[90%] mx-auto">
            {/* Chapter Title Input */}
            <input
              type="text"
              value={title}
              onChange={onTitleChange}
              placeholder="Chapter Title"
              className="w-full bg-transparent text-3xl font-bold font-[var(--font-display)] text-[var(--color-text-heading)] mb-6 focus:outline-none border-b-2 border-transparent focus:border-[var(--color-neon-cyan)] transition duration-200 py-1" // Added padding
            />

            {/* Save Button */}
            <button
              onClick={onSave}
              disabled={isSaving}
              className="fixed bottom-6 right-6 btn-primary-cyan px-6 py-2 z-50 shadow-lg disabled:opacity-50 flex items-center space-x-2"
              title="Save Chapter (Ctrl+S not implemented)"
            >
              {isSaving && <SpinnerIcon />} {/* Add spinner icon */}
              <span>{isSaving ? 'Saving...' : 'Save Chapter'}</span>
            </button>

            {/* Slate Editable Area */}
            <Editable
              renderElement={renderElement}
              renderLeaf={renderLeaf}
              placeholder="Start writing this chapter..."
              className="outline-none min-h-[60vh]" // Increased min height
              onKeyDown={handleKeyDown}
              spellCheck
              autoFocus
              // --- Re-apply sticky format on selection change ---
              // If selection collapses (no range), make sure editor.marks matches sticky
              onSelect={() => {
                if (editor.selection && Range.isCollapsed(editor.selection)) {
                  editor.marks = { ...stickyFormat };
                }
              }}
            />
          </div>
        </div>
      </Slate>
    </div>
  );
}

// Simple spinner icon component
const SpinnerIcon = () => (
  <svg
    className="animate-spin h-4 w-4 text-black"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

export default NovelEditor;
