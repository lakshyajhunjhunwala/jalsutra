export interface ReconstructionSketch {
  image: string;
  title: string;
  caption: string;
  architecturalStyle: string;
  keyFeatures: string[];
}

export interface ArchaeologicalDossier {
  id: string;
  name: string;
  sanskritOrLocalName?: string;
  region: string;
  state: string;
  coordinates: string;
  waterSource: string;
  riverBasin: string;
  period: string;
  associatedRulerOrCivilization: string;
  purpose: string;
  dimensions: {
    length?: string;
    height?: string;
    crestWidth?: string;
    baseWidth?: string;
    reservoirArea?: string;
    storageCapacity?: string;
  };
  constructionMaterials: string[];
  structuralDesign: string;
  waterManagementMethod: string;
  irrigationMethod: string;
  drainageAndFloodControl: string;
  currentCondition: string;
  historicalAndArchaeologicalEvidence: {
    inscriptions: string[];
    archaeologicalExcavations: string[];
    writtenTexts: string[];
  };
  engineeringAnalysis: {
    problem: string;
    environmentalCondition: string;
    engineeringSolution: string;
    constructionMethod: string;
    result: string;
  };
  documentedVsInferred: {
    documented: string[];
    inferred: string[];
    hypothetical: string[];
  };
  modernRelevance: string;
  image: string;
  reconstructionSketch?: ReconstructionSketch;
  keyPoints: string[];
}

export const ANCIENT_WATER_STRUCTURES: ArchaeologicalDossier[] = [
  {
    id: 'sudarshana-dam',
    name: 'Sudarshana Lake & Dam',
    sanskritOrLocalName: 'सुदर्शन तटाक (Sudarśana Taṭāka)',
    region: 'Western India',
    state: 'Gujarat (Saurashtra / Junagadh)',
    coordinates: '21.52° N, 70.47° E (Girnar foothills)',
    waterSource: 'Suvarnasikata (Sonrekha) & Palasini rivers (hill torrents)',
    riverBasin: 'Saurashtra Peninsular Coastal Basin',
    period: 'c. 320 BCE to 456 CE (~800 continuous years of epigraphic history)',
    associatedRulerOrCivilization: 'Mauryan Empire (Chandragupta Maurya & Ashoka), Western Kshatrapas (Rudradaman I), Gupta Empire (Skandagupta)',
    purpose: 'Inter-seasonal water storage, agrarian irrigation of the dry Kathiawar peninsula, municipal water security for ancient Girinagara.',
    dimensions: {
      length: 'Estimated 400–600 meters across the natural granite gorge',
      height: 'Approximately 10–14 meters',
      crestWidth: '4–6 meters',
      baseWidth: '28–35 meters with stepped masonry revetments',
      storageCapacity: 'Estimated 3.5–5.5 Million Cubic Meters',
    },
    constructionMaterials: [
      'Compacted clay and gravel impervious core',
      'Cyclopean basalt and granite stone pitching on water face',
      'Dressed stone conduits and rock-cut sluice portals',
      'Mortarless interlocking blocks with clay sealant',
    ],
    structuralDesign: 'Earthen embankment gravity dam fortified by dressed stone masonry revetment on the upstream water face, utilizing the natural constriction of Mount Girnar’s granite hills.',
    waterManagementMethod: 'Impoundment of torrential flash runoffs from Mount Urjayat (Girnar); controlled gravity decantation through subterranean stone conduits and side spillways.',
    irrigationMethod: 'Gravity feeder canals (*pranāḷikā*) distributing water across the agricultural plains of Saurashtra, regulated by sluice sluice-gates supervised by royal water officers (*sītādhyakṣa*).',
    drainageAndFloodControl: 'Natural rock spillway escape on the flank to discharge catastrophic monsoon surges. The dam breached twice across antiquity during unprecedented storm events.',
    currentCondition: 'Archaeological site; the original bund was washed away in late antiquity, but the rock edicts recording its 800-year history remain pristine at Junagadh.',
    historicalAndArchaeologicalEvidence: {
      inscriptions: [
        'Junagadh Rock Inscription of Mahakshatrapa Rudradaman I (dated 150 CE, Saka year 72): explicitly documents that Pushyagupta the Vaishya, governor of Chandragupta Maurya, initially dammed the lake, and Tusaspha, the Yavana governor of Emperor Ashoka, added irrigation conduits (conduits/canals). It then records Rudradaman rebuilding the breached dam without taxing the citizenry, tripling its strength under minister Suvisakha.',
        'Junagadh Inscription of Skandagupta (dated 455–456 CE): records a second catastrophic breach due to heavy monsoon rain, and its subsequent reconstruction within two months with solid stone masonry by Chakrapalita, son of Governor Parnadatta.',
      ],
      archaeologicalExcavations: [
        'ASI surveys of the Junagadh rock edict precinct and the dry gorge of the Sonrekha river, tracing remnants of ancient stone revetment lines and embankment abutments.',
      ],
      writtenTexts: [
        'Kautilya’s Arthashastra (Book II Ch. 24 & Book III Ch. 9) detailing the Mauryan administrative framework for *setu-bandha* (dam networks) and irrigation fees.',
      ],
    },
    engineeringAnalysis: {
      problem: 'Arid Saurashtra climate with extreme rainfall volatility: flash floods during July–August followed by 9 months of severe agrarian drought.',
      environmentalCondition: 'Steep granite slopes of Mount Girnar producing rapid runoff velocity and high scouring momentum in narrow seasonal streams.',
      engineeringSolution: 'Gravity dam spanning the narrowest gap between Girnar hills, creating a multi-million-cubic-meter reservoir to throttle flash surges and store perennial water.',
      constructionMethod: 'Heavy boulder foundation wedged into natural bedrock, clay core rammed in layers, upstream face revetted with heavy stone blocks to resist wave action, side hill saddle utilized as emergency surplus escape.',
      result: 'Transformed the arid Kathiawar region into an agricultural breadbasket, sustained municipal life in Girinagara for eight centuries through three successive empires.',
    },
    documentedVsInferred: {
      documented: [
        'Pushyagupta (Chandragupta Maurya) built the initial bund (c. 320–300 BCE).',
        'Tusaspha (Ashoka) added irrigation canals and conduits (c. 260–240 BCE).',
        'Rudradaman repaired a 420-cubit (approx. 200m) breach in 150 CE.',
        'Chakrapalita (Skandagupta) constructed a stone masonry embankment in 456 CE.',
      ],
      inferred: [
        'The primary breach mechanism was overtopping during an extreme localized cloudburst that exceeded the rock spillway discharge capacity.',
        'Tusaspha’s conduits relied on gravity gradient channels with timber or stone stop-log gates for flow regulation.',
      ],
      hypothetical: [
        'Specific hydraulic sluice gate mechanisms (whether lever-operated or vertical counterweighted drop logs).',
      ],
    },
    modernRelevance: 'Demonstrates the critical necessity of designed surplus spillways in semi-arid hill catchment dams. The 150 CE breach is one of the earliest documented hydraulic forensic engineering cases in world history.',
    image: '/src/assets/images/sudarshana_lake_girnar_1790264567305.jpg',
    reconstructionSketch: {
      image: '/src/assets/images/sudarshana_dam_crosssection_1790511646371.jpg',
      title: 'Architectural Elevation & Cross-Section: Mauryan Sudarshana Dam (Girnar)',
      caption: 'Detailed pen-and-ink sepia cross-section showing the Mauryan earthen gravity embankment, central compacted impervious clay-gravel core keyed into bedrock, stepped cyclopean granite boulder revetment, subterranean rock-cut sluice conduits (pranāḷikā) engineered under Governor Tusaspha, and side-saddle rock emergency spillway.',
      architecturalStyle: 'Sepia Ink & Watercolor Elevation Drafting on Aged Parchment',
      keyFeatures: [
        'Stepped cyclopean stone pitching (boulder revetment) counteracting hydrostatic wave slap',
        'Dense compacted clay-gravel impervious central core keyed into granite bed',
        'Subterranean dressed stone conduits (*pranāḷikā*) engineered under Mauryan governor Tusaspha',
        'Side saddle emergency rock-cut spillway discharging catastrophic monsoonal spates',
      ],
    },
    keyPoints: [
      'Gold standard of ancient Indian epigraphic water history: 800 continuous years recorded on a single granite boulder.',
      'Explicit proof that Mauryan state planning (Chandragupta & Ashoka) prioritized agricultural hydraulic engineering.',
      'Multi-generational maintenance spanning Mauryas, Kshatrapas, and Guptas.',
    ],
  },
  {
    id: 'kallanai-grand-anicut',
    name: 'Kallanai (Grand Anicut)',
    sanskritOrLocalName: 'கல்லணை (Stone Dam / Grand Anicut)',
    region: 'Southern India',
    state: 'Tamil Nadu (Thanjavur / Tiruchirappalli)',
    coordinates: '10.83° N, 78.81° E',
    waterSource: 'Cauvery (Kaveri) River & Kollidam (Coleroon) River',
    riverBasin: 'Cauvery River Delta Basin',
    period: 'c. 1st to 2nd Century CE (Sangam Period, Early Cholas)',
    associatedRulerOrCivilization: 'Early Chola Dynasty (King Karikalan Chola)',
    purpose: 'River diversion weir to prevent Kaveri waters from being lost into the deeper northern branch (Coleroon) and direct flood flows into the delta irrigation network.',
    dimensions: {
      length: '329 meters (1,079 feet)',
      height: '4.5 to 5.4 meters (15 to 18 feet)',
      crestWidth: '18 to 20 meters (60 feet) with gentle downstream glacis',
      storageCapacity: 'Run-of-river diversion structure irrigating over 1,000,000 acres',
    },
    constructionMaterials: [
      'Unhewn cyclopean granite boulders placed directly on shifting river sand',
      'Hydraulic clay and lime-pozzolana binding mortar',
      'Cut-stone facing on downstream apron to dissipate hydraulic energy',
    ],
    structuralDesign: 'Curved, serpentine gravity weir designed to deflect high-velocity flow away from the fragile riverbanks and stabilize sand foundations through sinking boulder ballast.',
    waterManagementMethod: 'Hydraulic division: Kaveri river naturally bifurcates into Kaveri and Coleroon. Because Coleroon has a steeper bed gradient, the entire river would naturally empty into Coleroon, desiccating the delta. Kallanai was placed across the Kaveri to maintain hydraulic head and divert surplus into irrigation canals.',
    irrigationMethod: 'Canal network distributing water across the Thanjavur delta ("Rice Bowl of Tamil Nadu"), feeding interconnected tanks and paddy fields.',
    drainageAndFloodControl: 'Surplus water is vented into the wider Coleroon stream during monsoonal floods, safeguarding the low-lying agricultural plains from catastrophic inundation.',
    currentCondition: 'Operational and intact after nearly 2,000 years; still serves as the primary diversion hub of the modern Cauvery delta system, reinforced in the 19th century by Sir Arthur Cotton.',
    historicalAndArchaeologicalEvidence: {
      inscriptions: [
        'Sangam literature references (Pattinappalai, Silappadikaram, and Purananuru) praising Karikalan for taming the wild floods of the Kaveri and raising river embankments.',
        'Chola epigraphs throughout Thanjavur and Tiruchirappalli temples commemorating the maintenance of the Kaveri bunds (*karai*).',
      ],
      archaeologicalExcavations: [
        'Engineering soundings and masonry investigations conducted by the Public Works Department and British engineers (Capt. Caldwell, Sir Arthur Cotton) in the 1800s discovering the unhewn stone boulder base resting on river quicksand.',
      ],
      writtenTexts: [
        'Sangam anthologies (*Pattinappalai* v. 280–285); Sir Arthur Cotton’s engineering memoirs establishing Kallanai as the inspiration for the Godavari and Krishna anicuts.',
      ],
    },
    engineeringAnalysis: {
      problem: 'Geomorphological bifurcation: The Coleroon channel is steeper and wider than the Kaveri branch. Over time, riverbed erosion would cause the Kaveri to dry up, starving Thanjavur’s agriculture.',
      environmentalCondition: 'Alluvial sandy riverbed with zero bedrock foundation; high silt load and violent seasonal monsoon spates.',
      engineeringSolution: 'A massive unhewn stone weir built across the river. Heavy boulders were dropped into the sand; as water washed sand from beneath them, the stones settled into a deep, immovable interlocking rock foundation.',
      constructionMethod: 'Sinking cyclopean stones by water scour until reaching a stable subterranean sand-friction equilibrium; linking boulders with clay mortar and pitching a curved crest to deflect current.',
      result: 'Created the oldest functioning water-diversion weir in the world, enabling two millennia of continuous rice cultivation.',
    },
    documentedVsInferred: {
      documented: [
        'Karikalan Chola is credited in Sangam works with taming the Kaveri and organizing agrarian infrastructure.',
        'Physical structure rests on alluvial sand without solid bedrock, confirmed during 19th-century excavations.',
      ],
      inferred: [
        'The curved serpentine profile was deliberately aligned with current vectors to minimize localized eddy scour.',
        'Initial labor force comprised thousands of workers quarrying granite from the Trichy hillocks.',
      ],
      hypothetical: [
        'Precise calendar year of initial construction (sources place Karikalan between 1st c. BCE and 2nd c. CE).',
      ],
    },
    modernRelevance: 'Arthur Cotton directly studied Kallanai before designing modern colonial weirs. Proves that flexible rip-rap boulder weirs on sand foundations can outlast rigid reinforced concrete dams by millennia.',
    image: '/src/assets/images/kallanai_grand_anicut_1790264602228.jpg',
    reconstructionSketch: {
      image: '/src/assets/images/kallanai_anicut_sketch_1790349404364.jpg',
      title: 'Structural Drafting & Hydraulic Current Vectors: Kallanai (Grand Anicut)',
      caption: 'Architectural isometric drafting displaying King Karikalan’s 329-meter curved serpentine granite weir resting on shifting alluvial quicksand, dissipating river kinetic energy and feeding the Cauvery delta canals.',
      architecturalStyle: 'Architectural Engineering Drafting with Hydraulic Flow Vectors',
      keyFeatures: [
        'Unhewn cyclopean granite boulders sunk into riverbed quicksand until reaching bedrock scour equilibrium',
        'Curved serpentine weir geometry deflecting high-velocity flood vectors away from fragile banks',
        'Dressed stone downstream apron functioning as an energy dissipation hydraulic jump basin',
        'Canal diversion headworks maintaining perennial water supply to the Thanjavur delta',
      ],
    },
    keyPoints: [
      'One of the oldest operational water-regulator structures in world history (~1,900+ years).',
      'Masterpiece of foundation engineering on shifting alluvial river sand.',
      'Preserved the agrarian economic foundation of the Chola Empire.',
    ],
  },
  {
    id: 'dholavira-reservoirs',
    name: 'Dholavira Water Harvesting System',
    sanskritOrLocalName: 'धौलावीरा जलाशय प्रणाली (Harappan Hydraulic Works)',
    region: 'Western India',
    state: 'Gujarat (Kutch / Khadir Bet)',
    coordinates: '23.88° N, 70.21° E',
    waterSource: 'Mansar and Manhar seasonal desert rivulets',
    riverBasin: 'Great Rann of Kutch Endorheic Basin',
    period: 'c. 3000 BCE to 1500 BCE (Harappan / Indus Valley Civilisation)',
    associatedRulerOrCivilization: 'Indus Valley Civilisation (Mature Harappan City State)',
    purpose: 'Complete urban water security in a hyper-arid island environment subject to drought, saline groundwater, and brackish maritime surrounds.',
    dimensions: {
      length: 'Interconnected perimeter system enclosing 48 hectares',
      height: 'Reservoir depths up to 7.5 meters cut into solid sandstone bedrock',
      storageCapacity: 'Estimated at over 250,000 to 300,000 cubic meters (up to 10% of total city area dedicated to water storage)',
    },
    constructionMaterials: [
      'Finely dressed sandstone and limestone blocks',
      'Natural quarried sandstone bedrock',
      'Waterproof plaster composed of lime, gypsum, and fine clay',
      'Stone sluice gates, inlet channels, and settling tanks',
    ],
    structuralDesign: 'A series of 16 cascading rock-cut and masonry-faced reservoirs wrapped around the citadel, connected by stone-paved aqueducts, desilting chambers, and storm drains.',
    waterManagementMethod: 'Catchment interception: bunds and check dams were erected across the seasonal streams Mansar (north) and Manhar (south) to divert flash runoff into settling basins before cascading into deep rectangular stone cisterns.',
    irrigationMethod: 'Primarily urban drinking water, livestock watering, artisanal workshops (bead making, shell processing), and secondary kitchen gardens.',
    drainageAndFloodControl: 'Integrated storm-water drainage network with stone inspection chambers and silt traps, preventing flood debris from contaminating drinking water cisterns.',
    currentCondition: 'Excavated and conserved by the Archaeological Survey of India (ASI); designated a UNESCO World Heritage Site in 2021.',
    historicalAndArchaeologicalEvidence: {
      inscriptions: [
        'The Dholavira Signboard (10 large Indus script symbols discovered near the northern gate of the citadel), representing one of the longest Harappan inscriptions, though currently undeciphered.',
      ],
      archaeologicalExcavations: [
        'Extensive excavations by Dr. R.S. Bisht (ASI) between 1990 and 2005 uncovering the massive eastern, southern, and castle reservoirs, rock-cut steps, desilting basins, and stone drains.',
      ],
      writtenTexts: [
        'Pre-literate archaeological context; evidence is purely physical and stratigraphic.',
      ],
    },
    engineeringAnalysis: {
      problem: 'Khadir Bet island is surrounded by the hyper-saline Rann of Kutch. Groundwater is brackish; annual rainfall is meager (<300 mm) and erratic.',
      environmentalCondition: 'Short, violent cloudbursts sending rapid torrents down shallow gullies, followed by 10 months of complete arid desiccation.',
      engineeringSolution: 'Enclosing the entire city with a necklace of gigantic stepped stone cisterns, turning the city walls themselves into water retention barriers.',
      constructionMethod: 'Excavating directly into sedimentary bedrock, building dressed limestone retaining walls with internal waterproof plastering, engineering check-dams with baffle walls to force sediment to settle before water reached the main tanks.',
      result: 'Enabled a thriving metropolis of over 20,000 residents to endure for over a millennium in one of the most hostile arid landscapes on Earth.',
    },
    documentedVsInferred: {
      documented: [
        'Direct physical remnants of 16 monumental reservoirs, stepped ghats, stone check dams across Mansar and Manhar.',
        'Desilting chambers with bottom scour plugs documented by ASI stratigraphic records.',
      ],
      inferred: [
        'Reservoirs were prioritized hierarchically: the upper castle tank reserved for administrative elites / ritual purification, peripheral tanks for general citizenry.',
      ],
      hypothetical: [
        'Exact administrative system for rationing water during multi-year droughts.',
      ],
    },
    modernRelevance: 'The pinnacle of decentralized urban rainwater harvesting and desilting engineering. Today’s arid cities (e.g. in Rajasthan, Middle East, Australia) rely on identical principles of multi-stage stormwater retention.',
    image: '/src/assets/images/dholavira_reservoirs_1790264585923.jpg',
    reconstructionSketch: {
      image: '/src/assets/images/dholavira_reservoir_sketch_1790349422051.jpg',
      title: 'Archaeological Axonometric Reconstruction: Dholavira Cascading Reservoirs',
      caption: 'Detailed isometric architectural sketch illustrating the Harappan cascading rock-cut rectangular cisterns, stepped sandstone ghats, desilting baffle basins, and stone-paved aqueducts framing the citadel.',
      architecturalStyle: 'Archaeological Axonometric Isometric Rendering on Historic Vellum',
      keyFeatures: [
        'Monolithic cisterns quarried up to 7.5 meters deep directly into sedimentary sandstone bedrock',
        'Stepped ghats allowing water access across varying seasonal water table elevations',
        'Circular sediment settling chambers with bottom scouring plugs for desilting prior to storage',
        'Waterproof plastering composed of gypsum, lime, and fine impermeable desert clay',
      ],
    },
    keyPoints: [
      'Oldest comprehensive urban water-harvesting system in recorded history (~5,000 years old).',
      'Over 10% of urban spatial volume was engineered purely for water storage.',
      'Included advanced sediment separation chambers before water entered storage cisterns.',
    ],
  },
  {
    id: 'bhojpur-cyclopean-dam',
    name: 'Bhojpur Cyclopean Dam & Lake',
    sanskritOrLocalName: 'भोजपुर महासेतु (Bhoja’s Great Reservoir)',
    region: 'Central India',
    state: 'Madhya Pradesh (Raisen / Bhopal District)',
    coordinates: '23.14° N, 77.58° E',
    waterSource: 'Betwa (Vetravati) and Kaliasote rivers',
    riverBasin: 'Yamuna–Ganga Basin (Betwa Tributary)',
    period: 'c. 1010 to 1055 CE (Paramara Dynasty)',
    associatedRulerOrCivilization: 'King Bhoja of Dhar (Paramara Empire), renowned polymath and author of architectural treatise *Samarāṅgaṇa Sūtradhāra*',
    purpose: 'Creation of a vast inland lake covering ~650 sq km (Bhojtal / Lake of Bhojpur) for regional flood moderation, regional climate cooling, agricultural canals, and royal prestige.',
    dimensions: {
      length: 'Main Betwa dam ~450 meters; secondary saddle dam ~100 meters',
      height: '12 to 14 meters (40 feet)',
      crestWidth: '8 to 10 meters',
      baseWidth: '30 to 35 meters',
      reservoirArea: 'Estimated 650 square kilometers',
      storageCapacity: 'Over 1,200 Million Cubic Meters at peak storage',
    },
    constructionMaterials: [
      'Massive cyclopean dressed sandstone blocks (some measuring 4m × 1m × 0.7m, weighing several tons)',
      'Dry cyclopean masonry laid completely without mortar',
      'Dense clay puddle core sandwiched between double-faced dressed stone ramparts',
    ],
    structuralDesign: 'Two earthen and cyclopean masonry gravity bunds closing two natural gaps between sandstone hills, transforming a large plateau depression into an inland sea.',
    waterManagementMethod: 'Impoundment of Betwa headwaters. King Bhoja identified two low gaps in the hills encircling the valley; by sealing these with two stone dams, he captured the drainage of 365 streams.',
    irrigationMethod: 'Extensive contour canals branching from the lake to irrigate the fertile black cotton soil (*regur*) of the Malwa plateau.',
    drainageAndFloodControl: 'Spillway carved through a natural solid rock ridge away from the main earthen bund to ensure surplus flood discharge never overtopped the stone facing.',
    currentCondition: 'Breached in 1434 CE by Sultan Hoshang Shah of Malwa; the dry lake bed is now the fertile agricultural valley of Bhojpur. The massive sandstone abutments and cyclopean stone blocks remain standing.',
    historicalAndArchaeologicalEvidence: {
      inscriptions: [
        'Inscriptions at the incomplete Bhojeshwar Temple nearby detailing King Bhoja’s architectural activities; records by Persian chroniclers (Ain-i-Akbari, Tarikh-i-Firishta).',
      ],
      archaeologicalExcavations: [
        'Surveys by British surveyor Lt. Kincaid (1888) and subsequent ASI investigations measuring the cyclopean sandstone blocks, quarry markings, and breach geometry.',
      ],
      writtenTexts: [
        'King Bhoja’s *Samarāṅgaṇa Sūtradhāra* (Chapters on soil testing, embankment stability, and hydraulic conduits); *Ain-i-Akbari* of Abu’l-Fazl recording that Hoshang Shah’s army took 3 months to drain the lake after demolishing the dam.',
      ],
    },
    engineeringAnalysis: {
      problem: 'Severe seasonal flooding of the Betwa river alternating with dry winter wheat crop failure in the Malwa plateau.',
      environmentalCondition: 'Natural amphitheater formed by ring of sandstone ridges, with only two narrow outlet gorges draining the Betwa and Kaliasote rivers.',
      engineeringSolution: 'Building two massive cyclopean stone gravity dams across the gaps, relying on the sheer weight of giant interlocking sandstone blocks without relying on perishable mortar.',
      constructionMethod: 'Quarrying large sandstone blocks from adjacent hilltops, transporting them down earthen ramps, dressing face joints to tight tolerances, and packing dense impervious clay between the outer and inner stone walls.',
      result: 'Created the largest artificial lake in medieval India (Bhojpur Lake), moderating regional microclimate and supporting intensive multi-crop agriculture.',
    },
    documentedVsInferred: {
      documented: [
        'Constructed by King Bhoja in early 11th century CE.',
        'Breached deliberately by Hoshang Shah of Malwa in 1434 CE for military and territorial reasons.',
        'Abu’l-Fazl documents that the breach took several months to drain.',
      ],
      inferred: [
        'The rock-cut spillway on the northern saddle was calibrated precisely to prevent overtopping during 100-year monsoon floods.',
      ],
      hypothetical: [
        'Exact mechanical hoist systems (pulley arrays, elephant draft teams) used to place the 4-meter sandstone megaliths.',
      ],
    },
    modernRelevance: 'Demonstrates the power of topographically intelligent site selection: by building only ~550m of total dam length across two natural bottlenecks, ancient engineers impounded 650 sq km of water. Modern Upper Lake of Bhopal is a surviving western remnant of this hydraulic network.',
    image: '/src/assets/images/ancient_dam_cross_section_1790264551732.jpg',
    reconstructionSketch: {
      image: '/src/assets/images/bhojpur_dam_crosssection_1790511686379.jpg',
      title: 'Civil Engineering Cutaway: King Bhoja’s Bhojpur Cyclopean Dam (11th Century CE)',
      caption: 'Technical architectural cross-section depicting King Bhoja’s 14-meter-high gravity dam built with dry-laid cyclopean sandstone megaliths weighing up to 10 tons forming double-faced retaining ramparts, enclosing a dense compacted puddle clay core anchored into bedrock.',
      architecturalStyle: 'Civil Engineering Technical Wash & Architectural Line Drafting',
      keyFeatures: [
        'Giant dressed sandstone megaliths (measuring up to 4m × 1m × 0.7m) laid dry without mortar',
        'Double-faced stone retaining ramparts sandwiching an impervious clay core',
        'Natural rock saddle spillway isolated from the earthen bund to prevent crest overtopping',
        'Topographic bottleneck placement impounding a staggering 650 sq km artificial reservoir',
      ],
    },
    keyPoints: [
      'Megalithic cyclopean masonry: blocks up to 4 meters long laid without mortar.',
      'Impounded a staggering 650 sq km lake using natural topography.',
      'Engineered by King Bhoja, one of the greatest civil engineering minds of medieval India.',
    ],
  },
  {
    id: 'ashoka-mauryan-hydrology',
    name: 'Mauryan Public Water Infrastructure & Ashoka’s Edicts',
    sanskritOrLocalName: 'मौर्य कालीन जल प्रबन्धन एवं अशोक के अभिलेख (Mauryan Vāri-Vidyā)',
    region: 'Pan-Indian (Pataliputra, Girnar, Kalsi, Delhi-Topra, Sanchi, Taxila)',
    state: 'Bihar, Gujarat, Uttar Pradesh, Haryana, Madhya Pradesh',
    coordinates: 'Pan-empire network (Centered at Pataliputra 25.61° N, 85.14° E)',
    waterSource: 'Ganga, Son, seasonal rivers, groundwater aquifers',
    riverBasin: 'Ganga River Basin & Indus Basin',
    period: 'c. 322 BCE to 185 BCE (Reign of Chandragupta, Bindusara, and Emperor Ashoka 268–232 BCE)',
    associatedRulerOrCivilization: 'Mauryan Empire (Emperor Ashoka, Chandragupta Maurya, Kautilya/Chanakya)',
    purpose: 'Universal roadside traveler and cattle welfare, famine mitigation, strategic defense (city moats), high-efficiency agricultural taxation (*udakabhāga*), and public health.',
    dimensions: {
      length: 'Empire-wide royal highway (*rājamārga*) water networks spanning thousands of kilometers',
      storageCapacity: 'Pataliputra moat: 600 feet wide, 45 feet deep; road wells spaced every half kosa (~3.2 km)',
    },
    constructionMaterials: [
      'Terracotta ring-wells (*kūpa*) stacked vertically in deep alluvium',
      'Burnt brick and dressed stone masonry well linings',
      'Massive sal wood timber palisades and iron dowels for moats and embankments',
      'Earthen diversion bunds (*setu*) and stone sluice valves',
    ],
    structuralDesign: 'Integrated administrative-hydrological network comprising urban deep moats with timber retaining walls, agrarian canal systems (*kulyā*), roadside step-wells and drinking troughs (*apāna*), and standardized terracotta ring-wells.',
    waterManagementMethod: 'Dual administrative and physical infrastructure: centralized state regulation by the *Sītādhyakṣa* (Crown Lands Superintendent) combined with decentralized local community maintenance backed by strict statutory penal codes.',
    irrigationMethod: 'Gravity canals, Persian-wheel precursors (*aratī-yantra* or *srotra-yantra* operated by water current or bullocks), manual well-lifting with balanced sweeps (*tulā-yantra*).',
    drainageAndFloodControl: 'Pataliputra’s monumental defensive and drainage moat (described by Megasthenes) encircled the 9-mile long capital, diverting flood surges from the Son into the Ganga and preventing seasonal river inundation of the wooden citadel.',
    currentCondition: 'Archaeological remains excavated at Kumrahar and Bulandibagh (Patna); terracotta ring-wells excavated across dozens of Mauryan sites; Ashoka’s rock and pillar edicts preserved in situ and in national museums.',
    historicalAndArchaeologicalEvidence: {
      inscriptions: [
        'Ashoka’s Major Rock Edict II (Girnar, Kalsi, Shahbazgarhi): "Everywhere within the dominions of Beloved-of-the-Gods... wells have been caused to be dug and trees caused to be planted for the enjoyment of cattle and men."',
        'Ashoka’s Pillar Edict VII (Topra-Delhi Pillar): "On the roads I have had banyan trees planted, which will give shade to beasts and men; mango groves have been planted; at every half-kosa (approx. 2 miles / 3.2 km) wells have been caused to be dug; rest houses (*nimshidhya*) have been erected; and many watering sheds (*apāna*) have been established for the enjoyment of cattle and men."',
        'Junagadh Rock Inscription: explicitly mentions Tusaspha, governor under Emperor Ashoka, constructing canals from Sudarshana Lake.',
      ],
      archaeologicalExcavations: [
        'Excavations at Kumrahar and Bulandibagh by Spooner, Waddell, and Altekar uncovering the 600-foot-wide Mauryan wooden palisade moat with iron dowels and drains.',
        'Widespread discovery of Mauryan terracotta ring-wells at Hastinapur, Ropar, Pataliputra, and Taxila, demonstrating standardized sanitary groundwater extraction.',
      ],
      writtenTexts: [
        'Megasthenes’ *Indica* (Book III): recording the dimensions of Pataliputra’s moat and municipal water sanitation officers.',
        'Kautilya’s *Arthashastra*: Book II Chapter 24 (Irrigation tax rates: 1/5th to 1/3rd depending on water lifting mechanism); Book III Chapter 9 (Fines for causing damage to dams, illegally draining communal tanks, or obstructing irrigation sluices).',
      ],
    },
    engineeringAnalysis: {
      problem: 'Continental-scale trade routes connecting Pataliputra to Taxila and Ujjain passing through semi-arid zones; travelers and transport cattle faced dehydration during hot pre-monsoon months; urban flood vulnerability in floodplains.',
      environmentalCondition: 'Alluvial Gangetic plain with high silt load, seasonal monsoon flooding, deep dry season water tables, and fragile uncompacted soil prone to well-collapse.',
      engineeringSolution: 'Terracotta ring-well technology preventing soil cave-in; rigid imperial spacing of wells and shading canopies at 3.2 km intervals; massive timber-palisaded moats absorbing monsoon river swells.',
      constructionMethod: 'Pre-fabricated terracotta ceramic cylinders sunk one by one as soil was scooped from within; mature banyan trees planted along road shoulders to prevent soil erosion and provide cooling canopy.',
      result: 'Created the most extensive humanitarian and trade logistics corridor in the ancient world, reducing highway mortality to near zero and boosting continental commerce.',
    },
    documentedVsInferred: {
      documented: [
        'Ashokan inscriptions directly state wells were dug at half-kosa intervals along royal routes.',
        'Rest houses and animal watering stations (*apāna*) were state-funded.',
        'Tusaspha added irrigation channels to Sudarshana reservoir under Ashoka.',
        'Megasthenes documented the 600-foot wide moat around Pataliputra.',
      ],
      inferred: [
        'Half-kosa spacing (~3.2 km) corresponds to the maximum distance a laden bullock cart or marching infantryman could travel without water under hot tropical sun.',
        'Terracotta ring-wells served as soakage/septic drainage pits in urban centers and as sanitary drinking wells in rural sectors.',
      ],
      hypothetical: [
        'The exact mechanical lifting apparatus used at Ashokan highway wells (likely counterpoised shadufs or pulley pulleys with rope).',
      ],
    },
    modernRelevance: 'The earliest documented state policy of "climate-resilient green highways": integrating groundwater extraction, afforestation for thermal comfort, rest shelters, and flood drainage. Today’s National Highways Authority of India (NHAI) green corridor policies mimic Ashoka’s Pillar Edict VII specifications.',
    image: '/src/assets/images/sudarshana_lake_girnar_1790264567305.jpg',
    reconstructionSketch: {
      image: '/src/assets/images/ashokan_hydrology_sketch_1790349450946.jpg',
      title: 'Imperial Mauryan Highway Hydrology & Ashokan Infrastructure Sketch',
      caption: 'Archaeological reconstruction drawing illustrating Ashokan roadside water stations (*apāna*), standardized terracotta ring-wells sunk in alluvium, canal gates, and shaded banyan transit corridors.',
      architecturalStyle: 'Epigraphical & Archaeological Field Reconstruction Drawing',
      keyFeatures: [
        'Standardized half-kosa (~3.2 km) grid spacing of public drinking wells along trunk highways',
        'Stacked interlocking terracotta ring-wells preventing soil collapse in sandy alluvium',
        'Pataliputra 600-foot wide defensive and flood diversion moat with wooden timber palisades',
        'State-regulated sluice gates and irrigation conduits overseen by imperial *Sītādhyakṣa*',
      ],
    },
    keyPoints: [
      'Pillar Edict VII documents royal wells engineered every half-kosa (~3.2 km) along imperial highways.',
      'Major Rock Edict II proves state environmental management included cattle welfare and roadside botany.',
      'Arthashastra provides the world’s most comprehensive ancient legal and economic framework for dam safety and water taxation.',
    ],
  },
  {
    id: 'sringaverapura-tank',
    name: 'Sringaverapura Desilting Tank & Sluice Complex',
    sanskritOrLocalName: 'शृङ्गवेरपुर जल शोधन कुण्ड (Ganga Flood Harvesting Complex)',
    region: 'Northern India',
    state: 'Uttar Pradesh (Prayagraj / Allahabad District)',
    coordinates: '25.58° N, 81.65° E',
    waterSource: 'Ganga (Ganges) River monsoon floodwaters',
    riverBasin: 'Middle Ganga River Basin',
    period: 'c. 1st Century BCE to 1st Century CE (Sunga–Kushana Period)',
    associatedRulerOrCivilization: 'Early Historic Northern India (Sunga / Kushana period communities)',
    purpose: 'Harvesting heavy monsoon floodwaters from the Ganga, separating heavy silt and debris, and storing purified water for urban, ritual, and agrarian utility throughout the dry season.',
    dimensions: {
      length: 'Over 250 meters overall hydraulic complex',
      height: 'Cascading tank depth ranging from 4 to 7 meters',
      storageCapacity: 'Over 12,000 cubic meters in series of interconnected brick reservoirs',
    },
    constructionMaterials: [
      'Kiln-fired terracotta bricks (standard Kushana-era size: approx. 42 cm × 26 cm × 7 cm)',
      'Lime-surkhi hydraulic waterproof mortar',
      'Terracotta drain pipes, stone spillway steps, and circular siltation wells',
    ],
    structuralDesign: 'Three-stage hydraulic desilting system: (1) An intake canal cutting into the Ganga floodplain, (2) A deep circular silting chamber (*kūpa*) with curved baffle walls to drop bed-load sediment, (3) Tank A for intermediate settling, (4) Overflow spillway with stepped cascade into Tank B for pristine water storage.',
    waterManagementMethod: 'Flood-skimming: only the peak, relatively cleaner surface floodwaters were drawn into the intake during high monsoon spates. The circular chamber induced rotational flow, shedding sand and coarse silt before clear water overflowed into the main brick-lined reservoirs.',
    irrigationMethod: 'Gravity feeder conduits delivering water to adjacent settlement gardens and religious establishments.',
    drainageAndFloodControl: 'Emergency stone surplus weir at the tail end of Tank B discharging excess water back into the Ganga downstream, avoiding hydraulic wall blowouts.',
    currentCondition: 'Excavated and conserved by the Archaeological Survey of India; partially covered protective archaeological park.',
    historicalAndArchaeologicalEvidence: {
      inscriptions: [
        'Clay sealings and pottery with Brahmi scripts from the Kushana period excavated within the strata.',
      ],
      archaeologicalExcavations: [
        'Pioneering excavations conducted by Prof. B.B. Lal and the ASI (National Project on Archaeology of Ramayana Sites, 1977–1986), exposing the entire 250-meter-long brick complex in immaculate preservation.',
      ],
      writtenTexts: [
        'Epics mention Sringaverapura as the capital of Nishada king Guha on the banks of the Ganga.',
      ],
    },
    engineeringAnalysis: {
      problem: 'Ganga floodwaters carry immense volumes of abrasive, muddy silt. Diverting raw river water directly into storage tanks rapidly chokes them with mud within single monsoon.',
      environmentalCondition: 'Extreme river stage fluctuation (8 to 10 meters difference between summer dry flow and peak monsoon inundation).',
      engineeringSolution: 'A multi-chamber settling velocity decelerator: using centrifugal force in a circular pit to decelerate water velocity, dropping silt by gravity before clear water cascades over a wide broad-crested brick weir.',
      constructionMethod: 'Deep trenching in river alluvium, laying high-density burnt brick retaining walls with stepped batters to resist lateral earth pressure, lining joints with water-resistant lime mortar.',
      result: 'The most sophisticated sediment-separation and water purification installation in ancient hydraulic history.',
    },
    documentedVsInferred: {
      documented: [
        'Stratigraphic excavation proves 1st century BCE to 1st century CE date.',
        'Physical circular well with bottom silt collection sump and intake canal connected directly to Ganga flood plain.',
      ],
      inferred: [
        'The circular well was periodically desilted manually during winter low-water periods through bottom drain valves.',
      ],
      hypothetical: [
        'Whether floating vegetative silt booms were placed at the intake mouth to block tree logs and floating flotsam.',
      ],
    },
    modernRelevance: 'Direct precursor to modern water treatment settling tanks (clariflocculators) and stormwater sediment basins. Validates ancient Indian mastery of hydraulic sediment transport physics.',
    image: '/src/assets/images/ancient_dam_cross_section_1790264551732.jpg',
    reconstructionSketch: {
      image: '/src/assets/images/sringaverapura_tank_sketch_1790349467189.jpg',
      title: 'Three-Stage Hydraulic Clarification Plant: Sringaverapura Complex',
      caption: 'Technical isometric architectural sketch of the 1st century BCE Kushana-Sunga brick desilting installation on the Ganga, featuring a circular settling well (*kūpa*), cascade weirs, and purification basins.',
      architecturalStyle: 'Hydraulic Clarification Plant Axonometric Cutaway',
      keyFeatures: [
        'Deep circular silting chamber (*kūpa*) utilizing rotational centrifugal force to settle coarse riverbed sand',
        'Stepped kiln-fired Kushana brick cascade weirs aerating and skimming clarified surface water',
        'High-density burnt brick retaining walls with stepped batters to resist lateral soil thrust',
        'Tail-end stone emergency surplus spillway returning excess monsoon surges back to the Ganga',
      ],
    },
    keyPoints: [
      'Oldest documented multi-chamber desilting and water clarification plant in Asia.',
      'Engineered specifically to harvest Ganga monsoon floodwaters without tank siltation.',
      'Excavated by Prof. B.B. Lal; designated a milestone of ancient Indian civil engineering.',
    ],
  },
  {
    id: 'porumamilla-tank',
    name: 'Porumamilla Tank (Anantarajasagara)',
    sanskritOrLocalName: 'पोरुमामिळ्ळ अनन्तराजसागर (Anantarājasāgara)',
    region: 'Southern India',
    state: 'Andhra Pradesh (Kadapa / Cuddapah District)',
    coordinates: '15.01° N, 79.00° E',
    waterSource: 'Maldevi River (Tributary of Pennar)',
    riverBasin: 'Pennar River Basin',
    period: '1369 CE (Vijayanagara Empire)',
    associatedRulerOrCivilization: 'Prince Bhaskara Bhavadurga (Anantaraja), son of Vijayanagara Emperor Bukka I',
    purpose: 'Monumental irrigation reservoir creating thousands of acres of paddy land, famine relief, and civic merit (*dharma*).',
    dimensions: {
      length: 'Embankment length ~1,400 meters (4,500 feet)',
      height: '10 to 12 meters (33 feet)',
      crestWidth: '3.6 to 4.5 meters',
      storageCapacity: 'Over 20 Million Cubic Meters, watering 14 villages',
    },
    constructionMaterials: [
      'Massive revetment of dressed granite blocks laid in steps on water face',
      'Dense rammed red earth core',
      'Cut-stone sluices (*tūmu*) with vertical granite pillars and plug-lifters',
      'Twin rock-cut surplus weirs (*kalingu*)',
    ],
    structuralDesign: 'Monumental earthen embankment with stone revetment closing the gap between two hills, featuring four independent stone sluice gates and two spillways.',
    waterManagementMethod: 'Sluice regulation: vertical stone conduits with plug cisterns allowing controlled water release to channels while maintaining hydrostatic stability of the bund.',
    irrigationMethod: 'Extensive canal network feeding 14 downstream agrarian villages.',
    drainageAndFloodControl: 'Two natural rock-cut waste weirs (*kalingu*) placed at opposite ends on solid granite foundations to bypass catastrophic cloudburst overflows.',
    currentCondition: 'Fully operational and intact after more than 650 years, continuing to irrigate Kadapa district agricultural lands.',
    historicalAndArchaeologicalEvidence: {
      inscriptions: [
        'The celebrated 1369 CE Porumamilla Sanskrit Stone Inscription (Epigraphia Indica Vol. XIV): 24 poetic verses detailing the exact date of construction (Saka 1291), the labor of 1,000 men and 100 carts working for two years, and enshrining the **12 Essential Sādhanas (prerequisites) and 6 Doshas (critical structural defects)** of dam engineering.',
      ],
      archaeologicalExcavations: [
        'Epigraphical Survey of India and Irrigation Department surveys cataloging the granite sluices and spillways.',
      ],
      writtenTexts: [
        'Epigraphia Indica Vol. XIV, pp. 97–109; Vijayanagara royal charters.',
      ],
    },
    engineeringAnalysis: {
      problem: 'Pennar basin experiences erratic North-East monsoon rains with prolonged multi-year droughts causing catastrophic famines.',
      environmentalCondition: 'Two granite ridges flanking the Maldevi river, providing natural rock abutments but demanding high shear resistance against hydrostatic thrust.',
      engineeringSolution: 'Building a massive earthen embankment faced with cyclopean stepped granite stones, anchoring both ends into living granite bedrock.',
      constructionMethod: '1,000 laborers and 100 bullock carts hauling clay and rock over two continuous dry seasons, compacting earth in thin layers, dressing stone revetment to break wave action, and carving spillways into the natural mountain rock.',
      result: 'An enduring irrigation reservoir operating without structural breach for over six centuries.',
    },
    documentedVsInferred: {
      documented: [
        'Exact construction timeline: two years, 1,000 men, 100 carts (recorded in the inscription).',
        'Codification of the 12 Sādhanas (virtues of a dam) and 6 Doshas (fatal flaws).',
      ],
      inferred: [
        'Labor was organized along guilds (*shreni*) of stonecutters, earth-diggers (*vaddas*), and hydraulic architects (*jalasutrada*).',
      ],
      hypothetical: [
        'Total imperial treasury cost in contemporary gold *varahas*.',
      ],
    },
    modernRelevance: 'The Porumamilla Inscription is the most famous ancient textbook on dam safety and site selection. Its 12 prerequisites (good foundation, natural rock abutments, adequate spillway, dependable river) match modern International Commission on Large Dams (ICOLD) dam safety criteria.',
    image: '/src/assets/images/ancient_dam_cross_section_1790264551732.jpg',
    reconstructionSketch: {
      image: '/src/assets/images/porumamilla_dam_crosssection_1790511698176.jpg',
      title: 'Architectural Cross-Section: Porumamilla Reservoir Dam (1369 CE, Vijayanagara)',
      caption: 'Engineering transverse cross-section drawing of Prince Bhaskara’s 1,400-meter embankment dam conforming to the 12 Sādhanas. Shows the dense rammed red earth core, stepped granite boulder revetment, vertical cut-stone sluice towers (*tūmu*) with plug controls, and bedrock abutments.',
      architecturalStyle: 'Historical Architectural Drafting on Aged Engineering Parchment',
      keyFeatures: [
        'Massive stepped granite boulder revetment protecting the upstream red earth embankment',
        'Cut-stone sluice towers (*tūmu*) with vertical granite pillars and plug-lifting controls',
        'Twin natural rock-cut waste weirs (*kalingu*) anchored into living mountain bedrock',
        'Strict structural adherence to the 12 Sādhanas and 6 Doshas codified in the 1369 CE inscription',
      ],
    },
    keyPoints: [
      'Features the world’s most comprehensive epigraphical code of dam engineering principles (12 Sādhanas & 6 Doshas).',
      'Maintained and irrigating crops continuously since 1369 CE.',
      'Directly connects ancient Indian civil engineering treatises with real-world infrastructure.',
    ],
  },
  {
    id: 'mohenjo-daro-drainage',
    name: 'Mohenjo-daro Great Bath & Underground Sewer Network',
    sanskritOrLocalName: 'मोहनजोदड़ो महास्नानागार एवं जल निकास प्रणाली',
    region: 'North-Western Subcontinent',
    state: 'Sindh (Larkana District / Indus River Valley)',
    coordinates: '27.32° N, 68.13° E',
    waterSource: 'Indus River alluvial aquifer & brick cylindrical wells',
    riverBasin: 'Lower Indus River Basin',
    period: 'c. 2600 BCE to 1900 BCE (Mature Harappan Phase)',
    associatedRulerOrCivilization: 'Indus Valley Civilisation (Mature Harappan Municipality)',
    purpose: 'Civic sanitation, ritual water lustrations, disease prevention, and urban stormwater/wastewater separation across a multi-tiered city.',
    dimensions: {
      length: 'Great Bath basin: 11.88m × 7.01m; depth: 2.43m (Drain length: over 24m corbelled arch gallery)',
      height: 'Basin depth 2.43 meters with double-stepped stairs',
      storageCapacity: 'Great Bath capacity ~160 cubic meters; urban grid fed by over 700 brick wells',
    },
    constructionMaterials: [
      'Kiln-burnt terracotta bricks laid in English bond with fine gypsum-lime mortar',
      'Natural bitumen (asphalt) mastic moisture barrier (3 cm thick waterproofing layer)',
      'Mud-brick backing retaining wall behind waterproof membrane',
      'Dressed limestone lintels and corbelled brick ceiling arches',
    ],
    structuralDesign: 'Sunken rectangular brick pool with two symmetrical flights of brick stairs, enveloped by a 3-layer waterproofing sandwich (fine-jointed brickwork, 3cm bitumen mastic, outer burnt brick retaining wall) draining into a corbelled-arch sewer high enough for an adult to walk through.',
    waterManagementMethod: 'Well extraction into storage cisterns; regulated overflow into covered street culverts equipped with terracotta sediment traps and grease-interceptor soakage jars.',
    irrigationMethod: 'Urban civic domestic use, ritual purification, and peripheral floodplain recession farming (*sailabi*).',
    drainageAndFloodControl: 'Gradient-engineered covered street conduits with limestone manhole slabs for periodic desilting; sewage separated strictly from domestic water wells.',
    currentCondition: 'Archaeological UNESCO World Heritage site (1980); exposed brick remains conserved under international archaeological supervision.',
    historicalAndArchaeologicalEvidence: {
      inscriptions: [
        'Pre-literate / undeciphered Indus script found on steatite seals across the HR and DK areas.',
      ],
      archaeologicalExcavations: [
        'Excavations by Sir John Marshall, Ernest Mackay (1922–1931), and Dr. George Dales documenting the Great Bath, 700+ cylindrical brick wells, and the monumental corbelled drain outlet.',
      ],
      writtenTexts: [
        'Purely archaeological evidence; stratigraphic documentation by Archaeological Survey of India and UNESCO.',
      ],
    },
    engineeringAnalysis: {
      problem: 'Dense urban population (~40,000 residents) vulnerable to waterborne epidemics and seasonal Indus groundwater waterlogging.',
      environmentalCondition: 'Alluvial plain prone to high groundwater pressure and seasonal river flooding.',
      engineeringSolution: 'Multi-layer waterproofing using bitumen mastic on the Great Bath and building a gravity-drained subterranean sewer network beneath paved street thoroughfares.',
      constructionMethod: 'Tightly jointed fired bricks set on edge with gypsum plaster; applying molten asphalt as an impervious membrane; corbelling overhead brick tiers to form structural sewer vaults without timber forms.',
      result: 'The most sanitary and sophisticated urban wastewater and hydraulic system in the Bronze Age world, unrivaled until the Roman Empire two millennia later.',
    },
    documentedVsInferred: {
      documented: [
        'Direct physical recovery of 3cm thick bitumen waterproofing mastic layer.',
        'Corbelled brick outlet sewer over 1.8 meters tall exiting the western citadel slope.',
        'Over 700 brick-lined cylindrical wells distributed across individual domestic courtyards.',
      ],
      inferred: [
        'Great Bath water was emptied and refilled frequently for civic religious or ritual purification rites.',
        'Municipal sanitation officials (*nagaradhyaksha* equivalent) oversaw daily sewer clearances.',
      ],
      hypothetical: [
        'Specific botanical coagulants or filtration media used in domestic soakage jars.',
      ],
    },
    modernRelevance: 'Validates modern municipal separation of blackwater, greywater, and storm runoff. Pioneers the use of petroleum/bitumen waterproofing membranes still standard in modern civil engineering.',
    image: '/src/assets/images/dholavira_reservoirs_1790264585923.jpg',
    reconstructionSketch: {
      image: '/src/assets/images/dholavira_reservoir_sketch_1790349422051.jpg',
      title: 'Bronze Age Subterranean Sanitary Engineering: Mohenjo-daro Drainage',
      caption: 'Isometric architectural drafting showing the Great Bath waterproofing sandwich (gypsum mortar, 3cm bitumen mastic), terracotta soakage sumps, and vaulted corbelled brick sewers.',
      architecturalStyle: 'Archaeological Cutaway Isometric Drafting',
      keyFeatures: [
        '3-layer waterproofing barrier featuring natural bitumen mastic sandwiched between kiln-burnt brickwork',
        'Corbelled brick arched wastewater conduits with removable limestone inspection inspection covers',
        'Terracotta vertical soakage jars trapping heavy organic silt before street discharge',
        'Standardized brick metrology (1:2:4 ratio) resistant to hydraulic shear',
      ],
    },
    keyPoints: [
      'Earliest recorded use of bitumen waterproofing in world civil engineering history (~4,500 years ago).',
      'World’s first standardized municipal covered sewer and drainage network.',
      'Over 700 private and public cylindrical brick wells providing universal clean water.',
    ],
  },
  {
    id: 'lothal-dockyard',
    name: 'Lothal Tidal Dockyard & Sluice Lock Gate',
    sanskritOrLocalName: 'लोथल ज्वारीय गोदी एवं जलकपाट प्रणाली',
    region: 'Western India',
    state: 'Gujarat (Ahmedabad District / Gulf of Khambhat)',
    coordinates: '22.52° N, 72.25° E',
    waterSource: 'Bhogavo River & Gulf of Khambhat tidal flood surges',
    riverBasin: 'Sabarmati & Bhogavo Basin',
    period: 'c. 2400 BCE to 1900 BCE (Mature Harappan Phase)',
    associatedRulerOrCivilization: 'Harappan Maritime Corporation / Indus Port Authority',
    purpose: 'Maritime berthing basin, ship maintenance, international commerce with Dilmun (Bahrain) and Magan (Oman), and siltation prevention.',
    dimensions: {
      length: 'Basin dimensions: 214 meters × 36 meters (embankment perimeter ~500m)',
      height: 'Basin brick wall depth: 4.15 meters',
      storageCapacity: 'Enclosed hydraulic basin volume ~32,000 cubic meters; accommodates up to 30 ships of 60 tons',
    },
    constructionMaterials: [
      'Kiln-burnt hydraulic bricks engineered to withstand sea-water salt crystallization',
      'Mud-brick backing rampart absorbing wave impact',
      'Grooved wooden vertical lock gate (sluice shutter) with stone guide slots',
      'Terracotta spillway conduits with baffle chambers',
    ],
    structuralDesign: 'Massive trapezoidal basin built of burnt brick with an inlet channel cutting from the Bhogavo river and a southern escape sluice fitted with vertical wooden lock gate slots to maintain floating water depth at low tide.',
    waterManagementMethod: 'Tidal hydraulic lock: incoming high tide forced water and ships through the 7-meter-wide inlet channel; at high tide crest, the vertical wooden gate was lowered, trapping water inside so ships remained afloat during low tide.',
    irrigationMethod: 'Primarily naval transport, dry-dock vessel maintenance, and secondary freshwater storage.',
    drainageAndFloodControl: 'Automatic excess spillway on the southern wall with a 1m diameter circular opening discharging surplus flood runoff into the estuary.',
    currentCondition: 'Excavated and conserved by Archaeological Survey of India (ASI); designated national maritime heritage monument.',
    historicalAndArchaeologicalEvidence: {
      inscriptions: [
        'Harappan seals with ship motifs, anchor stones, and Persian Gulf round button seals found inside warehouse precinct.',
      ],
      archaeologicalExcavations: [
        'Excavations by Dr. S.R. Rao (ASI, 1954–1962) documenting the 214m brick basin, five stone anchor weights, inlet sill, and lock-gate grooves.',
      ],
      writtenTexts: [
        'Pre-literate archaeological context; S.R. Rao’s definitive excavation monograph "Lothal and the Indus Civilization".',
      ],
    },
    engineeringAnalysis: {
      problem: 'Gulf of Khambhat experiences the second highest tidal range in the world (8 to 10 meters). Ships would be smashed or stranded in mud at low tide.',
      environmentalCondition: 'Extreme diurnal tidal variation, muddy estuary bed, and abrasive saline wave action.',
      engineeringSolution: 'Building the world’s first artificial enclosed tidal basin with a vertical wooden lock gate acting as a hydraulic check valve.',
      constructionMethod: 'Laying over a million burnt bricks with stepped batter walls, cutting an inlet channel at an acute angle to the river flow to reduce silt ingress, and reinforcing the sluice gate opening with grooved brick pillars.',
      result: 'Maintained a stable 2-meter water head inside the dock at all times, making Lothal the premier international seaport of ancient Asia.',
    },
    documentedVsInferred: {
      documented: [
        'Physical burnt brick basin 214m × 36m with stepped walls.',
        'Grooved brick pillars at the southern outlet specifically designed to hold a sliding wooden gate.',
        'Five heavy perforated stone anchors recovered from the basin bottom.',
      ],
      inferred: [
        'The lock gate was operated using wooden levers or ropes during tidal slack periods.',
      ],
      hypothetical: [
        'Use of animal draft teams to tow deep-draft vessels through the river inlet.',
      ],
    },
    modernRelevance: 'Pioneered the basic hydraulic principles of modern tidal wet docks and lock-gate engineering 4,000 years before the docks of Liverpool and London.',
    image: '/src/assets/images/dholavira_reservoirs_1790264585923.jpg',
    reconstructionSketch: {
      image: '/src/assets/images/dholavira_reservoir_sketch_1790349422051.jpg',
      title: 'Bronze Age Tidal Hydraulic Engineering: Lothal Dockyard Lock Gate',
      caption: 'Isometric reconstruction of the 214m brick tidal basin, acute-angle river inlet channel, stone anchor berths, and vertical wooden sluice lock gate.',
      architecturalStyle: 'Harappan Naval Engineering Isometric Drafting',
      keyFeatures: [
        '214m × 36m kiln-burnt brick basin maintaining water head through tidal cycles',
        'Grooved vertical sluice lock gate trapping seawater at high tide to keep ships afloat',
        'Acute-angle river diversion channel minimizing sediment ingress into the dock basin',
        'Perforated stone anchor moorings along brick wharves and warehouse platforms',
      ],
    },
    keyPoints: [
      'World’s oldest engineered tidal dock basin (~2400 BCE).',
      'Pioneered the hydraulic lock gate for maritime dry-dock berthing.',
      'Sustained international Bronze Age maritime commerce between India, Oman, and Mesopotamia.',
    ],
  },
  {
    id: 'rani-ki-vav-stepwells',
    name: 'Rani ki Vav (The Queen’s Stepwell) & Western Indian Baolis',
    sanskritOrLocalName: 'राणी की वाव (पाटन सोलंकी जल मन्दिर)',
    region: 'Western India',
    state: 'Gujarat (Patan / Saraswati River Valley)',
    coordinates: '23.85° N, 72.10° E',
    waterSource: 'Saraswati River subterranean alluvial aquifers',
    riverBasin: 'Saraswati River Basin',
    period: 'c. 1063 CE (Chaulukya / Solanki Dynasty)',
    associatedRulerOrCivilization: 'Queen Udayamati (memorial to King Bhima I, Chaulukya Dynasty)',
    purpose: 'Civic water security, subterranean thermal moderation, flood sediment filtration, and sacred water reverence (*tirtha*).',
    dimensions: {
      length: '65 meters long, 20 meters wide',
      height: 'Depth: 28 meters across 7 descending pillared subterranean tiers',
      storageCapacity: 'Perennial access to multiple aquifer horizons via deep stepped circular shaft',
    },
    constructionMaterials: [
      'Finely dressed Dhrangadhra yellow and white sandstone',
      'Interlocking mortise-and-tenon stone joinery without mortar',
      'Heavy structural stone lintels and cantilevered bracket pillars',
      'Silt settling sumps and sandstone well-lining rings',
    ],
    structuralDesign: 'An inverted subterranean temple descending through 7 stepped terraces, supported by over 500 principal sculptures and 200 pillared pavilions (*mandapas*) engineered to resist immense lateral soil pressure (*earth pressure at rest* $K_0$).',
    waterManagementMethod: 'Subterranean step-descent: as the Saraswati groundwater table fluctuated from monsoon surface level down to 28 meters during arid summers, citizens descended dry steps to reach the clean, naturally sand-filtered water table without rope-draw contamination.',
    irrigationMethod: 'Municipal drinking water, traveler caravans, and secondary gravity flow to adjacent garden orchards.',
    drainageAndFloodControl: 'Inundation silt traps; after being buried by Saraswati flood silts in the 13th century, the structural cantilever pillars preserved the entire lower well intact for 700 years until ASI de-silting in the 1980s.',
    currentCondition: 'UNESCO World Heritage Site (2014); impeccably conserved by Archaeological Survey of India.',
    historicalAndArchaeologicalEvidence: {
      inscriptions: [
        'Mentioned in Merutunga’s 1304 CE historical chronicle *Prabandha Chintamani*: "Udayamati, the daughter of Naravaraha Khengara, built this novel stepped well at Anahilapatana."',
      ],
      archaeologicalExcavations: [
        'Major ASI archaeological desilting and conservation project (1986–1989) clearing millions of cubic meters of Saraswati river silt, revealing pristine sculptures and structural tiers.',
      ],
      writtenTexts: [
        '*Prabandha Chintamani* (1304 CE); *Aparajitapriccha* of Bhuvanadeva (12th c. treatise on stepwell architectural metrology - *Jaya*, *Vijaya*, *Bhadra*, *Nanda* classifications).',
      ],
    },
    engineeringAnalysis: {
      problem: 'Extreme arid climate of North Gujarat: searing 45°C summer heat, rapid surface evaporation, and high seasonal groundwater fluctuations in fine alluvial sand.',
      environmentalCondition: 'Soft alluvial soil prone to inward collapse under hydrostatic and lateral earth pressure.',
      engineeringSolution: 'Building an inverted stepped pyramid where descending multi-tier pillared galleries act as structural struts, counteracting horizontal soil pressure while shading the water from evaporation.',
      constructionMethod: 'Excavating a massive 30-meter-deep trench, erecting stepped stone retaining walls, locking pillars and lintels with dry stone mortise-and-tenon joints, and sinking a cylindrical well at the western terminus.',
      result: 'A breathtaking subterranean architectural masterpiece that supplied cold, purified groundwater year-round while resisting catastrophic soil blowouts for nearly a millennium.',
    },
    documentedVsInferred: {
      documented: [
        'Constructed by Queen Udayamati around 1063 CE as recorded in Prabandha Chintamani.',
        'Physical structural depth of 28 meters with 7 distinct architectural terraces.',
        'Classification as a *Maru-Gurjara* style stepwell with *Nanda* entrance typology.',
      ],
      inferred: [
        'Pillared pavilion cross-beams were mathematically dimensioned to resist lateral Rankine earth pressure.',
      ],
      hypothetical: [
        'Total number of master stonecutters (*sompuras*) employed across the 20-year construction period.',
      ],
    },
    modernRelevance: 'Demonstrates passive geothermal cooling and zero-energy groundwater harvesting. Modern subterranean architecture and retained earth basement engineering directly copy its structural strut-and-tier load distribution.',
    image: '/src/assets/images/ancient_dam_cross_section_1790264551732.jpg',
    reconstructionSketch: {
      image: '/src/assets/images/ashokan_hydrology_sketch_1790349450946.jpg',
      title: 'Subterranean Hydraulic Architecture: Rani ki Vav (Patan)',
      caption: 'Transverse cutaway drafting displaying the 7 stepped subterranean pillared terraces, lateral earth-pressure retaining walls, and circular aquifer draw well.',
      architecturalStyle: 'Classical Stepwell Structural Elevation Drafting',
      keyFeatures: [
        '7 descending pillared architectural terraces acting as structural struts against lateral soil thrust',
        'Deep circular shaft tapping multi-stratum sand aquifers free of surface contamination',
        'Passive subterranean microclimate maintaining water temperatures 8–10°C below ambient air',
        'Dry mortise-and-tenon sandstone joinery absorbing seismic and ground settlements',
      ],
    },
    keyPoints: [
      'Pinnacle of Indian stepwell (*vav* / *baoli*) engineering and UNESCO World Heritage monument.',
      'Combines profound hydraulic geology with 7-tier structural earth retention.',
      'Engineered to supply purified groundwater in the arid Saraswati basin.',
    ],
  },
  {
    id: 'kakatiya-cascade-tanks',
    name: 'Kakatiya Dynasty Chain-Tank Cascade (Ramappa & Pakhal Lakes)',
    sanskritOrLocalName: 'काकतीय शृङ्खला जलाशय (रामप्पा एवं पाखाल चेरुवु)',
    region: 'Southern India',
    state: 'Telangana (Warangal / Mulugu District)',
    coordinates: '18.25° N, 79.94° E',
    waterSource: 'Tributaries of Godavari & Krishna rivers (seasonal hill torrents)',
    riverBasin: 'Godavari River Basin',
    period: 'c. 1200 CE to 1323 CE (Kakatiya Empire)',
    associatedRulerOrCivilization: 'Kakatiya Dynasty (Ganapati Deva, Rudrama Devi, Prataparudra; Minister Recharla Rudra)',
    purpose: 'Transforming the semi-arid, rocky Deccan plateau into an agricultural granary through gravity-linked valley reservoir chains.',
    dimensions: {
      length: 'Ramappa bund: over 2,000 meters; Pakhal dam: 1,500 meters',
      height: 'Embankment heights up to 12–14 meters',
      storageCapacity: 'Ramappa Lake: ~80 MCM; Pakhal Lake: ~100 MCM; watering over 100,000 acres',
    },
    constructionMaterials: [
      'Engineered red clay and gravel embankment with puddle clay core',
      'Cyclopean granite stone pitching on upstream water slope',
      'Granite sluice conduits (*tūmu*) with vertical wooden plug-lifters',
      'Natural rock-cut surplus weirs (*kalingu*) on bedrock saddles',
    ],
    structuralDesign: 'Contour earthen gravity bunds thrown across natural gaps between granitic hills, connecting multiple reservoirs in a cascade where the surplus spillway of one lake directly charges the feeder canal of the downstream tank.',
    waterManagementMethod: 'Cascade hydrology (*Golusu Kattu Cheruvulu*): every drop of monsoon rainfall in the micro-catchment is captured. When Ramappa Lake reaches maximum capacity, excess discharges over its rock weir into lower feeder tanks, eliminating flood damage while replenishing valley groundwater.',
    irrigationMethod: 'Extensive gravity canal distributaries watering double-cropped paddy and sugarcane across the Warangal plain.',
    drainageAndFloodControl: 'Natural granite escape weirs preventing crest overtopping; upstream cascade buffers peak flood velocities before water reaches lower settlements.',
    currentCondition: 'Fully operational and intact after 800 years; Ramappa Temple complex designated UNESCO World Heritage Site in 2021; modern Telangana *Mission Kakatiya* is directly modeled on this network.',
    historicalAndArchaeologicalEvidence: {
      inscriptions: [
        'The 1213 CE Ramappa Inscription on a black basalt pillar recording the construction of the lake and temple by General Recharla Rudra under Kakatiya King Ganapati Deva.',
        'Pakhal Inscription (c. 1250 CE) recording the damming of a river between two hills by King Ganapati Deva’s governor.',
      ],
      archaeologicalExcavations: [
        'Telangana Irrigation Department and ASI archaeological surveys documenting the granite sluice gates and interconnected valley contours.',
      ],
      writtenTexts: [
        '*Prataparudra Yashobhushanam*; contemporary Telugu epigraphical corpus detailing the *Cheruvu-variyam* (tank maintenance committees).',
      ],
    },
    engineeringAnalysis: {
      problem: 'The Deccan plateau receives erratic, intense monsoon rainfall that rapidly drains off rocky granitic slopes, leaving the land parched for 9 months.',
      environmentalCondition: 'Undulating topography with hard granitic outcrops and thin topsoil.',
      engineeringSolution: 'Linking entire river valleys into a "chain-tank cascade" where no runoff escapes to the sea without passing through 4 to 6 sequential storage reservoirs.',
      constructionMethod: 'Excavating foundation trenches into consolidated bedrock, banking compacted clay-soil in layers, revetting upstream faces with heavy granitic rip-rap, and utilizing natural rock saddles as flood spillways.',
      result: 'Established perennial agrarian water security in one of India’s most drought-prone inland plateaus, supporting the Kakatiya state for centuries.',
    },
    documentedVsInferred: {
      documented: [
        'Ramappa Lake constructed in 1213 CE by Recharla Rudra (dated basalt inscription).',
        'Pakhal Lake constructed under Ganapati Deva impounding an entire hill valley.',
        'Direct connection between royal patronage and tank excavation (*sapta-santana* meritorious deeds).',
      ],
      inferred: [
        'Hydraulic levels across the chain were surveyed using water-level sighting tubes (*jalayantra*).',
      ],
      hypothetical: [
        'Total volume of sediment dredged annually by local village labor councils.',
      ],
    },
    modernRelevance: 'The direct blueprint for modern decentralized watershed management. The state government of Telangana launched "Mission Kakatiya" (restoring 46,000 ancient tanks) specifically reviving this 800-year-old engineering model.',
    image: '/src/assets/images/kallanai_grand_anicut_1790264602228.jpg',
    reconstructionSketch: {
      image: '/src/assets/images/kakatiya_dam_crosssection_1790511659568.jpg',
      title: 'Valley Cascade Engineering Cross-Section: Kakatiya Dam & Sluice (Ramappa Lake)',
      caption: 'Civil engineering transverse cutaway of the 13th-century Kakatiya contour earthen gravity dam. Features the layered puddle clay embankment core, upstream stepped granite stone revetment (rip-rap), monolithic cut-stone sluice intake tower (*tūmu*) with wooden plug regulator, and living rock surplus weir (*kalingu*).',
      architecturalStyle: 'Regional Watershed & Dam Cross-Section Drafting',
      keyFeatures: [
        'Valley contour earthen bunds with compacted impermeable puddle clay core',
        'Upstream stepped granite boulder pitching breaking destructive monsoonal wave action',
        'Cut-stone sluice towers (*tūmu*) with vertical plug controls for volumetric discharge',
        'Natural rock saddle overflow weirs (*kalingu*) feeding downstream cascade tanks',
      ],
    },
    keyPoints: [
      'Pioneered the "chain-tank cascade" system across the Deccan plateau.',
      'Ramappa Lake (1213 CE) has operated continuously for over 800 years without structural failure.',
      'Inspired the modern revival program *Mission Kakatiya*.',
    ],
  },
  {
    id: 'hampi-vijayanagara-aqueducts',
    name: 'Vijayanagara Tungabhadra Anicuts & Hampi Urban Aqueducts',
    sanskritOrLocalName: 'विजयनगर तुङ्गभद्रा जल सेतु एवं हम्पी प्रणाली',
    region: 'Southern India',
    state: 'Karnataka (Bellary / Vijayanagara District / Hampi)',
    coordinates: '15.33° N, 76.46° E',
    waterSource: 'Tungabhadra River & Kamalapuram Reservoir',
    riverBasin: 'Krishna–Tungabhadra River Basin',
    period: 'c. 1336 CE to 1565 CE (Vijayanagara Empire)',
    associatedRulerOrCivilization: 'Vijayanagara Emperors (Bukkaraya, Devaraya II, Krishnadevaraya)',
    purpose: 'Perennial water supply to an imperial capital of 500,000 citizens, irrigation of royal orchards, and feeding monumental bathing complexes (Queen’s Bath, Octagonal Bath).',
    dimensions: {
      length: 'Turtha Canal: 19 km; Raya Canal: 27 km; Kamalapuram Tank: 100+ hectares',
      height: 'Elevated stone aqueducts spanning up to 10–12 meters above gorges',
      storageCapacity: 'Kamalapuram reservoir holds over 15 MCM; network feeds 16 perennial diversion canals',
    },
    constructionMaterials: [
      'Dressed granite ashlar blocks fitted with interlocking tongue-and-groove joints',
      'Molten lead and iron clamps securing weir crest blocks against river spates',
      'Terracotta pipe liners embedded in hydraulic lime mortar',
      'Granite monolith pillars supporting elevated stone trough aqueducts',
    ],
    structuralDesign: 'A series of 16 run-of-river diversion anicuts built diagonally across the boulder-strewn rapids of the Tungabhadra River, feeding contour rock-cut canals, siphon bridges, and elevated stone aqueducts.',
    waterManagementMethod: 'Diagonal deflection weirs: anicuts were aligned diagonally across the riverbed to reduce hydraulic drag and divert water into riverside rock-cut channels, feeding intermediate storage tanks (Kamalapuram) before distributing through terracotta pipes to city palaces.',
    irrigationMethod: 'Continuous gravity flow through contour canals (Turtha, Hiriya, Anegundi canals) watering lush banana and paddy plantations along the river valley.',
    drainageAndFloodControl: 'Surplus overflow escapes carved into solid granite river boulders; storm drainage ditches protecting the Royal Enclosure from torrential flash flooding.',
    currentCondition: 'UNESCO World Heritage Site (1986); the Turtha, Raya, and Basavanna canals continue to irrigate farmland around Hampi today after 500+ years.',
    historicalAndArchaeologicalEvidence: {
      inscriptions: [
        'Inscriptions of Krishnadevaraya (1513–1521 CE) detailing the construction of the Korragal weir, the Basavanna canal, and the monumental stone aqueducts.',
        'Accounts of Portuguese chroniclers Domingo Paes (1520) and Fernão Nunes (1535) describing the immense reservoir built with foreign engineers.',
      ],
      archaeologicalExcavations: [
        'Extensive excavations by the Archaeological Survey of India (ASI) uncovering the Royal Enclosure stepwells, underground stone water channels, and copper pipes.',
      ],
      writtenTexts: [
        'Domingo Paes (*Chronica dos Reis de Bisnaga*); ASI Hampi Architectural Monographs.',
      ],
    },
    engineeringAnalysis: {
      problem: 'Supplying a densely populated imperial metropolis built amidst arid, rugged granitic hills, requiring year-round water for both defense and luxury palaces.',
      environmentalCondition: 'Extreme torrent velocity in the rocky Tungabhadra River during monsoon, followed by scorching dry season.',
      engineeringSolution: 'Building boulder-anchored diagonal diversion anicuts, elevated granite trough aqueducts crossing ravines, and pressurizing subterranean terracotta water pipes.',
      constructionMethod: 'Clamping giant granite blocks with iron and lead cramps, carving channels directly into living granite cliffs, and erecting stone post-and-lintel viaducts across valleys.',
      result: 'Created an oasis city that astonished European visitors, with flowing water in multi-story palace pavilions and perpetual agriculture.',
    },
    documentedVsInferred: {
      documented: [
        'Krishnadevaraya’s construction of anicuts and canals attested in contemporary lithic inscriptions.',
        'Surviving elevated stone aqueducts and terracotta pipe networks excavated in the Royal Enclosure.',
        'Continuous agricultural operation of the Turtha Canal for over 500 years.',
      ],
      inferred: [
        'Siphon hydraulics were utilized to convey water across depression saddles without structural collapse.',
      ],
      hypothetical: [
        'Detailed maintenance treaties between the imperial court and regional agrarian guilds.',
      ],
    },
    modernRelevance: 'Proves the extraordinary longevity of mortarless clamped granite weir engineering in high-energy river currents. Modern irrigation boards still maintain these 16 anicuts for local farming.',
    image: '/src/assets/images/ancient_dam_cross_section_1790264551732.jpg',
    reconstructionSketch: {
      image: '/src/assets/images/hampi_aqueduct_crosssection_1790511674254.jpg',
      title: 'Architectural Cutaway & Cross-Section: Vijayanagara Tungabhadra Anicuts & Hampi Aqueducts',
      caption: 'Technical axonometric elevation and transverse cross-section showing the diagonal Tungabhadra river diversion weir constructed of lead-clamped cyclopean granite ashlar blocks, elevated stone trough viaducts on monolithic granite pillars, and subterranean pressurized terracotta delivery pipes.',
      architecturalStyle: 'Medieval Hydraulic Viaduct & Anicut Cross-Section Drafting',
      keyFeatures: [
        'Diagonal boulder-anchored run-of-river diversion anicuts with molten lead-clamped granite ashlar blocks',
        'Elevated stone trough aqueducts carried on monolithic granite pillars across natural ravines',
        'Subterranean pressurized terracotta water pipelines feeding royal bathing stepped tanks',
        '16 continuous gravity diversion canals still irrigating the Tungabhadra valley today',
      ],
    },
    keyPoints: [
      'Monumental urban water infrastructure supplying an imperial capital of 500,000 citizens.',
      '16 boulder-anchored anicuts across the Tungabhadra operating continuously since the 15th century.',
      'Advanced stone siphon viaducts and pressurized terracotta piping.',
    ],
  },
  {
    id: 'soil-texture-bhumi-pariksha',
    name: 'Bhūmi-Parīkṣā: Ancient Soil Texture Determination & Geotechnical Hydrology',
    sanskritOrLocalName: 'भूमिपरीक्षा एवं मृत्तिका लक्षण (Bhūmi-Parīkṣā & Mṛttikā-Lakṣaṇa)',
    region: 'Pan-Indian Epigraphs & Sanskrit Treatises',
    state: 'Madhya Pradesh, Gujarat, Saurashtra, Andhra Pradesh & Gangetic Basin',
    coordinates: '23.17° N, 75.78° E (Ujjain Meridian of Varāhamihira)',
    waterSource: 'Reservoir Foundations, Dam Abutments, Canals & Groundwater Aquifers',
    riverBasin: 'Betwa, Narmada, Ganga & Peninsular River Basins',
    period: 'c. 4th century BCE to 14th century CE',
    associatedRulerOrCivilization: 'Varāhamihira (Bṛhat Saṃhitā), King Bhoja (Samarāṅgaṇa Sūtradhāra), Kautilya (Arthaśāstra), Bhāskarācārya',
    purpose: 'Determining soil particle texture (clay, silt, sand, gravel), hydraulic permeability, shear strength, and compaction suitability for impervious puddle dam cores (bhal), canal beds, and foundation trenches.',
    dimensions: {
      length: 'Standard test pit: 1 aratni × 1 aratni × 1 aratni (~45 × 45 × 45 cm; 1 cubit³)',
      height: 'Depth profiles testing topsoil (0.5m), alluvial silt (1-3m), and hard substratum / rock key',
      reservoirArea: 'Applied across major historical reservoirs (Sudarshana, Bhojpur, Porumamilla, Sringaverapura)',
      storageCapacity: 'Empirical geotechnical selection prevented catastrophic piping through porous sand/gravel beds',
    },
    constructionMaterials: [
      'Impervious puddle clay (bhal / kṛṣṇa mṛttikā) kneaded with water and vegetable mucilage',
      'Lateritic red soil (rakta) with high angle of internal friction (phi = 30-34 degrees)',
      'Alluvial silt (pīta / alluvial loam) used in stratified outer embankment shoulders',
      'Crushed sandstone ballast, gravel drains, and boulder shear keys into bedrock',
    ],
    structuralDesign: 'Geotechnical zoning: an inner impermeable core of compacted puddle clay (mṛttikā-garbha) flanked by transition zones of silty sand and outer heavy rock rip-rap, preventing internal hydraulic piping and slope liquefaction.',
    waterManagementMethod: 'Pre-construction soil texture verification to verify that reservoir percolation rates remain below critical thresholds (< 10^-6 cm/s for clay cores; preventing Porumamilla Dosha #2: porous crumbly soil).',
    irrigationMethod: 'Testing soil permeability along canal alignments to prevent conveyance water loss through porous unlined sandy beds, directing clay lining to high-permeability stretches.',
    drainageAndFloodControl: 'Identification of expansive montmorillonitic black cotton soils (regur) prone to swelling and shrinking, providing drainage blankets and stone toes to avoid slope slips.',
    currentCondition: 'Ancient soil testing principles directly anticipate modern ASTM D2488 (Visual-Manual Soil Description), IS 1498 (Soil Classification), Atterberg Plasticity Limits, and Proctor compaction tests.',
    historicalAndArchaeologicalEvidence: {
      inscriptions: [
        'Porumamilla Inscription of 1369 CE (Epigraphia Indica Vol. XIV, v. 23): Explicitly warns against Dosha #2—saline, alkaline, or porous crumbly soil at the reservoir bed causing dam failure.',
        'Junagadh Rock Inscription of Rudradaman I (150 CE): Commends the embankment built without porous sand seams, compacted with clay and stone revetment to resist catastrophic breaching.',
      ],
      archaeologicalExcavations: [
        'Sringaverapura Excavation (ASI 1977-1986 under Prof. B.B. Lal): Proved deliberate multi-chamber desilting tanks exploiting particle settling velocity (coarse sand drops in Tank 1, fine silt in Tank 2).',
        'Dholavira Citadel Excavations (ASI under Dr. R.S. Bisht): Revealed stepped reservoir floors cut directly into impermeable bedrock with sticky puddle-clay plastering in porous joints.',
        'Bhojpur Dam Field Survey: Demonstrated cyclopean sandstone blocks encasing a massive central clay-soil core that successfully impounded a 65,000-hectare lake without foundation blowouts.',
      ],
      writtenTexts: [
        'Varāhamihira’s Bṛhat Saṃhitā (Ch. 54, Dakargala, Verses 100-105): Defines the Gartā-Parīkṣā (pit refill test) and overnight water absorption test to identify clay vs. sand texture.',
        'King Bhoja’s Samarāṅgaṇa Sūtradhāra (Ch. 8 & 18): Details manual plasticity rolling tests (mṛd-mardanā), color classification (Krishna, Rakta, Peeta, Shweta), and puddling clay for hydraulic bund cores.',
        'Kautilya’s Arthaśāstra (Book II, Ch. 24): Prescribes assessing alluvial soil moisture retention and stability before constructing canal bunds.',
      ],
    },
    engineeringAnalysis: {
      problem: 'Building massive earthen dams and deep reservoirs on untested ground risks catastrophic failure through piping (internal erosion through porous sand lenses) or slope sliding under saturation.',
      environmentalCondition: 'Variable geological strata ranging from highly pervious riverbed sands to expansive black cotton clays and fractured granitic bedrock.',
      engineeringSolution: 'Four rigorous ancient soil texture tests: (1) Volumetric Pit Refill Test (Gartā-Parīkṣā), (2) Overnight Water Absorption Test, (3) Manual Rolling Ribbon Plasticity Test, and (4) Sedimentation Settling in water jars.',
      constructionMethod: 'Excavating 1-cubit test pits; classifying soil behavior upon refill and watering; selecting cohesive clays for central puddle cores (bhal); lining porous zones with puddled clay blankets.',
      result: 'Dams and reservoirs constructed with verified clay cores stood for centuries without piping breaches, validated by modern soil mechanics (Terzaghi effective stress and Darcy permeability laws).',
    },
    documentedVsInferred: {
      documented: [
        'Varāhamihira (c. 505–587 CE) explicitly documented the pit refill test: overflow = dense clay, flush = loam, deficit = porous sand (Bṛhat Saṃhitā Ch. 54).',
        'Overnight water retention test in 1-cubit pits documented as primary test for aquifer imperviousness.',
        'Porumamilla epigraph (1369 CE) documented saline/porous crumbly soil as fatal engineering flaw (Dosha #2).',
        'King Bhoja (c. 1010–1055 CE) documented fourfold color/plasticity soil testing and clay core compaction in Samarāṅgaṇa Sūtradhāra.',
      ],
      inferred: [
        'Ancient masons calibrated clay moisture content to near Plastic Limit (PL ≈ 18–25%) by tactile kneadability.',
        'The pit refill test relies scientifically on bulk density changes: undisturbed vs loosened soil compaction ratios.',
      ],
      hypothetical: [
        'Ancient engineers may have added botanical gum (bilva fruit pulp, acacia resins) to enhance clay core impermeability, as recorded in temple mortar recipes.',
      ],
    },
    modernRelevance: 'Direct precursor to modern geotechnical field testing: Visual-Manual Identification (ASTM D2488), Indian Standard Soil Classification (IS 1498:1970), and in-situ percolation testing for dam abutments.',
    image: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&q=80&w=1200',
    keyPoints: [
      'Varāhamihira’s Bṛhat Saṃhitā (Ch. 54): Pit refill test (Gartā-Parīkṣā) scientifically determines clay vs sand volume expansion.',
      'King Bhoja’s Samarāṅgaṇa Sūtradhāra: Soil plasticity rolling tests and impervious puddle-clay core (bhal) compaction.',
      'Porumamilla Inscription (1369 CE): Explicitly identifies crumbly porous soil as fatal engineering flaw (Dosha #2).',
      'Correlates 100% with modern ASTM D2488 / IS 1498 geotechnical soil texture classification.',
    ],
  },
];

export const PORUMAMILLA_PRINCIPLES = {
  sadhanas: [
    { number: 1, rule: 'A king endowed with righteousness, rich, happy, and desirous of acquiring fame.' },
    { number: 2, rule: 'A man proficient in hydrology and the science of water architectures (Jala-shastra).' },
    { number: 3, rule: 'A ground of hard, firm clay or solid bedrock foundation.' },
    { number: 4, rule: 'A river with sweet, silt-bearing water, flowing between two hills.' },
    { number: 5, rule: 'Two natural hills hemming in the waters closely as natural abutments.' },
    { number: 6, rule: 'A dam constructed with a durable stone core and heavy revetment, free of earth-slipping.' },
    { number: 7, rule: 'Two natural rock-cut waste weirs (spillways) built on living stone at a distance from the dam.' },
    { number: 8, rule: 'A deep, extensive bed for the reservoir ensuring vast storage capacity.' },
    { number: 9, rule: 'Downstream command area consisting of wide, fertile agricultural land free of saline deposits.' },
    { number: 10, rule: 'Canals flowing with gentle downward gradient through firm ground without steep eroding drop-offs.' },
    { number: 11, rule: 'Skilled masons, quarrymen, and earth-movers plentiful and well-compensated.' },
    { number: 12, rule: 'Ample wealth and dedicated treasury reserves to complete the work without premature abandonment.' },
  ],
  doshas: [
    { number: 1, flaw: 'Water oozing or seeping through the base or body of the dam (piping failure).' },
    { number: 2, flaw: 'Saline, alkaline, or porous crumbly soil at the reservoir bed or command area.' },
    { number: 3, flaw: 'A site situated at the boundary of two rival kingdoms where disputes disrupt maintenance.' },
    { number: 4, flaw: 'An embankment with a low or weak central span prone to overtopping.' },
    { number: 5, flaw: 'Too meager a water catchment supply for the vast size of the constructed bed.' },
    { number: 6, flaw: 'Too excessive and violent a flood torrent that overwhelms the surplus escape weirs.' },
  ],
};

export const MAURYAN_LEGAL_HYDRAULIC_CODES = [
  {
    source: 'Arthashastra Book II, Chapter 24',
    topic: 'Udakabhāga (Water Tax Structure)',
    details: 'The Sītādhyakṣa levied water rates according to the hydraulic mechanism used: 1/5th of produce for water lifted manually; 1/4th for water drawn by bullock-powered leather buckets (*churasa*); 1/3rd for water carried by mechanics or waterwheels (*srotra-yantra*); and 1/4th from rivers, lakes, and state dams (*setu*).',
  },
  {
    source: 'Arthashastra Book III, Chapter 9',
    topic: 'Setubheda (Penalties for Dam Damage)',
    details: 'Whoever breaches the embankment of a dam (*setu-bheda*) or reservoir shall be punished with death by drowning in that very water, or if the dam was dry/abandoned, fined the highest amercement. Whoever floods another’s field by negligence shall pay double the damages.',
  },
  {
    source: 'Arthashastra Book II, Chapter 1',
    topic: 'Sahodaka & Āhāryodaka Setu',
    details: 'State dams were classified into two fundamental civil types: *Sahodaka-setu* (natural reservoir holding rain/spring water) and *Āhāryodaka-setu* (fed by diversion canals from perennial rivers). Collective village labor (*kudimaramathu*) was legally enforced; non-participants were fined and compelled to pay laborers while being barred from water shares.',
  },
  {
    source: 'Ashoka Major Rock Edict II',
    topic: 'Welfare Infrastructure on Royal Corridors',
    details: 'Proclaims state-funded construction of public wells, planting of medicinal botanical reserves (*aushadha*), and tree planting for the physical comfort of humans and livestock along imperial arteries across the Mauryan realm and neighboring Greek/Chola/Pandya kingdoms.',
  },
  {
    source: 'Ashoka Pillar Edict VII',
    topic: 'Standardized Half-Kosa Well Grids',
    details: 'Imperial directive recording that on all trunk roads, banyan trees were planted for canopy shade, wells were dug at regular half-kosa (~3.2 km) intervals, rest-houses (*nimshidhya*) were erected, and water troughs/drinking stations (*apāna*) were maintained by royal officers.',
  },
];

export interface AncientSoilTestMethod {
  id: string;
  name: string;
  sanskritName: string;
  sourceText: string;
  exactCitation: string;
  approximateDate: string;
  engineeringObjective: string;
  testProcedure: string[];
  evaluationCriteria: {
    result: string;
    textureIdentified: string;
    hydraulicImplication: string;
    suitability: string;
  }[];
  modernGeotechnicalStandard: string;
  physicsPrinciples: string;
}

export const ANCIENT_SOIL_TEXTURE_METHODS: AncientSoilTestMethod[] = [
  {
    id: 'garta-pariksha',
    name: 'Volumetric Pit Refill Test (Gartā-Parīkṣā)',
    sanskritName: 'गर्ता-परीक्षा (Gartā-Parīkṣā)',
    sourceText: 'Varāhamihira’s Bṛhat Saṃhitā',
    exactCitation: 'Chapter 54 (Dakārgala), Verses 100–103',
    approximateDate: 'c. 6th century CE (505–587 CE)',
    engineeringObjective: 'Determines in-situ soil density, void ratio, and clay vs. loose sand texture before digging reservoirs or banking dam cores.',
    testProcedure: [
      'Excavate a square test pit of 1 aratni × 1 aratni × 1 aratni (approx. 45 cm × 45 cm × 45 cm; 1 cubit³).',
      'Carefully extract all excavated soil onto a clean flat platform without loss.',
      'Refill the excavated soil back into the same pit gently without artificial mechanical ramming.',
      'Measure whether the refill volume creates an overflow mound, fills flush, or leaves a hollow depression.',
    ],
    evaluationCriteria: [
      {
        result: 'Overflow Surplus (Adhika / अधिक)',
        textureIdentified: 'Dense Cohesive Clay (Mṛttikā / CH-CL under USCS)',
        hydraulicImplication: 'High volumetric swell upon uncompacting; low void ratio (e < 0.6); hydraulic permeability k < 10⁻⁷ cm/s.',
        suitability: 'EXCELLENT for impervious puddle core (bhal), canal linings, and reservoir bed blankets.',
      },
      {
        result: 'Level Flush (Samā / समा)',
        textureIdentified: 'Medium Loam / Silty Sand (SM-SC under USCS)',
        hydraulicImplication: 'Balanced grain size distribution; moderate permeability (k ≈ 10⁻⁴ to 10⁻⁵ cm/s); stable internal shear resistance.',
        suitability: 'GOOD for dam embankment shoulders and outer stabilizing berms.',
      },
      {
        result: 'Deficit Hollow (Hīnā / हीना)',
        textureIdentified: 'Loose Sand or Porous Gravel (SP-GP under USCS)',
        hydraulicImplication: 'High void ratio (e > 0.85); high permeability (k > 10⁻² cm/s); prone to piping and severe seepage losses.',
        suitability: 'UNACCEPTABLE for unlined water storage; requires deep clay cut-off trench down to bedrock.',
      },
    ],
    modernGeotechnicalStandard: 'ASTM D2488 (Visual-Manual Soil Description) & IS 2720 Part 28 (Dry Density in-situ).',
    physicsPrinciples: 'Bulk density vs. specific gravity ratio: fine clays fluff up when loosened due to cohesive platy particle alignment, while coarse non-cohesive sands repack tightly.',
  },
  {
    id: 'jala-dharana-pariksha',
    name: 'Overnight Water Infiltration & Absorption Test',
    sanskritName: 'जल-धारण परीक्षा (Jala-Dhāraṇa Parīkṣā)',
    sourceText: 'Varāhamihira’s Bṛhat Saṃhitā',
    exactCitation: 'Chapter 54 (Dakārgala), Verse 104',
    approximateDate: 'c. 6th century CE',
    engineeringObjective: 'Tests soil permeability (hydraulic conductivity k) and aquifer percolation rate to verify water retention.',
    testProcedure: [
      'Excavate a 1-cubit pit at the planned reservoir bed or canal bed alignment.',
      'Fill the pit completely with water in the evening at sunset.',
      'Cover the top with a reed mat to prevent wind evaporation losses.',
      'Inspect the remaining water depth at sunrise the following morning.',
    ],
    evaluationCriteria: [
      {
        result: 'Water retains over 80% of original depth at sunrise',
        textureIdentified: 'Impervious Heavy Clay (Fat Clay)',
        hydraulicImplication: 'Seepage loss rate < 10 mm/day; ideal impervious boundary.',
        suitability: 'Ideal for deep reservoir beds and long canal conveyances.',
      },
      {
        result: 'Water level drops by roughly 50%',
        textureIdentified: 'Sandy Silt / Clayey Loam',
        hydraulicImplication: 'Moderate seepage; requires puddling with cattle hooves and silt slurry.',
        suitability: 'Acceptable with standard soil compaction (mardanā).',
      },
      {
        result: 'Pit completely dry at sunrise',
        textureIdentified: 'Pervious Sand / Karst Fissures / Gravel Bed',
        hydraulicImplication: 'High Darcy seepage flux Q = k·i·A; risk of foundation blowout.',
        suitability: 'FATAL SITE FLAW (Porumamilla Dosha #2); site must be rejected or sealed with clay blanket.',
      },
    ],
    modernGeotechnicalStandard: 'IS 5529 (In-situ Percolation Test) & Double Ring Infiltrometry (ASTM D3385).',
    physicsPrinciples: 'Darcy’s Law of saturated soil percolation: v = -k (dh/dl).',
  },
  {
    id: 'mrd-mardana-ribbon-test',
    name: 'Manual Plasticity & Ribbon Roll Test',
    sanskritName: 'मृद्-मर्दना एवं वर्तिका परीक्षा (Mṛd-Mardanā & Vartikā)',
    sourceText: 'King Bhoja’s Samarāṅgaṇa Sūtradhāra',
    exactCitation: 'Chapter 18 (Jala-bandhana & Vāstu-Lakṣaṇa), Verses 40–46',
    approximateDate: 'c. 1010–1055 CE',
    engineeringObjective: 'Distinguishes between cohesive clays, non-plastic silts, and gritty sands by tactile kneading.',
    testProcedure: [
      'Moisten a palm-sized soil sample with clean water until it forms a workable paste without sticking to fingers.',
      'Roll the paste between the palms or on a smooth slate stone into a thin cylindrical thread (approx. 3 mm diameter).',
      'Attempt to form a continuous ribbon and loop without breakage.',
    ],
    evaluationCriteria: [
      {
        result: 'Forms a continuous smooth 3 mm thread and loop without cracking',
        textureIdentified: 'High-Plasticity Cohesive Clay (Plasticity Index PI > 17)',
        hydraulicImplication: 'Rich in fine colloidal montmorillonite/illite clay platelets.',
        suitability: 'Target material for central dam core (bhal) puddling.',
      },
      {
        result: 'Forms thread but cracks and crumbles upon bending into loop',
        textureIdentified: 'Silty Clay / Medium Plasticity Loam (PI 7–17)',
        hydraulicImplication: 'Moderate cohesion; excellent for embankment shoulders.',
        suitability: 'Suitable for outer bund body.',
      },
      {
        result: 'Cannot form thread; crumbles into gritty powder immediately',
        textureIdentified: 'Non-Plastic Silt or Sand (PI < 4)',
        hydraulicImplication: 'Zero cohesion (c = 0); internal friction only.',
        suitability: 'Only usable as downstream filter drainage layer or rip-rap cushion.',
      },
    ],
    modernGeotechnicalStandard: 'IS 2720 Part 5 / ASTM D4318 (Atterberg Plastic Limit & Plasticity Index).',
    physicsPrinciples: 'Cohesive molecular surface tension and diffuse double layer thickness in clay minerals.',
  },
  {
    id: 'sedimentation-jar-settling',
    name: 'Hydraulic Gravity Settling & Stratification Test',
    sanskritName: 'जल-निक्षेपण परीक्षा (Jala-Nikṣepaṇa Parīkṣā)',
    sourceText: 'Ancient Field Siltation Manuals (Documented in Sringaverapura & Dholavira ASI monographs)',
    exactCitation: 'ASI Excavation Monograph on Sringaverapura (1989), pp. 42–48',
    approximateDate: 'c. 1st century BCE (Sringaverapura Phase)',
    engineeringObjective: 'Measures exact proportion of sand, silt, and clay in sediment-laden river inflows and soil beds.',
    testProcedure: [
      'Place a soil or alluvial sediment sample into a transparent or glazed cylindrical container filled with water.',
      'Vigorously shake for 60 seconds to fully disaggregate particle clusters.',
      'Place vessel on a level surface and record settling layer thicknesses across time benchmarks.',
    ],
    evaluationCriteria: [
      {
        result: 'Layer 1 settles within 30 to 60 seconds',
        textureIdentified: 'Coarse and Fine Sand Fraction (particle diameter d > 0.075 mm)',
        hydraulicImplication: 'High mass settling velocity; intercepted in Sringaverapura Chamber 1.',
        suitability: 'Filtered out in siltation traps before entering main water body.',
      },
      {
        result: 'Layer 2 settles within 1 to 2 hours',
        textureIdentified: 'Silt Fraction (particle diameter 0.002 mm < d < 0.075 mm)',
        hydraulicImplication: 'Moderate settling velocity; intercepted in secondary settling tank.',
        suitability: 'Fertile agricultural silt flushed annually via scouring sluices.',
      },
      {
        result: 'Layer 3 remains in suspension and settles over 24 to 48 hours',
        textureIdentified: 'Colloidal Clay Fraction (particle diameter d < 0.002 mm)',
        hydraulicImplication: 'Very low terminal settling velocity governed by Stokes’ Law.',
        suitability: 'Forms impervious reservoir floor sediment over years.',
      },
    ],
    modernGeotechnicalStandard: 'IS 2720 Part 4 (Grain Size Analysis: Sieve & Hydrometer) & ASTM D422.',
    physicsPrinciples: 'Stokes’ Law of settling velocity: v = (2/9)·[(ρ_s - ρ_w)·g·r²] / η.',
  },
];

