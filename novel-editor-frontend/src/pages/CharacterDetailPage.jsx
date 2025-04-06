// ---> FILE: ./novel-editor-frontend/src/pages/CharacterDetailPage.jsx <---
// src/pages/CharacterDetailPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from '../components/ConfirmModal';
import { SpinnerIcon, TrashIcon, ArrowLeftIcon } from '../components/Icons';
import { motion, AnimatePresence } from 'framer-motion';

const backendUrl = 'http://localhost:5001';

// Enhanced FormField helper with focus state and animation class
const FormField = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  required = false,
  type = 'text',
  rows = 3,
  className = '',
  labelClassName = ''
}) => {
  // Added labelClassName prop
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  return (
    <div
      className={`${className} relative ${
        isFocused ? 'animated-border-active' : ''
      }`}
    >
      {/* ---> CHANGE START <--- */}
      {/* Apply relative positioning and higher z-index to the label */}
      <label
        htmlFor={id}
        className={`form-label text-xs uppercase font-mono text-[var(--color-text-muted)] mb-1 block tracking-wider relative z-[2] pointer-events-none ${labelClassName}`} // Added z-[2], relative, pointer-events-none
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {/* ---> CHANGE END <--- */}
      {type === 'textarea' ? (
        <textarea
          id={id}
          name={id}
          value={value}
          autoComplete="off"
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          rows={rows}
          className="form-input w-full text-sm bg-[var(--color-content-bg)] border border-[var(--color-border)] focus:outline-none resize-none p-2 rounded-sm transition duration-150 placeholder:text-gray-600 overflow-y-auto relative z-[1]" // Keep z-[1]
        />
      ) : (
        <input
          type={type}
          id={id}
          name={id}
          value={value}
          autoComplete="off"
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          required={required}
          className="form-input w-full text-sm bg-[var(--color-content-bg)] border border-[var(--color-border)] focus:outline-none p-2 rounded-sm transition duration-150 placeholder:text-gray-600 relative z-[1]" // Keep z-[1]
        />
      )}
      {/* The ::before pseudo-element (z-index 0) will be styled via CSS for the animation */}
    </div>
  );
};

// Section component (no changes)
const DetailSection = ({ title, children }) => (
  <motion.div
    className="bg-gray-900/30 border border-[var(--color-border)] rounded-md p-4 md:p-5"
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay: 0.1 }}
  >
    <h3 className="text-lg font-semibold font-[var(--font-display)] text-[var(--color-neon-pink)] mb-3 border-b border-[var(--color-neon-pink)]/30 pb-2">
      {title}
    </h3>
    <div className="space-y-4">{children}</div>
  </motion.div>
);

function CharacterDetailPage() {
  const { novelId, characterId } = useParams();
  const { authState } = useAuth();
  const navigate = useNavigate();

  // State for form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    role: '',
    appearance: '',
    backstory: '',
    personality: '',
    goals: '',
    notes: ''
  });
  const [originalName, setOriginalName] = useState('');

  // State for loading, saving, errors
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // State for delete confirmation
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Fetch Character Data (logic remains the same)
  useEffect(() => {
    const fetchCharacter = async () => {
      // ... fetch logic ...
      if (!novelId || !characterId || !authState.token) {
        setError('Invalid request parameters or not authenticated.');
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
          `${backendUrl}/api/novels/${novelId}/characters/${characterId}`,
          config
        );
        const charData = response.data;
        setFormData({
          name: charData.name || '',
          description: charData.description || '',
          role: charData.role || '',
          appearance: charData.appearance || '',
          backstory: charData.backstory || '',
          personality: charData.personality || '',
          goals: charData.goals || '',
          notes: charData.notes || ''
        });
        setOriginalName(charData.name || 'Character');
      } catch (err) {
        console.error('Error fetching character details:', err);
        setError(
          err.response?.data?.message || 'Failed to load character details.'
        );
        if (err.response?.status === 404 || err.response?.status === 401) {
          navigate(`/workspace/novel/${novelId}/characters`, { replace: true });
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchCharacter();
  }, [novelId, characterId, authState.token, navigate]);

  // Handle Input Change (logic remains the same)
  const handleChange = (e) => {
    // ... change logic ...
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setSaveSuccess(false);
  };

  // Handle Save (Update) (logic remains the same)
  const handleSave = async (e) => {
    // ... save logic ...
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Character name is required.');
      return;
    }
    setIsSaving(true);
    setError('');
    setSaveSuccess(false);
    const config = { headers: { Authorization: `Bearer ${authState.token}` } };
    try {
      const response = await axios.put(
        `${backendUrl}/api/novels/${novelId}/characters/${characterId}`,
        formData,
        config
      );
      const updatedData = response.data;
      setFormData({
        name: updatedData.name || '',
        description: updatedData.description || '',
        role: updatedData.role || '',
        appearance: updatedData.appearance || '',
        backstory: updatedData.backstory || '',
        personality: updatedData.personality || '',
        goals: updatedData.goals || '',
        notes: updatedData.notes || ''
      });
      setOriginalName(updatedData.name);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving character:', err);
      setError(err.response?.data?.message || 'Failed to save character.');
    } finally {
      setIsSaving(false);
    }
  };

  // --- Delete Handlers (logic remains the same) ---
  const handleDeleteClick = () => {
    setShowConfirmModal(true);
  };
  const confirmDeletion = async () => {
    // ... delete logic ...
    setShowConfirmModal(false);
    setError('');
    try {
      const config = {
        headers: { Authorization: `Bearer ${authState.token}` }
      };
      await axios.delete(
        `${backendUrl}/api/novels/${novelId}/characters/${characterId}`,
        config
      );
      navigate(`/workspace/novel/${novelId}/characters`);
    } catch (err) {
      console.error('Error deleting character:', err);
      setError(err.response?.data?.message || 'Failed to delete character.');
    }
  };
  const cancelDeletion = () => {
    setShowConfirmModal(false);
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="p-6 md:p-8 h-full flex justify-center items-center">
        <SpinnerIcon className="animate-spin h-8 w-8 text-[var(--color-neon-cyan)]" />
      </div>
    );
  }

  // Error State
  if (error && !isLoading) {
    return (
      <div className="p-6 md:p-8">
        <Link
          to={`/workspace/novel/${novelId}/characters`}
          className="inline-flex items-center text-sm text-[var(--color-neon-cyan)] hover:underline mb-4"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-1" /> Back to Characters
        </Link>
        <div className="mt-10 text-center text-red-500 bg-red-900/50 p-4 rounded">
          {error}
        </div>
      </div>
    );
  }

  // Render Detail Page Form with New Design
  return (
    <div className="p-6 md:p-8 h-full overflow-y-auto">
      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={cancelDeletion}
        onConfirm={confirmDeletion}
        title="Confirm Character Deletion"
        message={`Are you sure you want to permanently delete the character "${
          formData.name || originalName
        }"? This action cannot be undone.`}
      />
      {/* Back Link */}
      <Link
        to={`/workspace/novel/${novelId}/characters`}
        className="inline-flex items-center text-sm text-[var(--color-text-muted)] hover:text-[var(--color-neon-cyan)] mb-4 transition-colors group"
      >
        <ArrowLeftIcon className="w-4 h-4 mr-1 transition-transform group-hover:-translate-x-1" />
        Back to Characters List
      </Link>
      {/* --- Form Starts Here --- */}
      <form id="character-edit-form" onSubmit={handleSave} autoComplete="off">
        {/* Top Header Section */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* ---> CHANGE START <--- */}
          {/* Pass sr-only class to visually hide labels for Name and Role fields */}
          <FormField
            id="name"
            label="Character Name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Character Name"
            required
            className="[&_input]:w-full [&_input]:bg-transparent [&_input]:text-3xl md:[&_input]:text-4xl [&_input]:font-bold [&_input]:font-[var(--font-display)] [&_input]:text-[var(--color-text-heading)] [&_input]:focus:outline-none [&_input]:border-b-2 [&_input]:border-transparent focus-within:[&_input]:border-[var(--color-neon-cyan)] [&_input]:transition [&_input]:duration-200 [&_input]:py-1 [&_input]:mb-1 [&_input]:placeholder:text-[var(--color-border)]"
            labelClassName="sr-only" // Visually hide label
          />
          <FormField
            id="role"
            label="Character Role"
            value={formData.role}
            onChange={handleChange}
            placeholder="Character Role (e.g., Protagonist)"
            className="[&_input]:w-full md:[&_input]:w-1/2 [&_input]:bg-transparent [&_input]:text-sm [&_input]:font-mono [&_input]:text-[var(--color-text-muted)] [&_input]:focus:outline-none [&_input]:border-b [&_input]:border-transparent focus-within:[&_input]:border-[var(--color-border)] [&_input]:focus:text-[var(--color-text-base)] [&_input]:transition [&_input]:duration-200 [&_input]:py-0.5 [&_input]:placeholder:text-gray-600"
            labelClassName="sr-only" // Visually hide label
          />
          {/* ---> CHANGE END <--- */}
        </motion.div>

        {/* Display Save Success/Error Messages */}
        <AnimatePresence>
          {/* ... messages ... */}
          {saveSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 text-center text-green-400 bg-green-900/50 p-2 rounded text-sm"
            >
              {' '}
              Character saved successfully!{' '}
            </motion.div>
          )}
        </AnimatePresence>
        {error && !saveSuccess && (
          <div className="mb-4 text-center text-red-500 bg-red-900/50 p-2 rounded text-sm">
            {error}
          </div>
        )}

        {/* Main Content Sections Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Sections using FormField */}
            <DetailSection title="Core Identity">
              <FormField
                id="description"
                label="Brief Description / Tagline"
                value={formData.description}
                onChange={handleChange}
                placeholder="A short summary..."
                type="textarea"
                rows={3}
              />
              <FormField
                id="personality"
                label="Personality Traits"
                value={formData.personality}
                onChange={handleChange}
                placeholder="Quirks, strengths, weaknesses..."
                type="textarea"
                rows={5}
              />
            </DetailSection>

            <DetailSection title="Background">
              <FormField
                id="backstory"
                label="Backstory / History"
                value={formData.backstory}
                onChange={handleChange}
                placeholder="Relevant history..."
                type="textarea"
                rows={8}
              />
            </DetailSection>
          </div>
          {/* Right Column */}
          <div className="space-y-6">
            {/* Sections using FormField */}
            <DetailSection title="Physicality & Motivation">
              <FormField
                id="appearance"
                label="Appearance"
                value={formData.appearance}
                onChange={handleChange}
                placeholder="Physical details, clothing..."
                type="textarea"
                rows={5}
              />
              <FormField
                id="goals"
                label="Goals / Motivation"
                value={formData.goals}
                onChange={handleChange}
                placeholder="What drives them?"
                type="textarea"
                rows={4}
              />
            </DetailSection>

            <DetailSection title="Additional Notes">
              <FormField
                id="notes"
                label="General Notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Anything else..."
                type="textarea"
                rows={8}
              />
            </DetailSection>
          </div>
        </div>

        {/* --- Action Buttons Footer --- */}
        <motion.div
          className="mt-8 pt-4 border-t border-[var(--color-border)] flex justify-end items-center space-x-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {/* Buttons */}
          <motion.button
            type="button"
            onClick={handleDeleteClick}
            className="btn bg-red-600 hover:bg-red-700 text-white text-xs px-4 py-2 rounded flex items-center space-x-1.5"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={isSaving}
          >
            <TrashIcon className="w-4 h-4" />
            <span>Delete Character</span>
          </motion.button>
          <motion.button
            type="submit"
            className="btn-primary-cyan text-sm px-6 py-2 flex items-center justify-center space-x-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={isSaving}
          >
            {isSaving && (
              <SpinnerIcon className="animate-spin h-4 w-4 mr-1 text-black" />
            )}
            <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
          </motion.button>
        </motion.div>
      </form>{' '}
      {/* --- Form Ends Here --- */}
    </div>
  );
}

export default CharacterDetailPage;
