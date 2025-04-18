// ---> FILE: ./novel-editor-frontend/src/pages/WorkbenchPage.jsx <---
// src/pages/WorkbenchPage.jsx
import React from 'react';
import { useParams, Link } from 'react-router-dom';
// Example icons (replace with real ones or improve)
// ---> CHANGE START <---
import { PeopleIcon, GlobeIcon, ListIcon, NoteIcon } from '../components/Icons'; // Assuming Icons.jsx exists
// ---> CHANGE END <---

function WorkbenchPage() {
  const { novelId } = useParams(); // Get current novel ID

  // Define the tools/sections available in the workbench
  const workbenchItems = [
    // ---> CHANGE START <---
    {
      name: 'Characters',
      path: `/workspace/novel/${novelId}/characters`,
      icon: PeopleIcon,
      description: "Manage your novel's characters."
    }
    // ---> CHANGE END <---
    // { name: "World", path: `/workspace/novel/${novelId}/world`, icon: GlobeIcon, description: "Build and explore your story world." },
    // { name: "Outline", path: `/workspace/novel/${novelId}/outline`, icon: ListIcon, description: "Structure your plot and scenes." },
    // { name: "Notes", path: `/workspace/novel/${novelId}/notes`, icon: NoteIcon, description: "Keep track of research and ideas." },
    // Add more tools here later, commenting out unused ones for now
  ];

  return (
    <div className="p-6 md:p-8 h-full overflow-y-auto">
      <h2 className="text-3xl font-bold mb-8 text-[var(--color-text-heading)]">
        Workbench
      </h2>
      <p className="text-lg text-[var(--color-text-muted)] mb-8 font-[var(--font-body)]">
        Access your novel's planning and organizational tools here.
      </p>

      {/* Grid layout for the tools */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {workbenchItems.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            className="block p-6 rounded border border-[var(--color-border)] bg-gray-900/40 hover:border-[var(--color-neon-cyan)] hover:bg-gray-900/70 transition duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-neon-cyan)] focus:ring-offset-2 focus:ring-offset-[var(--color-cyber-bg)]"
          >
            <div className="flex items-center mb-3">
              <item.icon className="w-6 h-6 mr-3 text-[var(--color-neon-cyan)]" />
              <h3 className="text-xl font-semibold font-[var(--font-display)] text-[var(--color-text-base)]">
                {item.name}
              </h3>
            </div>
            <p className="text-sm text-[var(--color-text-muted)] font-[var(--font-body)]">
              {item.description}
            </p>
          </Link>
        ))}
        {/* Placeholder for future sections */}
        <div className=" p-6 rounded border border-dashed border-[var(--color-border)] bg-gray-900/20 flex items-center justify-center text-center">
          <p className="text-sm text-[var(--color-text-muted)] font-mono">
            More tools coming soon... (World, Outline, Notes)
          </p>
        </div>
      </div>
    </div>
  );
}

export default WorkbenchPage;
