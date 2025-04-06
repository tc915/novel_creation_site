// ---> FILE: ./novel-editor-frontend/src/components/NovelEditor.jsx <---

import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef
} from 'react';
// ---> CHANGE START <---
// Remove unused imports if manual reset is gone
import { createEditor, Editor, Transforms, Text, Range, Node } from 'slate';
// ---> CHANGE END <---
import { Slate, Editable, withReact, ReactEditor } from 'slate-react';
import EditorToolbar from './EditorToolbar';
import SaveConfirmationPopup from './SaveConfirmationPopup';
import {
  DEFAULT_FONT_FAMILY,
  DEFAULT_FONT_SIZE_STR,
  MIN_FONT_SIZE,
  MAX_FONT_SIZE,
  DEFAULT_COLOR
} from '../utils/slateEditorUtils';

// Leaf and Element Renderers (Keep as is from previous step)
const Leaf = React.memo(
  ({ attributes, children, leaf, novelDefaults = {} }) => {
    let styles = {};
    if (!leaf.fontFamily) {
      styles.fontFamily =
        novelDefaults.fontFamily || `var(--font-body, ${DEFAULT_FONT_FAMILY})`;
    }
    if (!leaf.fontSize) {
      styles.fontSize = novelDefaults.fontSize || DEFAULT_FONT_SIZE_STR;
    }
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
    if (leaf.fontFamily) {
      styles.fontFamily = leaf.fontFamily;
    }
    if (Object.keys(styles).length > 0) {
      return (
        <span {...attributes} style={styles}>
          {children}
        </span>
      );
    }
    return <span {...attributes}>{children}</span>;
  }
);
Leaf.displayName = 'LeafRenderer';
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
Element.displayName = 'ElementRenderer';
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
  novelDefaults,
  onNovelDefaultsChange
}) {
  // ---> CHANGE START <---
  // Revert editor creation: Let the key prop handle instance per chapter
  const editor = useMemo(() => withReact(createEditor()), [chapterId]);
  // State now directly uses initialContent, will be reset by key change
  const [value, setValue] = useState(initialContent);
  // ---> CHANGE END <---

  const [showSavePopup, setShowSavePopup] = useState(false);
  const [savePopupMessage, setSavePopupMessage] = useState('');
  const prevIsSaving = useRef(isSaving);

  // ---> CHANGE START <---
  // Effect to synchronize internal state 'value' if initialContent prop changes
  // This covers cases where the parent might force an update without changing chapterId
  useEffect(() => {
    // Basic check, might need deep comparison if objects are complex but reference differs
    if (initialContent !== value) {
      console.log(
        'NovelEditor: Syncing value state with new initialContent prop.'
      );
      setValue(initialContent);
    }
  }, [initialContent]); // Only depends on initialContent now

  // Remove the manual reset useEffect and the isContentLoaded ref
  // useEffect(() => { /* ... manual reset logic ... */ }, [chapterId, initialContent, editor]);
  // useEffect(() => { isContentLoaded.current = false; }, [chapterId]);
  // ---> CHANGE END <---

  // Effect to show popup when saving completes successfully
  useEffect(() => {
    if (prevIsSaving.current && !isSaving) {
      console.log('Saving transition detected: true -> false');
      setSavePopupMessage(`Chapter "${title || 'Untitled'}" saved!`);
      setShowSavePopup(true);
    }
    prevIsSaving.current = isSaving;
  }, [isSaving, title]);

  // Pass novelDefaults to the Leaf renderer
  const renderLeaf = useCallback(
    (props) => <Leaf {...props} novelDefaults={novelDefaults} />,
    [novelDefaults]
  );
  const renderElement = useCallback((props) => <Element {...props} />, []);

  // Update local value, propagate content change
  const handleChange = useCallback(
    (newValue) => {
      if (newValue === value) return;
      setValue(newValue);
      onContentChange(newValue);
    },
    [onContentChange, value]
  );

  // Keyboard shortcut handler (no changes needed here)
  const handleKeyDown = useCallback(
    (event) => {
      if (!editor) return;
      const isModKey = event.ctrlKey || event.metaKey;
      // Ctrl+S Save Shortcut
      if (isModKey && event.key.toLowerCase() === 's') {
        event.preventDefault();
        console.log('Ctrl+S pressed, calling onSave...');
        if (onSave && !isSaving) {
          onSave();
        }
        return;
      }
      // Bold/Italic Toggles
      if (isModKey && event.key.toLowerCase() === 'b') {
        event.preventDefault();
        const isActive = Editor.marks(editor)?.bold || false;
        if (isActive) Editor.removeMark(editor, 'bold');
        else Editor.addMark(editor, 'bold', true);
        return;
      }
      if (isModKey && event.key.toLowerCase() === 'i') {
        event.preventDefault();
        const isActive = Editor.marks(editor)?.italic || false;
        if (isActive) Editor.removeMark(editor, 'italic');
        else Editor.addMark(editor, 'italic', true);
        return;
      }
      // Novel Default Font Size Shortcuts
      if (onNovelDefaultsChange) {
        if (
          isModKey &&
          (event.key === ',' ||
            event.key === '<' ||
            event.key === '.' ||
            event.key === '>')
        ) {
          event.preventDefault();
          const currentSizeStr =
            novelDefaults?.fontSize || DEFAULT_FONT_SIZE_STR;
          let currentSizeNum =
            parseInt(currentSizeStr, 10) || DEFAULT_FONT_SIZE_NUM;
          let newSizeNum;
          if (event.key === ',' || event.key === '<') {
            newSizeNum = Math.max(MIN_FONT_SIZE, currentSizeNum - 1);
          } else {
            newSizeNum = Math.min(MAX_FONT_SIZE, currentSizeNum + 1);
          }
          if (newSizeNum !== currentSizeNum) {
            onNovelDefaultsChange('fontSize', `${newSizeNum}px`);
          }
          return;
        }
      }
    },
    [editor, novelDefaults, onNovelDefaultsChange, onSave, isSaving]
  );

  // Calculate styles for the Editable component (no changes needed)
  const editorStyle = useMemo(
    () => ({
      fontFamily:
        novelDefaults?.fontFamily || `var(--font-body, ${DEFAULT_FONT_FAMILY})`,
      fontSize: novelDefaults?.fontSize || DEFAULT_FONT_SIZE_STR
    }),
    [novelDefaults]
  );

  return (
    <div className="relative flex flex-col h-full">
      {/* ---> CHANGE START <--- */}
      {/* Re-introduce key prop, use 'value' for controlled input */}
      <Slate
        editor={editor}
        initialValue={value} // Use state for initial value
        value={value} // Make it fully controlled
        onChange={handleChange} // Use the existing handleChange
        key={chapterId} // Re-add key to force remount on chapter change
      >
        {/* ---> CHANGE END <--- */}
        <EditorToolbar
          novelDefaults={novelDefaults}
          onNovelDefaultsChange={onNovelDefaultsChange}
        />
        <div className="flex-grow overflow-y-auto">
          <div className="p-6 md:p-8 max-w-[90%] mx-auto">
            <input
              type="text"
              value={title}
              onChange={onTitleChange}
              placeholder="Chapter Title"
              className="w-full bg-transparent text-3xl font-bold font-[var(--font-display)] text-[var(--color-text-heading)] mb-6 focus:outline-none border-b-2 border-transparent focus:border-[var(--color-neon-cyan)] transition duration-200 py-1"
            />

            <button
              onClick={onSave}
              disabled={isSaving}
              className="fixed bottom-6 right-6 btn-primary-cyan px-6 py-2 z-50 shadow-lg disabled:opacity-50 flex items-center space-x-2"
              title="Save Chapter (Ctrl+S)"
            >
              {isSaving && <SpinnerIcon />}
              <span>{isSaving ? 'Saving...' : 'Save Chapter'}</span>
            </button>

            <Editable
              renderElement={renderElement}
              renderLeaf={renderLeaf}
              placeholder="Start writing this chapter..."
              className="outline-none min-h-[60vh]"
              onKeyDown={handleKeyDown}
              spellCheck
              style={editorStyle}
              // autoFocus removed previously
            />
          </div>
        </div>
      </Slate>
      <SaveConfirmationPopup
        isVisible={showSavePopup}
        message={savePopupMessage}
        onClose={() => setShowSavePopup(false)}
      />
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
    {' '}
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>{' '}
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>{' '}
  </svg>
);

export default NovelEditor;
