// src/pages/NovelsListPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext'; // Adjust path if needed
import ConfirmModal from '../components/ConfirmModal'; // Adjust path if needed

// Placeholder Icons
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>;


function NovelsListPage() {
  const [novels, setNovels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { authState } = useAuth();
  const navigate = useNavigate();
  const backendUrl = 'http://localhost:5001'; // Use env variable ideally

  // --- State for Confirmation Modal ---
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [novelToDeleteId, setNovelToDeleteId] = useState(null);
  const [novelToDeleteTitle, setNovelToDeleteTitle] = useState('');
  // --- End Modal State ---

  // Fetch novels effect
  useEffect(() => {
    const fetchNovels = async () => {
      setIsLoading(true);
      setError('');
      if (!authState.token) {
        setError("Not authenticated. Please log in.");
        setIsLoading(false);
        return;
      }
      try {
        const config = { headers: { Authorization: `Bearer ${authState.token}` } };
        const response = await axios.get(`${backendUrl}/api/novels`, config);
        setNovels(response.data || []);
      } catch (err) {
        console.error("Error fetching novels:", err);
        setError(err.response?.data?.message || 'Failed to fetch novels.');
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch if token is present
    if(authState.token) {
        fetchNovels();
    } else {
        // If no token on load (e.g., after logout), don't show loading
        setIsLoading(false);
        // Optionally navigate to login if AuthProvider handles initial loading state correctly
    }
  }, [authState.token]); // Depend on token


 // --- UPDATED: Handle creating novel ---
  // No longer calls API, just navigates to the form page with 'new' ID
  const handleCreateNovel = () => {
     navigate(`/workspace/novel/new/details`);
  };
  // --- End Update ---

  // --- Initiate Deletion (opens modal) ---
  const handleDeleteNovelClick = (id, title, event) => {
      event.stopPropagation(); // Prevent link navigation within the card
      event.preventDefault(); // Prevent default anchor/button behavior
      setError(''); // Clear previous errors
      setNovelToDeleteId(id);
      setNovelToDeleteTitle(title || 'Untitled Novel'); // Store title for message
      setShowConfirmModal(true); // Open the modal
  };
  // --- End Initiate Deletion ---

  // --- Confirm Deletion (called by modal's confirm button) ---
  const confirmDeletion = async () => {
      setError(''); // Clear previous errors
      if (!authState.token || !novelToDeleteId) return;

      // Show loading state? Maybe disable confirm button in modal?
      // setIsLoading(true); // Might interfere with list loading state

      try {
           const config = { headers: { Authorization: `Bearer ${authState.token}` } };
           await axios.delete(`${backendUrl}/api/novels/${novelToDeleteId}`, config);
           // Remove novel from state
           setNovels(prevNovels => prevNovels.filter(novel => novel._id !== novelToDeleteId));
           console.log(`Novel ${novelToDeleteId} deleted successfully.`);
      } catch (err) {
           console.error(`Error deleting novel ${novelToDeleteId}:`, err);
           // Display error - could set state to show in modal or on page
           setError(err.response?.data?.message || 'Failed to delete novel.');
      } finally {
          // Close modal and clear delete state
          setShowConfirmModal(false);
          setNovelToDeleteId(null);
          setNovelToDeleteTitle('');
          // setIsLoading(false); // Reset loading if set
      }
  };
  // --- End Confirm Deletion ---

  // --- Cancel Deletion (called by modal's cancel/close button) ---
   const cancelDeletion = () => {
       setShowConfirmModal(false);
       setNovelToDeleteId(null);
       setNovelToDeleteTitle('');
   };
   // --- End Cancel Deletion ---


  return (
    // Using theme colors/fonts from index.css
    <div className="p-6 md:p-8 h-full overflow-y-auto">
      {/* Render Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={cancelDeletion}
        onConfirm={confirmDeletion}
        title="Confirm Novel Deletion" // More specific title
        message={`Are you sure you want to permanently delete the novel "${novelToDeleteTitle}" and all its associated content (chapters, characters, etc.)? This action cannot be undone.`} // More specific message
      />

      <h2 className="text-3xl font-bold mb-6 text-[var(--color-text-heading)]">Your Novels</h2>

      {isLoading && <p className="text-[var(--color-text-muted)]">Loading novels...</p>}
      {/* Display general errors (like fetch errors) */}
      {!isLoading && error && <p className="text-red-500 bg-red-900/50 p-3 rounded mb-4">{error}</p>}

      {!isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Create New Novel Button */}
          <button
             onClick={handleCreateNovel}
             className="flex flex-col items-center justify-center p-6 h-48 rounded border-2 border-dashed border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-neon-cyan)] hover:text-[var(--color-neon-cyan)] transition duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-neon-cyan)] focus:ring-offset-2 focus:ring-offset-[var(--color-cyber-bg)]"
             title="Create a New Novel"
           >
                <PlusIcon />
                <span className="mt-2 text-sm font-semibold font-[var(--font-display)]">New Novel</span>
           </button>

          {/* Display Existing Novels */}
          {novels.map((novel) => (
            // Use group for hover/focus-within state on the container
            <div key={novel._id} className="relative group">
              <Link
                // Link card to details page
                to={`/workspace/novel/${novel._id}/editor`}
                className="block p-4 h-48 rounded border border-[var(--color-border)] bg-gray-900/40 hover:border-[var(--color-neon-pink)] hover:bg-gray-900/70 transition duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-neon-pink)] focus:ring-offset-2 focus:ring-offset-[var(--color-cyber-bg)]"
              >
                <h3 className="text-lg font-semibold font-[var(--font-display)] text-[var(--color-text-base)] truncate mb-2">
                  {novel.title || 'Untitled Novel'}
                </h3>
                <p className="text-xs text-[var(--color-text-muted)] font-mono">
                  Updated: {new Date(novel.updatedAt).toLocaleDateString()} {/* Show updated date */}
                </p>
                 <p className="text-xs text-[var(--color-text-muted)] font-mono mt-1">
                  Author: {novel.author || 'N/A'} {/* Show author */}
                </p>
                 {/* Add more info like genre later if needed */}
              </Link>
              {/* Delete Button */}
              <button
                // Pass novel title to initiator function for modal message
                onClick={(e) => handleDeleteNovelClick(novel._id, novel.title, e)}
                // Show on hover OR when button/link inside has focus
                className="absolute top-2 right-2 p-1 rounded bg-gray-800/50 text-red-500 hover:bg-red-500 hover:text-white opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus:opacity-100 transition-opacity duration-200"
                title="Delete Novel"
              >
                 <TrashIcon />
              </button>
            </div>
          ))}

          {/* Message if no novels exist yet */}
          {novels.length === 0 && !isLoading && (
              <div className="p-6 h-48 rounded border border-transparent text-[var(--color-text-muted)] flex items-center justify-center">
                 <p>Click "New Novel" to start.</p>
              </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NovelsListPage;