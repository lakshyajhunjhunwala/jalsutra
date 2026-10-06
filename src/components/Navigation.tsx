import React, { useState, useEffect } from 'react';
import { Compass, BookOpen, Sliders, Layers, Landmark, MessageSquare, Mic, HardDrive, User, LogIn, LogOut, Database } from 'lucide-react';
import { onDriveAuthStateChanged, DriveUser } from '../services/googleDriveService.ts';
import { onUserAuthStateChanged, signInWithGoogle, signOutUser, JalaSutraUser } from '../services/firebase.ts';

interface NavigationProps {
  activeTab: 'research' | 'chat' | 'simulator' | 'dossiers' | 'mauryan' | 'compare' | 'drive';
  setActiveTab: (tab: 'research' | 'chat' | 'simulator' | 'dossiers' | 'mauryan' | 'compare' | 'drive') => void;
  onOpenVoiceModal?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  onOpenVoiceModal,
}) => {
  const [driveUser, setDriveUser] = useState<DriveUser | null>(null);
  const [authUser, setAuthUser] = useState<JalaSutraUser | null>(null);
  const [showAuthDropdown, setShowAuthDropdown] = useState<boolean>(false);

  useEffect(() => {
    const unsub = onDriveAuthStateChanged((user) => {
      setDriveUser(user);
    });
    const unsubAuth = onUserAuthStateChanged((u) => {
      setAuthUser(u);
    });
    return () => {
      unsub();
      unsubAuth();
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-[#FBF9F5]/95 backdrop-blur-md border-b border-[#E8E2D5] transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-2 min-h-[64px] py-2 sm:py-0 sm:h-16">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('research')}
              className="text-left group cursor-pointer focus:outline-none"
            >
              <span className="font-archival text-xl sm:text-2xl font-bold tracking-tight text-[#2B241D] group-hover:text-[#8B3A1C] transition-colors">
                JalaSutra
              </span>
            </button>
            <span className="hidden lg:inline-block text-xs font-sans tracking-widest uppercase text-[#8C7E72] pl-3 border-l border-[#DCD3C4]">
              Ancient Hydrology & Engineering
            </span>
          </div>

          {/* Zone 2: Clean text navigation links with subtle active states */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2 text-sm font-medium">
            <button
              onClick={() => setActiveTab('research')}
              className={`px-2.5 py-1.5 rounded transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'research'
                  ? 'text-[#8B3A1C] font-semibold border-b-2 border-[#8B3A1C]'
                  : 'text-[#5C5349] hover:text-[#2B241D]'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Research</span>
            </button>

            <button
              onClick={() => setActiveTab('chat')}
              className={`px-2.5 py-1.5 rounded transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'chat'
                  ? 'text-[#8B3A1C] font-semibold border-b-2 border-[#8B3A1C]'
                  : 'text-[#5C5349] hover:text-[#2B241D]'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Gemini LLM</span>
              <span className="px-1.5 py-0.2 text-[9px] font-sans font-bold uppercase rounded bg-[#8B3A1C]/10 text-[#8B3A1C] flex items-center gap-1">
                Google Search
              </span>
            </button>

            <button
              onClick={() => setActiveTab('simulator')}
              className={`px-2.5 py-1.5 rounded transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'simulator'
                  ? 'text-[#8B3A1C] font-semibold border-b-2 border-[#8B3A1C]'
                  : 'text-[#5C5349] hover:text-[#2B241D]'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Simulator</span>
            </button>

            <button
              onClick={() => setActiveTab('dossiers')}
              className={`px-2.5 py-1.5 rounded transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'dossiers'
                  ? 'text-[#8B3A1C] font-semibold border-b-2 border-[#8B3A1C]'
                  : 'text-[#5C5349] hover:text-[#2B241D]'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Dossiers</span>
            </button>

            <button
              onClick={() => setActiveTab('mauryan')}
              className={`px-2.5 py-1.5 rounded transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'mauryan'
                  ? 'text-[#8B3A1C] font-semibold border-b-2 border-[#8B3A1C]'
                  : 'text-[#5C5349] hover:text-[#2B241D]'
              }`}
            >
              <Landmark className="w-4 h-4" />
              <span>Atlas</span>
            </button>

            <button
              onClick={() => setActiveTab('compare')}
              className={`px-2.5 py-1.5 rounded transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'compare'
                  ? 'text-[#8B3A1C] font-semibold border-b-2 border-[#8B3A1C]'
                  : 'text-[#5C5349] hover:text-[#2B241D]'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Compare</span>
            </button>

            <button
              onClick={() => setActiveTab('drive')}
              className={`px-2.5 py-1.5 rounded transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer relative ${
                activeTab === 'drive'
                  ? 'text-[#8B3A1C] font-semibold border-b-2 border-[#8B3A1C]'
                  : 'text-[#5C5349] hover:text-[#2B241D]'
              }`}
            >
              <HardDrive className="w-4 h-4" />
              <span>Google Drive</span>
              {driveUser ? (
                <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-200" title={`Connected to ${driveUser.email}`} />
              ) : (
                <span className="px-1.5 py-0.2 text-[9px] font-sans font-semibold rounded bg-[#E4DBCB] text-[#55473A]">
                  Sync
                </span>
              )}
            </button>
          </nav>

          {/* Zone 3: 1-2 primary actions + Firebase Auth */}
          <div className="flex items-center gap-2">
            {onOpenVoiceModal && (
              <button
                onClick={onOpenVoiceModal}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-[#8B3A1C] hover:bg-[#742E15] rounded flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer shadow-xs"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Voice (3.8-Live)</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('drive')}
              className={`hidden sm:inline-flex px-3 py-1.5 text-xs font-semibold rounded transition-colors whitespace-nowrap cursor-pointer items-center gap-1.5 ${
                activeTab === 'drive'
                  ? 'bg-[#8B3A1C] text-white shadow-sm'
                  : 'text-[#3A3026] bg-[#EFE8DA] hover:bg-[#E4DBC9] border border-[#D5CABB]'
              }`}
            >
              <HardDrive className="w-3.5 h-3.5 text-[#8B3A1C]" />
              <span>Drive</span>
            </button>

            {/* Firebase Account & Cloud Sync Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowAuthDropdown(!showAuthDropdown)}
                className="px-2.5 py-1.5 rounded-lg bg-[#EFE8DA] hover:bg-[#E5DBC8] border border-[#D5CABB] text-xs font-medium text-[#3A3025] flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Account & Cloud Firestore Synchronization"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <User className="w-3.5 h-3.5 text-[#8B3A1C]" />
                <span className="hidden md:inline max-w-[100px] truncate">
                  {authUser?.isAnonymous ? 'Guest' : authUser?.displayName || 'User'}
                </span>
              </button>

              {showAuthDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-[#FAF7F0] border border-[#D5CABB] rounded-xl shadow-xl p-3 z-50 space-y-3 animate-fade-in text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-[#E8DFCFA0]">
                    <span className="font-serif font-bold text-sm text-[#261E16]">Researcher Account</span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-100 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Database className="w-2.5 h-2.5" />
                      Firestore Synced
                    </span>
                  </div>

                  <div className="space-y-1 text-[#54483C]">
                    <p className="font-semibold text-[#292118]">
                      {authUser?.displayName || (authUser?.isAnonymous ? 'Guest Researcher' : 'Researcher')}
                    </p>
                    <p className="text-[11px] text-[#7A6C5B] truncate">
                      {authUser?.email || `UID: ${authUser?.uid.slice(0, 14)}...`}
                    </p>
                    <p className="text-[10px] text-[#8C7D6D] pt-1">
                      All your conversations, research points, and search history are continuously backed up to Cloud Firestore.
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#E8DFCFA0]">
                    {authUser?.isAnonymous ? (
                      <button
                        onClick={async () => {
                          try {
                            await signInWithGoogle();
                            setShowAuthDropdown(false);
                          } catch (e: any) {
                            console.warn('Google sign in error:', e);
                          }
                        }}
                        className="w-full py-1.5 px-3 bg-[#8B3A1C] hover:bg-[#742E15] text-white font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>Sign in with Google</span>
                      </button>
                    ) : (
                      <button
                        onClick={async () => {
                          await signOutUser();
                          setShowAuthDropdown(false);
                        }}
                        className="w-full py-1.5 px-3 bg-[#EFE8DC] hover:bg-[#E5DDCB] text-[#554739] font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-[#D5CABB]"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Tab Rail */}
        <div className="md:hidden flex items-center justify-between py-2 border-t border-[#E8E2D5] overflow-x-auto text-xs gap-1">
          <button
            onClick={() => setActiveTab('research')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${
              activeTab === 'research' ? 'bg-[#EAE4D7] text-[#8B3A1C] font-semibold' : 'text-[#5C5349]'
            }`}
          >
            Research
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${
              activeTab === 'chat' ? 'bg-[#EAE4D7] text-[#8B3A1C] font-semibold' : 'text-[#5C5349]'
            }`}
          >
            Gemini LLM
          </button>
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${
              activeTab === 'simulator' ? 'bg-[#EAE4D7] text-[#8B3A1C] font-semibold' : 'text-[#5C5349]'
            }`}
          >
            Simulator
          </button>
          <button
            onClick={() => setActiveTab('dossiers')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${
              activeTab === 'dossiers' ? 'bg-[#EAE4D7] text-[#8B3A1C] font-semibold' : 'text-[#5C5349]'
            }`}
          >
            Dossiers
          </button>
          <button
            onClick={() => setActiveTab('mauryan')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${
              activeTab === 'mauryan' ? 'bg-[#EAE4D7] text-[#8B3A1C] font-semibold' : 'text-[#5C5349]'
            }`}
          >
            Atlas
          </button>
          <button
            onClick={() => setActiveTab('compare')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${
              activeTab === 'compare' ? 'bg-[#EAE4D7] text-[#8B3A1C] font-semibold' : 'text-[#5C5349]'
            }`}
          >
            Compare
          </button>
          <button
            onClick={() => setActiveTab('drive')}
            className={`px-2.5 py-1 rounded whitespace-nowrap flex items-center gap-1 ${
              activeTab === 'drive' ? 'bg-[#EAE4D7] text-[#8B3A1C] font-semibold' : 'text-[#5C5349]'
            }`}
          >
            <HardDrive className="w-3 h-3 text-[#8B3A1C]" />
            Drive
          </button>
        </div>
      </div>
    </header>
  );
};
