// ---> FILE: ./novel-editor-frontend/src/components/CharacterFormModal.jsx <---
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloseIcon, SpinnerIcon } from './Icons'; // Assuming Icons.jsx exists

// Animation variants for the modal
const modalBackdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.2, delay: 0.1 } }
};

const modalContentVariants = {
  hidden: { y: 50, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 300, damping: 25, duration: 0.3 }
  },
  exit: { y: 50, opacity: 0, transition: { duration: 0.2 } }
};

// Enhanced FormField helper - DEFINED LOCALLY within this component
// Includes focus state management for animated border effect
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
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  return (
    // Apply relative positioning and the conditional class to the wrapper
    <div
      className={`${className} relative ${
        isFocused ? 'animated-border-active' : ''
      }`}
    >
      <label
        htmlFor={id}
        // Use the more techy label style from Detail Page
        className={`form-label text-xs uppercase font-mono text-[var(--color-text-muted)] mb-1 block tracking-wider relative z-[2] pointer-events-none ${labelClassName}`}
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {type === 'textarea' ? (
        <textarea
          id={id}
          name={id}
          value={value}
          onChange={onChange}
          onFocus={handleFocus} // Add focus handler
          onBlur={handleBlur} // Add blur handler
          placeholder={placeholder}
          rows={rows}
          // Use standard input styling, remove default focus, add z-index
          className="form-input w-full text-sm bg-[var(--color-content-bg)] border border-[var(--color-border)] focus:outline-none resize-none p-2 rounded-sm transition duration-150 placeholder:text-gray-600 overflow-y-auto relative z-[1]"
        />
      ) : (
        <input
          type={type}
          id={id}
          name={id}
          value={value}
          onChange={onChange}
          onFocus={handleFocus} // Add focus handler
          onBlur={handleBlur} // Add blur handler
          placeholder={placeholder}
          required={required}
          // Use standard input styling, remove default focus, add z-index
          className="form-input w-full text-sm bg-[var(--color-content-bg)] border border-[var(--color-border)] focus:outline-none p-2 rounded-sm transition duration-150 placeholder:text-gray-600 relative z-[1]"
        />
      )}
      {/* The ::before pseudo-element (z-index 0) will be styled via CSS */}
    </div>
  );
};

function CharacterFormModal({
  isOpen,
  onClose,
  onSave,
  characterData,
  isSaving,
  error
}) {
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

  const isEditMode = !!characterData?._id;

  // Sync form data
  useEffect(() => {
    if (isEditMode && characterData) {
      setFormData({
        name: characterData.name || '',
        description: characterData.description || '',
        role: characterData.role || '',
        appearance: characterData.appearance || '',
        backstory: characterData.backstory || '',
        personality: characterData.personality || '',
        goals: characterData.goals || '',
        notes: characterData.notes || ''
      });
    } else {
      // Reset form for creation mode or if data is cleared
      setFormData({
        name: '',
        description: '',
        role: '',
        appearance: '',
        backstory: '',
        personality: '',
        goals: '',
        notes: ''
      });
    }
  }, [characterData, isEditMode, isOpen]); // Also depends on isOpen to reset on open

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      // Basic client-side validation, backend handles more
      alert('Character name is required.');
      return;
    }
    onSave(formData, isEditMode ? characterData._id : null);
  };

  // Handle Escape key press to close modal
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        // Backdrop: Keep dark overlay and blur
        <motion.div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[5000] p-4" // Increased z-index from 990
          variants={modalBackdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={onClose} // Close on backdrop click
        >
          {/* Modal Content Container */}
          {/* ---> CHANGE START <--- */}
          {/* Change max-h- to control height - using arbitrary value syntax */}
          <motion.div
            className="bg-[var(--color-content-bg)] border border-[var(--color-neon-cyan)] rounded-lg shadow-[0_0_15px_theme(colors.neon-cyan/30%)] w-full max-w-2xl flex flex-col max-h-[65vh]" // Changed max-h- from 90vh to 65vh
            variants={modalContentVariants}
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
          >
            {/* ---> CHANGE END <--- */}
            {/* Header: Keep cyan text, display font */}
            <div className="flex justify-between items-center px-6 py-3 border-b border-[var(--color-border)] flex-shrink-0">
              <h2 className="text-xl font-bold font-[var(--font-display)] text-[var(--color-neon-cyan)]">
                {isEditMode
                  ? `Edit Character: ${characterData?.name || ''}`
                  : 'Create New Character'}
              </h2>
              <motion.button
                onClick={onClose}
                // Use pink accent on hover for close button
                className="text-[var(--color-text-muted)] hover:text-[var(--color-neon-pink)]"
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
              >
                <CloseIcon className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Body: Scrollable Form */}
            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-4 overflow-y-auto flex-grow"
            >
              {error && ( // Display error passed via prop
                <p className="text-red-400 bg-red-900/50 p-2 rounded text-sm text-center border border-red-600">
                  {error}
                </p>
              )}
              {/* Use FormField component which now includes focus animation handling */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  id="name"
                  label="Name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Character's full name"
                  required
                />
                <FormField
                  id="role"
                  label="Role"
                  value={formData.role}
                  onChange={handleChange}
                  placeholder="e.g., Protagonist, Mentor, Villain"
                />
              </div>
              <FormField
                id="description"
                label="Brief Description / Tagline"
                value={formData.description}
                onChange={handleChange}
                placeholder="A short summary of the character"
                type="textarea"
                rows={2}
              />
              <FormField
                id="appearance"
                label="Appearance"
                value={formData.appearance}
                onChange={handleChange}
                placeholder="Physical description, clothing, mannerisms"
                type="textarea"
                rows={4}
              />
              <FormField
                id="personality"
                label="Personality"
                value={formData.personality}
                onChange={handleChange}
                placeholder="Traits, quirks, strengths, weaknesses"
                type="textarea"
                rows={4}
              />
              <FormField
                id="backstory"
                label="Backstory"
                value={formData.backstory}
                onChange={handleChange}
                placeholder="Relevant history and background"
                type="textarea"
                rows={5}
              />
              <FormField
                id="goals"
                label="Goals / Motivation"
                value={formData.goals}
                onChange={handleChange}
                placeholder="What drives the character?"
                type="textarea"
                rows={3}
              />
              <FormField
                id="notes"
                label="Additional Notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Any other relevant information"
                type="textarea"
                rows={4}
              />
            </form>

            {/* Footer: Darker bg, themed buttons */}
            <div className="px-6 py-3 bg-black/30 border-t border-[var(--color-border)] flex justify-end space-x-3 flex-shrink-0">
              <motion.button
                type="button" // Important: type="button"
                onClick={onClose}
                // Use secondary button style (darker) - ensure btn-secondary-dark exists or adjust
                className="btn btn-secondary-dark text-sm px-4 py-1.5"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={isSaving}
              >
                Cancel
              </motion.button>
              <motion.button
                type="submit" // Submits the form via the onSubmit handler attached to the <form> tag
                onClick={handleSubmit} // Can also call handleSubmit directly
                // Use primary cyan button style
                className="btn btn-primary-cyan text-sm px-5 py-1.5 flex items-center justify-center space-x-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={isSaving}
              >
                {isSaving && (
                  <SpinnerIcon className="animate-spin h-4 w-4 mr-2 text-black" />
                )}
                <span>
                  {isSaving
                    ? 'Saving...'
                    : isEditMode
                    ? 'Save Changes'
                    : 'Create Character'}
                </span>
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default CharacterFormModal;
