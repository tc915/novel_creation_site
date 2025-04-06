// ---> FILE: ./novel-editor-frontend/src/pages/CharactersPage.jsx <---
// src/pages/CharactersPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // Import useNavigate
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import CharacterCard from '../components/CharacterCard';
import CharacterFormModal from '../components/CharacterFormModal'; // Keep for CREATION
import ConfirmModal from '../components/ConfirmModal';
import { PlusIcon, SpinnerIcon } from '../components/Icons';
import { motion, AnimatePresence } from 'framer-motion';

const backendUrl = 'http://localhost:5001';

function CharactersPage() {
  const { novelId } = useParams();
  const { authState } = useAuth();
  const navigate = useNavigate(); // Use navigate hook

  // State
  const [characters, setCharacters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  // ---> CHANGE START <---
  // Rename modal state to reflect it's only for creation now
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  // Removed editingCharacter state
  // const [editingCharacter, setEditingCharacter] = useState(null);
  // ---> CHANGE END <---
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState('');

  // Delete confirmation state (remains the same)
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [characterToDeleteId, setCharacterToDeleteId] = useState(null);
  const [characterToDeleteName, setCharacterToDeleteName] = useState('');

  // Fetch Characters (remains largely the same)
  const fetchCharacters = useCallback(async () => {
    // ... (fetch logic is the same) ...
    if (!novelId || !authState.token) {
      setError('Cannot load characters without novel ID or authentication.');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const config = {
        headers: { Authorization: `Bearer ${authState.token}` }
      };
      const response = await axios.get(
        `${backendUrl}/api/novels/${novelId}/characters`,
        config
      );
      setCharacters(response.data || []);
    } catch (err) {
      console.error('Error fetching characters:', err);
      setError(err.response?.data?.message || 'Failed to fetch characters.');
      if (err.response?.status === 404 || err.response?.status === 401) {
        navigate('/workspace/novels', { replace: true });
      }
    } finally {
      setIsLoading(false);
    }
  }, [novelId, authState.token, navigate]);

  useEffect(() => {
    fetchCharacters();
  }, [fetchCharacters]);

  // --- Modal Handlers for CREATION ---
  const handleOpenCreateModal = () => {
    setModalError('');
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    setModalError('');
  };

  // ---> CHANGE START <---
  // --- Edit Handler - Navigates to Detail Page ---
  const handleEditCharacter = (character) => {
    navigate(`/workspace/novel/${novelId}/characters/${character._id}`);
  };
  // ---> CHANGE END <---

  // --- Save Handler (Now ONLY for Create) ---
  const handleSaveCharacter = async (formData) => {
    // Removed characterIdToUpdate param
    setIsSaving(true);
    setModalError('');
    setError('');

    const config = { headers: { Authorization: `Bearer ${authState.token}` } };
    const url = `${backendUrl}/api/novels/${novelId}/characters`; // Always POST for create
    const method = 'post';

    try {
      const response = await axios[method](url, formData, config);
      const savedCharacter = response.data;

      // Add new character to the list
      setCharacters((prev) =>
        [...prev, savedCharacter].sort((a, b) => a.name.localeCompare(b.name))
      );

      handleCloseCreateModal(); // Close modal on success
    } catch (err) {
      console.error('Error creating character:', err);
      const message =
        err.response?.data?.message || `Failed to create character.`;
      setModalError(message); // Show error within the modal
    } finally {
      setIsSaving(false);
    }
  };

  // --- Delete Handlers (remain the same) ---
  const handleDeleteClick = (id, name) => {
    setCharacterToDeleteId(id);
    setCharacterToDeleteName(name || 'Unnamed Character');
    setShowConfirmModal(true);
  };

  const confirmDeletion = async () => {
    // ... (deletion logic is the same) ...
    if (!characterToDeleteId || !authState.token) return;
    setShowConfirmModal(false);
    setError('');

    try {
      const config = {
        headers: { Authorization: `Bearer ${authState.token}` }
      };
      await axios.delete(
        `${backendUrl}/api/novels/${novelId}/characters/${characterToDeleteId}`,
        config
      );
      setCharacters((prev) =>
        prev.filter((char) => char._id !== characterToDeleteId)
      );
      setCharacterToDeleteId(null);
      setCharacterToDeleteName('');
    } catch (err) {
      console.error('Error deleting character:', err);
      setError(err.response?.data?.message || 'Failed to delete character.');
      setCharacterToDeleteId(null);
      setCharacterToDeleteName('');
    }
  };

  const cancelDeletion = () => {
    setShowConfirmModal(false);
    setCharacterToDeleteId(null);
    setCharacterToDeleteName('');
  };

  // Animation container variants (remains the same)
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.07
      }
    }
  };

  return (
    <div className="p-6 md:p-8 h-full overflow-y-auto">
      {/* Character Form Modal - ONLY FOR CREATION NOW */}
      <CharacterFormModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        onSave={handleSaveCharacter}
        characterData={null} // Always pass null for creation mode
        isSaving={isSaving}
        error={modalError}
      />

      {/* Delete Confirmation Modal (remains the same) */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={cancelDeletion}
        onConfirm={confirmDeletion}
        title="Confirm Character Deletion"
        message={`Are you sure you want to permanently delete the character "${characterToDeleteName}"? This action cannot be undone.`}
      />

      {/* Header (remains the same) */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-[var(--color-text-heading)]">
          Characters
        </h2>
        <motion.button
          onClick={handleOpenCreateModal} // Still opens create modal
          className="btn-primary-cyan text-sm px-4 py-2 flex items-center space-x-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <PlusIcon className="w-5 h-5" />
          <span>New Character</span>
        </motion.button>
      </div>

      {/* Loading State (remains the same) */}
      {isLoading && (
        <div className="flex justify-center items-center h-40">
          <SpinnerIcon className="animate-spin h-8 w-8 text-[var(--color-neon-cyan)]" />
        </div>
      )}

      {/* Error Display (remains the same) */}
      {error && !isLoading && (
        <div className="mb-4 text-center text-red-500 bg-red-900/50 p-3 rounded">
          {error}
        </div>
      )}

      {/* No Characters Message (remains the same) */}
      {!isLoading && !error && characters.length === 0 && (
        <div className="text-center text-[var(--color-text-muted)] mt-10 font-mono">
          No characters found. Click "New Character" to add one.
        </div>
      )}

      {/* Character Grid */}
      {!isLoading && !error && characters.length > 0 && (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence>
            {characters.map((character) => (
              <CharacterCard
                key={character._id}
                character={character}
                // ---> CHANGE START <---
                onEdit={handleEditCharacter} // Pass the navigation handler
                // ---> CHANGE END <---
                onDelete={handleDeleteClick}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}

export default CharactersPage;
