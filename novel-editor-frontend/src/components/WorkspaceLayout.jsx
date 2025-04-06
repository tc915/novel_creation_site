// ---> FILE: ./novel-editor-frontend/src/components/WorkspaceLayout.jsx <---
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Link,
  Outlet, // Keep Outlet
  useLocation,
  useNavigate,
  useMatch
} from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import PageTransitionWrapper from './PageTransitionWrapper'; // Import the wrapper
// Assuming Icons.jsx exists and exports these icons
import {
  HomeIcon,
  EditIcon,
  WorkbenchIcon,
  SettingsIcon,
  SaveIcon,
  PeopleIcon,
  ArrowLeftIcon
} from './Icons';

function WorkspaceLayout() {
  const { logout, authState } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const novelRouteMatch = useMatch('/workspace/novel/:novelId/*');
  const novelId = novelRouteMatch?.params?.novelId;

  const [currentNovel, setCurrentNovel] = useState(null);
  const [isLoadingNovel, setIsLoadingNovel] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [saveTrigger, setSaveTrigger] = useState(0);
  const backendUrl = 'http://localhost:5001';

  const triggerSave = () => {
    console.log('Header Save Triggered');
    setSaveTrigger((count) => count + 1);
  };

  const updateCurrentNovelData = useCallback((updatedData) => {
    console.log(
      'WorkspaceLayout: Updating currentNovel state with:',
      updatedData
    );
    setCurrentNovel((prev) => ({ ...prev, ...updatedData }));
  }, []);

  const fetchNovel = useCallback(
    async (id) => {
      if (!id || id === 'new' || !authState.token) {
        console.log(
          `fetchNovel called with invalid id (${id}) or no token, returning.`
        );
        setCurrentNovel(null); // Clear novel data if ID is invalid
        setIsLoadingNovel(false);
        setFetchError('');
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
        // Removed automatic navigation on error
        // if (err.response?.status === 404 || err.response?.status === 401) {
        //     // navigate('/workspace/novels', { replace: true });
        // }
      } finally {
        setIsLoadingNovel(false);
      }
    },
    [authState.token, backendUrl]
  ); // Removed navigate from dependencies here

  useEffect(() => {
    // Fetch novel only if novelId exists and is not 'new'
    if (novelId && novelId !== 'new') {
      fetchNovel(novelId);
    } else {
      // Clear state if no valid novelId is present
      setCurrentNovel(null);
      setIsLoadingNovel(false); // Ensure loading state is false
      setFetchError(''); // Clear any previous errors
      if (novelId === 'new') {
        console.log("Layout detected 'new' novelId, state cleared.");
      }
    }
  }, [novelId, fetchNovel]); // Depend on novelId and the fetchNovel callback

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Define base navigation items
  const navItemsBase = [
    { pathBase: '/novels', name: 'Novels', icon: HomeIcon, show: 'always' },
    {
      pathBase: '/editor',
      name: 'Editor',
      icon: EditIcon,
      show: 'novelSelected'
    },
    {
      pathBase: '/workbench',
      name: 'Workbench',
      icon: WorkbenchIcon,
      show: 'novelSelected'
    },
    {
      pathBase: '/characters',
      name: 'Characters',
      icon: PeopleIcon,
      show: 'novelSelected'
    }, // Changed Icon
    {
      pathBase: '/details',
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
              ? 'Loading Novel...' // More specific loading text
              : currentNovel?.title || 'Novel Workspace' // Default to Workspace if title missing
            : 'Novel Workspace'}
        </h1>
        <div className="flex items-center space-x-2">
          <span className="text-xs mr-3 font-mono text-[var(--color-text-muted)] hidden md:inline">
            {authState.user?.name || authState.user?.email}
          </span>
          {/* Save button: Show only when a novel is loaded and not 'new' */}
          {novelId && novelId !== 'new' && !isLoadingNovel && currentNovel && (
            <button
              onClick={triggerSave}
              className="btn btn-primary-cyan text-xs px-4 py-1.5 flex items-center" // Ensure btn and btn-primary-cyan are defined
              title="Save current view (Details or Chapter)"
            >
              <SaveIcon className="w-4 h-4" /> {/* Explicit size */}
              <span className="ml-1">Save</span>
            </button>
          )}
          <button
            onClick={handleLogout}
            className="btn bg-red-600 text-white text-xs px-3 py-1.5 rounded hover:bg-red-700 transition" // Ensure btn is defined
          >
            Log Out
          </button>
        </div>
      </header>

      {/* Main Area with Sidebar */}
      <div className="flex-grow flex overflow-hidden">
        {/* Sidebar Navigation */}
        <aside className="w-20 flex-shrink-0 bg-gray-900/50 border-r border-[var(--color-border)] p-2 flex flex-col items-center space-y-4 overflow-y-auto">
          {navItemsBase.map((item) => {
            const isNovelContextReady =
              novelId && novelId !== 'new' && !isLoadingNovel && currentNovel; // Check currentNovel exists
            let isDisabled = false;
            let finalPath = '#'; // Default to '#'

            if (item.show === 'always') {
              finalPath = `/workspace${item.pathBase}`;
            } else if (item.show === 'novelSelected') {
              // Don't show novel-specific links for 'new' novel or if no novelId
              if (!novelId || novelId === 'new') return null;
              // Disable if loading novel context or if context isn't ready (novel fetch failed/null)
              isDisabled = isLoadingNovel || !isNovelContextReady;
              if (isNovelContextReady) {
                finalPath = `/workspace/novel/${novelId}${item.pathBase}`;
              }
            } else {
              return null; // Should not happen based on current items
            }

            // Determine active state more accurately
            // Check if the current location pathname *exactly* matches the final path
            // OR if it starts with the final path followed by a '/' (for detail pages like character/:id)
            const isActive =
              location.pathname === finalPath ||
              location.pathname.startsWith(`${finalPath}/`);

            return (
              <Link
                key={item.name}
                to={isDisabled ? '#' : finalPath}
                title={item.name}
                aria-disabled={isDisabled || finalPath === '#'} // Disable if path is '#'
                onClick={(e) =>
                  (isDisabled || finalPath === '#') && e.preventDefault()
                } // Prevent click if disabled or path is '#'
                className={`flex flex-col items-center p-2 rounded-md w-full transition duration-200 ${
                  isActive
                    ? 'bg-[var(--color-neon-pink)] text-black' // Active style
                    : 'text-[var(--color-text-muted)] hover:bg-[var(--color-content-bg)] hover:text-[var(--color-neon-cyan)]' // Default/Hover style
                } ${
                  isDisabled || finalPath === '#'
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                }`} // Disabled style
              >
                <item.icon className="w-5 h-5 mb-1" />
                <span className="text-[0.75rem] font-mono uppercase">
                  {item.name}
                </span>
              </Link>
            );
          })}
          <div className="flex-grow"></div> {/* Spacer */}
          <Link
            to="/" // Link back to landing page
            title="Back to Landing"
            className="p-2 rounded-md w-full text-center text-[var(--color-text-muted)] hover:bg-[var(--color-content-bg)] hover:text-[var(--color-neon-cyan)]"
          >
            {/* Use ArrowLeftIcon */}
            <ArrowLeftIcon className="w-5 h-5 inline-block" />
          </Link>
        </aside>

        {/* Content Area - Make <main> relative */}
        <main className="flex-grow overflow-y-auto relative">
          {' '}
          {/* ENSURE relative is present */}
          {fetchError && (
            // Display fetch error prominently if it occurs
            <div className="absolute inset-x-0 top-0 p-3 bg-red-900/80 text-red-200 text-sm text-center z-10">
              {fetchError}
            </div>
          )}
          {/* Wrap the Outlet with the PageTransitionWrapper using mode="absolute" */}
          <PageTransitionWrapper
            mode="absolute"
            key={location.pathname + '-nested'}
          >
            {/* Pass context down via Outlet */}
            <Outlet
              context={{
                novelId,
                currentNovel,
                isLoadingNovel,
                updateCurrentNovelData,
                saveTrigger
              }}
            />
          </PageTransitionWrapper>
        </main>
      </div>
    </div>
  );
}

export default WorkspaceLayout;
