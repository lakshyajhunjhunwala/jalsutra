export type SubjectType =
  | 'channel'
  | 'irrigation'
  | 'dam'
  | 'drainage'
  | 'flood_management'
  | 'soil_texture'
  | 'other';

export type SectionStatus = 'not_loaded' | 'loading' | 'ready' | 'no_info' | 'error';

export interface ResearchSourceItem {
  title: string;
  url: string;
  publisher?: string;
  snippet?: string;
}

export interface ResearchTopicItem {
  id: string;
  title: string;
  content: string; // Target ~200–300 words
  sources?: ResearchSourceItem[];
  confidence?: 'high' | 'moderate' | 'low' | string;
  limitations?: string;
}

export interface StructuredSection {
  id: string; // e.g. "section-8"
  number: number;
  title: string;
  categoryGroup: string;
  categoryGroupId: string;
  status: SectionStatus;
  content?: string; // Target 200–300 words
  topics?: ResearchTopicItem[];
  sources?: ResearchSourceItem[];
  confidence?: 'high' | 'moderate' | 'low' | string;
  limitations?: string;
  error?: string;
  wordCount?: number;
}

export interface StructuredResearchReport {
  id: string;
  subject: string;
  subjectType: SubjectType;
  subjectCategory: string; // User-facing badge e.g. "🌾 Soil Science & Texture"
  sections: StructuredSection[];
  mode?: string;
  region?: string;
  technicalLevel?: string;
  modelUsed?: string;
  groundingSources?: any[];
  searchQueries?: string[];
  verificationAudit?: any;
  researchSources?: any[];
  offlineFallback?: boolean;
  offlineReason?: string;
}

// Canonical 39 Major Sections
export const CANONICAL_39_SECTION_DEFINITIONS: Array<{
  number: number;
  title: string;
  categoryGroupId: string;
  categoryGroup: string;
  defaultTopicTitle: string;
}> = [
  { number: 1, title: 'Executive Summary', categoryGroupId: 'cat1', categoryGroup: 'Overview & Identification', defaultTopicTitle: 'Principal findings, engineering significance, and evidence quality' },
  { number: 2, title: 'Identification and Classification', categoryGroupId: 'cat1', categoryGroup: 'Overview & Identification', defaultTopicTitle: 'Nomenclature, geographical coordinates, classification, and status' },
  { number: 3, title: 'Historical Timeline and Development', categoryGroupId: 'cat2', categoryGroup: 'History, Builders & Inscriptions', defaultTopicTitle: 'Origin, construction chronology, and documented modifications' },
  { number: 4, title: 'Builders, Designers, Institutions, and Origins', categoryGroupId: 'cat2', categoryGroup: 'History, Builders & Inscriptions', defaultTopicTitle: 'Patrons, engineering guilds, communities, or natural pedogenic processes' },
  { number: 5, title: 'Original Purpose and Functional Objectives', categoryGroupId: 'cat2', categoryGroup: 'History, Builders & Inscriptions', defaultTopicTitle: 'Agrarian irrigation, flood diversion, water supply, or soil retention' },
  { number: 6, title: 'Archaeological, Geological, and Physical Evidence', categoryGroupId: 'cat2', categoryGroup: 'History, Builders & Inscriptions', defaultTopicTitle: 'Stratigraphic excavation records, core samples, and physical remains' },
  { number: 7, title: 'Inscriptions, Documents, and Recorded Evidence', categoryGroupId: 'cat2', categoryGroup: 'History, Builders & Inscriptions', defaultTopicTitle: 'Epigraphical records, historical manuscripts, and archival surveys' },
  { number: 8, title: 'Overall Design, Geometry, and Classification', categoryGroupId: 'cat3', categoryGroup: 'Geometry, Components & Materials', defaultTopicTitle: 'Physical dimensions, geometry, alignment, and hydraulic layout' },
  { number: 9, title: 'Component-by-Component Analysis', categoryGroupId: 'cat3', categoryGroup: 'Geometry, Components & Materials', defaultTopicTitle: 'Sluices, conduits, embankments, spillways, or soil pore structure' },
  { number: 10, title: 'Materials, Soil Composition, and Physical Properties', categoryGroupId: 'cat3', categoryGroup: 'Geometry, Components & Materials', defaultTopicTitle: 'Masonry, mortars, gravel cores, particle sizes, and sediment fractions' },
  { number: 11, title: 'Construction, Formation, or Development Method', categoryGroupId: 'cat3', categoryGroup: 'Geometry, Components & Materials', defaultTopicTitle: 'Excavation, boulder sinking, masonry bonding, or natural soil formation' },
  { number: 12, title: 'Hydraulic, Hydrological, and Soil-Water Principles', categoryGroupId: 'cat4', categoryGroup: 'Hydraulics, Hydrology & Soil', defaultTopicTitle: 'Hydrostatic pressure, Torricelli velocities, Darcy seepage, and infiltration' },
  { number: 13, title: 'Network, Distribution, and Land-Management System', categoryGroupId: 'cat4', categoryGroup: 'Hydraulics, Hydrology & Soil', defaultTopicTitle: 'Canal hierarchy, cascade tank distribution, and command area governance' },
  { number: 14, title: 'Blueprint, Layout, and Site Plan', categoryGroupId: 'cat4', categoryGroup: 'Hydraulics, Hydrology & Soil', defaultTopicTitle: 'Geometric layout, orientation, and hydraulic alignment plan' },
  { number: 15, title: 'Cross-Section and Internal Structure', categoryGroupId: 'cat4', categoryGroup: 'Hydraulics, Hydrology & Soil', defaultTopicTitle: 'Structural cutaways, revetments, core geometry, or soil horizon profiles' },
  { number: 16, title: 'Catchment, Soil, and Environmental Context', categoryGroupId: 'cat4', categoryGroup: 'Hydraulics, Hydrology & Soil', defaultTopicTitle: 'Watershed hydrology, monsoon rainfall peaks, and environmental setting' },
  { number: 17, title: 'Modern Technical and Engineering Analysis', categoryGroupId: 'cat5', categoryGroup: 'Modern Analysis & Geospatial', defaultTopicTitle: 'Stress analysis, CFD hydrodynamic modeling, and geotechnical stability' },
  { number: 18, title: 'Historical Changes, Modifications, and Land-Use Changes', categoryGroupId: 'cat5', categoryGroup: 'Modern Analysis & Geospatial', defaultTopicTitle: 'Medieval repairs, colonial additions, and regional land-use changes' },
  { number: 19, title: 'Current Condition and Performance', categoryGroupId: 'cat5', categoryGroup: 'Modern Analysis & Geospatial', defaultTopicTitle: 'Structural integrity, siltation percentage, and operational status' },
  { number: 20, title: 'Photographic and Field Evidence', categoryGroupId: 'cat5', categoryGroup: 'Modern Analysis & Geospatial', defaultTopicTitle: 'Archival photographs, ASI survey plates, and field exploration notes' },
  { number: 21, title: 'Maps, Satellite Imagery, and Geospatial Evidence', categoryGroupId: 'cat5', categoryGroup: 'Modern Analysis & Geospatial', defaultTopicTitle: 'Corona satellite imagery, GIS paleochannels, and digital elevation models' },
  { number: 22, title: '3D Reconstruction and Digital Modelling', categoryGroupId: 'cat5', categoryGroup: 'Modern Analysis & Geospatial', defaultTopicTitle: 'Photogrammetry point clouds, CAD restorations, and hydraulic simulations' },
  { number: 23, title: 'Social, Agricultural, Economic, and Ecological Impact', categoryGroupId: 'cat6', categoryGroup: 'Socio-Ecological & Epistemology', defaultTopicTitle: 'Agrarian surplus, famine mitigation, Kudimaramathu labor, and trade routes' },
  { number: 24, title: 'Claims vs Evidence', categoryGroupId: 'cat6', categoryGroup: 'Socio-Ecological & Epistemology', defaultTopicTitle: 'Analytical verification of historical claims against archaeological reality' },
  { number: 25, title: 'Conflicting Interpretations and Unresolved Debates', categoryGroupId: 'cat6', categoryGroup: 'Socio-Ecological & Epistemology', defaultTopicTitle: 'Scholarly disputes regarding builder attribution, dates, and functions' },
  { number: 26, title: 'What We Know With High Confidence', categoryGroupId: 'cat6', categoryGroup: 'Socio-Ecological & Epistemology', defaultTopicTitle: 'Firmly established epigraphical, stratigraphic, and physical engineering facts' },
  { number: 27, title: 'What Remains Uncertain', categoryGroupId: 'cat6', categoryGroup: 'Socio-Ecological & Epistemology', defaultTopicTitle: 'Missing superstructures, unexcavated depths, and chronological ambiguities' },
  { number: 28, title: 'What We Still Do Not Know', categoryGroupId: 'cat6', categoryGroup: 'Socio-Ecological & Epistemology', defaultTopicTitle: 'Unresolved research questions, lost mechanisms, and unstudied reaches' },
  { number: 29, title: 'Comparison With Other Relevant Systems or Materials', categoryGroupId: 'cat7', categoryGroup: 'Comparative Systems & Sources', defaultTopicTitle: 'Comparative evaluation against Roman, Persian, or regional hydraulic systems' },
  { number: 30, title: 'Complete Source List and Bibliography', categoryGroupId: 'cat7', categoryGroup: 'Comparative Systems & Sources', defaultTopicTitle: 'Tier-classified academic bibliography, epigraphical corpora, and field memoirs' },
  { number: 31, title: 'Current Problems and Historical or Natural Solutions', categoryGroupId: 'cat8', categoryGroup: 'Problems vs Solutions Matrix', defaultTopicTitle: 'Sedimentation, scour, seepage, and traditional hydraulic countermeasures' },
  { number: 32, title: 'Problem-versus-Solution Evidence Matrix', categoryGroupId: 'cat8', categoryGroup: 'Problems vs Solutions Matrix', defaultTopicTitle: 'Tabulated matrix of engineering challenges, solutions, and effectiveness' },
  { number: 33, title: 'Lessons for Modern Engineering, Soil Management, and Environmental Planning', categoryGroupId: 'cat8', categoryGroup: 'Problems vs Solutions Matrix', defaultTopicTitle: 'Passive-energy design, low-carbon materials, and regenerative water systems' },
  { number: 34, title: 'Problems Not Solved or Remaining Limitations', categoryGroupId: 'cat8', categoryGroup: 'Problems vs Solutions Matrix', defaultTopicTitle: 'Catastrophic overtopping, long-term silt accretion, and structural limits' },
  { number: 35, title: 'Historical/Traditional vs Modern Comparison', categoryGroupId: 'cat8', categoryGroup: 'Problems vs Solutions Matrix', defaultTopicTitle: 'Comparative assessment of durability, maintenance burden, and adaptability' },
  { number: 36, title: 'Lessons for Next-Generation Systems', categoryGroupId: 'cat9', categoryGroup: 'Next-Gen Lessons & Verdict', defaultTopicTitle: 'Climate-resilient civil engineering and ecological water infrastructure' },
  { number: 37, title: 'What the Original Design or Natural System Did Well', categoryGroupId: 'cat9', categoryGroup: 'Next-Gen Lessons & Verdict', defaultTopicTitle: 'Exceptional long-term geotechnical durability and gravity equilibrium' },
  { number: 38, title: 'What a Modern Engineer or Scientist Would Change', categoryGroupId: 'cat9', categoryGroup: 'Next-Gen Lessons & Verdict', defaultTopicTitle: 'Modern seismic retrofitting, automated gates, and spillway safety margins' },
  { number: 39, title: 'Final Findings and Research Confidence Assessment', categoryGroupId: 'cat9', categoryGroup: 'Next-Gen Lessons & Verdict', defaultTopicTitle: 'Comprehensive synthesis of verified findings and overall confidence score' },
];

export function createInitialReportStructure(
  researchId: string,
  subject: string,
  subjectType: SubjectType,
  subjectCategory: string
): StructuredResearchReport {
  return {
    id: researchId,
    subject,
    subjectType,
    subjectCategory,
    sections: CANONICAL_39_SECTION_DEFINITIONS.map((def) => ({
      id: `section-${def.number}`,
      number: def.number,
      title: def.title,
      categoryGroup: def.categoryGroup,
      categoryGroupId: def.categoryGroupId,
      status: 'not_loaded',
      topics: [
        {
          id: `section-${def.number}-topic-1`,
          title: def.defaultTopicTitle,
          content: '',
        },
      ],
      content: '',
      sources: [],
    })),
  };
}
