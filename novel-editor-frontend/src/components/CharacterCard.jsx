// ---> FILE: ./novel-editor-frontend/src/components/CharacterCard.jsx <---
// src/components/CharacterCard.jsx
import React from 'react';
import { motion } from 'framer-motion';
// ---> CHANGE START <---
import { TrashIcon /* Removed PencilIcon */ } from './Icons'; // Assuming Icons.jsx exists
import { useNavigate, useParams } from 'react-router-dom'; // Import navigation hooks
// ---> CHANGE END <---

function CharacterCard({ character, onDelete }) {
  // Removed onEdit prop

  // ---> CHANGE START <---
  const navigate = useNavigate();
  const { novelId } = useParams(); // Get novelId to build the link

  const handleNavigate = () => {
    if (novelId && character?._id) {
      navigate(`/workspace/novel/${novelId}/characters/${character._id}`);
    } else {
      console.error('Missing novelId or character._id for navigation');
    }
  };
  // ---> CHANGE END <---

  // Animation variants for the card
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: 'easeOut' }
    }
  };

  return (
    // ---> CHANGE START <---
    // Added cursor-pointer to the main div
    <motion.div
      className="relative group bg-gray-900/60 border border-[var(--color-border)] rounded-lg shadow-lg hover:border-[var(--color-neon-pink)] transition-all duration-200 flex flex-col p-4 min-h-[160px] cursor-pointer" // Added cursor-pointer
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -4 }}
      layout
      onClick={handleNavigate} // Add onClick handler here
      // Use onKeyDown for accessibility (e.g., Enter key)
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') handleNavigate();
      }}
      tabIndex={0} // Make it focusable
    >
      {/* ---> CHANGE END <--- */}

      {/* Content Section */}
      <div className="flex-grow flex flex-col justify-between h-full">
        <div>
          <h3 className="text-lg font-bold font-[var(--font-display)] text-[var(--color-text-heading)] truncate mb-1 pointer-events-none">
            {' '}
            {/* Added pointer-events-none */}
            {character.name || 'Unnamed Character'}
          </h3>
          {character.role && (
            <p className="text-xs uppercase font-mono text-[var(--color-neon-cyan)] mb-2 tracking-wider pointer-events-none">
              {' '}
              {/* Added pointer-events-none */}
              {character.role}
            </p>
          )}
          <p className="text-sm text-[var(--color-text-base)] line-clamp-3 pointer-events-none">
            {' '}
            {/* Added pointer-events-none */}
            {character.description || (
              <span className="italic text-[var(--color-text-muted)]">
                No description provided.
              </span>
            )}
          </p>
        </div>
        <div className="mt-2"></div>
      </div>

      {/* Action Buttons - Appear on Hover */}
      {/* ---> CHANGE START <--- */}
      {/* Removed Edit button, kept Delete */}
      <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200">
        {/* <motion.button ... edit button removed ... /> */}
        <motion.button
          // Pass novel title to initiator function for modal message
          onClick={(e) => {
            e.stopPropagation(); // Prevent card navigation
            onDelete(character._id, character.name);
          }}
          className="p-1.5 rounded bg-gray-800/70 text-red-500 hover:bg-red-500 hover:text-white"
          title="Delete Character"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <TrashIcon className="w-3.5 h-3.5" />
        </motion.button>
      </div>
      {/* ---> CHANGE END <--- */}
    </motion.div>
  );
}

export default CharacterCard;
