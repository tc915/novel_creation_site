// ---> FILE: ./novel-editor-frontend/src/components/WorkspaceLayout.jsx <---

import React, { useEffect, useState, useCallback } from 'react';
import {
  Link,
  Outlet,
  useLocation,
  useNavigate,
  useMatch
} from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

// Icons
const HomeIcon = () => <span>🏠</span>;
const EditIcon = () => <span>📝</span>;
const WorkbenchIcon = () => <span>🛠️</span>;
const SettingsIcon = () => <span>⚙️</span>;
// ---> CHANGE START <---
const SaveIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-4 h-4 mr-1"
  >
    {' '}
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.5 3.75V16.5L12 14.25L7.5 16.5V3.75M16.5 3.75H7.5C6.4 3.75 5.5 4.65 5.5 5.75V20.25L12 17.25L18.5 20.25V5.75C18.5 4.65 17.6 3.75 16.5 3.75Z"
    />{' '}
  </svg>
); // Simple save icon
// ---> CHANGE END <---

function WorkspaceLayout() {
  const { logout, authState } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const novelRouteMatch = useMatch('/workspace/novel/:novelId/*');
  const novelId = novelRouteMatch?.params?.novelId;

  const [currentNovel, setCurrentNovel] = useState(null);
  const [isLoadingNovel, setIsLoadingNovel] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const backendUrl = 'http://localhost:5001';

  // ---> CHANGE START <---
  // State to trigger saves in child components
  const [saveTrigger, setSaveTrigger] = useState(0);

  // Function called by the header Save button
  const triggerSave = () => {
    console.log('Header Save Triggered');
    setSaveTrigger((count) => count + 1); // Increment to trigger useEffect in children
  };
  // ---> CHANGE END <---

  // Callback to allow child routes to update the fetched novel data
  const updateCurrentNovelData = useCallback((updatedData) => {
    console.log(
      'WorkspaceLayout: Updating currentNovel state with:',
      updatedData
    );
    setCurrentNovel((prev) => ({ ...prev, ...updatedData }));
  }, []);

  // Wrap fetchNovel in useCallback
  const fetchNovel = useCallback(
    async (id) => {
      // Double check: Do not fetch if id is 'new' or invalid
      if (!id || id === 'new' || !authState.token) {
        console.log(
          `fetchNovel called with invalid id (${id}) or no token, returning.`
        );
        return;
      }

      console.log(`Layout fetching details for novel: ${id}`);
      setIsLoadingNovel(true);
      setFetchError('');
      try {
        const config = {
          headers: { Authorization: `Bearer ${authState.token}` }
        };
        const response = await axios.get(
          `${backendUrl}/api/novels/${id}`,
          config
        );
        setCurrentNovel(response.data);
        console.log('Fetched novel details:', response.data);
      } catch (err) {
        console.error('Error fetching novel details in Layout:', err);
        setFetchError(
          err.response?.data?.message || 'Failed to load novel details.'
        );
        setCurrentNovel(null);
        if (err.response?.status === 404 || err.response?.status === 401) {
          navigate('/workspace/novels', { replace: true });
        }
      } finally {
        setIsLoadingNovel(false);
      }
    },
    [authState.token, navigate]
  );

  // Effect to Fetch Novel Details or handle 'new' case
  useEffect(() => {
    if (novelId && novelId !== 'new') {
      fetchNovel(novelId);
    } else if (novelId === 'new') {
      console.log("Layout detected 'new' novelId, clearing state.");
      setCurrentNovel(null);
      setFetchError('');
      setIsLoadingNovel(false);
    } else {
      setCurrentNovel(null);
      setFetchError('');
      setIsLoadingNovel(false);
    }
  }, [novelId, fetchNovel]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Nav Items
  const navItems = [
    {
      path: '/workspace/novels',
      name: 'Novels',
      icon: HomeIcon,
      show: 'always'
    },
    {
      path: `/workspace/novel/${novelId}/editor`,
      name: 'Editor',
      icon: EditIcon,
      show: 'novelSelected'
    },
    {
      path: `/workspace/novel/${novelId}/workbench`,
      name: 'Workbench',
      icon: WorkbenchIcon,
      show: 'novelSelected'
    },
    {
      path: `/workspace/novel/${novelId}/details`,
      name: 'Details',
      icon: SettingsIcon,
      show: 'novelSelected'
    }
  ];

  return (
    <div className="h-screen flex flex-col bg-[var(--color-cyber-bg)] text-[var(--color-text-base)]">
      {/* Header */}
      <header className="flex-shrink-0 bg-gray-900 border-b border-[var(--color-border)] p-3 flex justify-between items-center z-20">
        <h1 className="text-lg text-[var(--color-neon-cyan)] font-[var(--font-display)] truncate">
          {novelId === 'new'
            ? 'Create New Novel'
            : novelId
            ? isLoadingNovel
              ? 'Loading...'
              : currentNovel?.title || 'Novel Details'
            : 'Novel Workspace'}
        </h1>
        <div className="flex items-center space-x-2">
          <span className="text-xs mr-3 font-mono text-[var(--color-text-muted)] hidden md:inline">
            {authState.user?.name || authState.user?.email}
          </span>
          {/* ---> CHANGE START <--- */}
          {/* Replace Details Link with Save Button */}
          {novelId && novelId !== 'new' && !isLoadingNovel && (
            <button
              onClick={triggerSave} // Call the trigger function
              className="btn-primary-cyan text-xs px-4 py-1.5 flex items-center" // Use button styles
              title="Save current view (Details or Chapter)"
            >
              <SaveIcon /> Save
            </button>
          )}
          {/* ---> CHANGE END <--- */}
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white text-xs px-3 py-1 ml-2 rounded hover:bg-red-700 transition font-[var(--font-display)]"
          >
            Log Out
          </button>
        </div>
      </header>

      {/* Main Area with Sidebar */}
      <div className="flex-grow flex overflow-hidden">
        {/* Sidebar Navigation */}
        <aside className="w-20 flex-shrink-0 bg-gray-900/50 border-r border-[var(--color-border)] p-2 flex flex-col items-center space-y-4 overflow-y-auto">
          {navItems.map((item) => {
            const isNovelContextReady =
              novelId && novelId !== 'new' && !isLoadingNovel;
            let isDisabled = false;
            let finalPath = item.path;
            if (item.show === 'novelSelected') {
              isDisabled = isLoadingNovel || novelId === 'new';
              finalPath = isNovelContextReady
                ? `/workspace/novel/${novelId}/${item.path.split('/').pop()}`
                : '#';
              if (!isNovelContextReady && novelId !== 'new') finalPath = '#';
              if (novelId === 'new') return null;
            }
            if (
              item.show === 'always' ||
              (item.show === 'novelSelected' && novelId && novelId !== 'new')
            ) {
              const isActive =
                location.pathname === item.path ||
                (location.pathname.startsWith(item.path) &&
                  item.path !== '/workspace/novels');
              return (
                <Link
                  key={item.name}
                  to={isDisabled ? '#' : finalPath}
                  title={item.name}
                  aria-disabled={isDisabled}
                  onClick={(e) => isDisabled && e.preventDefault()}
                  className={`flex flex-col items-center p-2 rounded-md w-full transition duration-200 ${
                    isActive
                      ? 'bg-[var(--color-neon-pink)] text-black'
                      : 'text-[var(--color-text-muted)] hover:bg-[var(--color-content-bg)] hover:text-[var(--color-neon-cyan)]'
                  } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {' '}
                  <item.icon className="w-5 h-5 mb-1" />{' '}
                  <span className="text-[0.75rem] font-mono uppercase">
                    {item.name}
                  </span>{' '}
                </Link>
              );
            }
            return null;
          })}
          <div className="flex-grow"></div>
          <Link
            to="/"
            title="Back to Landing"
            className="p-2 rounded-md w-full text-center text-[var(--color-text-muted)] hover:bg-[var(--color-content-bg)] hover:text-[var(--color-neon-cyan)]"
          >
            {' '}
            <span className="text-xl">‹</span>{' '}
          </Link>
        </aside>

        {/* Content Area */}
        <main className="flex-grow overflow-y-auto">
          {fetchError && (
            <div className="p-4 m-4 text-red-500">{fetchError}</div>
          )}
          {/* Pass saveTrigger down */}
          <Outlet
            context={{
              novelId,
              currentNovel,
              isLoadingNovel,
              updateCurrentNovelData,
              saveTrigger
            }}
          />
        </main>
      </div>
    </div>
  );
}

export default WorkspaceLayout;
