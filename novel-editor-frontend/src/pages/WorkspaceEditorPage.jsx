// src/pages/WorkspaceEditorPage.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // Removed Link as it's not used directly here
import axios from 'axios';
import { useAuth } from '../context/AuthContext'; // Adjust if needed
import NovelEditor from '../components/NovelEditor'; // Adjust if needed
import ConfirmModal from '../components/ConfirmModal'; // Adjust if needed
import { DndProvider, useDrag, useDrop } from 'react-dnd'; // For Drag and Drop
import { HTML5Backend } from 'react-dnd-html5-backend'; // For Drag and Drop
import { debounce } from 'lodash'; // Import debounce

// Default values matching utils/constants
const initialSlateValue = [{ type: 'paragraph', children: [{ text: '' }] }];
const DEFAULT_FONT_SIZE_STR = '16px';
const DEFAULT_FONT_FAMILY = 'Open Sans'; // Match index.css --font-body
const DEFAULT_COLOR = '#CBD5E1'; // Match --color-text-base

const backendUrl = 'http://localhost:5001'; // Use env var ideally

// --- Draggable Chapter Item ---
const ItemTypes = { CHAPTER: 'chapter' };

const DraggableChapterLink = ({
  chapter,
  index,
  moveChapter,
  onSelect,
  isActive,
  onDelete
}) => {
  const ref = useRef(null);

  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: ItemTypes.CHAPTER,
      item: { id: chapter._id, index }, // Pass ID and original index
      collect: (monitor) => ({
        isDragging: monitor.isDragging()
      })
    }),
    [chapter._id, index]
  ); // Dependencies

  const [, drop] = useDrop(
    () => ({
      accept: ItemTypes.CHAPTER,
      hover(item, monitor) {
        // item is the dragged item { id, index }
        if (!ref.current) return;

        const dragIndex = item.index;
        const hoverIndex = index;

        // Don't replace items with themselves
        if (dragIndex === hoverIndex) return;

        // Determine rectangle on screen
        const hoverBoundingRect = ref.current?.getBoundingClientRect();
        // Get vertical middle
        const hoverMiddleY =
          (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
        // Determine mouse position
        const clientOffset = monitor.getClientOffset();
        // Get pixels to the top
        const hoverClientY = clientOffset.y - hoverBoundingRect.top;

        // Dragging downwards
        if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
        // Dragging upwards
        if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;

        // Time to actually perform the action
        moveChapter(dragIndex, hoverIndex); // Call the move function from parent
        // Update the item's index for subsequent hover checks
        item.index = hoverIndex;
      }
    }),
    [index, moveChapter]
  ); // Dependencies

  drag(drop(ref)); // Attach drag and drop refs to the same node

  return (
    <a
      ref={ref} // Attach combined ref
      href="#"
      onClick={(e) => {
        e.preventDefault();
        onSelect(chapter._id);
      }}
      className={`group relative flex items-center justify-between px-3 py-1.5 text-gray-300 rounded transition truncate text-sm font-mono ${
        isActive
          ? 'bg-[var(--color-content-bg)] text-[var(--color-neon-cyan)] font-semibold'
          : 'hover:bg-gray-800/50 hover:text-[var(--color-neon-cyan)]'
      } ${isDragging ? 'opacity-30' : 'opacity-100'}`}
      style={{ cursor: 'move' }} // Indicate draggable
      data-handler-id={chapter._id} // For dnd-kit internals (if using that later)
    >
      <span className="truncate flex-grow pr-2">
        {chapter.order + 1}. {chapter.title}
      </span>
      {/* Delete Button (shown on hover) */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(chapter._id, chapter.title);
        }}
        className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 rounded bg-gray-700/30 text-red-500 hover:bg-red-500 hover:text-white opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
        title="Delete Chapter"
      >
        <TrashIcon />
      </button>
    </a>
  );
};
// --- End Draggable Chapter Item ---

function WorkspaceEditorPage() {
  const { novelId } = useParams();
  const navigate = useNavigate();
  const { authState } = useAuth();

  // State
  const [chapters, setChapters] = useState([]); // List for sidebar
  const [currentChapterId, setCurrentChapterId] = useState(null);
  const [currentChapterTitle, setCurrentChapterTitle] = useState('');
  const [currentChapterContent, setCurrentChapterContent] =
    useState(initialSlateValue);
  const [isLoadingChapters, setIsLoadingChapters] = useState(true);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [stickyFormat, setStickyFormat] = useState({}); // State for persistent formatting

  // Modal State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [chapterToDeleteId, setChapterToDeleteId] = useState(null);
  const [chapterToDeleteTitle, setChapterToDeleteTitle] = useState('');

  // Ref to track previous chapter order for debouncing save
  const prevChaptersRef = useRef([]);

  // Update Sticky Format Callback
  const updateStickyFormat = useCallback((format, value) => {
    setStickyFormat((prev) => {
      const newFormat = { ...prev };
      // Check against default values to decide whether to keep or remove the mark
      if (
        value === null ||
        value === false ||
        (format === 'fontSize' && value === DEFAULT_FONT_SIZE_STR) ||
        (format === 'fontFamily' && value === DEFAULT_FONT_FAMILY) ||
        (format === 'color' &&
          typeof value === 'string' &&
          value.toUpperCase() === DEFAULT_COLOR.toUpperCase())
      ) {
        delete newFormat[format];
      } else {
        newFormat[format] = value;
      }
      console.log('Sticky format updated:', newFormat);
      return newFormat;
    });
  }, []); // No dependencies, only uses default constants

  // Load Specific Chapter Content
  const loadChapter = useCallback(
    async (chapterId) => {
      if (!chapterId || !authState.token) return;
      console.log(`Loading chapter: ${chapterId}`);
      setIsLoadingContent(true);
      setError('');
      try {
        const config = {
          headers: { Authorization: `Bearer ${authState.token}` }
        };
        const response = await axios.get(
          `${backendUrl}/api/novels/${novelId}/chapters/${chapterId}`,
          config
        );
        const { _id, title, content } = response.data;
        setCurrentChapterId(_id);
        setCurrentChapterTitle(title || '');
        const validContent =
          Array.isArray(content) && content.length > 0
            ? content
            : initialSlateValue;
        setCurrentChapterContent(validContent);
        // Optional: Reset sticky format when loading a chapter?
        // setStickyFormat({});
      } catch (err) {
        console.error(`Error loading chapter ${chapterId}:`, err);
        setError(
          err.response?.data?.message || 'Failed to load chapter content.'
        );
        setCurrentChapterId(null);
        setCurrentChapterTitle('');
        setCurrentChapterContent(initialSlateValue);
      } finally {
        setIsLoadingContent(false);
      }
    },
    [novelId, authState.token]
  ); // Removed setStickyFormat dependency if not resetting

  // Fetch Chapters List
  const fetchChapters = useCallback(async () => {
    if (!novelId || !authState.token) return;
    setIsLoadingChapters(true);
    setError('');
    const currentSelectionId = currentChapterId; // Store current selection before fetch
    try {
      const config = {
        headers: { Authorization: `Bearer ${authState.token}` }
      };
      const response = await axios.get(
        `${backendUrl}/api/novels/${novelId}/chapters`,
        config
      );
      const fetchedChapters = response.data || [];
      setChapters(fetchedChapters);
      prevChaptersRef.current = fetchedChapters; // Initialize prevChaptersRef

      const currentChapterStillExists = fetchedChapters.some(
        (chap) => chap._id === currentSelectionId
      );

      if (fetchedChapters.length > 0) {
        if (!currentChapterStillExists) {
          // Load first chapter if current one is gone or was null
          loadChapter(fetchedChapters[0]._id);
        } else if (!currentChapterId) {
          // If there was no selection previously, load the first one
          loadChapter(fetchedChapters[0]._id);
        }
        // If currentChapterStillExists and currentChapterId was already set, do nothing to avoid reload
      } else {
        // No chapters, clear editor
        setCurrentChapterId(null);
        setCurrentChapterTitle('');
        setCurrentChapterContent(initialSlateValue);
      }
    } catch (err) {
      console.error('Error fetching chapters:', err);
      setError(err.response?.data?.message || 'Failed to load chapters.');
      setCurrentChapterId(null);
      setCurrentChapterTitle('');
      setCurrentChapterContent(initialSlateValue);
      if (err.response?.status === 404 || err.response?.status === 401) {
        navigate('/workspace/novels', { replace: true });
      }
    } finally {
      setIsLoadingChapters(false);
    }
    // Add dependencies
  }, [novelId, authState.token, navigate, loadChapter, currentChapterId]);

  // Initial Fetch Effect
  useEffect(() => {
    fetchChapters();
  }, [fetchChapters]);

  // Handle Chapter Selection
  const handleSelectChapter = (chapterId) => {
    if (chapterId !== currentChapterId) {
      // TODO: Consider adding check for unsaved changes before switching
      loadChapter(chapterId);
    }
  };

  // Handle Title Change in Editor
  const handleTitleChange = (e) => {
    setCurrentChapterTitle(e.target.value);
  };

  // Handle Content Change in Editor
  const handleContentChange = useCallback((newContent) => {
    setCurrentChapterContent(newContent);
  }, []); // No dependencies needed

  // Handle Save Chapter
  const handleSaveChapter = async () => {
    if (!currentChapterId || !authState.token) {
      setError('No chapter selected or not authorized.');
      return;
    }
    setIsSaving(true);
    setError('');
    try {
      const config = {
        headers: { Authorization: `Bearer ${authState.token}` }
      };
      const payload = {
        title: currentChapterTitle.trim() || 'Untitled Chapter',
        content: currentChapterContent
      };
      if (payload.title === '') {
        setError('Chapter title cannot be empty.');
        setIsSaving(false);
        return;
      }

      const response = await axios.put(
        `${backendUrl}/api/novels/${novelId}/chapters/${currentChapterId}`,
        payload,
        config
      );

      // Update the title in the sidebar list
      setChapters((prevChapters) =>
        prevChapters.map((chap) =>
          chap._id === currentChapterId
            ? {
                ...chap,
                title: response.data.title,
                updatedAt: response.data.updatedAt
              }
            : chap
        )
      );
      console.log('Chapter saved successfully');
      // Optionally: show success feedback
    } catch (err) {
      console.error(`Error saving chapter ${currentChapterId}:`, err);
      setError(err.response?.data?.message || 'Failed to save chapter.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Create New Chapter
  const handleCreateChapter = async () => {
    if (!novelId || !authState.token) return;
    setError('');
    // Consider button loading state
    try {
      const config = {
        headers: { Authorization: `Bearer ${authState.token}` }
      };
      const response = await axios.post(
        `${backendUrl}/api/novels/${novelId}/chapters`,
        {},
        config
      );
      const newChapter = response.data;
      // Add to list and automatically select it
      setChapters((prevChapters) => [...prevChapters, newChapter]);
      loadChapter(newChapter._id);
    } catch (err) {
      console.error('Error creating chapter:', err);
      setError(err.response?.data?.message || 'Failed to create chapter.');
    }
  };

  // Initiate Deletion (opens modal)
  const handleDeleteChapterClick = (id, title) => {
    setError('');
    setChapterToDeleteId(id);
    setChapterToDeleteTitle(title || 'Untitled Chapter');
    setShowConfirmModal(true);
  };

  // Confirm Deletion (called by modal)
  const confirmChapterDeletion = async () => {
    setError('');
    if (!authState.token || !chapterToDeleteId) return;
    const chapterId = chapterToDeleteId;
    setShowConfirmModal(false);
    setChapterToDeleteId(null);
    setChapterToDeleteTitle('');
    // Consider delete loading state

    try {
      const config = {
        headers: { Authorization: `Bearer ${authState.token}` }
      };
      await axios.delete(
        `${backendUrl}/api/novels/${novelId}/chapters/${chapterId}`,
        config
      );

      let nextChapterToLoadId = null;
      let updatedChapters = [];
      setChapters((prevChapters) => {
        const index = prevChapters.findIndex((c) => c._id === chapterId);
        if (index === -1) return prevChapters;

        // Determine next chapter to load
        if (prevChapters.length > 1) {
          nextChapterToLoadId =
            index > 0
              ? prevChapters[index - 1]._id
              : prevChapters[index + 1]._id;
        }
        // Filter out the deleted chapter and update order locally for immediate UI feedback
        updatedChapters = prevChapters
          .filter((c) => c._id !== chapterId)
          .map((chap, idx) => ({ ...chap, order: idx }));
        return updatedChapters;
      });

      // Load next/previous or clear editor
      if (nextChapterToLoadId) {
        loadChapter(nextChapterToLoadId);
      } else if (currentChapterId === chapterId) {
        // If deleted was current and last
        setCurrentChapterId(null);
        setCurrentChapterTitle('');
        setCurrentChapterContent(initialSlateValue);
      }
      // Update the ref for debouncer comparison
      prevChaptersRef.current = updatedChapters;

      console.log(`Chapter ${chapterId} deleted successfully.`);
    } catch (err) {
      console.error(`Error deleting chapter ${chapterId}:`, err);
      setError(err.response?.data?.message || 'Failed to delete chapter.');
    } finally {
      // Reset delete state/loading
    }
  };

  // --- Drag and Drop Logic ---
  const moveChapter = useCallback((dragIndex, hoverIndex) => {
    setChapters((prevChapters) => {
      const newChapters = [...prevChapters];
      const [draggedItem] = newChapters.splice(dragIndex, 1);
      newChapters.splice(hoverIndex, 0, draggedItem);
      // Local order update for UI feedback during drag
      return newChapters.map((chap, idx) => ({ ...chap, order: idx }));
    });
    // Debounced save will be triggered by the useEffect below
  }, []);

  // API call to save reordered chapters
  const saveChapterOrder = useCallback(
    async (currentOrderedChapters) => {
      if (!novelId || !authState.token || currentOrderedChapters.length === 0)
        return;

      const orderedChapterIds = currentOrderedChapters.map((chap) => chap._id);
      // Avoid saving if the order hasn't actually changed from the ref
      const previousOrderIds = prevChaptersRef.current.map((c) => c._id);
      if (
        JSON.stringify(orderedChapterIds) === JSON.stringify(previousOrderIds)
      ) {
        console.log("Order hasn't changed, skipping save.");
        return;
      }

      setError('');
      console.log('Attempting to save new chapter order:', orderedChapterIds);
      // Add saving indicator?

      try {
        const config = {
          headers: { Authorization: `Bearer ${authState.token}` }
        };
        await axios.post(
          `${backendUrl}/api/novels/${novelId}/chapters/reorder`,
          { orderedChapterIds },
          config
        );
        console.log('Chapter order saved successfully on backend.');
        // Update the ref *after* successful save
        prevChaptersRef.current = currentOrderedChapters;
        // Success: Trust local state, no re-fetch needed
      } catch (err) {
        console.error('Error saving chapter order:', err);
        setError(
          err.response?.data?.message ||
            'Failed to save chapter order. Reverting.'
        );
        // Failure: Re-fetch to get server state
        fetchChapters();
      } finally {
        // Clear saving indicator
      }
    },
    [novelId, authState.token, fetchChapters]
  ); // Include fetchChapters for error case

  // Debounced Save Function - Use useRef to ensure stable debounce function
  const debouncedSaveOrderRef = useRef(
    debounce((orderedChapters) => {
      saveChapterOrder(orderedChapters);
    }, 1500) // Debounce API call (e.g., 1.5 seconds after last change)
  );

  // Effect to trigger debounced save when local chapter order changes
  useEffect(() => {
    // Check if the component is still loading chapters initially
    if (isLoadingChapters) return;

    // Compare current order with the ref's order
    const currentOrderIds = chapters.map((c) => c._id);
    const previousOrderIds = prevChaptersRef.current.map((c) => c._id);

    if (JSON.stringify(currentOrderIds) !== JSON.stringify(previousOrderIds)) {
      console.log('Chapter order changed locally, debouncing save...');
      debouncedSaveOrderRef.current(chapters); // Pass the current chapters state
      // Do NOT update prevChaptersRef here; update it only after successful save
    }
    // Only depend on the chapters array identity/content and loading state
  }, [chapters, isLoadingChapters]);
  // --- End Drag and Drop ---

  // Basic error handling if novelId is missing
  if (!novelId) {
    return (
      <div className="p-6 text-center text-red-500">
        Error: Novel ID not found in URL.
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmChapterDeletion}
        title="Confirm Delete Chapter"
        message={`Are you sure you want to permanently delete the chapter "${chapterToDeleteTitle}"? This cannot be undone.`}
      />
      <div className="flex h-full bg-[var(--color-cyber-bg)]">
        {/* Chapter List Sidebar */}
        <aside className="w-64 h-full flex-shrink-0 border-r border-[var(--color-border)] bg-gray-900/20 overflow-y-auto flex flex-col">
          <div className="p-3 border-b border-[var(--color-border)] flex-shrink-0">
            <h2 className="font-semibold text-[var(--color-neon-pink)] mb-2 uppercase text-sm tracking-wider">
              Chapters
            </h2>
            <button
              onClick={handleCreateChapter}
              className="w-full btn-primary-pink text-xs py-1.5 flex items-center justify-center space-x-1 disabled:opacity-50"
              disabled={isLoadingChapters} // Disable while loading
            >
              <PlusIconMini /> <span>New Chapter</span>
            </button>
          </div>
          <nav className="flex-grow p-2 space-y-1">
            {isLoadingChapters ? (
              <p className="text-xs text-center text-gray-500 p-4">
                Loading chapters...
              </p>
            ) : chapters.length === 0 ? (
              <p className="text-xs text-center text-gray-500 p-4">
                No chapters yet. Click 'New Chapter' to start.
              </p>
            ) : (
              chapters.map((chap, index) => (
                <DraggableChapterLink
                  key={chap._id}
                  chapter={chap}
                  index={index}
                  moveChapter={moveChapter}
                  onSelect={handleSelectChapter}
                  isActive={currentChapterId === chap._id}
                  onDelete={handleDeleteChapterClick}
                />
              ))
            )}
          </nav>
          {/* Optional: Save Order Button */}
          {/* <div className="p-2 border-t border-[var(--color-border)]"> <button onClick={() => saveChapterOrder(chapters)} className="...">Save Order Now</button> </div> */}
        </aside>

        {/* Editor Area */}
        <div className="flex-grow h-full flex flex-col overflow-hidden bg-[var(--color-content-bg)]">
          {/* Display Errors */}
          {error && (
            <div className="p-2 bg-red-900/70 text-red-300 text-sm text-center flex-shrink-0">
              {error}{' '}
              <button
                onClick={() => setError('')}
                className="ml-2 text-red-200 hover:text-white"
              >
                ×
              </button>
            </div>
          )}

          {/* Handle Loading/Empty States */}
          {isLoadingContent && (
            <div className="flex-grow flex items-center justify-center text-gray-400">
              Loading chapter content...
            </div>
          )}
          {!isLoadingChapters &&
            !isLoadingContent &&
            !currentChapterId &&
            chapters.length > 0 && (
              <div className="flex-grow flex items-center justify-center text-gray-400">
                Select a chapter to start editing.
              </div>
            )}
          {!isLoadingChapters &&
            !isLoadingContent &&
            !currentChapterId &&
            chapters.length === 0 && (
              <div className="flex-grow flex items-center justify-center text-gray-400">
                Create your first chapter using the sidebar.
              </div>
            )}

          {/* Render NovelEditor only when chapter is loaded and selected */}
          {!isLoadingContent && currentChapterId && (
            <NovelEditor
              key={currentChapterId} // Force re-render on chapter change
              chapterId={currentChapterId}
              title={currentChapterTitle}
              initialContent={currentChapterContent}
              onTitleChange={handleTitleChange}
              onContentChange={handleContentChange}
              onSave={handleSaveChapter}
              isSaving={isSaving}
              stickyFormat={stickyFormat} // Pass state down
              updateStickyFormat={updateStickyFormat} // Pass callback down
            />
          )}
        </div>
      </div>
    </DndProvider>
  );
}
// --- Helper Icons ---
const PlusIconMini = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2.5}
    stroke="currentColor"
    className="w-3 h-3"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 4.5v15m7.5-7.5h-15"
    />
  </svg>
);
const TrashIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className="w-3.5 h-3.5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
    />
  </svg>
);

export default WorkspaceEditorPage;
