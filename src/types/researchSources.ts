/**
 * Research Source Types
 * Unified source model for all research pipelines — web grounding, primary epigraphical references,
 * ASI excavation reports, classical treatises, and academic publications.
 */

export type SourceType =
  | 'primary_epigraphical'   // Rock inscriptions, copper plates (Junagadh, Porumamilla, etc.)
  | 'primary_manuscript'     // Classical Sanskrit treatises (Brihat Samhita, Arthashastra, etc.)
  | 'archaeological_report'  // ASI excavation memoirs and stratigraphic reports
  | 'academic_paper'         // Peer-reviewed journal articles
  | 'book'                   // Scholarly monographs and published books
  | 'government'             // Government publications (ASI, UNESCO, etc.)
  | 'web'                    // General web / search-grounded pages
  | 'other';

export interface ResearchSource {
  id: string;                        // Stable unique ID (url-hash or citation ref)
  title: string;                     // Full source title
  url: string;                       // Primary URL — must be a real, non-fabricated URL
  domain?: string;                   // Extracted domain (e.g. "asi.nic.in")
  favicon?: string;                  // Favicon URL (https://www.google.com/s2/favicons?domain=...)
  snippet?: string;                  // Relevant excerpt supporting the claim
  author?: string;                   // Author(s) if known
  publishedAt?: string;              // Publication / inscription date string
  sourceType: SourceType;            // Classification
  isPrimary: boolean;                // true = Primary source, false = Secondary/Tertiary
  citationIds?: string[];            // Which [n] citation numbers this source backs
  relevanceNote?: string;            // Why this source is relevant to the query
  confidence?: number;               // 🎯 Confidence score (e.g. 95)
  justification?: string;            // 🔎 Concise justification of the evidence/reasoning
  evidenceTrail?: string[];          // 🧩 Visual evidence trail icons/tags (e.g. ['📜 Historical Records', '🏺 Archaeological Evidence'])
  uncertainty?: string;              // ⚠️ Conflicting evidence, missing data, or limitations
}

// Known stable URLs for primary historical sources used across the dossier system
export const KNOWN_PRIMARY_SOURCE_URLS: Record<string, {
  url: string;
  domain: string;
  author?: string;
  publishedAt?: string;
  confidence?: number;
  justification?: string;
  evidenceTrail?: string[];
  uncertainty?: string;
}> = {
  'Varahamihira Brihat Samhita': {
    url: 'https://www.wisdomlib.org/hinduism/book/brihat-samhita',
    domain: 'wisdomlib.org',
    author: 'Varahamihira (6th century CE)',
    publishedAt: 'c. 550 CE',
    confidence: 96,
    justification: 'Classical Sanskrit treatise (Ch. 54 Dakargala) defining the Garta-Pariksha pit refill test, percolation rates, and bio-indicators of subsoil aquifers.',
    evidenceTrail: ['📜 Historical Records', '🔬 Scientific Research', '📚 Academic Sources'],
    uncertainty: 'Ancient volumetric units (aratni/hasta) correspond to ~45 cm; minor variations across regional recensions.',
  },
  'Kautilya Arthashastra': {
    url: 'https://archive.org/details/Arthashastra_of_Chanakya',
    domain: 'archive.org',
    author: 'Kautilya (c. 300 BCE)',
    publishedAt: 'c. 300 BCE',
    confidence: 94,
    justification: 'Statecraft compendium codifying royal water taxes (Udakabhaga: 1/5th to 1/3rd) and penalties for dam breaching (Setubheda in Book III Ch. 9).',
    evidenceTrail: ['📜 Historical Records', '📚 Academic Sources'],
    uncertainty: 'Textual layers span 4th c. BCE to 2nd c. CE, reflecting accumulated administrative jurisprudence.',
  },
  'Junagadh Rock Inscription': {
    url: 'https://en.wikipedia.org/wiki/Junagadh_rock_inscription_of_Rudradaman',
    domain: 'wikipedia.org',
    author: 'Mahakshatrapa Rudradaman I & Skandagupta',
    publishedAt: '150 CE & 456 CE',
    confidence: 98,
    justification: 'Prakrit/Sanskrit lithic epigraph on Girnar rock verifying Sudarshana Dam construction under Chandragupta Maurya, Ashokan canals by Tusaspha, and 150/456 CE repairs.',
    evidenceTrail: ['📜 Historical Records', '🏺 Archaeological Evidence', '📚 Academic Sources'],
    uncertainty: 'Precise perimeter shoreline of ancient lake is partially obscured by modern agricultural siltation.',
  },
  'Porumamilla Inscription': {
    url: 'https://www.jstor.org/stable/25193047',
    domain: 'jstor.org',
    author: 'Epigraphia Indica Vol. XIV (Prince Bhaskara Bhavadura)',
    publishedAt: '1369 CE',
    confidence: 97,
    justification: 'Epigraphical text detailing the 12 essential prerequisites (Sadhanas) and 6 fatal flaws (Doshas) for reservoir engineering, including crumbly soil prohibition.',
    evidenceTrail: ['📜 Historical Records', '🏺 Archaeological Evidence', '🔬 Scientific Research'],
    uncertainty: 'Peak flood discharge estimates were measured using local catchment topography rather than metric cumecs.',
  },
  'ASI Dholavira Report': {
    url: 'https://asi.nic.in/excavation-in-dholavira/',
    domain: 'asi.nic.in',
    author: 'Dr. R.S. Bisht, ASI',
    publishedAt: '1990–2005',
    confidence: 96,
    justification: 'Stratigraphic excavations revealing 16 interconnected masonry reservoirs, rock-cut cisterns, storm diversion bunds on Mansar/Manhar, and silt baffle chambers.',
    evidenceTrail: ['🏺 Archaeological Evidence', '🔬 Scientific Research', '🛰️ Space/Satellite Data', '🗺️ Geographic Data'],
    uncertainty: 'Operational capacity during catastrophic prolonged aridification phases (c. 1900 BCE) remains an active debate.',
  },
  'ASI Sringaverapura Monograph': {
    url: 'https://asi.nic.in/',
    domain: 'asi.nic.in',
    author: 'Prof. B.B. Lal, ASI',
    publishedAt: '1989',
    confidence: 95,
    justification: 'Excavated 1st-century BCE Ganga river tank demonstrating a 3-stage hydraulic desilting system: circular vortex well, stepped cascade, and clarification tank.',
    evidenceTrail: ['🏺 Archaeological Evidence', '🔬 Scientific Research', '📚 Academic Sources'],
    uncertainty: 'Exact seasonal sluice operational frequency during monsoon flood peaks is inferred from stratigraphy.',
  },
  'Samarangana Sutradhara': {
    url: 'https://www.wisdomlib.org/hinduism/book/samarangana-sutradhara',
    domain: 'wisdomlib.org',
    author: 'King Bhoja (Paramara Dynasty)',
    publishedAt: 'c. 1050 CE',
    confidence: 95,
    justification: 'Chapter 18 (Jala-bandhana) details tactile plasticity tests (mrd-mardana) and rammed puddle-clay core (bhal) construction verified at the monumental Bhojpur Dam.',
    evidenceTrail: ['📜 Historical Records', '🏺 Archaeological Evidence', '🔬 Scientific Research'],
    uncertainty: 'Surviving manuscripts contain scribal orthographic variants in specific architectural formulas.',
  },
  'Schnitter History of Dams': {
    url: 'https://www.routledge.com/A-History-of-Dams/Schnitter/p/book/9789054101369',
    domain: 'routledge.com',
    author: 'Schnitter, N.J.',
    publishedAt: '1994',
    confidence: 92,
    justification: 'Seminal global civil engineering history documenting ancient Indian gravity dams, boulder sinking methods, and hydraulic sluices.',
    evidenceTrail: ['📚 Academic Sources', '🔬 Scientific Research'],
    uncertainty: 'Secondary synthesis drawing upon colonial and early post-independence engineering surveys.',
  },
  'UNESCO Dujiangyan': {
    url: 'https://whc.unesco.org/en/list/1001/',
    domain: 'whc.unesco.org',
    author: 'UNESCO World Heritage Centre',
    publishedAt: '2000',
    confidence: 98,
    justification: 'UNESCO World Heritage monograph verifying Qin Dynasty (256 BCE) Min River diversion without damming, utilizing natural vortex desilting.',
    evidenceTrail: ['🏺 Archaeological Evidence', '📜 Historical Records', '🛰️ Space/Satellite Data'],
    uncertainty: 'Subsequent Ming and Qing dynasty restorations modified certain revetment profiles.',
  },
  'Lothal ASI Report': {
    url: 'https://asi.nic.in/lothal/',
    domain: 'asi.nic.in',
    author: 'Dr. S.R. Rao, ASI',
    publishedAt: '1955–1962',
    confidence: 93,
    justification: 'ASI excavation of 214m x 36m fired-brick tidal basin with vertical timber sluice lock gate and stone mooring anchors on the Bhogavo River.',
    evidenceTrail: ['🏺 Archaeological Evidence', '🔬 Scientific Research', '🗺️ Geographic Data'],
    uncertainty: 'Scholarly debate regarding whether the basin functioned strictly as a tidal dockyard or an irrigation/drinking reservoir.',
  },
  'Rani ki Vav UNESCO': {
    url: 'https://whc.unesco.org/en/list/1570/',
    domain: 'whc.unesco.org',
    author: 'UNESCO World Heritage Centre',
    publishedAt: '2014',
    confidence: 98,
    justification: 'Stratified subterranean stepwell on the Saraswati River built c. 1063 CE by Queen Udayamati, engineered to resist lateral soil pressure across 7 tiers.',
    evidenceTrail: ['🏺 Archaeological Evidence', '📜 Historical Records', '🛰️ Space/Satellite Data'],
    uncertainty: 'Centuries of silt deposition by the Saraswati protected carvings but buried hydraulic inlet conduits until modern ASI desilting.',
  },
  'IS 1498 Soil Standards': {
    url: 'https://bis.gov.in/',
    domain: 'bis.gov.in',
    author: 'Bureau of Indian Standards',
    publishedAt: '1970',
    confidence: 99,
    justification: 'National geotechnical standard defining visual-manual soil classification, Atterberg limits, and dry density tests validating Varahamihira’s pit refill test.',
    evidenceTrail: ['🔬 Scientific Research', '📚 Academic Sources'],
    uncertainty: 'Standardizes modern metric geotechnical laboratory procedures rather than pre-industrial field methods.',
  },
  'Epigraphia Indica ASI': {
    url: 'https://asi.nic.in/epigraphical-publications/',
    domain: 'asi.nic.in',
    author: 'Archaeological Survey of India',
    publishedAt: '1888–present',
    confidence: 99,
    justification: 'The authoritative peer-reviewed corpus of Indian epigraphy, publishing verbatim rubbings, transcriptions, and translations of historical rock and copper-plate grants.',
    evidenceTrail: ['📜 Historical Records', '🏺 Archaeological Evidence', '📚 Academic Sources'],
    uncertainty: 'Interpretative decipherment nuances exist for archaic regional Brahmi scripts.',
  },
};
