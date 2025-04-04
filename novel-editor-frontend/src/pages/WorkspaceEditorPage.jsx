// src/pages/WorkspaceEditorPage.jsx
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
// --- Import the new editor component ---
import NovelEditor from '../components/NovelEditor'; // Adjust path if needed

function WorkspaceEditorPage() {

  const { novelId } = useParams();
  // Chapter list logic (remains the same)
  const [chapters, setChapters] = useState([]);

   // Basic error handling if novelId is missing
  if (!novelId) {
      return <div className="p-6 text-center text-red-500">Error: Novel ID not found in URL.</div>;
  }

  return (
    <div className="flex h-full">
       {/* Chapter List Sidebar (remains the same) */}
       <aside className="w-60 h-full flex-shrink-0 border-r border-[var(--color-border)] bg-gray-900/10 overflow-y-auto flex flex-col">
           <div className="p-3 border-b border-[var(--color-border)] flex-shrink-0">
                <h2 className="font-semibold text-[var(--color-neon-pink)] mb-2 uppercase text-sm tracking-wider">Chapters</h2>
                <button className="w-full btn-primary-pink text-xs py-1">+ Add Chapter +</button>
            </div>
            <nav className="flex-grow p-2 space-y-1 font-mono text-sm">
                 {chapters.map((chap) => ( <a key={chap.id} href="#" className="block px-3 py-1.5 text-gray-300 rounded hover:bg-[var(--color-content-bg)] hover:text-[var(--color-neon-cyan)] focus:bg-[var(--color-content-bg)] focus:text-[var(--color-neon-cyan)] focus:outline-none transition truncate"> {chap.title} </a> ))}
            </nav>
       </aside>

       {/* --- Editor Area --- */}
       {/* Use flex-grow and overflow-hidden to manage size */}
       <div className="flex-grow h-full flex flex-col overflow-hidden bg-[var(--color-content-bg)]">

           {/* --- Render the Slate Editor Component --- */}
           {/* flex-grow allows it to fill remaining vertical space */}
           <div className="flex-grow overflow-hidden"> {/* Added overflow-hidden here */}
              <NovelEditor novelId={novelId}/>
           </div>
           {/* --- End Editor Component --- */}
       </div>
       {/* --- End Editor Area --- */}
    </div>
  );
}
export default WorkspaceEditorPage;