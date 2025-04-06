// ---> FILE: ./novel-editor-frontend/src/components/PageTransitionWrapper.jsx <---
import React from 'react';
import { motion } from 'framer-motion';

// Define cyberpunk-themed animation variants (keep variants as they were)
const cyberpunkVariants = {
  initial: {
    opacity: 0,
    clipPath: 'polygon(50% 50%, 50% 50%, 50% 50%, 50% 50%)'
  },
  animate: {
    opacity: 1,
    clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0% 100%)',
    transition: {
      duration: 0.5,
      ease: [0.83, 0, 0.17, 1]
    }
  },
  exit: {
    opacity: 0,
    clipPath: 'polygon(50% 0, 50% 0, 50% 100%, 50% 100%)',
    transition: {
      duration: 0.3,
      ease: [0.83, 0, 0.17, 1]
    }
  }
};

const fadeVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.4, ease: 'easeInOut' } },
  exit: { opacity: 0, transition: { duration: 0.3, ease: 'easeInOut' } }
};

// ---> CHANGE START <---
// Add a 'mode' prop to control positioning
const PageTransitionWrapper = ({ children, mode = 'fixed' }) => {
  const wrapperStyle =
    mode === 'fixed'
      ? {
          position: 'fixed', // Covers entire viewport
          inset: 0,
          width: '100%',
          height: '100%', // Or '100vh'
          zIndex: 50 // High z-index for standalone pages
          // Background applied to inner div now
        }
      : {
          position: 'absolute', // Covers parent container (the <main> tag)
          inset: 0,
          width: '100%',
          height: '100%',
          zIndex: 5 // Lower z-index within the layout
          // Background applied to inner div now
        };
  // ---> CHANGE END <---

  return (
    <motion.div
      variants={cyberpunkVariants} // Use cyberpunk or fade variants
      initial="initial"
      animate="animate"
      exit="exit"
      style={wrapperStyle} // Apply dynamic style
    >
      {/* Apply default page bg and scroll to the inner div */}
      {/* Ensure this inner div allows content to take full height */}
      <div className="w-full h-full bg-[var(--color-cyber-bg)] overflow-y-auto">
        {children}
      </div>
    </motion.div>
  );
};

export default PageTransitionWrapper;
