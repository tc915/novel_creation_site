// ---> FILE: ./novel-editor-frontend/src/pages/WorkspaceEditorPage.jsx <---

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo
} from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import NovelEditor from '../components/NovelEditor';
import ConfirmModal from '../components/ConfirmModal';
// Removed DND imports
import { debounce } from 'lodash';

import {
  DEFAULT_FONT_FAMILY as NOVEL_DEFAULT_FONT_FAMILY,
  DEFAULT_FONT_SIZE_STR as NOVEL_DEFAULT_FONT_SIZE
} from '../utils/slateEditorUtils';
const initialSlateValue = [{ type: 'paragraph', children: [{ text: '' }] }];

const backendUrl = 'http://localhost:5001';

// --- Chapter Link Component (Simplified) ---
const ChapterLink = ({ chapter, onSelect, isActive, onDelete }) => {
  return (
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        onSelect(chapter._id);
      }}
      className={`group relative flex items-center justify-between px-3 py-1.5 text-gray-300 rounded transition truncate text-sm font-mono ${
        isActive
          ? 'bg-[var(--color-content-bg)] text-[var(--color-neon-cyan)] font-semibold'
          : 'hover:bg-gray-800/50 hover:text-[var(--color-neon-cyan)]'
      }`}
    >
      {' '}
      <span className="truncate flex-grow pr-2">
        {chapter.order + 1}. {chapter.title}
      </span>{' '}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(chapter._id, chapter.title);
        }}
        className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 rounded bg-gray-700/30 text-red-500 hover:bg-red-500 hover:text-white opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
        title="Delete Chapter"
      >
        {' '}
        <TrashIcon />{' '}
      </button>{' '}
    </a>
  );
};

function WorkspaceEditorPage() {
  const { novelId } = useParams();
  const navigate = useNavigate();
  const { authState } = useAuth();
  const { currentNovel, isLoadingNovel, updateCurrentNovelData, saveTrigger } =
    useOutletContext();
  // ---> CHANGE START <---
  // Ref to track the last processed save trigger value
  const processedSaveTriggerRef = useRef(0);
  // ---> CHANGE END <---

  // State
  const [chapters, setChapters] = useState([]);
  const [currentChapterId, setCurrentChapterId] = useState(null);
  const [currentChapterTitle, setCurrentChapterTitle] = useState('');
  const [currentChapterContent, setCurrentChapterContent] =
    useState(initialSlateValue);
  const [isLoadingChapters, setIsLoadingChapters] = useState(true);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [isSavingChapter, setIsSavingChapter] = useState(false);
  const [isSavingNovel, setIsSavingNovel] = useState(false);
  const [error, setError] = useState('');
  const [novelDefaults, setNovelDefaults] = useState({
    fontFamily: NOVEL_DEFAULT_FONT_FAMILY,
    fontSize: NOVEL_DEFAULT_FONT_SIZE
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');

  // Effect to update local defaults
  useEffect(() => {
    if (currentNovel) {
      console.log('Current novel loaded in Editor Page:', currentNovel);
      setNovelDefaults({
        fontFamily: currentNovel.defaultFontFamily || NOVEL_DEFAULT_FONT_FAMILY,
        fontSize: currentNovel.defaultFontSize || NOVEL_DEFAULT_FONT_SIZE
      });
    } else {
      console.log('Current novel is null/undefined in Editor Page');
      setNovelDefaults({
        fontFamily: NOVEL_DEFAULT_FONT_FAMILY,
        fontSize: NOVEL_DEFAULT_FONT_SIZE
      });
    }
  }, [currentNovel]);

  // Modal State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [chapterToDeleteId, setChapterToDeleteId] = useState(null);
  const [chapterToDeleteTitle, setChapterToDeleteTitle] = useState('');

  // Debounced save novel defaults
  const debouncedSaveNovelDefaults = useRef(
    debounce(async (newDefaults) => {
      if (!novelId || !authState.token) {
        console.error('Cannot save novel defaults: missing novelId or token.');
        return;
      }
      setIsSavingNovel(true);
      setError('');
      console.log('Debounced save: Updating novel defaults with:', newDefaults);
      const payload = {
        defaultFontFamily: newDefaults.fontFamily,
        defaultFontSize: newDefaults.fontSize
      };
      try {
        const config = {
          headers: { Authorization: `Bearer ${authState.token}` }
        };
        const response = await axios.put(
          `${backendUrl}/api/novels/${novelId}`,
          payload,
          config
        );
        console.log('Novel defaults saved successfully.');
        if (updateCurrentNovelData) {
          updateCurrentNovelData(response.data);
          console.log('Called updateCurrentNovelData from context.');
        } else {
          console.warn('updateCurrentNovelData function not found in context.');
        }
      } catch (err) {
        console.error('Error saving novel defaults:', err);
        setError(
          err.response?.data?.message || 'Failed to save novel settings.'
        );
      } finally {
        setIsSavingNovel(false);
      }
    }, 1500)
  ).current;

  // Toolbar change handler
  const handleNovelDefaultsChange = useCallback(
    (format, value) => {
      console.log(
        `handleNovelDefaultsChange: format=${format}, value=${value}`
      );
      setNovelDefaults((prev) => {
        const updatedDefaults = { ...prev, [format]: value };
        debouncedSaveNovelDefaults(updatedDefaults);
        return updatedDefaults;
      });
    },
    [debouncedSaveNovelDefaults]
  );

  // Load Chapter
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
  );

  // Fetch Chapters
  const fetchChapters = useCallback(async () => {
    if (!novelId || !authState.token) return;
    setIsLoadingChapters(true);
    setError('');
    const currentSelectionId = currentChapterId;
    try {
      const config = {
        headers: { Authorization: `Bearer ${authState.token}` }
      };
      const response = await axios.get(
        `${backendUrl}/api/novels/${novelId}/chapters`,
        config
      );
      const fetchedChapters = response.data || [];
      fetchedChapters.sort((a, b) => a.order - b.order);
      setChapters(fetchedChapters);
      const currentChapterStillExists = fetchedChapters.some(
        (chap) => chap._id === currentSelectionId
      );
      if (fetchedChapters.length > 0) {
        if (!currentChapterStillExists || !currentChapterId) {
          loadChapter(fetchedChapters[0]._id);
        }
      } else {
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
  }, [novelId, authState.token, navigate, loadChapter, currentChapterId]);

  // Initial Fetch
  useEffect(() => {
    fetchChapters();
  }, [fetchChapters]);

  // Chapter Handlers
  const handleSelectChapter = (chapterId) => {
    if (chapterId !== currentChapterId) {
      loadChapter(chapterId);
    }
  };
  const handleTitleChange = (e) => {
    setCurrentChapterTitle(e.target.value);
  };
  const handleContentChange = useCallback((newContent) => {
    setCurrentChapterContent(newContent);
  }, []);

  // Save Chapter Handler
  const handleSaveChapter = useCallback(async () => {
    if (!currentChapterId || !authState.token || isSavingChapter) {
      if (isSavingChapter)
        console.log('Save Chapter prevented: Already saving.');
      else
        console.log(
          'Save Chapter prevented: No chapter selected or not authorized.'
        );
      return;
    }
    console.log('handleSaveChapter triggered');
    setIsSavingChapter(true);
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
        setIsSavingChapter(false);
        return;
      }
      const response = await axios.put(
        `${backendUrl}/api/novels/${novelId}/chapters/${currentChapterId}`,
        payload,
        config
      );
      setChapters((prevChapters) =>
        prevChapters
          .map((chap) =>
            chap._id === currentChapterId
              ? {
                  ...chap,
                  title: response.data.title,
                  updatedAt: response.data.updatedAt
                }
              : chap
          )
          .sort((a, b) => a.order - b.order)
      );
      console.log('Chapter saved successfully');
    } catch (err) {
      console.error(`Error saving chapter ${currentChapterId}:`, err);
      setError(err.response?.data?.message || 'Failed to save chapter.');
    } finally {
      setIsSavingChapter(false);
    }
  }, [
    currentChapterId,
    authState.token,
    currentChapterTitle,
    currentChapterContent,
    novelId,
    isSavingChapter
  ]);

  // Effect to listen for save trigger from layout
  useEffect(() => {
    // ---> CHANGE START <---
    // Check if the trigger value from context is NEWER than the last processed one
    if (saveTrigger > processedSaveTriggerRef.current) {
      console.log(
        `Save trigger received in WorkspaceEditorPage (Trigger: ${saveTrigger}, Processed: ${processedSaveTriggerRef.current})`
      );
      // Only save if there's actually a chapter loaded
      if (currentChapterId) {
        handleSaveChapter();
      } else {
        console.log('Save trigger received, but no chapter selected to save.');
      }
      // Update the ref to the current trigger value so we don't process it again
      processedSaveTriggerRef.current = saveTrigger;
    }
    // ---> CHANGE END <---
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveTrigger, handleSaveChapter, currentChapterId]); // Add currentChapterId dependency

  // Create / Delete Chapter logic
  const handleCreateChapter = async () => {
    if (!novelId || !authState.token) return;
    setError('');
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
      setChapters((prevChapters) =>
        [...prevChapters, newChapter].sort((a, b) => a.order - b.order)
      );
      loadChapter(newChapter._id);
    } catch (err) {
      console.error('Error creating chapter:', err);
      setError(err.response?.data?.message || 'Failed to create chapter.');
    }
  };
  const handleDeleteChapterClick = (id, title) => {
    setError('');
    setChapterToDeleteId(id);
    setChapterToDeleteTitle(title || 'Untitled Chapter');
    setShowConfirmModal(true);
  };
  const confirmChapterDeletion = async () => {
    setError('');
    if (!authState.token || !chapterToDeleteId) return;
    const chapterId = chapterToDeleteId;
    setShowConfirmModal(false);
    setChapterToDeleteId(null);
    setChapterToDeleteTitle('');
    try {
      const config = {
        headers: { Authorization: `Bearer ${authState.token}` }
      };
      await axios.delete(
        `${backendUrl}/api/novels/${novelId}/chapters/${chapterId}`,
        config
      );
      let nextChapterToLoadId = null;
      setChapters((prevChapters) => {
        const chaptersBeforeDelete = [...prevChapters].sort(
          (a, b) => a.order - b.order
        );
        const index = chaptersBeforeDelete.findIndex(
          (c) => c._id === chapterId
        );
        if (index === -1) return prevChapters;
        if (chaptersBeforeDelete.length > 1) {
          nextChapterToLoadId =
            index > 0
              ? chaptersBeforeDelete[index - 1]._id
              : chaptersBeforeDelete[index + 1]._id;
        }
        const updatedChapters = chaptersBeforeDelete
          .filter((c) => c._id !== chapterId)
          .sort((a, b) => a.order - b.order);
        return updatedChapters;
      });
      if (nextChapterToLoadId) {
        loadChapter(nextChapterToLoadId);
      } else if (currentChapterId === chapterId) {
        setCurrentChapterId(null);
        setCurrentChapterTitle('');
        setCurrentChapterContent(initialSlateValue);
      }
      console.log(`Chapter ${chapterId} deleted successfully.`);
    } catch (err) {
      console.error(`Error deleting chapter ${chapterId}:`, err);
      setError(err.response?.data?.message || 'Failed to delete chapter.');
    }
  };

  // Displayed Chapters calculation
  const displayChapters = useMemo(() => {
    let filtered = [...chapters];
    if (searchTerm.trim()) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (chapter) =>
          chapter.title.toLowerCase().includes(lowerSearchTerm) ||
          (chapter.order + 1).toString().includes(lowerSearchTerm)
      );
    }
    if (sortOrder === 'asc') {
      filtered.sort((a, b) => a.order - b.order);
    } else {
      filtered.sort((a, b) => b.order - a.order);
    }
    return filtered;
  }, [chapters, searchTerm, sortOrder]);

  // Loading/Error checks
  if (!novelId)
    return (
      <div className="p-6 text-center text-red-500">
        Error: Novel ID not found.
      </div>
    );
  if (isLoadingNovel) {
    return (
      <div className="p-6 text-center text-[var(--color-text-muted)]">
        Loading novel details...
      </div>
    );
  }
  if (!isLoadingNovel && !currentNovel) {
    return (
      <div className="p-6 text-center text-red-500">
        Error: Could not load novel details.
      </div>
    );
  }

  return (
    <>
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmChapterDeletion}
        title="Confirm Delete Chapter"
        message={`Are you sure you want to permanently delete the chapter "${chapterToDeleteTitle}"? This cannot be undone.`}
      />
      <div className="flex h-full bg-[var(--color-cyber-bg)]">
        {/* Sidebar */}
        <aside className="w-64 h-full flex-shrink-0 border-r border-[var(--color-border)] bg-gray-900/20 flex flex-col">
          <div className="sticky top-0 z-10 p-3 border-b border-[var(--color-border)] flex-shrink-0 bg-gray-900/50 backdrop-blur-sm">
            {' '}
            <div className="flex justify-between items-center mb-2">
              {' '}
              <h2 className="font-semibold text-[var(--color-neon-pink)] uppercase text-sm tracking-wider">
                Chapters
              </h2>{' '}
              {isSavingNovel && <SpinnerIcon size="small" color="pink" />}{' '}
            </div>{' '}
            <button
              onClick={handleCreateChapter}
              className="w-full btn-primary-pink text-xs py-1.5 flex items-center justify-center space-x-1 disabled:opacity-50"
              disabled={isLoadingChapters}
            >
              {' '}
              <PlusIconMini /> <span>New Chapter</span>{' '}
            </button>{' '}
          </div>
          <div className="p-2 border-b border-[var(--color-border)] flex-shrink-0">
            {' '}
            <div className="relative mb-2">
              {' '}
              <input
                type="text"
                placeholder="Search chapters..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs px-2 py-1 rounded border border-[var(--color-border)] bg-[var(--color-content-bg)] text-[var(--color-text-base)] placeholder-gray-500 focus:ring-1 focus:ring-[var(--color-neon-cyan)] focus:border-[var(--color-neon-cyan)] outline-none"
              />{' '}
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500">
                <SearchIcon />
              </span>{' '}
            </div>{' '}
            <div className="flex items-center justify-end space-x-1">
              {' '}
              <span className="text-xs text-gray-400 mr-1">Sort:</span>{' '}
              <button
                onClick={() => setSortOrder('asc')}
                title="Sort Ascending"
                className={`p-1 rounded ${
                  sortOrder === 'asc'
                    ? 'bg-[var(--color-neon-cyan)] text-black'
                    : 'text-gray-400 hover:bg-gray-700 hover:text-[var(--color-neon-cyan)]'
                }`}
              >
                {' '}
                <SortAscIcon />{' '}
              </button>{' '}
              <button
                onClick={() => setSortOrder('desc')}
                title="Sort Descending"
                className={`p-1 rounded ${
                  sortOrder === 'desc'
                    ? 'bg-[var(--color-neon-cyan)] text-black'
                    : 'text-gray-400 hover:bg-gray-700 hover:text-[var(--color-neon-cyan)]'
                }`}
              >
                {' '}
                <SortDescIcon />{' '}
              </button>{' '}
            </div>{' '}
          </div>
          <nav className="flex-grow p-2 space-y-1 overflow-y-auto">
            {' '}
            {isLoadingChapters ? (
              <p className="text-xs text-center text-gray-500 p-4">
                Loading chapters...
              </p>
            ) : displayChapters.length === 0 ? (
              <p className="text-xs text-center text-gray-500 p-4">
                {' '}
                {searchTerm
                  ? 'No chapters match search.'
                  : 'No chapters yet.'}{' '}
              </p>
            ) : (
              displayChapters.map((chap) => (
                <ChapterLink
                  key={chap._id}
                  chapter={chap}
                  onSelect={handleSelectChapter}
                  isActive={currentChapterId === chap._id}
                  onDelete={handleDeleteChapterClick}
                />
              ))
            )}{' '}
          </nav>
        </aside>
        {/* Editor Area */}
        <div className="flex-grow h-full flex flex-col overflow-hidden bg-[var(--color-content-bg)]">
          {error && (
            <div className="p-2 bg-red-900/70 text-red-300 text-sm text-center flex-shrink-0">
              {' '}
              {error}{' '}
              <button
                onClick={() => setError('')}
                className="ml-2 text-red-200 hover:text-white"
              >
                ×
              </button>{' '}
            </div>
          )}
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
                Select a chapter.
              </div>
            )}
          {!isLoadingChapters &&
            !isLoadingContent &&
            !currentChapterId &&
            chapters.length === 0 && (
              <div className="flex-grow flex items-center justify-center text-gray-400">
                Create your first chapter.
              </div>
            )}
          {!isLoadingContent && currentChapterId && novelDefaults && (
            <NovelEditor
              key={currentChapterId}
              chapterId={currentChapterId}
              title={currentChapterTitle}
              initialContent={currentChapterContent}
              onTitleChange={handleTitleChange}
              onContentChange={handleContentChange}
              onSave={handleSaveChapter}
              isSaving={isSavingChapter}
              novelDefaults={novelDefaults}
              onNovelDefaultsChange={handleNovelDefaultsChange}
            />
          )}
        </div>
      </div>
    </>
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
const SpinnerIcon = ({ size = 'small', color = 'cyan' }) => (
  <svg
    className={`animate-spin ${size === 'small' ? 'h-4 w-4' : 'h-5 w-5'} ${
      color === 'pink'
        ? 'text-[var(--color-neon-pink)]'
        : 'text-[var(--color-neon-cyan)]'
    }`}
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
const SearchIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-4 h-4"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
    />
  </svg>
);
const SortAscIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-4 h-4"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25m5.25-.75L17.25 9m0 0L21 12.75M17.25 9v12"
    />
  </svg>
);
const SortDescIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-4 h-4"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25m5.25.75L17.25 18m0 0L21 14.25M17.25 18V6"
    />
  </svg>
);

export default WorkspaceEditorPage;
