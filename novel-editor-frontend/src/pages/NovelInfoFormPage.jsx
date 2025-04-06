// ---> FILE: ./novel-editor-frontend/src/pages/NovelInfoFormPage.jsx <---

import React, { useState, useEffect, useCallback, useRef } from 'react'; // Added useRef
import {
  useParams,
  useNavigate,
  Link,
  useOutletContext
} from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import ConfirmModal from '../components/ConfirmModal';

// --- Genre List ---
const PREDEFINED_GENRES = [
  'Fantasy',
  'Science Fiction',
  'Dystopian',
  'Action',
  'Mystery',
  'Thriller',
  'Horror',
  'Romance',
  'Historical Fiction',
  'Adventure',
  'Drama',
  'Paranormal',
  'R18',
  'Post-Apocalyptic'
].sort((a, b) => a.localeCompare(b)); // Sort predefined list

// --- Icons ---
const TrashIcon = () => (
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
      d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
    />
  </svg>
);
const PlusIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2.5}
    stroke="currentColor"
    className="w-4 h-4"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 4.5v15m7.5-7.5h-15"
    />
  </svg>
);

// Define animation variants for the genre bubbles
const bubbleVariants = {
  deselected: {
    scale: 1,
    boxShadow: 'none',
    backgroundColor: 'rgba(26, 43, 65, 0)', // Transparent background (adjust rgb if theme changes)
    color: 'var(--color-text-muted)',
    borderColor: 'var(--color-border)',
    transition: {
      // Use a faster tween for deselection fade-out
      type: 'tween',
      duration: 0.15, // Faster duration
      ease: 'easeOut'
    }
  },
  selected: {
    scale: 1.05,
    boxShadow: '0 0 8px var(--color-neon-pink)',
    backgroundColor: 'var(--color-neon-pink)',
    color: '#000000',
    borderColor: 'var(--color-neon-pink)', // Match background or make transparent
    transition: {
      // Keep spring for selection pop
      type: 'spring',
      stiffness: 400,
      damping: 15
    }
  }
};

function NovelInfoFormPage() {
  const { novelId } = useParams();
  const { authState } = useAuth();
  const navigate = useNavigate();
  const { saveTrigger } = useOutletContext();
  const processedSaveTriggerRef = useRef(0);

  // Form state and other state variables
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [availableGenres, setAvailableGenres] = useState(
    PREDEFINED_GENRES.map((name) => ({ name, isCustom: false }))
  );
  const [description, setDescription] = useState('');
  const [newGenreInput, setNewGenreInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const isNewNovel = novelId === 'new';
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalConfirmText, setModalConfirmText] = useState('Confirm');

  const backendUrl = 'http://localhost:5001';

  // Fetch novel data
  useEffect(() => {
    let isMounted = true;
    const fetchNovelDetails = async () => {
      if (!novelId || isNewNovel || !authState.token) {
        setIsFetching(false);
        setAvailableGenres(
          PREDEFINED_GENRES.map((name) => ({ name, isCustom: false }))
        );
        setSelectedGenres([]);
        if (isNewNovel && !author && authState.user?.name) {
          setAuthor(authState.user.name);
        }
        return;
      }
      console.log(`Fetching details for novel: ${novelId}`);
      setIsFetching(true);
      setError('');
      setSuccessMessage('');
      try {
        const config = {
          headers: { Authorization: `Bearer ${authState.token}` }
        };
        const response = await axios.get(
          `${backendUrl}/api/novels/${novelId}`,
          config
        );
        if (isMounted) {
          const novelData = response.data;
          setTitle(novelData.title || '');
          setAuthor(novelData.author || '');
          const fetchedGenres = (novelData.genres || []).map((g) => ({
            name: g.name,
            isCustom: typeof g.isCustom === 'boolean' ? g.isCustom : false
          }));
          setSelectedGenres(fetchedGenres);
          setDescription(novelData.description || '');
          const predefinedObjects = PREDEFINED_GENRES.map((name) => ({
            name,
            isCustom: false
          }));
          const combined = [...predefinedObjects, ...fetchedGenres];
          const uniqueGenresMap = new Map();
          combined.forEach((genre) => {
            const lowerName = genre.name.toLowerCase();
            if (!uniqueGenresMap.has(lowerName)) {
              uniqueGenresMap.set(lowerName, genre);
            } else {
              const existing = uniqueGenresMap.get(lowerName);
              if (existing.isCustom && !genre.isCustom) {
                uniqueGenresMap.set(lowerName, genre);
              }
            }
          });
          setAvailableGenres(
            Array.from(uniqueGenresMap.values()).sort((a, b) =>
              a.name.localeCompare(b.name)
            )
          );
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching novel details:', err);
          setError(
            err.response?.data?.message || 'Failed to load novel details.'
          );
          if (err.response?.status === 404 || err.response?.status === 401) {
            navigate('/workspace/novels', { replace: true });
          }
        }
      } finally {
        if (isMounted) {
          setIsFetching(false);
        }
      }
    };
    fetchNovelDetails();
    return () => {
      isMounted = false;
    };
  }, [novelId, authState.token, authState.user?.name, isNewNovel, navigate]);

  // Handle Save
  const handleSave = useCallback(
    async (e) => {
      if (e) e.preventDefault();
      if (isLoading || (isFetching && !isNewNovel)) {
        console.log('Save prevented: Already loading or fetching.');
        return;
      }
      console.log('handleSave triggered (Novel Details)');
      setError('');
      setSuccessMessage('');
      setIsLoading(true);
      if (!title.trim()) {
        setError('Novel Title is required.');
        setIsLoading(false);
        return;
      }
      if (!authState.token) {
        setError('Authentication error.');
        setIsLoading(false);
        return;
      }
      const novelData = {
        title: title.trim(),
        author: author.trim(),
        genres: selectedGenres,
        description: description.trim()
      };
      const config = {
        headers: { Authorization: `Bearer ${authState.token}` }
      };
      try {
        let response;
        let savedNovelId = novelId;
        if (isNewNovel) {
          response = await axios.post(
            `${backendUrl}/api/novels`,
            novelData,
            config
          );
          savedNovelId = response.data._id;
          console.log('Novel created:', response.data);
          setSuccessMessage('Novel created successfully!');
          navigate(`/workspace/novel/${savedNovelId}/editor`);
        } else {
          response = await axios.put(
            `${backendUrl}/api/novels/${novelId}`,
            novelData,
            config
          );
          console.log('Novel updated:', response.data);
          setSuccessMessage('Novel details saved successfully!');
          setTimeout(() => setSuccessMessage(''), 3000);
        }
      } catch (err) {
        console.error('Error saving novel details:', err);
        setError(
          err.response?.data?.message ||
            `Failed to ${isNewNovel ? 'create' : 'save'} novel.`
        );
      } finally {
        setIsLoading(false);
      }
    },
    [
      novelId,
      isNewNovel,
      authState.token,
      title,
      author,
      selectedGenres,
      description,
      navigate,
      isLoading,
      isFetching
    ]
  );

  // Effect to listen for save trigger from layout
  useEffect(() => {
    if (saveTrigger > processedSaveTriggerRef.current) {
      console.log(
        `Save trigger received in NovelInfoFormPage (Trigger: ${saveTrigger}, Processed: ${processedSaveTriggerRef.current})`
      );
      handleSave();
      processedSaveTriggerRef.current = saveTrigger;
    }
  }, [saveTrigger, handleSave]);

  // Handle Genre logic
  const toggleGenre = (genreObject) => {
    setSelectedGenres((prev) => {
      const isSelected = prev.some(
        (g) => g.name.toLowerCase() === genreObject.name.toLowerCase()
      );
      if (isSelected) {
        return prev.filter(
          (g) => g.name.toLowerCase() !== genreObject.name.toLowerCase()
        );
      } else {
        return [...prev, genreObject];
      }
    });
  };
  const handleAddGenre = () => {
    const newGenreName = newGenreInput.trim();
    if (!newGenreName) return;
    const existingGenre = availableGenres.find(
      (g) => g.name.toLowerCase() === newGenreName.toLowerCase()
    );
    if (!existingGenre) {
      const newGenreObject = { name: newGenreName, isCustom: true };
      setAvailableGenres((prev) =>
        [...prev, newGenreObject].sort((a, b) => a.name.localeCompare(b.name))
      );
      setSelectedGenres((prev) => [...prev, newGenreObject]);
      setNewGenreInput('');
    } else {
      console.warn(`Genre "${newGenreName}" already exists.`);
      if (
        !selectedGenres.some(
          (sg) => sg.name.toLowerCase() === newGenreName.toLowerCase()
        )
      ) {
        setSelectedGenres((prev) => [...prev, existingGenre]);
      }
      setNewGenreInput('');
    }
  };
  const handleGenreInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddGenre();
    }
  };

  // Delete logic
  const handleDeleteClick = (type) => {
    setError('');
    setSuccessMessage('');
    if (type === 'novel') {
      setModalTitle('Confirm Delete Novel');
      setModalMessage(
        `Are you sure you want to permanently delete the novel "${
          title || 'Untitled Novel'
        }" AND all its chapters? This action cannot be undone.`
      );
      setModalConfirmText('Delete Novel & Chapters');
      setConfirmAction('deleteNovel');
    } else if (type === 'chapters') {
      setModalTitle('Confirm Delete All Chapters');
      setModalMessage(
        `Are you sure you want to permanently delete ALL chapters within the novel "${
          title || 'Untitled Novel'
        }"? This action cannot be undone.`
      );
      setModalConfirmText('Delete All Chapters');
      setConfirmAction('deleteChapters');
    }
    setShowConfirmModal(true);
  };
  const handleConfirmAction = async () => {
    const action = confirmAction;
    setShowConfirmModal(false);
    setConfirmAction(null);
    if (!authState.token || !novelId || isNewNovel) {
      setError('Cannot perform delete action on unsaved or invalid novel.');
      return;
    }
    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    if (action === 'deleteNovel') {
      try {
        const config = {
          headers: { Authorization: `Bearer ${authState.token}` }
        };
        await axios.delete(`${backendUrl}/api/novels/${novelId}`, config);
        console.log(`Novel ${novelId} deleted successfully.`);
        navigate('/workspace/novels');
      } catch (err) {
        console.error(`Error deleting novel ${novelId}:`, err);
        setError(err.response?.data?.message || 'Failed to delete novel.');
        setIsLoading(false);
      }
    } else if (action === 'deleteChapters') {
      try {
        const config = {
          headers: { Authorization: `Bearer ${authState.token}` }
        };
        const response = await axios.delete(
          `${backendUrl}/api/novels/${novelId}/chapters/all`,
          config
        );
        console.log(`All chapters for novel ${novelId} deleted successfully.`);
        setSuccessMessage(response.data.message || 'All chapters deleted.');
      } catch (err) {
        console.error(`Error deleting all chapters for novel ${novelId}:`, err);
        setError(
          err.response?.data?.message || 'Failed to delete all chapters.'
        );
      } finally {
        setIsLoading(false);
      }
    } else {
      console.warn('Unknown confirm action:', action);
      setIsLoading(false);
    }
  };
  const handleCloseConfirm = () => {
    setShowConfirmModal(false);
    setConfirmAction(null);
  };
  const handleCancel = () => {
    setError('');
    setSuccessMessage('');
    if (isNewNovel) {
      navigate('/workspace/novels');
    }
  };

  // Render Loading state
  if (isFetching && !isNewNovel) {
    return (
      <div className="p-6 text-center text-[var(--color-text-muted)] font-mono">
        Loading novel details...
      </div>
    );
  }

  // Render Form
  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto relative">
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={handleCloseConfirm}
        onConfirm={handleConfirmAction}
        title={modalTitle}
        message={modalMessage}
        confirmText={modalConfirmText}
      />
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-3xl font-bold text-[var(--color-text-heading)]">
          {isNewNovel ? 'Create New Novel' : `Edit Details`}
        </h2>
        {!isNewNovel && (
          <div className="flex flex-col sm:flex-row items-end space-y-2 sm:space-y-0 sm:space-x-2 absolute right-8 top-8">
            {' '}
            <button
              onClick={() => handleDeleteClick('chapters')}
              title="Delete All Chapters"
              className="p-1.5 text-orange-500 hover:text-white hover:bg-orange-600 rounded transition duration-200 flex items-center text-xs"
              disabled={isLoading}
            >
              {' '}
              <span className="mr-1 hidden sm:inline">
                Delete All Chapters
              </span>{' '}
              <TrashIcon />{' '}
            </button>{' '}
            <button
              onClick={() => handleDeleteClick('novel')}
              title="Delete Novel"
              className="p-1.5 text-red-500 hover:text-white hover:bg-red-600 rounded transition duration-200 flex items-center text-xs"
              disabled={isLoading}
            >
              {' '}
              <span className="mr-1 hidden sm:inline">Delete Novel</span>{' '}
              <TrashIcon />{' '}
            </button>{' '}
          </div>
        )}
      </div>

      {error && (
        <p className="mb-4 text-center text-red-500 bg-red-900/50 p-2 rounded text-sm">
          {error}
        </p>
      )}
      {successMessage && (
        <p className="mb-4 text-center text-green-500 bg-green-900/50 p-2 rounded text-sm">
          {successMessage}
        </p>
      )}

      <form onSubmit={handleSave} autoComplete="off" className="space-y-5">
        <div>
          {' '}
          <label htmlFor="title" className="form-label">
            Title*
          </label>{' '}
          <input
            type="text"
            autoComplete="off"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="form-input focus:ring-[var(--color-neon-cyan)]"
            placeholder="Your Novel's Title"
          />{' '}
        </div>
        <div>
          {' '}
          <label htmlFor="author" className="form-label">
            Author
          </label>{' '}
          <input
            type="text"
            id="author"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="form-input focus:ring-[var(--color-neon-cyan)]"
            placeholder="Author Name (Defaults to your name)"
          />{' '}
        </div>
        <div>
          <label className="form-label">Genres</label>
          <div className="flex flex-wrap gap-2 mt-1 mb-3">
            {availableGenres.map((genreObj) => {
              const isSelected = selectedGenres.some(
                (g) => g.name.toLowerCase() === genreObj.name.toLowerCase()
              );
              return (
                <motion.button
                  key={genreObj.name}
                  type="button"
                  onClick={() => toggleGenre(genreObj)}
                  variants={bubbleVariants}
                  animate={isSelected ? 'selected' : 'deselected'}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-3 py-1 rounded-full border text-xs font-mono transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-offset-[var(--color-cyber-bg)] ${
                    isSelected
                      ? 'focus:ring-[var(--color-neon-pink)]'
                      : 'hover:border-[var(--color-neon-pink)] hover:text-[var(--color-neon-pink)] focus:ring-[var(--color-neon-cyan)]'
                  }`}
                >
                  {genreObj.name}
                  {genreObj.isCustom && (
                    <span className="ml-1 opacity-70">(Custom)</span>
                  )}
                </motion.button>
              );
            })}
          </div>
          <div className="flex items-center space-x-2 mt-2">
            {' '}
            <input
              type="text"
              value={newGenreInput}
              onChange={(e) => setNewGenreInput(e.target.value)}
              onKeyDown={handleGenreInputKeyDown}
              className="form-input text-xs flex-grow focus:ring-[var(--color-neon-cyan)]"
              placeholder="Add custom genre..."
            />{' '}
            <button
              type="button"
              onClick={handleAddGenre}
              className="btn-primary-cyan text-xs px-3 py-1.5 flex-shrink-0 flex items-center space-x-1"
              title="Add Genre"
            >
              {' '}
              <PlusIcon />{' '}
            </button>{' '}
          </div>
        </div>
        <div>
          {' '}
          <label htmlFor="description" className="form-label">
            Description / Synopsis{' '}
            <span className="text-xs text-[var(--color-text-muted)]">
              (Optional)
            </span>
          </label>{' '}
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="form-input focus:ring-[var(--color-neon-cyan)] min-h-[150px] font-[var(--font-body)] text-sm w-full outline-none border border-gray-400 rounded-lg mt-2 p-2 resize-none"
            placeholder="A brief summary or logline for your novel..."
            rows={5}
          ></textarea>{' '}
        </div>
        <div className="flex justify-end items-center space-x-3 pt-4">
          {isNewNovel && (
            <button
              type="button"
              onClick={handleCancel}
              className="btn bg-gray-600 hover:bg-gray-700 text-white text-sm px-4 py-1.5 rounded-sm"
              disabled={isLoading}
            >
              {' '}
              Cancel{' '}
            </button>
          )}
          <button
            type="submit"
            className="btn-primary-cyan text-sm px-5 py-1.5"
            disabled={isLoading || (isFetching && !isNewNovel)}
          >
            {' '}
            {isLoading
              ? 'Saving...'
              : isNewNovel
              ? 'Create & Save'
              : 'Save Details'}{' '}
          </button>
        </div>
      </form>
    </div>
  );
}

export default NovelInfoFormPage;
