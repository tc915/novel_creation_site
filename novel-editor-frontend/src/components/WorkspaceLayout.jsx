// src/components/WorkspaceLayout.jsx
import React, { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate, useMatch } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Assuming path is correct
import axios from 'axios'; // Assuming axios is used for fetching title

// --- Updated Placeholder Icons ---
const HomeIcon = () => <span>🏠</span>; // Novels List
const EditIcon = () => <span>📝</span>; // Editor
const WorkbenchIcon = () => <span>🛠️</span>; // Workbench (Characters, World, etc.)
const SettingsIcon = () => <span>⚙️</span>; // Details
// Removed unused icons: PeopleIcon, GlobeIcon, ListIcon, NoteIcon
// --- End Icons ---

function WorkspaceLayout() {
  const { logout, authState } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if the current path matches a novel-specific route
  const novelRouteMatch = useMatch('/workspace/novel/:novelId/*');
  const novelId = novelRouteMatch?.params?.novelId;

  // State for Current Novel Details (keep for title fetching)
  const [currentNovel, setCurrentNovel] = useState(null);
  const [isLoadingNovel, setIsLoadingNovel] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const backendUrl = 'http://localhost:5001'; // Use env variable ideally

  // Effect to Fetch Novel Details (remains same as your provided version)
  useEffect(() => {
    let isMounted = true; // Prevent state updates on unmounted component
    // Clear previous data/error when novelId changes or becomes null
    setCurrentNovel(null);
    setFetchError('');

    if (novelId && authState.token) {
      const fetchNovel = async () => {
        console.log(`Layout fetching details for novel: ${novelId}`);
        setIsLoadingNovel(true);
        try {
          const config = { headers: { Authorization: `Bearer ${authState.token}` } };
          const response = await axios.get(`${backendUrl}/api/novels/${novelId}`, config);
          if (isMounted) setCurrentNovel(response.data);
          console.log("Fetched novel details:", response.data);
        } catch (err) {
          if (isMounted) {
            console.error("Error fetching novel details in Layout:", err);
            setFetchError(err.response?.data?.message || 'Failed to load novel details.');
            setCurrentNovel(null);
            if (err.response?.status === 404 || err.response?.status === 401) {
                 navigate('/workspace/novels', { replace: true });
            }
          }
        } finally {
          if (isMounted) setIsLoadingNovel(false);
        }
      };
      fetchNovel();
    } else {
      setIsLoadingNovel(false);
    }
    return () => { isMounted = false; }; // Cleanup on unmount
  }, [novelId, authState.token, navigate]);


  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // --- Define UPDATED Nav Items ---
  const navItems = [
    // 1. Novels List (Always Shown)
    { path: '/workspace/novels', name: 'Novels', icon: HomeIcon, show: 'always' },
    // 2. Editor (Novel Selected)
    { path: `/workspace/novel/${novelId}/editor`, name: 'Editor', icon: EditIcon, show: 'novelSelected' },
    // 3. Workbench (Novel Selected - groups Characters, World, etc.)
    { path: `/workspace/novel/${novelId}/workbench`, name: 'Workbench', icon: WorkbenchIcon, show: 'novelSelected' },
    // 4. Details (Novel Selected)
    { path: `/workspace/novel/${novelId}/details`, name: 'Details', icon: SettingsIcon, show: 'novelSelected'},
    // REMOVED: Individual links for Characters, World, Outline, Notes
  ];
  // --- End Nav Items ---

  return (
    <div className="h-screen flex flex-col bg-[var(--color-cyber-bg)] text-[var(--color-text-base)]">
      {/* --- Header (using your provided styling) --- */}
      <header className="flex-shrink-0 bg-gray-900 border-b border-[var(--color-border)] p-3 flex justify-between items-center z-20">
        <h1 className="text-lg font-semibold text-[var(--color-neon-cyan)] font-[var(--font-display)] truncate">
           {novelId ? (isLoadingNovel ? 'Loading...' : (currentNovel?.title || 'Novel Details')) : 'Novel Workspace'}
        </h1>
        <div className="flex items-center space-x-2">
          <span className="text-xs mr-3 font-mono text-[var(--color-text-muted)] hidden md:inline">
            {authState.user?.name || authState.user?.email}
          </span>
          {/* Conditional Header Buttons (using your provided styling) */}
          {novelId && !isLoadingNovel && ( // Show only if novel selected and loaded
            <>
               <button className="btn-primary-cyan text-[0.75rem] mr-3 px-5 py-1.25" title="Save Changes (Not Implemented)">Save</button>
               <Link
                  to={`/workspace/novel/${novelId}/details`}
                  className="btn-primary-pink bg-gray-600 hover:bg-gray-700 rounded-sm text-white text-xs px-3 py-1.5" // Using your classes
                  title="Edit Novel Details"
               >
                 Novel Details
               </Link>
            </>
          )}
          <button onClick={handleLogout} className="bg-red-600 text-white text-xs px-3 py-1 ml-2 rounded font-semibold hover:bg-red-700 transition font-[var(--font-display)]">
            Log Out
          </button>
        </div>
      </header>

      {/* --- Main Area with Sidebar Navigation --- */}
      <div className="flex-grow flex overflow-hidden">
        {/* --- Vertical Sidebar Navigation (using your provided styling) --- */}
        <aside className="w-20 flex-shrink-0 bg-gray-900/50 border-r border-[var(--color-border)] p-2 flex flex-col items-center space-y-4 overflow-y-auto">
          {navItems.map((item) => {
            // Conditional Rendering based on 'show' and novelId
            if (item.show === 'always' || (item.show === 'novelSelected' && novelId)) {
               // Check active state (simplified check)
               const isActive = location.pathname === item.path || (location.pathname.startsWith(item.path) && item.path !== '/workspace/novels');
               const isDisabled = item.show === 'novelSelected' && isLoadingNovel;
               return (
                  <Link
                      key={item.name}
                      to={isDisabled ? '#' : item.path}
                      title={item.name}
                      aria-disabled={isDisabled}
                      onClick={(e) => isDisabled && e.preventDefault()}
                      // Using your className structure
                      className={`flex flex-col items-center p-2 rounded-md w-full transition duration-200 ${ isActive ? 'bg-[var(--color-neon-pink)] text-black' : 'text-[var(--color-text-muted)] hover:bg-[var(--color-content-bg)] hover:text-[var(--color-neon-cyan)]'} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                      <item.icon className="w-5 h-5 mb-1" />
                      {/* Using your text size */}
                      <span className="text-[0.75rem] font-mono uppercase">{item.name}</span>
                  </Link>
               );
            }
            return null;
          })}
          <div className="flex-grow"></div> {/* Spacer */}
           <Link to="/" title="Back to Landing" className="p-2 rounded-md w-full text-center text-[var(--color-text-muted)] hover:bg-[var(--color-content-bg)] hover:text-[var(--color-neon-cyan)]">
             <span className="text-xl">‹</span>
            </Link>
        </aside>

        {/* --- Content Area --- */}
        <main className="flex-grow overflow-y-auto">
          {fetchError && <div className="p-4 m-4">{fetchError}</div>}
          {/* Render child route components - pass context */}
          <Outlet context={{ novelId, currentNovel, isLoadingNovel }} />
        </main>
      </div>
    </div>
  );
}

// Define helpers if not externalized
// const HomeIcon = ... etc

export default WorkspaceLayout;