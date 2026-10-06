import React, { useState } from 'react';
import { Navigation } from './components/Navigation.tsx';
import { ResearchAssistant } from './components/ResearchAssistant.tsx';
import { GeminiHydraulicChat } from './components/GeminiHydraulicChat.tsx';
import { LiveVoiceModal } from './components/LiveVoiceModal.tsx';
import { DynamicDamSimulator } from './components/DynamicDamSimulator.tsx';
import { DossierCard } from './components/DossierCard.tsx';
import { DossierModal } from './components/DossierModal.tsx';
import { MauryanAtlas } from './components/MauryanAtlas.tsx';
import { ComparativeTool } from './components/ComparativeTool.tsx';
import { GoogleDriveWorkspace } from './components/GoogleDriveWorkspace.tsx';
import { SaveToDriveButton } from './components/SaveToDriveButton.tsx';
import { exportResearchDossierToDrive } from './services/googleDriveService.ts';
import { ANCIENT_WATER_STRUCTURES, ArchaeologicalDossier } from './data/ancientWaterData.ts';
import {
  Compass,
  BookOpen,
  Sliders,
  Landmark,
  Layers,
  Search,
  MessageSquare,
  Mic,
  Radio,
  HardDrive,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<
    'research' | 'chat' | 'simulator' | 'dossiers' | 'mauryan' | 'compare' | 'drive'
  >('research');
  const [selectedDossier, setSelectedDossier] = useState<ArchaeologicalDossier | null>(null);
  const [researchQuery, setResearchQuery] = useState<string>('');
  const [chatPrompt, setChatPrompt] = useState<string>('');
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState<boolean>(false);
  const [dossierRegionFilter, setDossierRegionFilter] = useState<string>('all');
  const [dossierSearchText, setDossierSearchText] = useState<string>('');
  const [dossierSketchFilter, setDossierSketchFilter] = useState<boolean>(false);

  const handleLaunchResearch = (queryText: string) => {
    setResearchQuery(queryText);
    setActiveTab('research');
  };

  const handleSendToChat = (promptText: string) => {
    setChatPrompt(promptText);
    setActiveTab('chat');
  };

  const handleDossierInquire = (dossier: ArchaeologicalDossier) => {
    const query = `Provide an exhaustive 15-point engineering dossier on ${dossier.name} in ${dossier.state}. Focus on the ${dossier.waterSource}, structural design, flood management, documented inscriptional evidence, and modern relevance.`;
    handleLaunchResearch(query);
  };

  const handleDossierChat = (dossier: ArchaeologicalDossier) => {
    const prompt = `Let's analyze the hydraulic engineering of ${dossier.name} (${dossier.period}, ${dossier.associatedRulerOrCivilization}). How did its builders solve the challenge: "${dossier.engineeringAnalysis.problem}"?`;
    handleSendToChat(prompt);
  };

  const filteredDossiers = ANCIENT_WATER_STRUCTURES.filter((d) => {
    const matchesRegion =
      dossierRegionFilter === 'all' ||
      d.region.toLowerCase().includes(dossierRegionFilter.toLowerCase());
    const matchesSketch = !dossierSketchFilter || !!d.reconstructionSketch;
    const matchesSearch =
      !dossierSearchText ||
      d.name.toLowerCase().includes(dossierSearchText.toLowerCase()) ||
      d.state.toLowerCase().includes(dossierSearchText.toLowerCase()) ||
      d.associatedRulerOrCivilization.toLowerCase().includes(dossierSearchText.toLowerCase()) ||
      d.purpose.toLowerCase().includes(dossierSearchText.toLowerCase());
    return matchesRegion && matchesSketch && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#F8F6F0] text-[#1E1C1A] flex flex-col font-sans">
      {/* Top Bar Navigation (Strict 3-zone contract) */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6 sm:space-y-8">
        {/* Curatorial Hero Section (Editorial Atmosphere) */}
        <section className="bg-[#FAF7F0] border border-[#E0D8CB] rounded-xl p-4 sm:p-8 relative overflow-hidden shadow-2xs">
          <div className="max-w-3xl space-y-3">
            <div className="text-[10px] sm:text-xs uppercase tracking-[0.16em] font-sans font-semibold text-[#8B3A1C] flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span>RESEARCH ARCHIVE & HYDRAULIC RECONSTRUCTION</span>
              <span aria-hidden="true">·</span>
              <span>EST. 3000 BCE – 1500 CE</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-[#231B15] tracking-tight leading-[0.95] text-balance max-w-[10ch] sm:max-w-none">
              Ancient Engineering & Environmental Structure
            </h1>

            <p className="text-sm sm:text-base text-[#574A3D] leading-relaxed max-w-2xl">
              An evidence-first scholarly research assistant analyzing how historical civilizations engineered gravity dams, rock-cut reservoirs, desilting basins, and Ashokan highway well networks to solve extreme climate volatility.
            </p>

            <div className="flex flex-wrap gap-2 pt-2 text-xs">
              <button
                onClick={() => setActiveTab('research')}
                className={`px-3 py-1.5 rounded transition-all cursor-pointer flex items-center gap-1.5 font-medium border ${
                  activeTab === 'research'
                    ? 'bg-[#8B3A1C] text-white border-[#8B3A1C]'
                    : 'bg-[#EFE9DC] text-[#4A3E31] border-[#DED3C2] hover:bg-[#E5DDCB]'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>AI Research Engine</span>
              </button>

              <button
                onClick={() => setActiveTab('chat')}
                className={`px-3 py-1.5 rounded transition-all cursor-pointer flex items-center gap-1.5 font-medium border ${
                  activeTab === 'chat'
                    ? 'bg-[#8B3A1C] text-white border-[#8B3A1C]'
                    : 'bg-[#EFE9DC] text-[#4A3E31] border-[#DED3C2] hover:bg-[#E5DDCB]'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Gemini LLM (Google Search Grounded)</span>
              </button>

              <button
                onClick={() => setIsVoiceModalOpen(true)}
                className="px-3 py-1.5 rounded transition-all cursor-pointer flex items-center gap-1.5 font-medium border bg-[#8B3A1C] text-white border-[#8B3A1C] hover:bg-[#722E15]"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Live Voice (3.8-Live)</span>
              </button>

              <button
                onClick={() => setActiveTab('simulator')}
                className={`px-3 py-1.5 rounded transition-all cursor-pointer flex items-center gap-1.5 font-medium border ${
                  activeTab === 'simulator'
                    ? 'bg-[#8B3A1C] text-white border-[#8B3A1C]'
                    : 'bg-[#EFE9DC] text-[#4A3E31] border-[#DED3C2] hover:bg-[#E5DDCB]'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Embankment Physics Simulator</span>
              </button>

              <button
                onClick={() => setActiveTab('dossiers')}
                className={`px-3 py-1.5 rounded transition-all cursor-pointer flex items-center gap-1.5 font-medium border ${
                  activeTab === 'dossiers'
                    ? 'bg-[#8B3A1C] text-white border-[#8B3A1C]'
                    : 'bg-[#EFE9DC] text-[#4A3E31] border-[#DED3C2] hover:bg-[#E5DDCB]'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Archaeological Dossiers</span>
              </button>

              <button
                onClick={() => setActiveTab('mauryan')}
                className={`px-3 py-1.5 rounded transition-all cursor-pointer flex items-center gap-1.5 font-medium border ${
                  activeTab === 'mauryan'
                    ? 'bg-[#8B3A1C] text-white border-[#8B3A1C]'
                    : 'bg-[#EFE9DC] text-[#4A3E31] border-[#DED3C2] hover:bg-[#E5DDCB]'
                }`}
              >
                <Landmark className="w-3.5 h-3.5" />
                <span>Atlas</span>
              </button>

              <button
                onClick={() => setActiveTab('compare')}
                className={`px-3 py-1.5 rounded transition-all cursor-pointer flex items-center gap-1.5 font-medium border ${
                  activeTab === 'compare'
                    ? 'bg-[#8B3A1C] text-white border-[#8B3A1C]'
                    : 'bg-[#EFE9DC] text-[#4A3E31] border-[#DED3C2] hover:bg-[#E5DDCB]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Comparative Matrix</span>
              </button>

              <button
                onClick={() => setActiveTab('drive')}
                className={`px-3 py-1.5 rounded transition-all cursor-pointer flex items-center gap-1.5 font-medium border ${
                  activeTab === 'drive'
                    ? 'bg-[#8B3A1C] text-white border-[#8B3A1C]'
                    : 'bg-[#EFE9DC] text-[#4A3E31] border-[#DED3C2] hover:bg-[#E5DDCB]'
                }`}
              >
                <HardDrive className="w-3.5 h-3.5" />
                <span>Google Drive Workspace</span>
              </button>
            </div>
          </div>
        </section>

        {/* Tab 1: AI Research Assistant */}
        {activeTab === 'research' && (
          <section className="space-y-6">
            <ResearchAssistant
              initialQuery={researchQuery}
              onSendToChat={handleSendToChat}
              onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
            />
          </section>
        )}

        {/* Tab 2: Gemini Multi-Turn Chatbot */}
        {activeTab === 'chat' && (
          <section className="space-y-6">
            <GeminiHydraulicChat
              onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
              initialPrompt={chatPrompt}
            />
          </section>
        )}

        {/* Tab 3: Hydraulic Simulator */}
        {activeTab === 'simulator' && (
          <section className="space-y-6">
            <DynamicDamSimulator />
          </section>
        )}

        {/* Tab 4: Curated Archaeological Dossiers */}
        {activeTab === 'dossiers' && (
          <section className="space-y-6">
            <div className="bg-[#FAF7F0] border border-[#E0D8CB] rounded-lg p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8E0D2]">
                <div>
                  <h2 className="text-xl font-serif font-bold text-[#2A231C]">
                    Curated Archaeological Dossiers
                  </h2>
                  <p className="text-xs sm:text-sm text-[#736657] mt-0.5">
                    Peer-reviewed engineering records with epigraphic translations and ASI excavation measurements.
                  </p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#8C7F70]" />
                    <input
                      type="text"
                      placeholder="Search structures..."
                      value={dossierSearchText}
                      onChange={(e) => setDossierSearchText(e.target.value)}
                      className="pl-8 pr-3 py-1.5 text-xs bg-[#FFFFFF] border border-[#D8CEBD] rounded text-[#2E241B] placeholder-[#9E9080] outline-none focus:border-[#8B3A1C]"
                    />
                  </div>

                  <select
                    value={dossierRegionFilter}
                    onChange={(e) => setDossierRegionFilter(e.target.value)}
                    className="text-xs bg-[#FFFFFF] border border-[#D8CEBD] rounded px-2.5 py-1.5 text-[#2E241B] cursor-pointer"
                  >
                    <option value="all">All Regions</option>
                    <option value="Western India">Western India (Gujarat / Kutch)</option>
                    <option value="Southern India">Southern India (Tamil Nadu / Andhra)</option>
                    <option value="Central India">Central India (Madhya Pradesh)</option>
                    <option value="Northern India">Northern India (Uttar Pradesh)</option>
                    <option value="Pan-Indian">Pan-Indian (Mauryan Corridors)</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => setDossierSketchFilter(!dossierSketchFilter)}
                    className={`px-2.5 py-1.5 text-xs font-semibold rounded transition-all cursor-pointer flex items-center gap-1.5 border ${
                      dossierSketchFilter
                        ? 'bg-[#8B3A1C] text-white border-[#8B3A1C] shadow-xs'
                        : 'bg-[#FFFFFF] text-[#4F4335] border-[#D8CEBD] hover:bg-[#F3ECE0]'
                    }`}
                    title="Toggle filter to show structures with architectural reconstruction cross-sections"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Cross-Sections Only</span>
                  </button>
                </div>
              </div>

              {/* Architectural Cross-Sections & Civil Reconstructions Featured Ribbon */}
              <div className="mt-4 p-4 bg-[#F5EFE3] border border-[#DDD0BC] rounded-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#E3D6C3]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#8B3A1C]"></span>
                    <h3 className="font-serif font-bold text-sm text-[#271E15]">
                      Architectural Cross-Sections & Civil Recreations
                    </h3>
                  </div>
                  <span className="text-[11px] text-[#786959]">
                    Mauryan and later hydraulic structures with forensic civil engineering elevations
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {[
                    { id: 'sudarshana-dam', label: 'Mauryan Sudarshana Dam', era: 'c. 320 BCE', badge: 'Compacted Core & Sluices' },
                    { id: 'bhojpur-cyclopean-dam', label: 'Bhojpur Cyclopean Dam', era: '1010 CE (Paramara)', badge: 'Megalithic Gravity Wall' },
                    { id: 'kakatiya-cascade-tanks', label: 'Kakatiya Ramappa Dam', era: '1213 CE (Kakatiya)', badge: 'Valley Cascade & Sluice' },
                    { id: 'hampi-vijayanagara-aqueducts', label: 'Hampi Anicuts & Viaducts', era: '15th c. (Vijayanagara)', badge: 'Lead-Clamped Ashlar' },
                    { id: 'porumamilla-tank', label: 'Porumamilla 12-Sādhana Dam', era: '1369 CE (Vijayanagara)', badge: '1,400m Stepped Revetment' },
                  ].map((item) => {
                    const matched = ANCIENT_WATER_STRUCTURES.find((d) => d.id === item.id);
                    if (!matched || !matched.reconstructionSketch) return null;
                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedDossier(matched)}
                        className="group relative rounded-md overflow-hidden border border-[#D5C8B4] bg-[#221B14] cursor-pointer hover:border-[#8B3A1C] transition-all flex flex-col"
                      >
                        <div className="h-24 w-full overflow-hidden relative">
                          <img
                            src={matched.reconstructionSketch.image}
                            alt={item.label}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent"></div>
                          <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[9px] font-mono bg-black/60 text-[#F5ECE1] border border-white/20">
                            {item.era}
                          </span>
                        </div>
                        <div className="p-2 bg-[#FAF7F0] border-t border-[#E5DAC8] flex-1 flex flex-col justify-between">
                          <div>
                            <span className="font-serif font-bold text-xs text-[#2A2118] group-hover:text-[#8B3A1C] transition-colors line-clamp-1">
                              {item.label}
                            </span>
                            <span className="text-[10px] text-[#7A6C5C] line-clamp-1 block mt-0.5">
                              {item.badge}
                            </span>
                          </div>
                          <span className="text-[9px] text-[#8B3A1C] font-semibold flex items-center gap-0.5 mt-1">
                            Inspect Drafting &rarr;
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Grid of Dossiers */}
              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDossiers.map((dossier) => (
                  <div key={dossier.id} className="relative group">
                    <DossierCard
                      dossier={dossier}
                      onSelect={(d) => setSelectedDossier(d)}
                      onAskResearch={handleDossierInquire}
                    />
                    <div className="mt-2 flex items-center justify-end px-1">
                      <button
                        onClick={() => handleDossierChat(dossier)}
                        className="text-[11px] text-[#8B3A1C] hover:text-[#5E240F] flex items-center gap-1 font-medium cursor-pointer"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>Discuss with AI Chatbot &rarr;</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {filteredDossiers.length === 0 && (
                <div className="text-center py-12 text-[#7A6C5D] text-sm">
                  No ancient structures matched your filter criteria.
                </div>
              )}
            </div>
          </section>
        )}

        {/* Tab 5: Ashoka & Mauryan Atlas */}
        {activeTab === 'mauryan' && (
          <section className="space-y-6">
            <MauryanAtlas onAskResearch={handleLaunchResearch} />
          </section>
        )}

        {/* Tab 6: Comparative Matrix */}
        {activeTab === 'compare' && (
          <section className="space-y-6">
            <ComparativeTool />
          </section>
        )}

        {/* Tab 7: Google Drive Workspace */}
        {activeTab === 'drive' && (
          <section className="space-y-6">
            <GoogleDriveWorkspace
              onNavigateToResearch={handleLaunchResearch}
              onNavigateToSimulator={() => setActiveTab('simulator')}
              onNavigateToChat={handleSendToChat}
            />
          </section>
        )}
      </main>

      {/* Full Dossier Modal */}
      <DossierModal
        dossier={selectedDossier}
        onClose={() => setSelectedDossier(null)}
        onAskResearch={handleLaunchResearch}
      />

      {/* Gemini 3.8 Live Voice Modal */}
      <LiveVoiceModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onInquireText={handleSendToChat}
      />

      {/* Institutional Editorial Footer */}
      <footer className="mt-12 bg-[#F3ECE0] border-t border-[#DFD6C5] py-8 text-xs text-[#6B5E4E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <div className="font-archival font-bold text-sm text-[#261E17]">
              JalaSutra · Vāri-Vidyā Research System
            </div>
            <p className="text-[11px] text-[#7A6D5E]">
              Dedicated to ancient Indian water engineering, historical hydrology, and epigraphical civil reconstruction.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px]">
            <span>Junagadh Rock Inscriptions</span>
            <span aria-hidden="true">·</span>
            <span>Archaeological Survey of India</span>
            <span aria-hidden="true">·</span>
            <span>Arthashastra Statutes</span>
            <span aria-hidden="true">·</span>
            <span>Porumamilla Record (1369 CE)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
