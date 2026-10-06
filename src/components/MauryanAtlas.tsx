import React, { useState } from 'react';
import { Landmark, Compass, Scroll, FileText, ChevronRight, CheckCircle, Layers, Search } from 'lucide-react';
import { MAURYAN_LEGAL_HYDRAULIC_CODES, PORUMAMILLA_PRINCIPLES } from '../data/ancientWaterData.ts';

interface MauryanAtlasProps {
  onAskResearch: (query: string) => void;
}

export const MauryanAtlas: React.FC<MauryanAtlasProps> = ({ onAskResearch }) => {
  const [activeSection, setActiveSection] = useState<'ashoka_edicts' | 'sudarshana_mauryan' | 'arthashastra_laws' | 'pataliputra_moat' | 'porumamilla_code'>('ashoka_edicts');

  return (
    <div className="space-y-6">
      {/* Banner Card */}
      <div className="bg-[#FAF7F0] border border-[#E0D8CB] rounded-lg p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8E0D2]">
          <div>
            <h2 className="text-xl font-serif font-bold text-[#2A231C] flex items-center gap-2">
              <Landmark className="w-5 h-5 text-[#8B3A1C]" />
              Mauryan Imperial Hydrology & Ashoka’s Public Infrastructure
            </h2>
            <p className="text-xs sm:text-sm text-[#736657] mt-0.5">
              Forensic analysis of 3rd Century BCE engineering: Ashokan epigraphs, Girnar canal masonry, Arthashastra hydraulic statutes, and Pataliputra drainage moats.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onAskResearch('Search Google for the latest archaeological excavations, sonar radar surveys, and epigraphical decipherments of Mauryan hydraulic infrastructure, Kumrahar Pataliputra moats, and Girnar Sudarshana canals.')}
              className="px-3.5 py-1.5 text-xs font-semibold text-[#8B3A1C] bg-[#FAF3E8] hover:bg-[#F4EADB] border border-[#E2D5C3] rounded transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer shadow-2xs"
              title="Query live Google Search data for recent Mauryan archaeological field reports"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Google Search Field Updates</span>
            </button>
            <button
              onClick={() => onAskResearch('Provide an exhaustive research paper on Mauryan hydraulic engineering under Chandragupta and Ashoka, citing Arthashastra, Megasthenes, and the Girnar rock edict.')}
              className="px-3.5 py-1.5 text-xs font-semibold text-[#FBF9F5] bg-[#8B3A1C] hover:bg-[#722F16] rounded transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer shadow-xs"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Generate Mauryan Research Dossier</span>
            </button>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="mt-4 flex flex-wrap gap-1.5 border-b border-[#E8E0D2] pb-2 text-xs">
          <button
            onClick={() => setActiveSection('ashoka_edicts')}
            className={`px-3 py-1.5 rounded font-medium transition-colors cursor-pointer ${
              activeSection === 'ashoka_edicts'
                ? 'bg-[#8B3A1C] text-white shadow-xs'
                : 'bg-[#EFE8DC] text-[#4F4335] hover:bg-[#E5DEC] '
            }`}
          >
            Ashoka’s Roadside Well Network (PE VII & MRE II)
          </button>

          <button
            onClick={() => setActiveSection('sudarshana_mauryan')}
            className={`px-3 py-1.5 rounded font-medium transition-colors cursor-pointer ${
              activeSection === 'sudarshana_mauryan'
                ? 'bg-[#8B3A1C] text-white shadow-xs'
                : 'bg-[#EFE8DC] text-[#4F4335] hover:bg-[#E5DEC]'
            }`}
          >
            Sudarshana Dam: Chandragupta & Tusaspha
          </button>

          <button
            onClick={() => setActiveSection('arthashastra_laws')}
            className={`px-3 py-1.5 rounded font-medium transition-colors cursor-pointer ${
              activeSection === 'arthashastra_laws'
                ? 'bg-[#8B3A1C] text-white shadow-xs'
                : 'bg-[#EFE8DC] text-[#4F4335] hover:bg-[#E5DEC]'
            }`}
          >
            Arthashastra Hydraulic Jurisprudence
          </button>

          <button
            onClick={() => setActiveSection('pataliputra_moat')}
            className={`px-3 py-1.5 rounded font-medium transition-colors cursor-pointer ${
              activeSection === 'pataliputra_moat'
                ? 'bg-[#8B3A1C] text-white shadow-xs'
                : 'bg-[#EFE8DC] text-[#4F4335] hover:bg-[#E5DEC]'
            }`}
          >
            Pataliputra Fortification & Moat Systems
          </button>

          <button
            onClick={() => setActiveSection('porumamilla_code')}
            className={`px-3 py-1.5 rounded font-medium transition-colors cursor-pointer ${
              activeSection === 'porumamilla_code'
                ? 'bg-[#8B3A1C] text-white shadow-xs'
                : 'bg-[#EFE8DC] text-[#4F4335] hover:bg-[#E5DEC]'
            }`}
          >
            Porumamilla Dam Code (12 Sādhanas & 6 Doshas)
          </button>
        </div>

        {/* Dynamic section content */}
        <div className="mt-5">
          {/* Section 1: Ashoka's Edicts */}
          {activeSection === 'ashoka_edicts' && (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-serif font-bold text-[#29211A]">
                    Standardized Well Spacing & Green Corridors on Imperial Highways
                  </h3>
                  <p className="text-xs text-[#6B5E4F] mt-0.5">
                    Primary inscriptional evidence from Pillar Edict VII (Topra-Delhi) and Major Rock Edict II (Girnar/Kalsi).
                  </p>
                </div>
              </div>

              {/* Inscription Quote Blocks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-[#F5EFE4] border-l-3 border-[#8B3A1C] rounded text-xs space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-[#7A3015] uppercase tracking-wider font-sans">
                    <Scroll className="w-3.5 h-3.5" />
                    <span>Pillar Edict VII (Topra-Delhi Column):</span>
                  </div>
                  <blockquote className="font-serif italic text-[#382E24] leading-relaxed">
                    "On the roads I have had banyan trees planted, which will give shade to beasts and men; mango groves have been planted; at every half-kosa (approx. 3.2 km / 2 miles) wells have been caused to be dug; rest-houses (*nimshidhya*) have been erected; and many watering sheds (*apāna*) have been established for the enjoyment of cattle and men."
                  </blockquote>
                  <span className="block text-[11px] text-[#7A6C5D] font-sans font-medium">
                    Language: Magadhi Prakrit • Script: Brahmi • Date: c. 242 BCE
                  </span>
                </div>

                <div className="p-4 bg-[#F5EFE4] border-l-3 border-[#2A613B] rounded text-xs space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-[#235232] uppercase tracking-wider font-sans">
                    <Scroll className="w-3.5 h-3.5" />
                    <span>Major Rock Edict II (Girnar Rock):</span>
                  </div>
                  <blockquote className="font-serif italic text-[#382E24] leading-relaxed">
                    "Everywhere within the dominions of Beloved-of-the-Gods... and in the lands of the Cholas, Pandyas, Satiyaputra, Keralaputra, and as far south as Tamraparni, and in the kingdom of the Greek king Antiochus... medical herbs suitable for humans and beasts have been planted, and along the roads wells have been dug and trees planted."
                  </blockquote>
                  <span className="block text-[11px] text-[#7A6C5D] font-sans font-medium">
                    Diplomatic & humanitarian infrastructure crossing Mauryan borders into Hellenistic Asia.
                  </span>
                </div>
              </div>

              {/* Engineering Analysis of Half-Kosa Spacing */}
              <div className="p-4 bg-[#FFFFFF] border border-[#E0D8CB] rounded-md space-y-2 text-xs text-[#3D3328]">
                <h4 className="font-serif font-bold text-sm text-[#251F19]">
                  Hydrological & Logistics Logic of the Half-Kosa (~3.2 km) Interval:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="p-2.5 bg-[#FAF6EE] rounded border border-[#E8E0D2]">
                    <strong className="block text-[#8B3A1C] mb-1">Human & Animal Physiology</strong>
                    <p className="leading-relaxed">
                      A walking pace in the north Indian summer heat (38°C–45°C) yields dehydration in beasts of burden within 45–60 minutes. 3.2 km corresponds precisely to 45 minutes of marching infantry or ox-cart travel.
                    </p>
                  </div>
                  <div className="p-2.5 bg-[#FAF6EE] rounded border border-[#E8E0D2]">
                    <strong className="block text-[#8B3A1C] mb-1">Terracotta Ring-Wells</strong>
                    <p className="leading-relaxed">
                      Archaeology at Kumrahar and Hastinapur proves Mauryan wells used pre-cast ceramic stacked rings that prevented Gangetic sandy alluvium from collapsing inward during deep excavation.
                    </p>
                  </div>
                  <div className="p-2.5 bg-[#FAF6EE] rounded border border-[#E8E0D2]">
                    <strong className="block text-[#8B3A1C] mb-1">Microclimate Mitigation</strong>
                    <p className="leading-relaxed">
                      Planting banyan trees with spreading root networks along road shoulders simultaneously anchored soil against monsoonal erosion and formed thermal shading canopies.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 2: Sudarshana Dam */}
          {activeSection === 'sudarshana_mauryan' && (
            <div className="space-y-4">
              <h3 className="text-lg font-serif font-bold text-[#29211A]">
                The Mauryan Genesis of Sudarshana Dam (Girnar, Gujarat)
              </h3>
              <p className="text-xs text-[#5E5143] leading-relaxed">
                The Junagadh Rock Inscription of Rudradaman I (150 CE) preserves an unbroken epigraphic memory of Mauryan engineering:
              </p>

              <div className="p-4 bg-[#F8F4EC] border border-[#E0D7C6] rounded text-xs space-y-3 font-serif">
                <div className="text-sm font-semibold text-[#8B3A1C]">
                  Direct Sanskrit Inscription Citation (Epigraphia Indica Vol. VIII, Line 8):
                </div>
                <blockquote className="italic text-[#3A3025] leading-relaxed pl-3 border-l-2 border-[#8B3A1C]">
                  "मौर्यस्य राज्ञः चन्द्रगुप्तस्य राष्ट्रियेण वैश्येन पुष्यगुप्तेन कारितम्, अशोकस्य मौर्यस्य कृते यवनराज्ञा तुषास्फेनाधिष्ठाय प्रणाळीभिरलंकृतम्..."
                  <br /><br />
                  "Originally constructed by the Vaishya Pushyagupta, provincial governor (Rāṣṭrīya) of the Mauryan King Chandragupta; and subsequently under Emperor Ashoka the Maurya, the Yavana (Greek) King Tusaspha ordered it to be adorned with irrigation canals (praṇāḷī)..."
                </blockquote>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-[#FAF6EE] border border-[#E5DCB] rounded space-y-1">
                  <span className="font-semibold text-[#251F19] block">Pushyagupta’s Dam (Chandragupta Maurya):</span>
                  <p className="text-[#4F4335] leading-relaxed">
                    Created the main retention bund across the Suvarnasikata and Palasini mountain torrents, turning a high rocky basin into a perennial freshwater reservoir.
                  </p>
                </div>

                <div className="p-3 bg-[#FAF6EE] border border-[#E5DCB] rounded space-y-1">
                  <span className="font-semibold text-[#251F19] block">Tusaspha’s Hydraulic Conduits (Emperor Ashoka):</span>
                  <p className="text-[#4F4335] leading-relaxed">
                    Equipped the reservoir with sluice portals and gravity-fed distributive canals (*praṇāḷikā*), converting pure water storage into active agrarian command area irrigation.
                  </p>
                </div>
              </div>

              {/* Visual Artistic Recreation: Mauryan Dam Architectural Cross-Section */}
              <div className="bg-[#FFFFFF] border border-[#E0D8CB] rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#8B3A1C]" />
                    <h4 className="font-serif font-bold text-sm text-[#251F19]">
                      Architectural Elevation & Cross-Section: Mauryan Sudarshana Dam
                    </h4>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#EFE9DC] text-[#4F4335] border border-[#DDD3C0]">
                    Forensic Epigraphic Drafting
                  </span>
                </div>

                <div className="relative rounded-lg overflow-hidden border border-[#D5C8B4] bg-[#221B14]">
                  <img
                    src="/src/assets/images/sudarshana_dam_crosssection_1790511646371.jpg"
                    alt="Mauryan Sudarshana Dam Architectural Cross-Section"
                    referrerPolicy="no-referrer"
                    className="w-full h-56 sm:h-72 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent flex flex-col justify-end p-3 sm:p-4 text-white">
                    <span className="text-[12px] font-serif font-bold text-[#F4ECE1]">
                      Transverse Cutaway: Compacted Clay Core, Boulder Pitching & Tusaspha Sluice Conduit
                    </span>
                    <p className="text-[10px] sm:text-[11px] text-[#D8CEBF] line-clamp-2 mt-0.5">
                      Visual reconstruction drafted from Rudradaman's Saka 72 (150 CE) rock inscription and Skandagupta's 456 CE edict at Junagadh.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1">
                  <div className="p-2.5 bg-[#FAF6EE] rounded border border-[#E8E0D2]">
                    <span className="font-bold text-[#8B3A1C] block text-[11px]">1. Impervious Core</span>
                    <p className="text-[#4F4335] text-[11px] mt-0.5 leading-relaxed">
                      Compacted clay and gravel central mass keyed directly into Mount Girnar's granite bedrock.
                    </p>
                  </div>
                  <div className="p-2.5 bg-[#FAF6EE] rounded border border-[#E8E0D2]">
                    <span className="font-bold text-[#8B3A1C] block text-[11px]">2. Cyclopean Revetment</span>
                    <p className="text-[#4F4335] text-[11px] mt-0.5 leading-relaxed">
                      Stepped granite boulder pitching on upstream water face to dissipate hydrostatic wave scour.
                    </p>
                  </div>
                  <div className="p-2.5 bg-[#FAF6EE] rounded border border-[#E8E0D2]">
                    <span className="font-bold text-[#8B3A1C] block text-[11px]">3. Rock-Cut Sluices (*Praṇāḷikā*)</span>
                    <p className="text-[#4F4335] text-[11px] mt-0.5 leading-relaxed">
                      Dressed stone subterranean conduits added by Governor Tusaspha for gravity agrarian canals.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Arthashastra Laws */}
          {activeSection === 'arthashastra_laws' && (
            <div className="space-y-4">
              <h3 className="text-lg font-serif font-bold text-[#29211A]">
                Kautilya’s Arthashastra: Ancient Legal & Fiscal Hydrology
              </h3>
              <p className="text-xs text-[#5E5143] leading-relaxed">
                Kautilya’s 4th Century BCE statecraft treatise contains the most rigorous ancient codification of irrigation taxes, water rights, and criminal penalties for structural damage:
              </p>

              <div className="space-y-3">
                {MAURYAN_LEGAL_HYDRAULIC_CODES.map((code, idx) => (
                  <div key={idx} className="p-3 bg-[#FAF7F0] border border-[#E0D8CB] rounded text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#8B3A1C]">{code.topic}</span>
                      <span className="font-mono text-[11px] text-[#7A6C5D]">{code.source}</span>
                    </div>
                    <p className="text-[#42372D] leading-relaxed">{code.details}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 4: Pataliputra Moat */}
          {activeSection === 'pataliputra_moat' && (
            <div className="space-y-4">
              <h3 className="text-lg font-serif font-bold text-[#29211A]">
                Pataliputra: Dual Defensive & Storm-Drainage Moat
              </h3>
              <p className="text-xs text-[#5E5143] leading-relaxed">
                Excavated at Bulandibagh and Kumrahar (Patna), the Mauryan capital was defended by an immense moat and timber rampart:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-[#FAF6EE] border border-[#E0D8CB] rounded space-y-2">
                  <span className="font-serif font-bold text-sm text-[#251F19] block">
                    Megasthenes’ Eye-Witness Record (Indica Book III):
                  </span>
                  <p className="text-[#42372D] leading-relaxed italic">
                    "Pataliputra was surrounded by a wooden wall pierced with 64 gates and 570 towers. In front of this wall was a ditch (moat) 600 feet (180 meters) broad and 30 cubits (14 meters) deep, which received the sewage of the city and the overflow of the rivers."
                  </p>
                </div>

                <div className="p-3 bg-[#FAF6EE] border border-[#E0D8CB] rounded space-y-2">
                  <span className="font-serif font-bold text-sm text-[#251F19] block">
                    ASI Excavation Evidence (Bulandibagh):
                  </span>
                  <p className="text-[#42372D] leading-relaxed">
                    Dr. D.B. Spooner unearthed double lines of monumental sal-wood uprights tied with wooden battens and iron dowels. The timber wood was subterraneanly preserved for 2,200 years due to the waterlogged silt matrix.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Section 5: Porumamilla Inscription */}
          {activeSection === 'porumamilla_code' && (
            <div className="space-y-4">
              <h3 className="text-lg font-serif font-bold text-[#29211A]">
                The Porumamilla Inscription (1369 CE): 12 Sādhanas & 6 Doshas
              </h3>
              <p className="text-xs text-[#5E5143] leading-relaxed">
                Found in Cuddapah district, Andhra Pradesh, this 24-verse Sanskrit inscription is the world’s most comprehensive epigraphical code of dam engineering:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* 12 Sādhanas */}
                <div className="p-3 bg-[#EEF5F0] border border-[#C5DEC8] rounded space-y-2">
                  <span className="font-bold text-sm text-[#1F5430] block flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    The 12 Sādhanas (Essential Virtues of an Enduring Dam):
                  </span>
                  <ol className="list-decimal ml-4 space-y-1 text-[#2B4734]">
                    {PORUMAMILLA_PRINCIPLES.sadhanas.map((s) => (
                      <li key={s.number}>{s.rule}</li>
                    ))}
                  </ol>
                </div>

                {/* 6 Doshas */}
                <div className="p-3 bg-[#FDF1ED] border border-[#E8C0B2] rounded space-y-2">
                  <span className="font-bold text-sm text-[#8C2915] block flex items-center gap-1">
                    <Scroll className="w-4 h-4" />
                    The 6 Doshas (Critical Structural Faults to Avoid):
                  </span>
                  <ol className="list-decimal ml-4 space-y-1 text-[#5E2013]">
                    {PORUMAMILLA_PRINCIPLES.doshas.map((d) => (
                      <li key={d.number}>{d.flaw}</li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
