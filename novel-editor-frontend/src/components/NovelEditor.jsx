// src/components/NovelEditor.jsx
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { createEditor, Editor, Transforms, Text, Range } from 'slate';
import { Slate, Editable, withReact, useSlate, useSelected, useFocused, ReactEditor } from 'slate-react';
import EditorToolbar from './EditorToolbar'; // Adjust path if needed

// Initial value (empty paragraph)
const initialValue = [
  {
    type: 'paragraph',
    children: [{ text: '' }],
  },
];

// Constants for font size control
const MIN_FONT_SIZE = 10;
const MAX_FONT_SIZE = 75;
const DEFAULT_FONT_SIZE_NUM = 16; // Matches common browser default
const DEFAULT_FONT_SIZE_STR = `${DEFAULT_FONT_SIZE_NUM}px`;
// Default font family comes from CSS var --font-body now

// Element renderer - applies base styles
const Element = ({ attributes, children, element }) => {
  // Removed selected/focused hooks as flash animation was removed
  // Apply base prose styling and ensure default body font applies
  const baseClasses = "prose prose-sm prose-invert max-w-none font-[var(--font-body)] text-[var(--color-text-base)]";
  switch (element.type) {
    // Add cases for other block types (headings, lists) here later
    case 'paragraph':
    default:
      return <p {...attributes} className={baseClasses}>{children}</p>;
  }
};

// Leaf renderer - applies inline formatting marks
const Leaf = ({ attributes, children, leaf }) => {
  let styles = {}; // Use inline styles for marks

  // Apply standard marks using tags (these might be styled by prose)
  if (leaf.bold) { children = <strong>{children}</strong>; }
  if (leaf.italic) { children = <em>{children}</em>; }

  // Apply custom marks using inline styles
  if (leaf.fontSize) { styles.fontSize = leaf.fontSize; }
  if (leaf.color) { styles.color = leaf.color; }
  // Apply fontFamily mark or fallback to CSS variable
  styles.fontFamily = leaf.fontFamily || `var(--font-body)`;

  // Apply styles only if needed (fontSize, color, fontFamily)
  if (Object.keys(styles).length > 0) {
     return <span {...attributes} style={styles}>{children}</span>;
  }
  // Render without extra span if only standard marks (bold/italic)
  return <span {...attributes}>{children}</span>;
};

// Helper functions (could be moved to utils/slateEditorUtils.js)
const isMarkActive = (editor, format) => {
    if (!editor || !editor.selection) return false;
    const marks = Editor.marks(editor);
    return marks ? marks[format] === true : false;
};

const toggleMark = (editor, format) => {
    if (!editor) return;
    // Select start if no selection (handles refresh case)
    if (!editor.selection) {
        Transforms.select(editor, Editor.start(editor, []));
    }
    const isActive = isMarkActive(editor, format);
    if (isActive) { Editor.removeMark(editor, format); }
    else { Editor.addMark(editor, format, true); }
    setTimeout(() => ReactEditor.focus(editor), 0); // Defer focus
};

const applyFontSizeMark = (editor, newSizeString) => {
    if (!editor) return;
     // Select start if no selection (handles refresh case)
     if (!editor.selection) {
        Transforms.select(editor, Editor.start(editor, []));
    }
    Editor.removeMark(editor, 'fontSize');
    // Add mark if it's not the default size string
    if (newSizeString !== DEFAULT_FONT_SIZE_STR) {
        Editor.addMark(editor, 'fontSize', newSizeString);
    }
    setTimeout(() => ReactEditor.focus(editor), 0); // Defer focus
};

// Helper function to get current font size (needed for shortcuts)
const getCurrentMarkValue = (editor, format, defaultValue) => {
    if (!editor || !editor.selection) return defaultValue;
    const marks = Editor.marks(editor);
    return marks?.[format] || defaultValue;
};



function NovelEditor() {
  const editor = useMemo(() => withReact(createEditor()), []);
  const [value, setValue] = useState(initialValue);

  const renderElement = useCallback(props => <Element {...props} />, []);
  const renderLeaf = useCallback(props => <Leaf {...props} />, []);

  // Keyboard shortcut handler
  const handleKeyDown = useCallback((event, editorInstance) => {
     if (!editorInstance) return;
     const isModKey = event.ctrlKey || event.metaKey;
     if (!isModKey) return; // Exit if modifier key isn't pressed

     switch (event.key.toLowerCase()) {
        case 'b': {
             event.preventDefault();
             toggleMark(editorInstance, 'bold');
             break;
        }
        case 'i': {
             event.preventDefault();
             toggleMark(editorInstance, 'italic');
             break;
        }
        case ',': // Corresponds to '<' key without Shift
        case '<': {
             event.preventDefault();
             const currentSizeStr = getCurrentMarkValue(editorInstance, 'fontSize', DEFAULT_FONT_SIZE_STR);
             let currentSizeNum = parseInt(currentSizeStr, 10);
             if (isNaN(currentSizeNum)) currentSizeNum = DEFAULT_FONT_SIZE_NUM;
             const newSizeNum = Math.max(MIN_FONT_SIZE, currentSizeNum - 1);
             applyFontSizeMark(editorInstance, `${newSizeNum}px`);
             break;
        }
        case '.': // Corresponds to '>' key without Shift
        case '>': {
             event.preventDefault();
             const currentSizeStr = getCurrentMarkValue(editorInstance, 'fontSize', DEFAULT_FONT_SIZE_STR);
             let currentSizeNum = parseInt(currentSizeStr, 10);
              if (isNaN(currentSizeNum)) currentSizeNum = DEFAULT_FONT_SIZE_NUM;
             const newSizeNum = Math.min(MAX_FONT_SIZE, currentSizeNum + 1);
             applyFontSizeMark(editorInstance, `${newSizeNum}px`);
             break;
        }
     }
  // Keep dependencies empty if helpers are stable (defined outside or useCallback with no deps)
  }, []);

  
  const handleChange = useCallback(newValue => {
    setValue(newValue);
  }, []);


  return (
    // Outer container uses flex-col to position toolbar above editor area
    <div className="flex flex-col h-full">
      <Slate
          editor={editor}
          initialValue={value} // Bind state
          onChange={handleChange} // Update state on change
      >
        {/* Toolbar remains static (non-sticky) at the top of this component */}
        <EditorToolbar />

        {/* Editor area wrapper fills remaining space and scrolls */}
        <div className="flex-grow overflow-y-auto font-[var(--font-body)]"> {/* Apply default body font here */}
            {/* Inner div still provides padding */}
            <div className="p-8">
              <Editable
                renderElement={renderElement}
                renderLeaf={renderLeaf}
                placeholder="Start writing your chapter..." // Uses CSS for styling
                className="outline-none min-h-[300px]" // Basic styling for editable area
                onKeyDown={(event) => handleKeyDown(event, editor)} // Pass editor instance
                spellCheck
                autoFocus // Automatically focus editor on load
              />
            </div>
        </div>
      </Slate>
    </div>
  );
}

export default NovelEditor;