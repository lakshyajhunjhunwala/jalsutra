import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import {
  Clock,
  Compass,
  Calendar,
  Layers,
  MapPin,
  Search,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Filter,
  MessageSquare,
  BookOpen,
  ShieldCheck,
  Sparkles,
  SlidersHorizontal,
  Info,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  X,
  ArrowRight,
  CornerDownRight,
  Tag,
  Download,
  FileDown,
  FileText,
  Loader2,
} from 'lucide-react';
import { exportTimelinePdfDossier } from '../services/timelinePdfExportService.ts';

export interface TimelineMilestone {
  id: string;
  year: number; // Negative for BCE, positive for CE
  yearLabel: string;
  title: string;
  sanskritOrLocalName?: string;
  period: string;
  eraId: 'harappan' | 'vedic' | 'mauryan' | 'early_historic' | 'gupta' | 'early_medieval' | 'vijayanagara';
  region: string;
  location: string;
  category: 'dam_weir' | 'reservoir_tank' | 'urban_well' | 'treatise_code';
  associatedRuler: string;
  description: string;
  engineeringInnovations: string[];
  evidenceType: 'Epigraphic' | 'Archaeological Excavation' | 'Sanskrit Treatise' | 'Multi-Source';
  primarySource: string;
  researchPrompt: string;
  associatedDossierId?: string;
}

export interface HistoricalEra {
  id: 'harappan' | 'vedic' | 'mauryan' | 'early_historic' | 'gupta' | 'early_medieval' | 'vijayanagara';
  name: string;
  startYear: number;
  endYear: number;
  dateRangeLabel: string;
  color: string;
  bgTint: string;
  borderColor: string;
  summary: string;
}

export interface GeneratedYearPrompt {
  year: number;
  yearLabel: string;
  eraName: string;
  historicalContext: string;
  waterTechniquesSummary: string;
  keySitesOrWorks: string[];
  prompt: string;
}

export const HISTORICAL_ERAS: HistoricalEra[] = [
  {
    id: 'harappan',
    name: 'Harappan / Indus Valley Civilisation',
    startYear: -3000,
    endYear: -1500,
    dateRangeLabel: '3000 BCE – 1500 BCE',
    color: '#8B4513',
    bgTint: 'rgba(139, 69, 19, 0.05)',
    borderColor: 'rgba(139, 69, 19, 0.25)',
    summary: 'Mastery of rock-cut stone cisterns, desilting chambers, and sophisticated baked-brick urban drainage in arid environments.',
  },
  {
    id: 'vedic',
    name: 'Later Vedic & Pre-Mauryan Mahajanapadas',
    startYear: -1500,
    endYear: -325,
    dateRangeLabel: '1500 BCE – 325 BCE',
    color: '#705335',
    bgTint: 'rgba(112, 83, 53, 0.04)',
    borderColor: 'rgba(112, 83, 53, 0.22)',
    summary: 'Development of riverine diversion canals (*kulyā*), earthen bunds (*setu*), and communal tank maintenance.',
  },
  {
    id: 'mauryan',
    name: 'Mauryan Imperial Dynasty & Ashokan Golden Age',
    startYear: -325,
    endYear: -185,
    dateRangeLabel: '322 BCE – 185 BCE',
    color: '#8B3A1C',
    bgTint: 'rgba(139, 58, 28, 0.07)',
    borderColor: 'rgba(139, 58, 28, 0.35)',
    summary: 'Continental water governance under Arthashastra statutes; imperial construction of Sudarshana Dam and Ashokan highway well grids.',
  },
  {
    id: 'early_historic',
    name: 'Post-Mauryan, Kushana & Early Sangam Era',
    startYear: -185,
    endYear: 320,
    dateRangeLabel: '185 BCE – 320 CE',
    color: '#21593A',
    bgTint: 'rgba(33, 89, 58, 0.05)',
    borderColor: 'rgba(33, 89, 58, 0.25)',
    summary: 'Technological leap in hydraulic clarification (Sringaverapura), boulder weirs on shifting sands (Kallanai), and Junagadh epigraphy.',
  },
  {
    id: 'gupta',
    name: 'Classical Gupta & Vakataka Era',
    startYear: 320,
    endYear: 650,
    dateRangeLabel: '320 CE – 650 CE',
    color: '#1E527D',
    bgTint: 'rgba(30, 82, 125, 0.05)',
    borderColor: 'rgba(30, 82, 125, 0.25)',
    summary: 'Forensic reconstruction of catastrophic dam breaches (Skandagupta 456 CE) and monumental stepped water architecture.',
  },
  {
    id: 'early_medieval',
    name: 'Early Medieval, Chola & Paramara Classical Era',
    startYear: 650,
    endYear: 1200,
    dateRangeLabel: '650 CE – 1200 CE',
    color: '#633B6E',
    bgTint: 'rgba(99, 59, 110, 0.05)',
    borderColor: 'rgba(99, 59, 110, 0.25)',
    summary: 'Megalithic mortarless cyclopean dams (King Bhoja) and continental delta tank cascading networks across Southern India.',
  },
  {
    id: 'vijayanagara',
    name: 'Late Medieval, Kakatiya & Vijayanagara Era',
    startYear: 1200,
    endYear: 1550,
    dateRangeLabel: '1200 CE – 1550 CE',
    color: '#7A3B18',
    bgTint: 'rgba(122, 59, 24, 0.06)',
    borderColor: 'rgba(122, 59, 24, 0.3)',
    summary: 'Systematization of civil engineering treatises; codification of the 12 Sādhanas & 6 Doshas at Porumamilla Tank (1369 CE).',
  },
];

export const WATER_ENGINEERING_MILESTONES: TimelineMilestone[] = [
  {
    id: 'dholavira-harvesting',
    year: -3000,
    yearLabel: 'c. 3000 BCE',
    title: 'Dholavira Cascading Reservoirs & Desilting Network',
    sanskritOrLocalName: 'धौलावीरा शैल-कृत जलाशय (Harappan Hydraulic Works)',
    period: 'Mature Harappan Period (Indus Valley Civilisation)',
    eraId: 'harappan',
    region: 'Western India',
    location: 'Khadir Bet, Kutch, Gujarat',
    category: 'reservoir_tank',
    associatedRuler: 'Harappan Municipal Engineering Guild',
    description: 'Enclosure of an entire 48-hectare island citadel with 16 interconnected rectangular rock-cut cisterns holding over 250,000 m³ of water, engineered to capture brief desert flash torrents.',
    engineeringInnovations: [
      'Circular settling wells with bottom scour plugs for centrifugal silt removal',
      'Impermeable hydraulic plastering of gypsum, lime, and dense clay',
      'Stepped sandstone ghats accommodating seasonal water level drops up to 7.5 meters',
    ],
    evidenceType: 'Archaeological Excavation',
    primarySource: 'ASI Excavations directed by Dr. R.S. Bisht (1990–2005); UNESCO World Heritage Dossier 2021',
    researchPrompt: 'Analyze the hydraulic mechanics of Dholavira’s rock-cut reservoirs, including the Mansar-Manhar diversion bunds and desilting sediment traps.',
    associatedDossierId: 'dholavira-reservoirs',
  },
  {
    id: 'mohenjodaro-drainage',
    year: -2600,
    yearLabel: 'c. 2600 BCE',
    title: 'Mohenjo-daro Great Bath & Municipal Waste Hydraulic Grid',
    sanskritOrLocalName: 'सिन्धु घाटी नगर-जल निकास प्रणाली',
    period: 'Harappan Urban Phase',
    eraId: 'harappan',
    region: 'Indus Valley',
    location: 'Larkana, Sindh (Indus Basin)',
    category: 'urban_well',
    associatedRuler: 'Harappan Urban Administrative Council',
    description: 'First documented bitumen-sealed public reservoir (Great Bath) alongside standardized kiln-fired brick drains with corbelled arches, inspection sumps, and individual household soakage jars.',
    engineeringInnovations: [
      'Double-walled burnt-brick construction sealed with natural bitumen (asphalt)',
      'Underground trunk conduits with removable stone covers for municipal cleanout',
      'Radial stepped wastewater separation pits preventing groundwater aquifer fouling',
    ],
    evidenceType: 'Archaeological Excavation',
    primarySource: 'Sir John Marshall & Ernest Mackay Excavation Reports (1931); Archaeological Survey of India Records',
    researchPrompt: 'Detail the waterproofing techniques and urban drainage calculations utilized in the Great Bath and street drains of Mohenjo-daro.',
  },
  {
    id: 'inamgaon-bunds',
    year: -1300,
    yearLabel: 'c. 1300 BCE',
    title: 'Inamgaon Canal Diversion & Earthen Embankment Bunds',
    sanskritOrLocalName: 'इनामगाँव नहर एवं मृत्तिका सेतु',
    period: 'Jorwe Culture (Post-Harappan Chalcolithic)',
    eraId: 'vedic',
    region: 'Western Deccan',
    location: 'Ghod River, Pune District, Maharashtra',
    category: 'dam_weir',
    associatedRuler: 'Deccan Chalcolithic Agrarian Community',
    description: 'Excavation of a 118-meter stone-and-mud embankment designed to divert the swollen Ghod River into artificial agrarian channel networks during monsoon floods.',
    engineeringInnovations: [
      'Gravel-and-rubble foundation ballast resisting bank scour',
      'Gravity contour canal cutting through Deccan trap alluvium',
    ],
    evidenceType: 'Archaeological Excavation',
    primarySource: 'Deccan College Postgraduate & Research Institute Excavations (Dhavalikar & Ansari, 1988)',
    researchPrompt: 'How did the Chalcolithic engineers at Inamgaon manage monsoon diversion using stone and clay bunds on the Ghod River?',
  },
  {
    id: 'sudarshana-construction',
    year: -320,
    yearLabel: 'c. 320 BCE',
    title: 'Sudarshana Dam Initial Construction by Pushyagupta',
    sanskritOrLocalName: 'सुदर्शन तटाक निर्माण (पुष्यगुप्त वैश्य)',
    period: 'Early Mauryan Empire',
    eraId: 'mauryan',
    region: 'Western India',
    location: 'Girinagara (Mount Girnar), Junagadh, Gujarat',
    category: 'dam_weir',
    associatedRuler: 'Chandragupta Maurya (Governor Pushyagupta the Vaishya)',
    description: 'Construction of a monumental earthen gravity dam faced with cyclopean granite blocks across the gorge of the Sonrekha and Palasini rivers, securing irrigation for arid Saurashtra.',
    engineeringInnovations: [
      'Keying the compacted impervious clay core into solid granite bedrock',
      'Cyclopean stone boulder revetment protecting the water face from wave erosion',
      'Impounding mountain flash floods to create multi-million cubic meter reservoir',
    ],
    evidenceType: 'Epigraphic',
    primarySource: 'Junagadh Rock Inscription of Rudradaman I (Lines 8–9, 150 CE)',
    researchPrompt: 'Examine the civil engineering contribution of Pushyagupta in constructing the original Sudarshana Dam under Chandragupta Maurya.',
    associatedDossierId: 'sudarshana-dam',
  },
  {
    id: 'kautilya-arthashastra',
    year: -300,
    yearLabel: 'c. 300 BCE',
    title: 'Kautilya’s Arthashastra Codification of Dam Statutes & Water Taxes',
    sanskritOrLocalName: 'कौटिलीय अर्थशास्त्रे जल-प्रबन्धन एवं सेतु-भेद विधि',
    period: 'Mauryan Empire',
    eraId: 'mauryan',
    region: 'Pan-Indian',
    location: 'Pataliputra, Magadha (Modern Patna, Bihar)',
    category: 'treatise_code',
    associatedRuler: 'Chanakya (Kautilya) / Chandragupta Maurya',
    description: 'The world’s first systematic legal, fiscal, and engineering code governing water infrastructure, establishing criminal penalties for dam breaching (*setubheda*) and progressive water rates (*udakabhāga*).',
    engineeringInnovations: [
      'Classification of dams into natural catchment (*sahodaka*) and river-fed canal (*āhāryodaka*) types',
      'Differential water tax scale keyed to mechanical water-lifting energy efficiency',
      'Statutory maintenance mandates enforcing collective village hydraulic upkeep (*kudimaramathu*)',
    ],
    evidenceType: 'Sanskrit Treatise',
    primarySource: 'Kautilya’s Arthashastra, Book II (Ch. 24 & Ch. 1), Book III (Ch. 9)',
    researchPrompt: 'Analyze the legal and engineering implications of Kautilya’s Arthashastra regarding dam breach penalties and irrigation tax structures.',
    associatedDossierId: 'ashoka-mauryan-hydrology',
  },
  {
    id: 'ashoka-hydrology-tusaspha',
    year: -250,
    yearLabel: 'c. 250 BCE',
    title: 'Ashoka’s Imperial Highway Well Grid & Tusaspha’s Canals',
    sanskritOrLocalName: 'अशोक स्तंभ-लेख ७ एवं तुषास्फ प्रणालिका',
    period: 'Mauryan Golden Age (Reign of Emperor Ashoka)',
    eraId: 'mauryan',
    region: 'Pan-Indian',
    location: 'Delhi-Topra Pillar / Girnar Rock / Pataliputra',
    category: 'urban_well',
    associatedRuler: 'Emperor Ashoka the Great (Yavana Governor Tusaspha)',
    description: 'Implementation of the world’s first "green transport corridor" policy: sinking terracotta ring-wells at strict half-kosa (~3.2 km) intervals with shaded cattle troughs, while Tusaspha added stone conduits to Sudarshana Dam.',
    engineeringInnovations: [
      'Standardized half-kosa (~3.2 km) well grid matching physiological human and beast transit limits',
      'Pre-fabricated modular terracotta ring-wells preventing soil collapse in Gangetic alluvium',
      'Subterranean stone sluice portals (*pranāḷikā*) distributing gravity canal water to Saurashtra fields',
    ],
    evidenceType: 'Epigraphic',
    primarySource: 'Ashoka Pillar Edict VII; Major Rock Edict II; Junagadh Rock Edict',
    researchPrompt: 'Explain how Emperor Ashoka’s half-kosa well grid and Tusaspha’s canal works demonstrated imperial state planning in ancient water infrastructure.',
    associatedDossierId: 'ashoka-mauryan-hydrology',
  },
  {
    id: 'sringaverapura-complex',
    year: -100,
    yearLabel: 'c. 100 BCE',
    title: 'Sringaverapura Three-Stage Hydraulic Clarification Plant',
    sanskritOrLocalName: 'शृङ्गवेरपुर जल शोधन एवं अवसादन कुण्ड',
    period: 'Sunga / Kushana Period',
    eraId: 'early_historic',
    region: 'Northern India',
    location: 'Prayagraj (Allahabad District), Uttar Pradesh',
    category: 'reservoir_tank',
    associatedRuler: 'Early Historic Gangetic Civil Guilds',
    description: 'An immaculate 250-meter-long kiln-fired brick clarification plant engineered to harvest turbid Ganga monsoon floodwaters, spinning out heavy sand in a circular vortex well before cascading clear water into storage tanks.',
    engineeringInnovations: [
      'Centrifugal vortex deceleration pit (*kūpa*) dropping bed-load silt without choking storage tanks',
      'Broad-crested stepped cascade brick weirs aerating and skimming top clarified water',
      'Tail-end stone emergency surplus spillway routing return flood surges safely to the Ganga',
    ],
    evidenceType: 'Archaeological Excavation',
    primarySource: 'ASI Excavations under Prof. B.B. Lal (Ramayana Sites Project 1977–1986)',
    researchPrompt: 'Analyze the hydraulic settling physics and brick masonry design of the Sringaverapura desilting installation on the Ganga River.',
    associatedDossierId: 'sringaverapura-tank',
  },
  {
    id: 'rudradaman-repair',
    year: 150,
    yearLabel: '150 CE',
    title: 'Rudradaman I’s Junagadh Rock Edict: Forensic Dam Reconstruction',
    sanskritOrLocalName: 'रुद्रदामन जूनागढ़ शिलालेख (सुविशाख पुनर्निर्माण)',
    period: 'Western Kshatrapa Dynasty (Saka Era 72)',
    eraId: 'early_historic',
    region: 'Western India',
    location: 'Mount Girnar, Junagadh, Gujarat',
    category: 'dam_weir',
    associatedRuler: 'Mahakshatrapa Rudradaman I (Minister Suvisakha)',
    description: 'Earliest documented hydraulic forensic case in world history: a catastrophic monsoon storm destroyed Sudarshana Dam with a 420-cubit breach. Rudradaman rebuilt it with triple the embankment width without taxing the populace.',
    engineeringInnovations: [
      'Tripling the cross-sectional base width of the earthen embankment to counteract sliding shear',
      'Solid granite masonry spillway design preventing recurrence of overtopping breach',
      'Complete epigraphic logging of failure mode, dimensions, and administrative costs',
    ],
    evidenceType: 'Epigraphic',
    primarySource: 'Junagadh Rock Inscription of Rudradaman I (Epigraphia Indica Vol. VIII)',
    researchPrompt: 'Detail the hydraulic failure mechanism of Sudarshana Dam in 150 CE and how Minister Suvisakha re-engineered its embankment to resist hydrostatic thrust.',
    associatedDossierId: 'sudarshana-dam',
  },
  {
    id: 'kallanai-grand-anicut',
    year: 160,
    yearLabel: 'c. 160 CE',
    title: 'Kallanai (Grand Anicut) on Shifting River Sand Bedrock',
    sanskritOrLocalName: 'கல்லணை (கரிகால சோழன் பெருமணை)',
    period: 'Early Chola Dynasty (Sangam Period)',
    eraId: 'early_historic',
    region: 'Southern India',
    location: 'Kaveri River Delta, Tiruchirappalli / Thanjavur, Tamil Nadu',
    category: 'dam_weir',
    associatedRuler: 'King Karikalan Chola',
    description: 'The world’s oldest continuously operational water-diversion weir: a 329-meter serpentine granite weir sunk directly into shifting alluvial quicksand, stabilizing the Kaveri delta into the "Rice Bowl of Tamil Nadu".',
    engineeringInnovations: [
      'Self-anchoring boulder technology: sinking cyclopean unhewn stones by water scour into quicksand',
      'Curved serpentine crest profile deflecting high-velocity flood vectors away from fragile riverbanks',
      'Downstream cut-stone masonry apron creating a hydraulic jump energy-dissipation basin',
    ],
    evidenceType: 'Multi-Source',
    primarySource: 'Sangam Literature (*Pattinappalai* v. 280–285); Sir Arthur Cotton Civil Engineering Reports (1836)',
    researchPrompt: 'Explain how King Karikalan Chola solved the problem of building Kallanai directly on shifting river sand without solid bedrock.',
    associatedDossierId: 'kallanai-grand-anicut',
  },
  {
    id: 'skandagupta-reconstruction',
    year: 456,
    yearLabel: '456 CE',
    title: 'Skandagupta’s Stone Reconstruction of Sudarshana Dam',
    sanskritOrLocalName: 'स्कन्दगुप्त जूनागढ़ अभिलेख (चक्रपालित सेतु निर्माण)',
    period: 'Classical Gupta Empire (Gupta Year 137)',
    eraId: 'gupta',
    region: 'Western India',
    location: 'Mount Girnar, Junagadh, Gujarat',
    category: 'dam_weir',
    associatedRuler: 'Emperor Skandagupta (Governor Chakrapalita)',
    description: 'Following a second unprecedented deluge in 455 CE that ruptured the dam, Chakrapalita mobilized masons to complete an entirely new dressed-stone masonry embankment within just two dry months.',
    engineeringInnovations: [
      'Transition from compacted earth core to interlocking dressed stone masonry gravity barrier',
      'Rapid seasonal construction schedule (60 days) to beat the subsequent monsoon spate',
      'Erection of the Vishnu Chakrabhrit temple on the embankment crest symbolizing divine water vigilance',
    ],
    evidenceType: 'Epigraphic',
    primarySource: 'Junagadh Inscription of Skandagupta (Corpus Inscriptionum Indicarum Vol. III)',
    researchPrompt: 'Contrast the 456 CE Gupta reconstruction of Sudarshana Dam under Chakrapalita with the earlier 150 CE Kshatrapa repair under Rudradaman.',
    associatedDossierId: 'sudarshana-dam',
  },
  {
    id: 'bhojpur-cyclopean-dam',
    year: 1025,
    yearLabel: 'c. 1025 CE',
    title: 'Bhojpur Megalithic Cyclopean Dam & Bhojtal Reservoir',
    sanskritOrLocalName: 'भोजपुर महासेतु एवं समराङ्गण सूत्रधार विधान',
    period: 'Paramara Dynasty',
    eraId: 'early_medieval',
    region: 'Central India',
    location: 'Betwa River, Raisen / Bhopal, Madhya Pradesh',
    category: 'dam_weir',
    associatedRuler: 'King Bhoja of Dhar (Paramara Polymath & Architect)',
    description: 'King Bhoja built two cyclopean stone gravity dams spanning narrow bottlenecks between sandstone hills, impounding the Betwa headwaters into a 650 sq km inland reservoir (Lake of Bhojpur).',
    engineeringInnovations: [
      'Mortarless cyclopean masonry using dressed sandstone blocks up to 4m long weighing over 10 tons',
      'Impervious clay puddle core sandwiched between double-faced megalithic ramparts',
      'Topographically isolated saddle spillway preventing overtopping during 100-year monsoon floods',
    ],
    evidenceType: 'Multi-Source',
    primarySource: 'King Bhoja’s *Samarāṅgaṇa Sūtradhāra*; Lt. Kincaid ASI Survey (1888); Abu’l-Fazl’s *Ain-i-Akbari*',
    researchPrompt: 'Analyze the civil engineering principles documented in Bhoja’s Samarāṅgaṇa Sūtradhāra and realized at the Bhojpur Cyclopean Dam.',
    associatedDossierId: 'bhojpur-cyclopean-dam',
  },
  {
    id: 'cholagangam-ponneri',
    year: 1080,
    yearLabel: 'c. 1080 CE',
    title: 'Rajendra Chola’s Cholagangam (Ponneri Lake) 16-Mile Bund',
    sanskritOrLocalName: 'சோழகங்கம் (பொன்னேரி ஏரி) - ராஜேந்திர சோழன்',
    period: 'Imperial Chola Empire',
    eraId: 'early_medieval',
    region: 'Southern India',
    location: 'Gangaikonda Cholapuram, Ariyalur District, Tamil Nadu',
    category: 'reservoir_tank',
    associatedRuler: 'Emperor Rajendra Chola I',
    description: 'Built as a "liquid pillar of victory" after his northern expedition to the River Ganga, Rajendra Chola raised a 16-mile-long (25 km) embankment impounding Kollidam flood waters to water hundreds of villages.',
    engineeringInnovations: [
      'Contour alignment over 25 kilometers maintaining uniform hydraulic gradient across delta plains',
      'Granite sluice gate portals (*tūmu*) equipped with stone plug-lifters for precise volumetric distribution',
      'Twin surplus weirs designed to safely discharge sudden monsoonal cyclones',
    ],
    evidenceType: 'Epigraphic',
    primarySource: 'Tiruvalangadu Copper Plates; Archaeological Survey of India South Indian Inscriptions Vol. II',
    researchPrompt: 'Describe the scale and canal distribution network of Rajendra Chola’s Cholagangam (Ponneri) reservoir at Gangaikonda Cholapuram.',
  },
  {
    id: 'porumamilla-tank',
    year: 1369,
    yearLabel: '1369 CE',
    title: 'Porumamilla Tank (Anantarajasagara) & the 12 Sādhanas Code',
    sanskritOrLocalName: 'पोरुमामिळ्ळ अनन्तराजसागर (द्वादश साधनानि षड् दोषाः)',
    period: 'Vijayanagara Empire (Saka 1291)',
    eraId: 'vijayanagara',
    region: 'Southern India',
    location: 'Pennar Basin (Maldevi River), Kadapa, Andhra Pradesh',
    category: 'treatise_code',
    associatedRuler: 'Prince Bhaskara Bhavadurga (Son of Emperor Bukka I)',
    description: 'A 1,400-meter embankment dam intact after 650 years, featuring the world’s most comprehensive epigraphical code of dam engineering: codifying the 12 Essential Sādhanas (virtues) and 6 Fatal Doshas (flaws).',
    engineeringInnovations: [
      'Twin natural rock-cut waste weirs (*kalingu*) anchored into living mountain bedrock away from earth bund',
      'Stepped cyclopean granite boulder pitching on upstream face counteracting wave impact',
      'Granite tower sluices (*tūmu*) with vertical control plugs and conduit tunnels',
    ],
    evidenceType: 'Epigraphic',
    primarySource: 'Porumamilla Sanskrit Stone Inscription (Epigraphia Indica Vol. XIV, pp. 97–109)',
    researchPrompt: 'Analyze the 12 Sādhanas and 6 Doshas codified in the 1369 CE Porumamilla inscription and compare them with modern ICOLD dam engineering safety standards.',
    associatedDossierId: 'porumamilla-tank',
  },
  {
    id: 'vijayanagara-hiriya-canals',
    year: 1520,
    yearLabel: 'c. 1520 CE',
    title: 'Vijayanagara Tungabhadra Canal & Aqueduct Network',
    sanskritOrLocalName: 'विजयनगर तुङ्गभद्रा जल सेतु एवं हिरिया कालुवे',
    period: 'Vijayanagara Empire (Tuluva Dynasty)',
    eraId: 'vijayanagara',
    region: 'Southern India',
    location: 'Hampi (Vijayanagara Capital), Bellary / Vijayanagara District, Karnataka',
    category: 'dam_weir',
    associatedRuler: 'Emperor Krishnadevaraya',
    description: 'Monumental run-of-river diversion anicuts across the torrential Tungabhadra River, feeding contour stone aqueducts, royal bath complexes, and irrigation canals (Turtha, Raya, and Hiriya canals) still functioning today.',
    engineeringInnovations: [
      'Mortarless interlocking granite blocks secured with iron clamps against violent river torrents',
      'Rock-cut contour gravity canals clinging to granite cliff faces with drop-in siltation traps',
      'Siphon aqueducts conveying water across natural gorges to urban palace precincts',
    ],
    evidenceType: 'Multi-Source',
    primarySource: 'Domingo Paes & Fernão Nunes Chronicles (1520–1537); ASI Hampi Excavation Memoirs',
    researchPrompt: 'How did Emperor Krishnadevaraya engineer the Tungabhadra river anicuts and stone aqueducts to supply water to ancient Hampi?',
  },
];

/**
 * Generates an exhaustive research prompt tailored to the exact year and historical water management context
 */
export function generateYearResearchPrompt(year: number): GeneratedYearPrompt {
  const yearLabel =
    year < 0
      ? `${Math.abs(year)} BCE`
      : year === 0 || year === 1
      ? '1st Century CE (c. 1 CE)'
      : `${year} CE`;

  if (year <= -1500) {
    return {
      year,
      yearLabel,
      eraName: 'Harappan / Indus Valley Civilisation (Bronze Age)',
      historicalContext: 'Mature Harappan urban planning across the Indus Basin and semi-arid Kutch peninsula.',
      waterTechniquesSummary: 'Rock-cut rectangular stone cisterns, seasonal torrent diversion, circular desilting baffle basins with bottom scour plugs, gypsum-lime waterproof plaster, and subterranean kiln-fired brick drainage networks.',
      keySitesOrWorks: ['Dholavira Cascading Reservoirs', 'Mohenjo-daro Great Bath & Drainage Grid', 'Lothal Tidal Dockyard'],
      prompt: `Provide an exhaustive archaeological and civil engineering investigation of water management techniques in India around ${yearLabel} during the Harappan (Indus Valley) civilization. Detail the design of rock-cut stone cisterns, desilting sediment traps, stormwater drainage, and waterproofing mortars, citing excavation evidence from Dholavira and Mohenjo-daro.`,
    };
  } else if (year <= -600) {
    return {
      year,
      yearLabel,
      eraName: 'Later Vedic & Chalcolithic Period',
      historicalContext: 'Transition from Chalcolithic agrarian settlements to early Iron Age Gangetic and Deccan river valley farming.',
      waterTechniquesSummary: 'Earthen diversion embankments (setu), gravity contour irrigation channels (kulyā), manual well-lifting with balance sweeps (tulā-yantra), and seasonal monsoon river flood moderation.',
      keySitesOrWorks: ['Inamgaon Ghod River Embankment', 'Painted Grey Ware (PGW) Channels', 'Early Ganga-Yamuna Riparian Wells'],
      prompt: `Analyze agricultural water management and flood control techniques in ancient India around ${yearLabel} during the Vedic and Chalcolithic periods. Examine the civil construction of earthen embankments (setu), gravity canals (kulyā), and early lifting apparatus mentioned in Vedic texts and verified in archaeological strata.`,
    };
  } else if (year <= -325) {
    return {
      year,
      yearLabel,
      eraName: 'Mahajanapada Era (Pre-Mauryan Urbanization)',
      historicalContext: 'Formation of 16 fortified regional kingdoms (Mahajanapadas) across Northern and Central India.',
      waterTechniquesSummary: 'Urban defensive moats serving as flood bypass canals, introduction of pre-fabricated terracotta ring-wells in Gangetic alluvium, and communal irrigation management.',
      keySitesOrWorks: ['Pataliputra & Rajgir Moat Networks', 'Ujjain River Bunds', 'Gangetic Terracotta Ring-Well Grids'],
      prompt: `Examine urban water infrastructure, defensive moats, and groundwater extraction techniques around ${yearLabel} in the Mahajanapada era of ancient India. Focus on the widespread introduction of standardized terracotta ring-wells and municipal flood diversion systems prior to Mauryan imperial unification.`,
    };
  } else if (year <= -185) {
    return {
      year,
      yearLabel,
      eraName: 'Mauryan Imperial Dynasty & Ashokan Golden Age',
      historicalContext: 'Centralized continental empire under Chandragupta Maurya and Emperor Ashoka the Great.',
      waterTechniquesSummary: 'Imperial earthen gravity dam construction with cyclopean stone pitching (Sudarshana Dam at Girnar), rock-cut conduits (pranāḷikā), Ashoka’s standardized half-kosa (~3.2 km) roadside ring-well grid (Pillar Edict VII), and Kautilya’s Arthashastra dam safety laws (setubheda) and water tax rates (udakabhāga).',
      keySitesOrWorks: ['Sudarshana Dam & Lake (Mount Girnar)', 'Ashokan Highway Well Corridors (Pillar Edict VII)', 'Pataliputra 600-Foot Timber-Palisaded Moat'],
      prompt: `Provide an in-depth civil engineering and administrative analysis of Mauryan water management around ${yearLabel} under the Mauryan Empire. Detail the construction of Sudarshana Dam, Tusaspha's canal conduits, Ashoka's half-kosa highway well network (Pillar Edict VII), and Kautilya's Arthashastra statutes governing dam safety and water taxation.`,
    };
  } else if (year <= 320) {
    return {
      year,
      yearLabel,
      eraName: 'Post-Mauryan, Kushana & Early Sangam Era',
      historicalContext: 'Rise of trade networks, Kushana urbanization, Western Kshatrapa governance, and the Early Chola Sangam kingdom.',
      waterTechniquesSummary: 'Three-stage hydraulic desilting complexes with circular vortex wells (Sringaverapura on the Ganga), Karikalan Chola’s 329-meter Kallanai (Grand Anicut) boulder weir built on shifting quicksand, and the 150 CE forensic reconstruction of Sudarshana Dam by Rudradaman I.',
      keySitesOrWorks: ['Sringaverapura Brick Clarification Plant', 'Kallanai (Grand Anicut) on Kaveri River', 'Junagadh Rock Inscription Site'],
      prompt: `Analyze the hydraulic engineering innovations and river diversion structures in India around ${yearLabel} during the Early Historic period. Detail the physics of sediment clarification at Sringaverapura, the foundation mechanics of Karikalan Chola’s Kallanai weir on shifting riverbed quicksand, and Rudradaman’s forensic dam reconstruction in Gujarat.`,
    };
  } else if (year <= 550) {
    return {
      year,
      yearLabel,
      eraName: 'Classical Gupta & Vakataka Period',
      historicalContext: 'Golden age of classical Sanskrit treatises, monumental temple architecture, and dressed stone gravity dams.',
      waterTechniquesSummary: 'Transition to dressed-stone masonry dam construction under Skandagupta (456 CE Sudarshana Dam rebuilt by Chakrapalita in 60 days), early stepped well architectures, and Varahamihira’s Brihat Samhita groundwater exploration.',
      keySitesOrWorks: ['Skandagupta’s Stone Sudarshana Dam (456 CE)', 'Central Indian Stepped Reservoirs', 'Brihat Samhita Hydrologic Sites'],
      prompt: `Examine water engineering, reservoir reconstruction, and groundwater science in India around ${yearLabel} during the Classical Gupta period. Discuss Governor Chakrapalita’s 456 CE dressed-stone masonry reconstruction of Sudarshana Dam after catastrophic flood breach, and hydrologic guidance codified in Varahamihira's Brihat Samhita.`,
    };
  } else if (year <= 1200) {
    return {
      year,
      yearLabel,
      eraName: 'Early Medieval, Imperial Chola & Paramara Era',
      historicalContext: 'Peak of regional empires (Cholas, Paramaras, Pallavas, Chalukyas) engineering vast irrigation systems across river deltas and central plateaus.',
      waterTechniquesSummary: 'King Bhoja’s 1025 CE Bhojpur cyclopean dam with mortarless 10-ton sandstone blocks impounding 650 sq km, Samarāṅgaṇa Sūtradhāra civil engineering treatise, and Rajendra Chola’s 16-mile Cholagangam (Ponneri Lake) reservoir and cascade tank networks (eri).',
      keySitesOrWorks: ['Bhojpur Cyclopean Dam & Bhojtal (Betwa River)', 'Cholagangam (Ponneri Lake) Embankment', 'Thanjavur Delta Eri Cascades'],
      prompt: `Provide a forensic engineering analysis of medieval Indian hydraulic architecture around ${yearLabel}. Examine the civil construction of cyclopean mortarless gravity dams (such as King Bhoja's Bhojpur Dam on the Betwa) or massive delta tank cascades and granite sluices (tūmu) engineered during the Chola dynasty.`,
    };
  } else {
    return {
      year,
      yearLabel,
      eraName: 'Late Medieval, Kakatiya & Vijayanagara Era',
      historicalContext: 'Monumental hydraulic architecture across the semi-arid Deccan plateau under the Kakatiya and Vijayanagara empires.',
      waterTechniquesSummary: 'Prince Bhaskara’s 1369 CE Porumamilla Tank (Anantarajasagara) codifying the 12 Sādhanas & 6 Doshas of dam safety, twin rock-cut mountain spillways (kalingu), granite sluice towers (tūmu), and Krishnadevaraya’s Tungabhadra anicuts, Hiriya canals, and siphon aqueducts at Hampi.',
      keySitesOrWorks: ['Porumamilla Tank & 1369 CE Inscription', 'Vijayanagara Tungabhadra Anicuts & Hiriya Canals (Hampi)', 'Kakatiya Ramappa & Pakhal Lake Dams'],
      prompt: `Investigate the hydraulic engineering treatises, dam safety standards, and canal networks of the Vijayanagara and Kakatiya periods around ${yearLabel}. Focus on the 12 Sādhanas and 6 Doshas codified in the 1369 CE Porumamilla inscription, granite sluice tower mechanics (tūmu), and the Tungabhadra river diversion anicuts.`,
    };
  }
}

interface WaterEngineeringTimelineProps {
  onInquire?: (query: string) => void;
  onSendToChat?: (query: string) => void;
}

export const WaterEngineeringTimeline: React.FC<WaterEngineeringTimelineProps> = ({
  onInquire,
  onSendToChat,
}) => {
  const [selectedEra, setSelectedEra] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [activeMilestoneId, setActiveMilestoneId] = useState<string>('sudarshana-construction');
  const [isExpandedView, setIsExpandedView] = useState<boolean>(false);
  const [isTimelineCollapsed, setIsTimelineCollapsed] = useState<boolean>(false);

  // New Year-Prompt Generator State
  const [selectedYearPrompt, setSelectedYearPrompt] = useState<GeneratedYearPrompt | null>(null);
  const [hoverYear, setHoverYear] = useState<number | null>(null);
  const [customYearInput, setCustomYearInput] = useState<string>('250');
  const [customEraInput, setCustomEraInput] = useState<'BCE' | 'CE'>('BCE');
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Filtered milestones
  const filteredMilestones = useMemo(() => {
    return WATER_ENGINEERING_MILESTONES.filter((m) => {
      const matchEra = selectedEra === 'all' || m.eraId === selectedEra;
      const matchCat = selectedCategory === 'all' || m.category === selectedCategory;
      const matchSearch =
        !searchFilter ||
        m.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
        m.location.toLowerCase().includes(searchFilter.toLowerCase()) ||
        m.associatedRuler.toLowerCase().includes(searchFilter.toLowerCase()) ||
        m.period.toLowerCase().includes(searchFilter.toLowerCase()) ||
        m.yearLabel.toLowerCase().includes(searchFilter.toLowerCase());
      return matchEra && matchCat && matchSearch;
    });
  }, [selectedEra, selectedCategory, searchFilter]);

  const activeMilestone = useMemo(() => {
    return (
      filteredMilestones.find((m) => m.id === activeMilestoneId) ||
      filteredMilestones[0] ||
      WATER_ENGINEERING_MILESTONES[0]
    );
  }, [filteredMilestones, activeMilestoneId]);

  // Handler for clicking any specific year
  const handleSelectYear = (year: number) => {
    const generated = generateYearResearchPrompt(year);
    setSelectedYearPrompt(generated);

    // If a nearby milestone exists within 150 years, highlight it as well
    const closest = WATER_ENGINEERING_MILESTONES.reduce((prev, curr) =>
      Math.abs(curr.year - year) < Math.abs(prev.year - year) ? curr : prev
    );
    if (closest && Math.abs(closest.year - year) <= 150) {
      setActiveMilestoneId(closest.id);
    }
  };

  const handleCustomYearSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(customYearInput.replace(/\D/g, ''), 10);
    if (isNaN(num)) return;
    const computedYear = customEraInput === 'BCE' ? -Math.abs(num) : Math.abs(num);
    // Clamp between -3000 and 1550
    const clampedYear = Math.max(-3000, Math.min(1550, computedYear));
    handleSelectYear(clampedYear);
  };

  const handleCopyPrompt = async () => {
    if (!selectedYearPrompt) return;
    try {
      await navigator.clipboard.writeText(selectedYearPrompt.prompt);
      setCopyToast('Research prompt copied to clipboard!');
      setTimeout(() => setCopyToast(null), 3000);
    } catch (err) {
      setCopyToast('Failed to copy');
      setTimeout(() => setCopyToast(null), 2000);
    }
  };

  const handleDownloadPdf = () => {
    setIsGeneratingPdf(true);
    try {
      exportTimelinePdfDossier({
        milestones: filteredMilestones,
        selectedEra,
        selectedCategory,
        selectedYearPrompt,
        activeMilestone,
      });
      setCopyToast('Academic PDF dossier generated and downloaded!');
      setTimeout(() => setCopyToast(null), 3500);
    } catch (err: any) {
      console.error('PDF export error:', err);
      setCopyToast('Failed to generate PDF document');
      setTimeout(() => setCopyToast(null), 3000);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // D3 Visualization Render
  useEffect(() => {
    if (isTimelineCollapsed) return;
    const svgEl = svgRef.current;
    if (!svgEl) return;

    // Clear previous SVG contents
    d3.select(svgEl).selectAll('*').remove();

    const width = 135;
    const height = isExpandedView ? 1150 : 780;
    const margin = { top: 30, right: 15, bottom: 40, left: 80 };
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3
      .select(svgEl)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    // D3 Linear Time Scale: 3000 BCE (-3000) to 1550 CE (1550)
    const yScale = d3
      .scaleLinear()
      .domain([-3000, 1550])
      .range([margin.top, margin.top + innerHeight]);

    const g = svg.append('g');

    // 1. Render Historical Era Bands along the Y-axis
    HISTORICAL_ERAS.forEach((era) => {
      const yStart = yScale(era.startYear);
      const yEnd = yScale(era.endYear);
      const bandHeight = Math.max(8, yEnd - yStart);

      // Era subtle background strip
      g.append('rect')
        .attr('x', margin.left - 12)
        .attr('y', yStart)
        .attr('width', 24)
        .attr('height', bandHeight)
        .attr('fill', era.color)
        .attr('fill-opacity', selectedEra === era.id ? 0.35 : 0.12)
        .attr('rx', 2);
    });

    // 2. Central Vertical Axis Line
    g.append('line')
      .attr('x1', margin.left)
      .attr('y1', margin.top - 10)
      .attr('x2', margin.left)
      .attr('y2', margin.top + innerHeight + 15)
      .attr('stroke', '#B8A894')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', 'none');

    // 3. Interactive Century / Epoch Tick Marks (Clickable to generate prompt)
    const keyCenturyTicks = [
      -3000, -2500, -2000, -1500, -1000, -500, -320, -250, 1, 150, 456, 1025, 1369, 1520,
    ];

    keyCenturyTicks.forEach((tickYear) => {
      const y = yScale(tickYear);
      const label =
        tickYear < 0
          ? `${Math.abs(tickYear)} BCE`
          : tickYear === 1
          ? '1 CE'
          : `${tickYear} CE`;

      const isCurrentSelected = selectedYearPrompt?.year === tickYear;

      const tickGroup = g
        .append('g')
        .attr('class', 'year-tick-btn cursor-pointer group')
        .on('click', () => {
          handleSelectYear(tickYear);
        })
        .on('mouseenter', () => {
          setHoverYear(tickYear);
        })
        .on('mouseleave', () => {
          setHoverYear(null);
        });

      // Expanded invisible hit area for easy clicking
      tickGroup
        .append('rect')
        .attr('x', 0)
        .attr('y', y - 8)
        .attr('width', margin.left + 14)
        .attr('height', 16)
        .attr('fill', isCurrentSelected ? 'rgba(139, 58, 28, 0.15)' : 'transparent')
        .attr('rx', 3);

      // Tick mark dash
      tickGroup
        .append('line')
        .attr('x1', margin.left - 6)
        .attr('y1', y)
        .attr('x2', margin.left + 6)
        .attr('y2', y)
        .attr('stroke', isCurrentSelected ? '#8B3A1C' : '#9E8D79')
        .attr('stroke-width', isCurrentSelected ? 2.5 : tickYear === 1 ? 2 : 1);

      // Tick label text
      tickGroup
        .append('text')
        .attr('x', margin.left - 10)
        .attr('y', y + 3.2)
        .attr('text-anchor', 'end')
        .attr('font-size', isCurrentSelected ? '9px' : '8.5px')
        .attr('font-family', 'monospace')
        .attr('fill', isCurrentSelected ? '#8B3A1C' : '#574839')
        .attr('font-weight', isCurrentSelected ? '800' : '600')
        .text(label);
    });

    // 4. Clickable Full-Height Axis Overlay (allows user to click ANY year on the continuous line)
    g.append('rect')
      .attr('x', margin.left - 14)
      .attr('y', margin.top)
      .attr('width', 28)
      .attr('height', innerHeight)
      .attr('fill', 'transparent')
      .attr('class', 'cursor-pointer')
      .on('click', (event) => {
        const [, mouseY] = d3.pointer(event);
        const computedYear = Math.round(yScale.invert(mouseY));
        handleSelectYear(computedYear);
      })
      .on('mousemove', (event) => {
        const [, mouseY] = d3.pointer(event);
        const computedYear = Math.round(yScale.invert(mouseY));
        setHoverYear(computedYear);
      })
      .on('mouseleave', () => {
        setHoverYear(null);
      });

    // 5. Selected Year Indicator Line on D3 Canvas
    if (selectedYearPrompt) {
      const selY = yScale(selectedYearPrompt.year);
      const selG = g.append('g').attr('class', 'selected-year-pin select-none pointer-events-none');

      // Horizontal dashed guide line
      selG
        .append('line')
        .attr('x1', 2)
        .attr('y1', selY)
        .attr('x2', width - 2)
        .attr('y2', selY)
        .attr('stroke', '#8B3A1C')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '3,2');

      // Pulse ring at axis intersection
      selG
        .append('circle')
        .attr('cx', margin.left)
        .attr('cy', selY)
        .attr('r', 8)
        .attr('fill', 'none')
        .attr('stroke', '#8B3A1C')
        .attr('stroke-width', 2)
        .attr('opacity', 0.7)
        .attr('class', 'animate-ping');

      // Solid center pin dot
      selG
        .append('circle')
        .attr('cx', margin.left)
        .attr('cy', selY)
        .attr('r', 4.5)
        .attr('fill', '#8B3A1C')
        .attr('stroke', '#FFFFFF')
        .attr('stroke-width', 1.5);
    }

    // 6. Plot Milestones as Interactive D3 Circles on the Vertical Axis
    const nodeGroup = g
      .selectAll('.milestone-node')
      .data(WATER_ENGINEERING_MILESTONES)
      .enter()
      .append('g')
      .attr('class', 'milestone-node cursor-pointer')
      .attr('transform', (d) => `translate(${margin.left}, ${yScale(d.year)})`)
      .on('click', (_, d) => {
        setActiveMilestoneId(d.id);
        handleSelectYear(d.year);
      });

    // Pulse ring for currently active milestone
    nodeGroup
      .filter((d) => d.id === activeMilestone.id)
      .append('circle')
      .attr('r', 8)
      .attr('fill', 'none')
      .attr('stroke', '#8B3A1C')
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.6)
      .attr('class', 'animate-ping');

    // Outer circle
    nodeGroup
      .append('circle')
      .attr('r', (d) => (d.id === activeMilestone.id ? 7 : 4.5))
      .attr('fill', (d) => {
        const isMatched = filteredMilestones.some((m) => m.id === d.id);
        if (!isMatched) return '#DCD3C4';
        const era = HISTORICAL_ERAS.find((e) => e.id === d.eraId);
        return era ? era.color : '#8B3A1C';
      })
      .attr('stroke', '#FFFFFF')
      .attr('stroke-width', 1.5)
      .attr('opacity', (d) => (filteredMilestones.some((m) => m.id === d.id) ? 1 : 0.35));

    // Pointer tick extending to the right card
    nodeGroup
      .filter((d) => d.id === activeMilestone.id)
      .append('line')
      .attr('x1', 7)
      .attr('y1', 0)
      .attr('x2', margin.left + 25)
      .attr('y2', 0)
      .attr('stroke', '#8B3A1C')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '2,2');
  }, [
    activeMilestone.id,
    filteredMilestones,
    isExpandedView,
    isTimelineCollapsed,
    selectedEra,
    selectedYearPrompt?.year,
  ]);

  const handleLaunchResearch = (prompt: string) => {
    if (onInquire) {
      onInquire(prompt);
    }
  };

  const handleLaunchChat = (milestone: TimelineMilestone) => {
    if (onSendToChat) {
      const chatPrompt = `Let's discuss the water engineering milestone: ${milestone.title} (${milestone.yearLabel}, ${milestone.location}). What were its primary structural innovations, and how does the evidence in "${milestone.primarySource}" substantiate its hydraulic design?`;
      onSendToChat(chatPrompt);
    }
  };

  const getCategoryBadge = (cat: TimelineMilestone['category']) => {
    switch (cat) {
      case 'dam_weir':
        return { label: 'Gravity Dam & Weir', color: 'text-amber-900 bg-amber-50 border-amber-200' };
      case 'reservoir_tank':
        return { label: 'Reservoir & Desilting Tank', color: 'text-sky-900 bg-sky-50 border-sky-200' };
      case 'urban_well':
        return { label: 'Urban Well & Drainage Grid', color: 'text-emerald-900 bg-emerald-50 border-emerald-200' };
      case 'treatise_code':
        return { label: 'Engineering Treatise & Statutes', color: 'text-purple-900 bg-purple-50 border-purple-200' };
    }
  };

  return (
    <div className="bg-[#FAF7F0] border border-[#E0D8CB] rounded-xl overflow-hidden shadow-2xs">
      {/* Toast Notification */}
      {copyToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#241B13] text-[#F9F5EE] px-4 py-2 rounded-lg text-xs shadow-xl border border-[#8B3A1C]/50 flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{copyToast}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="p-4 sm:p-5 border-b border-[#E8E0D2] bg-[#F5EFE3]/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#8B3A1C] text-white flex items-center justify-center shrink-0 shadow-xs">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif font-bold text-base sm:text-lg text-[#2A2118]">
                Chronological Water Engineering Timeline (3000 BCE – 1500 CE)
              </h3>
              <span className="hidden md:inline px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[#EAE0CF] text-[#695847] border border-[#D8CCBA]">
                D3 Interactive Scale
              </span>
            </div>
            <p className="text-xs text-[#706354] mt-0.5">
              Click any year, epoch tick, or axis position to generate an in-depth research inquiry on that exact historical period.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf || filteredMilestones.length === 0}
            className="p-1.5 rounded text-[#5E5143] hover:bg-[#EAE1D2] disabled:opacity-50 transition-colors cursor-pointer border border-[#DDD3C2] flex items-center gap-1 text-xs font-medium"
            title="Download currently visualized period data as a formatted PDF dossier"
          >
            {isGeneratingPdf ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#8B3A1C]" />
            ) : (
              <FileDown className="w-3.5 h-3.5 text-[#8B3A1C]" />
            )}
            <span className="hidden sm:inline">PDF Dossier</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExpandedView(!isExpandedView)}
            className="p-1.5 rounded text-[#5E5143] hover:bg-[#EAE1D2] transition-colors cursor-pointer border border-[#DDD3C2] flex items-center gap-1 text-xs font-medium"
            title={isExpandedView ? 'Compact timeline' : 'Expand full height timeline'}
          >
            {isExpandedView ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Compact</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Expand</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsTimelineCollapsed(!isTimelineCollapsed)}
            className="p-1.5 rounded text-[#5E5143] hover:bg-[#EAE1D2] transition-colors cursor-pointer border border-[#DDD3C2]"
            title={isTimelineCollapsed ? 'Expand timeline' : 'Collapse timeline'}
          >
            {isTimelineCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {!isTimelineCollapsed && (
        <div className="p-4 sm:p-5 space-y-4">
          {/* YEAR PROMPT GENERATOR QUICK-PICK & CUSTOM YEAR BAR */}
          <div className="p-3 bg-[#F4EEE2] border border-[#E3DAC9] rounded-lg space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#8B3A1C]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Click Any Year to Generate Period-Specific Research Prompt:</span>
              </div>

              {/* Custom Year Input Form */}
              <form onSubmit={handleCustomYearSubmit} className="flex items-center gap-1.5 text-xs">
                <span className="text-[#695A4B] font-medium hidden sm:inline">Or exact year:</span>
                <input
                  type="text"
                  value={customYearInput}
                  onChange={(e) => setCustomYearInput(e.target.value)}
                  placeholder="e.g. 250"
                  className="w-16 px-2 py-1 bg-white border border-[#D5C9B7] rounded text-center text-xs font-mono font-bold text-[#2A2016] focus:border-[#8B3A1C] outline-none"
                />
                <select
                  value={customEraInput}
                  onChange={(e) => setCustomEraInput(e.target.value as 'BCE' | 'CE')}
                  className="px-1.5 py-1 bg-white border border-[#D5C9B7] rounded text-xs font-semibold text-[#403325] cursor-pointer outline-none"
                >
                  <option value="BCE">BCE</option>
                  <option value="CE">CE</option>
                </select>
                <button
                  type="submit"
                  className="px-2.5 py-1 bg-[#8B3A1C] hover:bg-[#722F16] text-white rounded font-medium text-xs transition-colors cursor-pointer shadow-2xs"
                >
                  Generate
                </button>
              </form>
            </div>

            {/* Quick Milestone Year Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[11px] text-[#695A4B] mr-1">Turnpoints:</span>
              {[
                { year: -3000, label: '3000 BCE (Dholavira)' },
                { year: -2600, label: '2600 BCE (Mohenjo-daro)' },
                { year: -1300, label: '1300 BCE (Inamgaon)' },
                { year: -320, label: '320 BCE (Sudarshana)' },
                { year: -250, label: '250 BCE (Ashoka)' },
                { year: -100, label: '100 BCE (Sringaverapura)' },
                { year: 150, label: '150 CE (Rudradaman)' },
                { year: 160, label: '160 CE (Kallanai)' },
                { year: 456, label: '456 CE (Skandagupta)' },
                { year: 1025, label: '1025 CE (Bhojpur)' },
                { year: 1080, label: '1080 CE (Cholagangam)' },
                { year: 1369, label: '1369 CE (Porumamilla)' },
                { year: 1520, label: '1520 CE (Vijayanagara)' },
              ].map((item) => (
                <button
                  key={item.year}
                  type="button"
                  onClick={() => handleSelectYear(item.year)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all cursor-pointer border ${
                    selectedYearPrompt?.year === item.year
                      ? 'bg-[#8B3A1C] text-white border-[#8B3A1C] font-bold shadow-2xs'
                      : 'bg-white text-[#4A3D2F] border-[#DDD2BF] hover:border-[#8B3A1C] hover:bg-[#FCFBF8]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* DYNAMIC GENERATED YEAR RESEARCH PROMPT BANNER */}
          {selectedYearPrompt && (
            <div className="bg-[#FFFDF9] border-2 border-[#8B3A1C]/60 rounded-xl p-4 sm:p-5 shadow-sm space-y-3 animate-fade-in relative">
              <button
                type="button"
                onClick={() => setSelectedYearPrompt(null)}
                className="absolute top-3.5 right-3.5 p-1.5 rounded-full hover:bg-[#EFE8DD] text-[#736353] hover:text-[#251D16] transition-colors cursor-pointer"
                title="Dismiss generated prompt"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pr-8">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded bg-[#8B3A1C] text-white font-mono font-bold text-xs shadow-2xs">
                    {selectedYearPrompt.yearLabel}
                  </span>
                  <h4 className="font-serif font-bold text-base text-[#281F16]">
                    Generated Water Engineering Research Prompt
                  </h4>
                </div>
                <span className="text-xs font-semibold text-[#8B3A1C] bg-[#F7EFE4] px-2 py-0.5 rounded border border-[#EADBCA]">
                  {selectedYearPrompt.eraName}
                </span>
              </div>

              {/* Historical Context & Water Techniques Strip */}
              <div className="p-3 bg-[#F9F5EC] border border-[#E5DAC8] rounded-lg text-xs space-y-1.5">
                <p className="text-[#4E3F31]">
                  <strong>Period Context:</strong> {selectedYearPrompt.historicalContext}
                </p>
                <p className="text-[#4E3F31]">
                  <strong>Prevalent Hydraulic Techniques:</strong> {selectedYearPrompt.waterTechniquesSummary}
                </p>
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-[#736454]">Representative Works:</span>
                  {selectedYearPrompt.keySitesOrWorks.map((site, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded bg-white text-[#382D20] text-[11px] border border-[#DDD2C0]"
                    >
                      {site}
                    </span>
                  ))}
                </div>
              </div>

              {/* The Actionable Research Prompt Block */}
              <div className="p-3.5 bg-[#FAF6EE] border border-[#DDD0BC] rounded-lg text-xs sm:text-sm font-serif italic text-[#261E16] leading-relaxed relative group">
                "{selectedYearPrompt.prompt}"
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <span className="text-[11px] text-[#706152] flex items-center gap-1">
                  <CornerDownRight className="w-3.5 h-3.5 text-[#8B3A1C]" />
                  Launch directly into the scholarly research engine or multi-turn discussion:
                </span>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyPrompt}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#4D3F30] bg-[#EFE8DD] hover:bg-[#E4DBCC] transition-colors cursor-pointer border border-[#DCD0BE] flex items-center gap-1.5"
                    title="Copy generated research prompt"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Prompt</span>
                  </button>

                  {onSendToChat && (
                    <button
                      type="button"
                      onClick={() => onSendToChat(selectedYearPrompt.prompt)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#4D3F30] bg-[#EFE8DD] hover:bg-[#E4DBCC] transition-colors cursor-pointer border border-[#DCD0BE] flex items-center gap-1.5"
                      title="Discuss this period in Gemini Multi-Turn Chat"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-[#8B3A1C]" />
                      <span>Discuss in Chat</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleLaunchResearch(selectedYearPrompt.prompt)}
                    className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#8B3A1C] hover:bg-[#702F17] text-white transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
                    title="Execute search in AI Research Engine"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>Inquire with Research Assistant &rarr;</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Era & Category Filter Strip (Anti-slop clean buttons) */}
          <div className="space-y-2.5 pb-3 border-b border-[#ECE2D2]">
            {/* Historical Eras Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <span className="text-xs font-semibold text-[#544638] flex items-center gap-1 shrink-0">
                <Calendar className="w-3.5 h-3.5 text-[#8B3A1C]" />
                Filter by Era:
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedEra('all')}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer border ${
                    selectedEra === 'all'
                      ? 'bg-[#8B3A1C] text-white border-[#8B3A1C] shadow-2xs'
                      : 'bg-[#EFE9DC] text-[#4F4133] border-[#DDD2BF] hover:bg-[#E5DDCB]'
                  }`}
                >
                  All Eras (3000 BCE – 1500 CE)
                </button>
                {HISTORICAL_ERAS.map((era) => (
                  <button
                    key={era.id}
                    type="button"
                    onClick={() => setSelectedEra(era.id)}
                    className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer border ${
                      selectedEra === era.id
                        ? 'bg-[#8B3A1C] text-white border-[#8B3A1C] shadow-2xs'
                        : 'bg-[#EFE9DC] text-[#4F4133] border-[#DDD2BF] hover:bg-[#E5DDCB]'
                    }`}
                  >
                    {era.name.split('/')[0].trim()}
                  </button>
                ))}
              </div>
            </div>

            {/* Category & Search Filter Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-semibold text-[#544638] flex items-center gap-1 mr-1">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[#8B3A1C]" />
                  Structure Type:
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className={`px-2 py-0.5 rounded text-xs transition-colors cursor-pointer ${
                    selectedCategory === 'all'
                      ? 'bg-[#403326] text-white font-semibold'
                      : 'text-[#615243] hover:bg-[#EAE2D3]'
                  }`}
                >
                  All Types
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCategory('dam_weir')}
                  className={`px-2 py-0.5 rounded text-xs transition-colors cursor-pointer ${
                    selectedCategory === 'dam_weir'
                      ? 'bg-[#403326] text-white font-semibold'
                      : 'text-[#615243] hover:bg-[#EAE2D3]'
                  }`}
                >
                  Gravity Dams & Weirs
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCategory('reservoir_tank')}
                  className={`px-2 py-0.5 rounded text-xs transition-colors cursor-pointer ${
                    selectedCategory === 'reservoir_tank'
                      ? 'bg-[#403326] text-white font-semibold'
                      : 'text-[#615243] hover:bg-[#EAE2D3]'
                  }`}
                >
                  Reservoirs & Clarification
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCategory('urban_well')}
                  className={`px-2 py-0.5 rounded text-xs transition-colors cursor-pointer ${
                    selectedCategory === 'urban_well'
                      ? 'bg-[#403326] text-white font-semibold'
                      : 'text-[#615243] hover:bg-[#EAE2D3]'
                  }`}
                >
                  Highway Wells & Drainage
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCategory('treatise_code')}
                  className={`px-2 py-0.5 rounded text-xs transition-colors cursor-pointer ${
                    selectedCategory === 'treatise_code'
                      ? 'bg-[#403326] text-white font-semibold'
                      : 'text-[#615243] hover:bg-[#EAE2D3]'
                  }`}
                >
                  Treatises & Codes
                </button>
              </div>

              {/* Search Within Timeline */}
              <div className="relative min-w-[200px]">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8A7969]" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Search milestone or ruler..."
                  className="w-full bg-white border border-[#D5CABB] rounded pl-8 pr-3 py-1 text-xs text-[#2A2118] placeholder-[#9E9080] outline-none focus:border-[#8B3A1C]"
                />
              </div>
            </div>
          </div>

          {/* MAIN D3 VISUALIZATION & INTERACTIVE RESEARCH SPLIT VIEW */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Column A: D3 Vertical Timeline Axis & Milestone Scrubbing Bar (5 Cols on LG) */}
            <div className="lg:col-span-5 bg-white border border-[#E0D7C6] rounded-xl p-3 sm:p-4 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#EFE8DD] text-xs text-[#6B5D4E]">
                <span className="font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#8B3A1C]" />
                  Chronological Axis (Click year to generate prompt)
                </span>
                <span className="text-[11px] font-mono text-[#8C7A68]">
                  {hoverYear !== null
                    ? hoverYear < 0
                      ? `Hover: ${Math.abs(hoverYear)} BCE`
                      : `Hover: ${hoverYear} CE`
                    : `${filteredMilestones.length} Milestones`}
                </span>
              </div>

              <div className="flex items-start gap-2">
                {/* D3 Rendered SVG Scale */}
                <div
                  ref={containerRef}
                  className="w-32 sm:w-36 shrink-0 flex justify-center select-none relative"
                  style={{ height: isExpandedView ? '1050px' : '720px' }}
                >
                  <svg ref={svgRef} className="w-full h-full" />
                </div>

                {/* Milestone Fast-Jump List */}
                <div
                  className="flex-1 overflow-y-auto space-y-1.5 pr-1"
                  style={{ maxHeight: isExpandedView ? '1050px' : '720px' }}
                >
                  {filteredMilestones.map((m) => {
                    const isSelected = m.id === activeMilestone.id;
                    const era = HISTORICAL_ERAS.find((e) => e.id === m.eraId);
                    return (
                      <div
                        key={m.id}
                        onClick={() => {
                          setActiveMilestoneId(m.id);
                          handleSelectYear(m.year);
                        }}
                        className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#FAF4EB] border-[#8B3A1C] shadow-2xs ring-1 ring-[#8B3A1C]/30'
                            : 'bg-[#FDFCFA] border-[#E8DFC0]/70 hover:border-[#CFC3AE] hover:bg-[#F9F5EC]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectYear(m.year);
                            }}
                            className="font-mono text-[11px] font-bold text-[#8B3A1C] hover:underline"
                            title="Click year to generate period prompt"
                          >
                            {m.yearLabel}
                          </span>
                          <span className="text-[10px] text-[#786959] truncate max-w-[100px]">
                            {m.region}
                          </span>
                        </div>
                        <h5 className="font-serif font-bold text-xs text-[#281F17] line-clamp-1 mt-0.5">
                          {m.title}
                        </h5>
                        <div className="flex items-center gap-1.5 text-[10px] text-[#695B4C] mt-1">
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: era?.color || '#8B3A1C' }}
                          />
                          <span className="truncate">{m.associatedRuler}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Epoch Indicator Footer */}
              <div className="mt-3 pt-2 border-t border-[#EFE8DD] flex items-center justify-between text-[11px] text-[#7A6B5B]">
                <button
                  type="button"
                  onClick={() => handleSelectYear(-3000)}
                  className="hover:text-[#8B3A1C] cursor-pointer"
                >
                  3000 BCE (Dholavira)
                </button>
                <span>&bull;</span>
                <button
                  type="button"
                  onClick={() => handleSelectYear(-250)}
                  className="hover:text-[#8B3A1C] cursor-pointer"
                >
                  250 BCE (Ashoka)
                </button>
                <span>&bull;</span>
                <button
                  type="button"
                  onClick={() => handleSelectYear(1520)}
                  className="hover:text-[#8B3A1C] cursor-pointer"
                >
                  1520 CE (Hampi)
                </button>
              </div>
            </div>

            {/* Column B: Active Milestone Deep Engineering Dossier & Research Launcher (7 Cols on LG) */}
            <div className="lg:col-span-7 bg-[#FFFFFF] border border-[#DDD3C2] rounded-xl p-5 shadow-xs space-y-4">
              {/* Milestone Header */}
              <div className="space-y-1.5 pb-3 border-b border-[#ECE2D1]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectYear(activeMilestone.year)}
                      className="font-mono font-bold text-sm text-[#8B3A1C] bg-[#F7EFE4] hover:bg-[#EADBCA] px-2.5 py-0.5 rounded border border-[#E8DAC8] transition-colors cursor-pointer flex items-center gap-1"
                      title="Click to generate tailored research prompt for this year"
                    >
                      <Sparkles className="w-3 h-3 text-[#8B3A1C]" />
                      <span>{activeMilestone.yearLabel}</span>
                    </button>
                    <span className="text-xs text-[#5D4E3E] font-medium">
                      {activeMilestone.period}
                    </span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                      getCategoryBadge(activeMilestone.category).color
                    }`}
                  >
                    {getCategoryBadge(activeMilestone.category).label}
                  </span>
                </div>

                <h4 className="text-xl sm:text-2xl font-serif font-bold text-[#231A12] leading-tight">
                  {activeMilestone.title}
                </h4>

                {activeMilestone.sanskritOrLocalName && (
                  <p className="font-serif italic text-xs sm:text-sm text-[#665747]">
                    {activeMilestone.sanskritOrLocalName}
                  </p>
                )}
              </div>

              {/* Specifications Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-lg bg-[#F8F4EC] border border-[#E2D8C6] text-xs">
                <div>
                  <span className="block text-[#706253] font-semibold flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#8B3A1C]" />
                    Location:
                  </span>
                  <span className="font-medium text-[#292017]">{activeMilestone.location}</span>
                </div>

                <div>
                  <span className="block text-[#706253] font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#8B3A1C]" />
                    Dynasty / Builder:
                  </span>
                  <span className="font-medium text-[#292017]">{activeMilestone.associatedRuler}</span>
                </div>

                <div>
                  <span className="block text-[#706253] font-semibold flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-[#8B3A1C]" />
                    Evidence Type:
                  </span>
                  <span className="font-medium text-[#292017]">{activeMilestone.evidenceType}</span>
                </div>
              </div>

              {/* Engineering Overview */}
              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#6F5F4F]">
                  Hydraulic Context & Design Purpose:
                </span>
                <p className="text-sm text-[#382E23] leading-relaxed">
                  {activeMilestone.description}
                </p>
              </div>

              {/* Identified Engineering Innovations */}
              <div className="space-y-2 pt-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#6F5F4F] flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#8B3A1C]" />
                  Key Civil Engineering Innovations:
                </span>
                <div className="space-y-1.5">
                  {activeMilestone.engineeringInnovations.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-[#FAF6EE] border border-[#E4DCCF] text-xs text-[#352B20] flex items-start gap-2"
                    >
                      <span className="w-4 h-4 rounded-full bg-[#8B3A1C]/15 text-[#8B3A1C] font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Primary Source Epigraphy & Stratigraphy */}
              <div className="p-3 bg-[#F2ECE0] rounded-lg border border-[#DDD1BF] text-xs text-[#45382B] space-y-1">
                <span className="font-semibold text-[#292017] flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#8B3A1C]" />
                  Primary Epigraphical & Excavation Citation:
                </span>
                <p className="font-serif italic leading-relaxed text-[#3B2F23]">
                  "{activeMilestone.primarySource}"
                </p>
              </div>

              {/* Interactive Research Launchers */}
              <div className="pt-3 border-t border-[#EAE0D1] flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => handleSelectYear(activeMilestone.year)}
                  className="text-xs text-[#8B3A1C] hover:text-[#5F2410] font-medium flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate Custom Prompt for {activeMilestone.yearLabel} &rarr;</span>
                </button>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleLaunchChat(activeMilestone)}
                    className="px-3 py-1.5 text-xs font-medium text-[#46382A] bg-[#EFE8DC] hover:bg-[#E5DAC8] rounded transition-colors flex items-center gap-1.5 cursor-pointer border border-[#DDD1BF]"
                    title="Discuss with Gemini LLM"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-[#8B3A1C]" />
                    <span>Discuss in Chat</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLaunchResearch(activeMilestone.researchPrompt)}
                    className="px-4 py-1.5 text-xs font-semibold text-[#FBF9F5] bg-[#8B3A1C] hover:bg-[#722E15] rounded transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                    title="Send targeted research inquiry to AI Research Engine"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>Inquire in Research Assistant &rarr;</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ACADEMIC PDF DOSSIER DOWNLOAD BANNER BELOW THE D3 TIMELINE */}
          <div className="pt-3 border-t border-[#E5DAC6]">
            <div className="bg-[#F8F4EC] border border-[#DDD0BC] rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#8B3A1C]/10 text-[#8B3A1C] flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <h4 className="font-serif font-bold text-sm sm:text-base text-[#292016]">
                    Academic Reference PDF Dossier
                  </h4>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#EFE6D8] text-[#695847] border border-[#D8CCBA]">
                    {filteredMilestones.length} Works Visualized
                  </span>
                </div>
                <p className="text-xs text-[#635446] leading-relaxed">
                  Download the currently visualized period data (
                  <strong className="text-[#2F241A]">
                    {selectedEra === 'all'
                      ? '3000 BCE – 1500 CE (All Eras)'
                      : HISTORICAL_ERAS.find((e) => e.id === selectedEra)?.name || selectedEra}
                  </strong>
                  {selectedCategory !== 'all' && (
                    <>
                      {' '}· <span className="capitalize">{selectedCategory.replace('_', ' ')}</span>
                    </>
                  )}
                  ) as an authoritative, publication-ready PDF dossier complete with primary inscriptional citations, ASI excavation logs, civil engineering specifications, and academic bibliography.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isGeneratingPdf || filteredMilestones.length === 0}
                  className="px-4 py-2.5 rounded-lg text-xs font-semibold bg-[#8B3A1C] hover:bg-[#722E15] disabled:bg-[#C9BFB2] text-white transition-all cursor-pointer shadow-xs flex items-center gap-2"
                  title="Download the currently visualized period data as a formatted PDF dossier for academic reference"
                >
                  {isGeneratingPdf ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generating Academic PDF...</span>
                    </>
                  ) : (
                    <>
                      <FileDown className="w-4 h-4" />
                      <span>Download Academic PDF Dossier</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
