// src/pages/NovelInfoFormPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext'; // Adjust path if needed
import { motion } from 'framer-motion'; // Ensure framer-motion is installed
import ConfirmModal from '../components/ConfirmModal'; // Adjust path if needed

// --- Genre List ---
const PREDEFINED_GENRES = [
    "Fantasy", "Science Fiction", "Dystopian", "Action",
    "Mystery", "Thriller", "Horror", "Romance", "Historical Fiction",
    "Adventure", "Drama", "Paranormal", "R18", "Post-Apocalyptic"
    // Add/remove genres as needed
];

// --- Trash Icon Component ---
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>;


function NovelInfoFormPage() {
  const { novelId } = useParams();
  const { authState } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [description, setDescription] = useState('');
  // Status states
  const [isLoading, setIsLoading] = useState(false); // For save/delete actions
  const [isFetching, setIsFetching] = useState(true); // Start fetching immediately
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  // --- Determine mode based on novelId ---
  const isNewNovel = novelId === 'new';
  // --- End Mode Determination ---

  // Modal State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // 'delete' or 'cancelNew'
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalConfirmText, setModalConfirmText] = useState('Confirm');

  const backendUrl = 'http://localhost:5001';

  // Fetch novel data only if editing an existing novel
  useEffect(() => {
    let isMounted = true;
    const fetchNovelDetails = async () => {
        // Skip fetch if creating a new novel
      if (isNewNovel || !novelId || !authState.token) {
        setIsFetching(false);
        // Pre-fill author if new and author state is currently empty
        if (isNewNovel && !author && authState.user?.name) {
            setAuthor(authState.user.name);
        }
        return;
      }

      console.log(`Workspaceing details for novel: ${novelId}`);
      setIsFetching(true); setError(''); setSuccessMessage('');
      try {
        const config = { headers: { Authorization: `Bearer ${authState.token}` } };
        const response = await axios.get(`${backendUrl}/api/novels/${novelId}`, config);
        if (isMounted) {
          const novelData = response.data;
          setTitle(novelData.title || '');
          setAuthor(novelData.author || ''); // Don't default to user name when editing fetched data
          setSelectedGenres(novelData.genres || []);
          setDescription(novelData.description || '');
          // setIsNewNovel(false); // Already determined by novelId !== 'new'
        }
      } catch (err) {
         if (isMounted) {
            console.error("Error fetching novel details:", err);
            setError(err.response?.data?.message || 'Failed to load novel details.');
            if (err.response?.status === 404 || err.response?.status === 401) {
                 navigate('/workspace/novels', { replace: true });
            }
          }
      } finally { if (isMounted) { setIsFetching(false); } }
    };

    fetchNovelDetails();
    return () => { isMounted = false; }; // Cleanup

  }, [novelId, authState.token, authState.user?.name, isNewNovel, navigate]); // Dependencies


  // Handle Save (uses POST for new, PUT for existing)
  const handleSave = async (e) => {
    e.preventDefault();
    setError(''); setSuccessMessage(''); setIsLoading(true);
    if (!title.trim()) { setError('Novel Title is required.'); setIsLoading(false); return; }
    if (!authState.token) { setError('Authentication error.'); setIsLoading(false); return; }

    const novelData = {
      title: title.trim(), author: author.trim(),
      genres: selectedGenres, description: description.trim()
    };
    const config = { headers: { Authorization: `Bearer ${authState.token}` } };

    try {
      let response;
      let savedNovelId = novelId; // Use existing ID for PUT

      if (isNewNovel) {
        // Create Request (POST)
        response = await axios.post(`${backendUrl}/api/novels`, novelData, config);
        savedNovelId = response.data._id; // Get ID from response
        console.log('Novel created:', response.data);
        setSuccessMessage('Novel created successfully!');
      } else {
        // Update Request (PUT)
        response = await axios.put(`${backendUrl}/api/novels/${novelId}`, novelData, config);
        console.log('Novel updated:', response.data);
        setSuccessMessage('Novel details saved successfully!');
      }

      // Navigate to editor for the saved novel (new or existing) after delay
      setTimeout(() => navigate(`/workspace/novel/${savedNovelId}/editor`), 1000);

    } catch (err) {
      console.error("Error saving novel details:", err);
      setError(err.response?.data?.message || `Failed to ${isNewNovel ? 'create' : 'save'} novel.`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Genre Bubble Click
  const toggleGenre = (genre) => {
      setSelectedGenres(prev =>
          prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
      );
  };

  // Initiate Deletion (Opens Modal)
   const handleDeleteNovelClick = () => {
      setError(''); setSuccessMessage('');
      setModalTitle('Confirm Delete Novel');
      setModalMessage(`Are you sure you want to permanently delete the novel "${title || 'Untitled Novel'}"? This action cannot be undone.`);
      setModalConfirmText('Confirm Delete');
      setConfirmAction('delete');
      setShowConfirmModal(true);
   };

  // Handle Confirmation Action (only delete needed now)
  const handleConfirmAction = async () => {
      const action = confirmAction; // Capture before resetting
      setShowConfirmModal(false);
      setConfirmAction(null);

      if (action !== 'delete' || !authState.token || !novelId || isNewNovel) {
           setError("Cannot delete unsaved or invalid novel.");
           return;
       }
      setIsLoading(true); setError('');

      try {
           const config = { headers: { Authorization: `Bearer ${authState.token}` } };
           await axios.delete(`${backendUrl}/api/novels/${novelId}`, config);
           console.log(`Novel ${novelId} deleted successfully.`);
           navigate('/workspace/novels');
      } catch (err) {
           console.error(`Error deleting novel ${novelId}:`, err);
           setError(err.response?.data?.message || 'Failed to delete novel.');
           setIsLoading(false);
      }
   };

   // Close Confirmation Modal
   const handleCloseConfirm = () => { setShowConfirmModal(false); setConfirmAction(null); };

  // Cancel Handler (Simplified - no delete, just navigate)
  const handleCancel = () => {
      setError(''); setSuccessMessage('');
      if (isNewNovel) {
          // Just go back to list if cancelling a new novel form
          navigate('/workspace/novels');
      } else {
          // Go back to editor if cancelling an edit
          navigate(`/workspace/novel/${novelId}/editor`);
      }
  };

  // Render Loading state
  if (isFetching) {
      return <div className="p-6 text-center text-[var(--color-text-muted)] font-mono">Loading novel details...</div>;
  }

  // Render Form
  return (
    // Use user's styling from previous input
    <div className="p-6 md:p-8 max-w-3xl mx-auto relative">
      <ConfirmModal
        isOpen={showConfirmModal} // Driven by state
        onClose={handleCloseConfirm}
        onConfirm={handleConfirmAction}
        title={modalTitle}
        message={modalMessage}
        confirmText={modalConfirmText}
      />

      {/* Header Section */}
      <div className="flex justify-between items-start mb-6">
          <h2 className="text-3xl font-bold text-[var(--color-text-heading)]">
             {/* Update title based on mode */}
             {isNewNovel ? 'Create New Novel' : `Edit Details`}
          </h2>
           {/* Delete Button only shows when editing existing novel */}
           {/* Using user's styling */}
           {!isNewNovel && (
             <button onClick={handleDeleteNovelClick} title="Delete Novel" className="p-1.5 text-red-500 hover:text-white hover:bg-red-600 rounded transition duration-200 absolute right-8 top-8 flex items-center" disabled={isLoading}>
                 <span className='text-[0.75rem] mr-1 hidden sm:inline'>Delete Novel</span>
                 <TrashIcon />
             </button>
           )}
      </div>

      {/* Display Messages */}
      {error && <p className="mb-4 text-center text-red-500 bg-red-900/50 p-2 rounded text-sm">{error}</p>}
      {successMessage && <p className="mb-4 text-center text-green-500 bg-green-900/50 p-2 rounded text-sm">{successMessage}</p>}

      {/* Form - Using user's spacing */}
      <form onSubmit={handleSave} className="space-y-5">
        {/* Title */}
        <div>
          <label htmlFor="title" className="form-label">Title*</label>
          <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} required className="form-input focus:ring-[var(--color-neon-cyan)]" placeholder="Your Novel's Title" />
        </div>

        {/* Author */}
        <div>
          <label htmlFor="author" className="form-label">Author</label>
          <input type="text" id="author" value={author} onChange={(e) => setAuthor(e.target.value)} className="form-input focus:ring-[var(--color-neon-cyan)]" placeholder="Author Name (Defaults to your name)" />
        </div>

        {/* --- Genres Bubble Selector --- */}
        <div>
            <label className="form-label">Genres <span className="text-xs text-[var(--color-text-muted)]">(Optional, click to select/deselect)</span></label>
            <div className="flex flex-wrap gap-2 mt-1">
                {PREDEFINED_GENRES.map(genre => {
                     const isSelected = selectedGenres.includes(genre);
                     return (
                         // --- Full motion.button implementation ---
                         <motion.button
                            key={genre}
                            type="button" // Prevent form submission
                            onClick={() => toggleGenre(genre)}
                            animate={{
                                scale: isSelected ? 1.05 : 1,
                                boxShadow: isSelected ? `0 0 8px var(--color-neon-pink)` : 'none', // Glow effect
                                // Add background color transition if desired
                                backgroundColor: isSelected ? 'var(--color-neon-pink)' : 'transparent',
                                color: isSelected ? '#000000' : 'var(--color-text-muted)',
                                borderColor: isSelected ? 'transparent' : 'var(--color-border)'
                            }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 400, damping: 15 }}
                            className={`px-3 py-1 rounded-full border text-xs font-mono transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-offset-[var(--color-cyber-bg)] ${ isSelected ? 'focus:ring-[var(--color-neon-pink)]' : 'hover:border-[var(--color-neon-pink)] hover:text-[var(--color-neon-pink)] focus:ring-[var(--color-neon-cyan)]' }`}
                         >
                             {genre}
                         </motion.button>
                         // --- End motion.button implementation ---
                     );
                })}
            </div>
        </div>
        {/* --- End Genres --- */}

        {/* Description / Synopsis */}
        <div>
          <label htmlFor="description" className="form-label">Description / Synopsis <span className="text-xs text-[var(--color-text-muted)]">(Optional)</span></label>
          {/* Using user's Textarea styles */}
          <textarea
            id="description" value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="form-input focus:ring-[var(--color-neon-cyan)] min-h-[150px] font-[var(--font-body)] text-sm w-full outline-none border border-gray-400 rounded-lg mt-2 p-2 resize-none"
            placeholder="A brief summary or logline for your novel..."
            rows={5}
          ></textarea>
        </div>

        {/* Buttons */}
        <div className="flex justify-end items-center space-x-3 pt-4">
           {/* Cancel Button (calls updated handleCancel) */}
           {/* Using user's button styling */}
           <button type="button" onClick={handleCancel} className="btn bg-gray-600 hover:bg-gray-700 text-white text-sm px-4 py-1.5 rounded-sm" disabled={isLoading} >
             Cancel
           </button>
           {/* Save Button */}
           <button type="submit" className="btn-primary-cyan text-sm px-5 py-1.5" disabled={isLoading || isFetching} >
              {isLoading ? 'Saving...' : (isNewNovel ? 'Create & Save' : 'Save Details')}
            </button>
        </div>
      </form>
    </div>
  );
}

export default NovelInfoFormPage;