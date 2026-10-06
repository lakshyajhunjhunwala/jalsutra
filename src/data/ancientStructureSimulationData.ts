export type StructureKind =
  | 'DIVERSION_WEIR'
  | 'EMBANKMENT_DAM'
  | 'MASONRY_DAM'
  | 'GRAVITY_DAM'
  | 'RESERVOIR_TANK'
  | 'QANAT'
  | 'STEPWELL'
  | 'CANAL'
  | 'OTHER_HYDRAULIC_STRUCTURE';

export interface SimulationValues {
  height: number;
  length: number;
  width: number;
  upstreamLevel: number;
  downstreamLevel: number;
  riverWidth: number;
  discharge: number;
  catchment: number;
  slope: number;
  tunnelLength: number;
  tunnelDiameter: number;
  shaftSpacing: number;
  spillwayWidth?: number;
  basinDepth?: number;
  basinLength?: number;
  basinWidth?: number;
  tiers?: number;
}

export interface SimulationStructure {
  id: string;
  name: string;
  alternativeName: string;
  kind: StructureKind;
  typeLabel: string;
  location: string;
  civilization: string;
  period: string;
  approximateDate: string;
  builder: string;
  purpose: string;
  currentStatus: string;
  riverOrWaterBody: string;
  material: string;
  foundation: string;
  spillwayArrangement: string;
  sluiceArrangement: string;
  documented: Record<string, string>;
  assumptions: Record<string, string>;
  defaults: SimulationValues;
  schematicFeatures: string[];
}

export const ANCIENT_SIMULATION_STRUCTURES: SimulationStructure[] = [
  {
    id: 'kallanai',
    name: 'Kallanai / Grand Anicut',
    alternativeName: 'கல்லணை (Kallanai); Kaveri Anicut; Chola Diversion Dam',
    kind: 'DIVERSION_WEIR',
    typeLabel: 'Ancient River Diversion Weir / Anicut',
    location: 'Cauvery River, Tiruchirappalli district, Tamil Nadu, India',
    civilization: 'Ancient Tamilakam (Early Chola Dynasty)',
    period: 'Early Chola Period (Sangam Era), with later additions across Chola, Vijayanagara, and British administrations',
    approximateDate: 'c. 2nd century CE (traditional Chola attribution)',
    builder: 'Karikala Chola (Karikalan) recorded in Tamil Sangam literature (Pattinappalai); rebuilt/raised by later dynasties',
    purpose: 'Divert perennial Cauvery floods into the fertile delta and the Kollidam (Coleroon) flood distributary for year-round paddy irrigation',
    currentStatus: 'Fully operational, integrated into the modern regulated Cauvery delta irrigation network; UNESCO World Heritage candidate',
    riverOrWaterBody: 'Cauvery (Kaveri) River at delta bifurcation point',
    material: 'Rough-hewn undressed and dressed granite/gneiss stone blocks, hydraulic lime surkhi mortar in later layers, and clay-packing',
    foundation: 'Self-sinking cyclopean boulders unmortared in deep alluvial moving river sand; natural scouring caused boulders to settle onto stable clay/gravel layers without bedrock',
    spillwayArrangement: 'Continuous broad-crested submerged overflow weir crest spanning the active river course',
    sluiceArrangement: 'Scouring sluices (*kalingu*) with timber gate shutters to periodically flush bed silt and prevent delta canal choking',
    documented: {
      length: '329 meters (approx. 1,080 feet documented in historical surveys)',
      height: 'Approx. 5.4 meters (18 feet) overall height from foundation bed, with ~2.5m effective weir crest head',
      width: '20 meters crest/apron width (approx. 60–66 feet)',
      storage: 'Diversion weir without deep dead storage; active continuous river diversion system',
      materials: 'Granite boulders, stone pitching, unmortared foundation blocks',
      foundation: 'Riverbed alluvial sand foundation using self-sinking stone mass method',
    },
    assumptions: {
      riverWidth: 'Modeled active channel width at bifurcation (default 180 m)',
      riverDischarge: 'Monsoon high-flow scenario (default 900 m³/s)',
      weirHead: 'Upstream water head over weir crest (default 2.5 m)',
      roughness: 'Manning n = 0.035 for rough unmortared stone apron',
    },
    defaults: {
      height: 2.5,
      length: 329,
      width: 20,
      upstreamLevel: 2.5,
      downstreamLevel: 0.8,
      riverWidth: 180,
      discharge: 900,
      catchment: 0,
      slope: 0.0008,
      tunnelLength: 0,
      tunnelDiameter: 0,
      shaftSpacing: 0,
      spillwayWidth: 180,
    },
    schematicFeatures: ['river_channel', 'boulder_foundation', 'masonry_crest', 'overflow_nappe', 'scour_sluice', 'downstream_apron'],
  },
  {
    id: 'sudarshana',
    name: 'Sudarshana Lake Embankment Dam',
    alternativeName: 'Sudarśana Taṭāka (सुदर्शन तटाक); Girnar Ancient Dam',
    kind: 'EMBANKMENT_DAM',
    typeLabel: 'Composite Earthen & Masonry Embankment Dam',
    location: 'Mount Girnar valley near Junagadh, Saurashtra, Gujarat, India',
    civilization: 'Mauryan Empire through Western Kshatrapa & Gupta Dynasties',
    period: 'Mauryan origin (3rd cent. BCE) with major documented reconstructions in 150 CE and 456 CE',
    approximateDate: '320 BCE (Chandragupta Maurya) to 456 CE (Skandagupta)',
    builder: 'Initiated by Vaishya Governor Pushyagupta under Chandragupta Maurya; canals added by Yavana Governor Tushaspha under Emperor Ashoka; dam rebuilt with cyclopean masonry by Suvisakha under Mahakshatrapa Rudradaman I (150 CE); repaired by Chakrapalita under Skandagupta (456 CE)',
    purpose: 'Water supply, drought protection, and gravity canal irrigation for the Girinagara agricultural oasis',
    currentStatus: 'Archaeological monument; ancient bund was breached in antiquity and transformed into natural and check-dam topography; Junagadh Rock Inscriptions preserved on site',
    riverOrWaterBody: 'Suvarnasikata (Sonarekha) and Palasini mountain torrents in Girnar gorge',
    material: 'Compacted puddle-clay core, earthen embankment bund, cyclopean dressed stone revetment facing, burnt brick masonry, and timber conduits',
    foundation: 'Natural basalt and volcanic gorge bed with excavated rock cut-off trench and clay anchoring',
    spillwayArrangement: 'Natural rock-cut side channel surplus weir augmented with stone retaining spillway walls',
    sluiceArrangement: 'Submerged conduit sluices (*pranali*) with control stone plugs to release canal discharge under hydrostatic head',
    documented: {
      length: 'Approx. 450 meters spanning the Girnar gorge (estimated from valley topography and epigraphical breach records)',
      height: 'Approx. 10 meters bund height (estimated from Junagadh 150 CE inscription: breach was 420 cubits wide and 75 cubits deep)',
      width: 'Crest width ~5 meters; base width ~50 meters with 1:2.5 upstream and 1:2.0 downstream slopes',
      storage: 'Approx. 5.5 to 8.0 Million Cubic Meters (MCM) impounding seasonal runoff',
      materials: 'Clay embankment, cyclopean stone pitching, masonry sluice conduits',
      inscriptions: 'Junagadh Rock Inscriptions of Rudradaman I (150 CE) and Skandagupta (456 CE)',
    },
    assumptions: {
      height: 'Modeled embankment crest height (default 10 m)',
      catchment: 'Girnar mountain basin catchment area (default 40 km²)',
      soilFriction: 'Internal friction angle phi = 28 deg, cohesion c = 18 kPa',
      clayCore: 'Central impermeable clay core with 1:0.5 batter',
    },
    defaults: {
      height: 10,
      length: 450,
      width: 5,
      upstreamLevel: 8.5,
      downstreamLevel: 0,
      riverWidth: 80,
      discharge: 185,
      catchment: 40,
      slope: 2.5,
      tunnelLength: 0,
      tunnelDiameter: 0,
      shaftSpacing: 0,
      spillwayWidth: 25,
    },
    schematicFeatures: ['clay_core', 'stone_riprap', 'phreatic_line', 'toe_filter', 'bottom_conduit', 'gorge_bedrock'],
  },
  {
    id: 'dholavira',
    name: 'Dholavira Water Reservoir Complex',
    alternativeName: 'Dholavira Harappan Cascading Cisterns; Khadir Bet Hydraulic Network',
    kind: 'RESERVOIR_TANK',
    typeLabel: 'Urban Rock-Cut & Masonry Cascading Reservoir Complex',
    location: 'Dholavira, Khadir Bet Island, Great Rann of Kutch, Gujarat, India',
    civilization: 'Indus Valley / Harappan Civilization (Mature Harappan Stage)',
    period: 'Harappan Period (Stage III through Stage V)',
    approximateDate: 'c. 2600 BCE – 1900 BCE',
    builder: 'Harappan urban municipal engineers and guild architects (individual names unrecorded in script)',
    purpose: 'Complete seasonal rainwater collection, desilting, storm runoff diversion, and multi-year potable water storage in an hyper-arid saline island environment',
    currentStatus: 'Excavated UNESCO World Heritage Site; partially reconstructed masonry retaining walls, rock-cut steps, and check dams visible',
    riverOrWaterBody: 'Mansar (north) and Manhar (south) seasonal stormwater streams',
    material: 'Dressed sandstone blocks, chiseled natural bedrock, lime-gypsum plaster sealant, and stepped stone revetments',
    foundation: 'Chiseled sedimentary bedrock and rock-cut terraces directly anchoring retaining walls',
    spillwayArrangement: 'Broad rock-cut weir check-dams across seasonal stream beds with step cascades',
    sluiceArrangement: 'Interconnecting subterranean stone culverts, desilting chambers, and stone-plugs linking 16 cascading reservoirs',
    documented: {
      length: 'East Reservoir: 73.4 m long; South Reservoir: 95 m long (entire urban reservoir girdle exceeds 1,200 m total perimeter)',
      height: 'Basin excavation depth: 7.3 to 10.6 meters cut into solid rock',
      width: 'East Reservoir width: 29.3 meters wide; total water body area comprised ~10% of city footprint',
      storage: 'System-wide storage estimated at 250,000 to 300,000 cubic meters (300 ML)',
      features: '31 stone steps leading into basin, desilting inlet chambers, limestone conduits',
    },
    assumptions: {
      inflowRunoff: 'Cloudburst flood event into settlement intake (default 80 m³/s)',
      basinDepth: 'Representative single basin depth (default 7.5 m)',
      trapEfficiency: 'Sedimentation trap efficiency of inlet chamber ~85%',
    },
    defaults: {
      height: 7.5,
      length: 73,
      width: 29,
      upstreamLevel: 6.2,
      downstreamLevel: 0,
      riverWidth: 40,
      discharge: 80,
      catchment: 12,
      slope: 1.5,
      tunnelLength: 0,
      tunnelDiameter: 0,
      shaftSpacing: 0,
      basinDepth: 7.5,
      basinLength: 73,
      basinWidth: 29,
      tiers: 6,
    },
    schematicFeatures: ['rock_cut_basin', 'desilting_chamber', 'stepped_flight', 'inlet_weir', 'subterranean_culvert'],
  },
  {
    id: 'sringaverapura',
    name: 'Sringaverapura Water Tank System',
    alternativeName: 'Sringaverapura Ganga Desilting Tank; Ancient Hydraulic Brick Cistern',
    kind: 'RESERVOIR_TANK',
    typeLabel: 'Hydraulic Desilting & Silt-Clarification Brick Tank',
    location: 'Sringaverapura, Prayagraj district, Uttar Pradesh, India',
    civilization: 'Ancient Northern Indian Hydraulic Engineering (Post-Mauryan / Shunga-Kushan)',
    period: 'Late 1st century BCE to early 1st century CE',
    approximateDate: 'c. 50 BCE – 100 CE',
    builder: 'Ancient hydraulic architects under regional dynastic patronage; excavated by Prof. B. B. Lal (ASI)',
    purpose: 'Divert muddy monsoon floodwaters from the Ganga river through a multi-stage vortex settling chamber, filtering silt to produce crystal-clear drinking and ritual water',
    currentStatus: 'Archaeological Survey of India (ASI) protected monument; excavated brick tanks, circular silting chambers, and conduits preserved',
    riverOrWaterBody: 'Ganga (Ganges) River flood channel',
    material: 'Specialized burnt terracotta kiln-fired bricks (wedge-shaped and curved), lime surkhi mortar, and earthen embankments',
    foundation: 'Deep river silt bed stabilized with layered burnt brick foundations and ballast',
    spillwayArrangement: 'Graduated stepped weirs facilitating hydraulic deceleration and sediment precipitation',
    sluiceArrangement: 'Inlet canal through circular settling tank, interconnected via curved terracotta brick conduits to rectangular tank',
    documented: {
      length: 'Total complex exceeds 250 meters in length across all tanks and feeding canals',
      height: 'Depth of Tank A: ~4 meters; Tank B: ~7 meters with multiple stepped terraces',
      width: 'Varies from 6m inlet channel to 26m wide main settling reservoir',
      features: 'Circular silt-settling chamber (Tank A) with vortex energy dissipation; Tank B tiered settling basin',
      storage: 'Estimated 35,000 m³ of continuously filtered potable water',
    },
    assumptions: {
      inflowVelocity: 'Ganga flood intake velocity ~1.8 m/s reduced to 0.2 m/s in settling tank',
      sedimentLoad: 'High alluvial silt content (~4,000 ppm suspended solids)',
      retentionTime: 'Hydraulic detention time ~4.5 hours for gravity settling',
    },
    defaults: {
      height: 5.5,
      length: 220,
      width: 26,
      upstreamLevel: 4.8,
      downstreamLevel: 0.5,
      riverWidth: 15,
      discharge: 25,
      catchment: 8,
      slope: 1.0,
      tunnelLength: 0,
      tunnelDiameter: 0,
      shaftSpacing: 0,
      basinDepth: 5.5,
      basinLength: 220,
      basinWidth: 26,
      tiers: 4,
    },
    schematicFeatures: ['circular_desilting_tank', 'stepped_brick_flume', 'curved_conduit', 'settling_basin', 'filtered_discharge'],
  },
  {
    id: 'bhojpur',
    name: 'Bhojpur Lake / Bhoj Wetland Dam',
    alternativeName: 'Bhojpur Cyclopean Dam; Upper Lake (Bhojtal) Historic Bund',
    kind: 'MASONRY_DAM',
    typeLabel: 'Massive Cyclopean Masonry Gravity Dam',
    location: 'Bhojpur and Bhopal, Betwa River Basin, Raisen district, Madhya Pradesh, India',
    civilization: 'Paramara Dynasty',
    period: 'Medieval Indian Classical Engineering',
    approximateDate: 'c. 1010 CE – 1055 CE',
    builder: 'King Bhoja of Dhar (Paramara ruler, scholar-engineer, author of *Samarāṅgaṇa Sūtradhāra*)',
    purpose: 'Created an enormous inland lake covering over 65,000 hectares for regional microclimate moderation, irrigation, urban water, and flood defense',
    currentStatus: 'Historic bund breached in the 15th century by Hoshang Shah; remnants of massive cyclopean stone walls survive; Upper Lake in Bhopal forms a surviving legacy',
    riverOrWaterBody: 'Betwa River and Kaliasot River tributaries',
    material: 'Enormous mortarless cyclopean dressed sandstone blocks (weighing up to 10–20 tons each) keyed with stone dowels and earthen rear batter',
    foundation: 'Solid sand-stone bedrock gorge flanked by natural sandstone ridges',
    spillwayArrangement: 'Waste weir excavated through natural rocky saddle away from the main structural dam',
    sluiceArrangement: 'Dressed stone sluice towers with wood and bronze lift-plugs to supply feeder canals',
    documented: {
      length: 'Main bund length approx. 600 meters across Betwa gorge; secondary bund ~200 meters',
      height: 'Approx. 14 to 17 meters above river bed',
      width: 'Crest width ~8 meters; base width ~30 to 35 meters',
      storage: 'Original lake estimated at over 650 sq km surface area holding hundreds of MCM',
      stones: 'Blocks up to 4m x 1m x 1m cut and dressed with extraordinary precision',
    },
    assumptions: {
      height: 'Modeled gravity section height (default 14 m)',
      catchment: 'Betwa headwater catchment area (default 75 km²)',
      masonryDensity: 'Cyclopean sandstone unit weight = 24.5 kN/m³',
      frictionCoefficient: 'Bedrock-masonry friction coefficient mu = 0.65',
    },
    defaults: {
      height: 14,
      length: 600,
      width: 8,
      upstreamLevel: 12.0,
      downstreamLevel: 0,
      riverWidth: 100,
      discharge: 280,
      catchment: 75,
      slope: 1.8,
      tunnelLength: 0,
      tunnelDiameter: 0,
      shaftSpacing: 0,
      spillwayWidth: 40,
    },
    schematicFeatures: ['cyclopean_masonry_blocks', 'hydrostatic_triangle', 'thrust_vector', 'downstream_stepped_batter', 'keyed_bedrock'],
  },
  {
    id: 'proserpina',
    name: 'Roman Proserpina Dam',
    alternativeName: 'Presa de Proserpina; Embalse de Proserpina; Merida Roman Dam',
    kind: 'GRAVITY_DAM',
    typeLabel: 'Roman Buttressed Masonry Gravity Dam',
    location: 'Mérida (Augusta Emerita), Extremadura, Spain',
    civilization: 'Roman Empire',
    period: 'Classical Roman Hydraulic Engineering',
    approximateDate: 'c. 1st – 2nd century CE (Trajanic / Hadrianic era)',
    builder: 'Roman military hydraulic engineers and provincial municipal architects of Augusta Emerita',
    purpose: 'Impound reservoir to supply the city of Augusta Emerita via the Los Milagros Aqueduct',
    currentStatus: 'Extant, structurally intact, and still holds water as a recreational and irrigation reservoir; UNESCO World Heritage Site',
    riverOrWaterBody: 'Las Pardillas stream in the Guadiana river basin',
    material: 'Roman concrete (*opus caementicium*) core, ashlar granite facing blocks (*opus quadratum*), brick masonry, and earthen embankment buttress',
    foundation: 'Granite bedrock bed excavated with structural anchor trenches',
    spillwayArrangement: 'Lateral spillway channel cut into natural rock terrace on the eastern flank',
    sluiceArrangement: 'Two intake towers (*caput aquae*) built against the upstream wall with lead pipes and bronze valves',
    documented: {
      length: '427 meters crest length',
      height: '21.6 meters maximum height from foundation to crest',
      width: 'Crest width ~3.2 meters; reinforced on downstream face by 9 exterior non-continuous buttresses',
      storage: 'Approx. 5.5 to 6.0 Million Cubic Meters (MCM) storage volume',
      aqueduct: 'Fed the 10km long Los Milagros aqueduct system into the provincial capital',
    },
    assumptions: {
      height: 'Modeled dam height (default 21 m)',
      buttressSupport: 'External buttresses provide 25% increase in overturning moment resistance',
      concreteStrength: 'Roman pozzolanic hydraulic concrete compressive strength ~12 MPa',
    },
    defaults: {
      height: 21,
      length: 427,
      width: 3.5,
      upstreamLevel: 18.5,
      downstreamLevel: 0,
      riverWidth: 60,
      discharge: 120,
      catchment: 35,
      slope: 1.2,
      tunnelLength: 0,
      tunnelDiameter: 0,
      shaftSpacing: 0,
      spillwayWidth: 20,
    },
    schematicFeatures: ['roman_buttresses', 'ashlar_facing', 'concrete_core', 'hydrostatic_triangle', 'intake_tower', 'bedrock_anchor'],
  },
  {
    id: 'qanat',
    name: 'Ancient Persian Qanat of Gonabad',
    alternativeName: 'Qasabeh Qanat of Gonabad (قنات قصبه گناباد); Kariz; Foggara',
    kind: 'QANAT',
    typeLabel: 'Subterranean Gravity Aquifer Qanat Gallery',
    location: 'Gonabad, Razavi Khorasan Province, Iranian Plateau',
    civilization: 'Ancient Persian Empire (Achaemenid era to Islamic Golden Age)',
    period: 'Achaemenid Empire through Islamic Period',
    approximateDate: 'c. 700 BCE – 500 BCE (over 2,500 years of continuous operation)',
    builder: 'Persian hydraulic masters (*Muqannis*) and master subterranean miners',
    purpose: 'Transport pure drinking and irrigation water by gravity from alluvial mountain aquifers across tens of kilometers of arid desert without evaporation loss',
    currentStatus: 'Active, functioning water system; UNESCO World Heritage Site ("The Persian Qanat")',
    riverOrWaterBody: 'Unconfined alluvial mountain aquifer (no surface river)',
    material: 'Hand-chiseled subterranean clay and stone galleries, terracotta reinforcement hoops (*nāval*), and vertical shaft collars',
    foundation: 'Tunnel driven along natural alluvial sediment gradient beneath the hydraulic phreatic line',
    spillwayArrangement: 'Surface distribution splitter basins (*dividar*) dividing flow among community shares',
    sluiceArrangement: 'Underground weir gates and flow dividing channels at the daylight point (*mazhar*)',
    documented: {
      length: '33.1 kilometers total gallery network',
      height: 'Tunnel height 1.5 to 2.0 meters; mother well (*mādar-chāh*) depth exceeds 300 meters (deepest in the ancient world)',
      width: 'Gallery tunnel width: 0.9 to 1.4 meters wide',
      shafts: '427 vertical excavation and ventilation shafts along the primary branch',
      discharge: 'Continuous steady gravity flow between 150 L/s to 200 L/s (0.15–0.2 m³/s)',
    },
    assumptions: {
      tunnelSlope: 'Hydraulic gradient approx. 0.001 to 0.0015 (1 to 1.5 meters per kilometer)',
      tunnelRoughness: 'Manning n = 0.024 for excavated alluvial/rock tunnel',
      waterDepth: 'Steady state water depth in gallery ~0.5 to 0.8 meters',
    },
    defaults: {
      height: 0.8,
      length: 33000,
      width: 1.2,
      upstreamLevel: 0.8,
      downstreamLevel: 0.2,
      riverWidth: 0,
      discharge: 0.18,
      catchment: 0,
      slope: 0.0012,
      tunnelLength: 3500,
      tunnelDiameter: 1.4,
      shaftSpacing: 35,
    },
    schematicFeatures: ['mountain_aquifer', 'mother_well', 'vertical_shafts', 'sloping_gallery', 'water_table_line', 'daylight_outlet'],
  },
  {
    id: 'marib',
    name: 'Great Dam of Marib',
    alternativeName: 'Sadd Ma’rib (سد مأرب); Sabean Dam; Dam of the Queen of Sheba',
    kind: 'EMBANKMENT_DAM',
    typeLabel: 'Monumental Ancient Embankment Dam with Ashlar Sluices',
    location: 'Wadi Dhana, Marib, Yemen',
    civilization: 'Kingdom of Saba (Sheba) and Himyarite Kingdom',
    period: 'South Arabian Iron Age through Late Antiquity',
    approximateDate: 'c. 8th century BCE – 575 CE (famous breach mentioned in the Quran, Surat Saba)',
    builder: 'Sabean Mukarribs (rulers) including Dhamar Ali Dharih and Yitha’amar Bayyin; rebuilt by Sharhab’il Ya’fur (449 CE)',
    purpose: 'Impounded massive flash-floods (*sayl*) rushing down the Balaq hills to irrigate over 10,000 hectares of North and South oases ("Two Gardens")',
    currentStatus: 'Archaeological ruins; monumental North and South dressed stone sluice gates survive; modern Marib Dam constructed nearby in 1986',
    riverOrWaterBody: 'Wadi Dhana (seasonal mountain runoff flood wadi)',
    material: 'Compacted gravel and earth embankment core faced with dressed diorite ashlar stone masonry and hydraulic gypsum-lime mortar',
    foundation: 'Anchored onto Balaq volcanic bedrock abutments and deep wadi gravel beds',
    spillwayArrangement: 'High-elevation emergency bypass overflow channels carved through northern rock hills',
    sluiceArrangement: 'Monumental stepped ashlar stone intake towers with vertical sluice gates distributing flood waters into major canal flumes',
    documented: {
      length: 'Approx. 580 to 650 meters across Wadi Dhana',
      height: 'Approx. 14 to 18 meters height',
      width: 'Crest width ~6 meters; base width ~60 meters',
      storage: 'Peak flood retention capacity estimated at ~30 to 55 Million Cubic Meters',
      sluices: 'North Sluice (40m long, 11m high ashlar monument) and South Sluice',
    },
    assumptions: {
      height: 'Modeled embankment height (default 14 m)',
      catchment: 'Wadi Dhana flash-flood catchment (default 120 km²)',
      floodDischarge: 'Desert wadi flash flood peak (default 450 m³/s)',
    },
    defaults: {
      height: 14,
      length: 600,
      width: 6,
      upstreamLevel: 11.5,
      downstreamLevel: 0,
      riverWidth: 120,
      discharge: 450,
      catchment: 120,
      slope: 2.2,
      tunnelLength: 0,
      tunnelDiameter: 0,
      shaftSpacing: 0,
      spillwayWidth: 45,
    },
    schematicFeatures: ['ashlar_sluice_towers', 'earthen_core', 'stone_facing', 'phreatic_line', 'wadi_bed', 'irrigation_flume'],
  },
  {
    id: 'chand_baori',
    name: 'Chand Baori Stepwell',
    alternativeName: 'Abhaneri Stepwell (चाँद बावड़ी); Royal Subterranean Stepwell',
    kind: 'STEPWELL',
    typeLabel: 'Subterranean Stepped Groundwater Pavilion',
    location: 'Abhaneri village, Dausa district, Rajasthan, India',
    civilization: 'Nikumbha Dynasty / Gurjara-Pratihara Empire',
    period: 'Early Medieval Indian Hydraulic Architecture',
    approximateDate: 'c. 8th – 9th century CE',
    builder: 'King Chanda of the Nikumbha dynasty',
    purpose: 'Reliable communal access to deep groundwater year-round, rain harvesting reservoir, and cool architectural refuge in arid Rajasthan',
    currentStatus: 'Protected monument under Archaeological Survey of India (ASI); one of the deepest and most visually stunning stepwells in the world',
    riverOrWaterBody: 'Unconfined regional alluvial aquifer & monsoon runoff collection',
    material: 'Dressed porous volcanic basalt and sandstone blocks, interlocking dry masonry, carved columned pavilions',
    foundation: 'Deep square pit excavated into sedimentary rock and water-bearing alluvial sands',
    spillwayArrangement: 'Surface perimeter stormwater collection lip and overflow conduits',
    sluiceArrangement: 'Multiple water-level draw portals and subterranean storage cisterns',
    documented: {
      depth: 'Approx. 30 meters (100 feet) deep',
      tiers: '13 distinct stepped levels containing 3,500 narrow, perfectly symmetrical geometric steps',
      width: 'Square layout approx. 35 meters by 35 meters at ground surface',
      features: 'Three sides of geometric steps; fourth side features multi-storeyed pillared royal pavilions and arcades',
    },
    assumptions: {
      waterTableSummer: 'Deep water table level in dry season ~26 meters below ground',
      waterTableMonsoon: 'High water table level post-monsoon ~14 meters below ground',
      evaporationReduction: 'Subterranean microclimate reduces evaporation loss by ~75% compared to surface tanks',
    },
    defaults: {
      height: 30,
      length: 35,
      width: 35,
      upstreamLevel: 12,
      downstreamLevel: 0,
      riverWidth: 0,
      discharge: 0,
      catchment: 0.5,
      slope: 0,
      tunnelLength: 0,
      tunnelDiameter: 0,
      shaftSpacing: 0,
      basinDepth: 30,
      basinLength: 35,
      basinWidth: 35,
      tiers: 13,
    },
    schematicFeatures: ['geometric_steps', 'columned_pavilion', 'water_table_levels', 'aquifer_seepage', 'bottom_sump'],
  },
  {
    id: 'dujiangyan',
    name: 'Dujiangyan Irrigation System',
    alternativeName: 'Dūjiāngyàn (都江堰); Min River Weir & Water Diversion',
    kind: 'DIVERSION_WEIR',
    typeLabel: 'Non-Dam Flood Diversion & Automatic Desilting Weir',
    location: 'Min River (Minjiang), Dujiangyan City, Sichuan Province, China',
    civilization: 'Qin Dynasty / Ancient China',
    period: 'Warring States Period / Qin Dynasty',
    approximateDate: 'c. 256 BCE',
    builder: 'Li Bing (Governor of Shu) and his son',
    purpose: 'Control catastrophic Min River floods, automatically separate silt from water using vortex inertia, and divert 40–60% of river flow into the Chengdu Plain for irrigation without a blocking dam',
    currentStatus: 'Continuously active for over 2,280 years; UNESCO World Heritage Site; irrigates over 5,300 sq km of prime agricultural land',
    riverOrWaterBody: 'Min River (major tributary of the upper Yangtze River)',
    material: 'Woven bamboo cages packed with river cobbles (*zhulong*), timber tripods (*macha*), and chiseled rock cuts',
    foundation: 'Natural alluvial boulder and gravel riverbed',
    spillwayArrangement: 'Flying Sand Weir (*Feishayan*) acting as an automatic high-flood spillway and silt-scour flume',
    sluiceArrangement: 'Bottle-Neck Channel (*Baopingkou*) gouged through Mount Yulei acting as an automatic flow-limiting regulator',
    documented: {
      yuzui: 'Fish Mouth levee bifurcates the Min River into the Inner River (irrigation) and Outer River (flood relief)',
      feishayan: '200m wide low spillway weir that discharges excess water and uses centrifugal force to flush 80% of riverbed silt',
      baopingkou: '20m wide gorge cut through solid rock that restricts maximum flow into the Chengdu plain to prevent flooding',
      longevity: 'Active water regulation continuously maintained for over 2 millennia without silt-choking',
    },
    assumptions: {
      riverDischarge: 'Monsoon flood discharge of Min River (default 1200 m³/s)',
      divertedShare: 'Inner River diversion ratio: 60% during dry season, 40% during flood season',
      riverWidth: 'Min River total valley channel width ~240 meters',
    },
    defaults: {
      height: 3.5,
      length: 260,
      width: 30,
      upstreamLevel: 3.2,
      downstreamLevel: 1.0,
      riverWidth: 240,
      discharge: 1200,
      catchment: 23000,
      slope: 0.002,
      tunnelLength: 0,
      tunnelDiameter: 0,
      shaftSpacing: 0,
      spillwayWidth: 200,
    },
    schematicFeatures: ['bifurcation_fish_mouth', 'flying_sand_weir', 'bottle_neck_chute', 'curved_flow_vortex', 'sediment_flush'],
  },
  {
    id: 'porumamilla',
    name: 'Porumamilla Tank (Anantaraja Sagara)',
    alternativeName: 'Anantarājasāgara (अनंतराजसागर); Porumamilla 1369 CE Epigraphic Dam',
    kind: 'EMBANKMENT_DAM',
    typeLabel: 'Epigraphically Certified Earthen Irrigation Dam with Stone Sluices',
    location: 'Porumamilla, Kadapa (Cuddapah) district, Andhra Pradesh, India',
    civilization: 'Vijayanagara Empire (Sangama Dynasty)',
    period: 'Classical South Indian Medieval Tank Engineering',
    approximateDate: '1369 CE (attested by Sanskrit inscription in 48 verses)',
    builder: 'Prince Bhaskara Bhavadurga (son of King Bukka I of Vijayanagara)',
    purpose: 'Large-scale perennial irrigation reservoir engineered strictly according to the 12 cardinal virtues (*sadgunas*) and avoiding the 6 fatal flaws (*doshas*) of dam construction in Hindu Shastras',
    currentStatus: 'Extant and functioning irrigation tank; famous 1369 CE foundation inscription is preserved in the temple mandapa',
    riverOrWaterBody: 'Maldevi River tributary basin',
    material: 'Earthen core, heavy revetment of dressed stone pitching, and four massive stone sluices (*tumbas*) with granite slabs',
    foundation: 'Clay foundation anchored between two natural rocky hills (*Kalyana* and *Vemana*)',
    spillwayArrangement: 'Two natural rock-cut waste weirs (*kalingas*) at the mountain flanks',
    sluiceArrangement: '4 rectangular dressed stone sluices with cistern chambers and vertical wooden plug plugs',
    documented: {
      length: '4,500 cubits (approx. 1,400 meters long)',
      height: 'Approx. 12 meters (33 feet) high',
      width: '102 cubits (approx. 32 meters) base thickness; crest width approx. 5 meters',
      constructionLabor: 'Inscription records 1,000 men and 100 carts worked for two years',
      epigraphy: 'Porumamilla Inscription of 1369 CE (Epigraphia Indica Vol. XIV)',
    },
    assumptions: {
      height: 'Modeled dam height (default 12 m)',
      catchment: 'Maldevi basin catchment area (default 55 km²)',
      soilFriction: 'Compact composite clay-stone embankment with 1:2.5 slope',
    },
    defaults: {
      height: 12,
      length: 1400,
      width: 5,
      upstreamLevel: 10.2,
      downstreamLevel: 0,
      riverWidth: 100,
      discharge: 240,
      catchment: 55,
      slope: 2.5,
      tunnelLength: 0,
      tunnelDiameter: 0,
      shaftSpacing: 0,
      spillwayWidth: 35,
    },
    schematicFeatures: ['hill_abutments', 'clay_embankment', 'stone_facing', 'phreatic_line', 'four_stone_sluices', 'rock_waste_weir'],
  },
];

export const DEFAULT_SIMULATION_STRUCTURE = ANCIENT_SIMULATION_STRUCTURES[0]; // Kallanai

export function findPredefinedStructure(query: string): SimulationStructure | null {
  const q = query.toLowerCase().trim();
  if (!q) return null;

  // 1. Direct match on id
  const byId = ANCIENT_SIMULATION_STRUCTURES.find((s) => s.id === q);
  if (byId) return byId;

  // 2. Full phrase direct containment (e.g. "kallanai" in "Kallanai / Grand Anicut")
  const fullMatch = ANCIENT_SIMULATION_STRUCTURES.find((s) => {
    const n = s.name.toLowerCase();
    const alt = s.alternativeName.toLowerCase();
    return n.includes(q) || alt.includes(q);
  });
  if (fullMatch) return fullMatch;

  // 3. Keyword match excluding common generic stop words
  const stopWords = new Set([
    'dam',
    'dams',
    'ancient',
    'reservoir',
    'reservoirs',
    'water',
    'lake',
    'system',
    'river',
    'the',
    'and',
    'bund',
    'structure',
    'engineering',
    'historic',
    'historical',
  ]);
  const distinctWords = q
    .split(/[\s,/-]+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 2 && !stopWords.has(w));

  if (distinctWords.length > 0) {
    const matches = ANCIENT_SIMULATION_STRUCTURES.filter((structure) => {
      const terms = `${structure.name} ${structure.alternativeName} ${structure.id}`.toLowerCase();
      return distinctWords.some((word) => terms.includes(word));
    });

    if (matches.length > 0) {
      return matches.sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        const aScore = distinctWords.filter((w) => aName.includes(w)).length;
        const bScore = distinctWords.filter((w) => bName.includes(w)).length;
        return bScore - aScore;
      })[0];
    }
  }

  return null;
}

export function heuristicClassifyStructure(query: string): SimulationStructure {
  const q = query.toLowerCase().trim();

  if (/qanat|karez|kariz|foggara|underground/.test(q)) {
    return {
      ...ANCIENT_SIMULATION_STRUCTURES.find((s) => s.id === 'qanat')!,
      id: `qanat-${Date.now()}`,
      name: query.trim(),
      alternativeName: 'AI-Identified Subterranean Qanat Gallery',
      typeLabel: 'Subterranean Gravity Qanat Gallery',
      kind: 'QANAT',
      location: 'Regional Arid Basin (Verify site location)',
      documented: {
        dimensions: 'Historical dimensions are site-specific and not in catalog; verify local survey',
        status: 'Subterranean gallery identified based on keyword classification',
      },
    };
  }

  if (/stepwell|baori|baoli|vav|step well|kalyani|tank/.test(q) && /step|vav|baori|baoli/.test(q)) {
    return {
      ...ANCIENT_SIMULATION_STRUCTURES.find((s) => s.id === 'chand_baori')!,
      id: `stepwell-${Date.now()}`,
      name: query.trim(),
      alternativeName: 'AI-Identified Subterranean Stepwell',
      typeLabel: 'Subterranean Stepped Groundwater Pavilion',
      kind: 'STEPWELL',
      location: 'Regional Basin (Verify site location)',
      documented: {
        depth: 'Not documented in local catalog; estimated from regional stepwells',
        tiers: 'Tiered step cascade structure',
      },
    };
  }

  if (/anicut|weir|barrage|diversion|causeway/.test(q)) {
    return {
      ...ANCIENT_SIMULATION_STRUCTURES.find((s) => s.id === 'kallanai')!,
      id: `weir-${Date.now()}`,
      name: query.trim(),
      alternativeName: 'AI-Identified Diversion Weir / Anicut',
      typeLabel: 'River Diversion Weir / Anicut',
      kind: 'DIVERSION_WEIR',
      location: 'River Channel Basin (Verify site location)',
      documented: {
        crestLength: 'Not documented in local catalog; estimated',
        weirHead: 'Low-head diversion weir',
      },
    };
  }

  if (/reservoir|cistern|settling|tank|dholavira|sringaverapura/.test(q)) {
    return {
      ...ANCIENT_SIMULATION_STRUCTURES.find((s) => s.id === 'dholavira')!,
      id: `reservoir-${Date.now()}`,
      name: query.trim(),
      alternativeName: 'AI-Identified Water Harvesting Reservoir Complex',
      typeLabel: 'Rock-Cut / Masonry Reservoir Complex',
      kind: 'RESERVOIR_TANK',
      location: 'Water Harvesting Watershed (Verify site location)',
      documented: {
        basinCapacity: 'Not documented in local catalog; estimated',
        inlet: 'Monsoon runoff diversion basin',
      },
    };
  }

  if (/masonry|cyclopean|gravity|roman dam|bhojpur|proserpina|cornalvo/.test(q)) {
    return {
      ...ANCIENT_SIMULATION_STRUCTURES.find((s) => s.id === 'bhojpur')!,
      id: `masonry-${Date.now()}`,
      name: query.trim(),
      alternativeName: 'AI-Identified Masonry Gravity Dam',
      typeLabel: 'Masonry Gravity Dam',
      kind: 'MASONRY_DAM',
      location: 'Rock Gorge Valley (Verify site location)',
      documented: {
        height: 'Not documented in local catalog; estimated',
        masonry: 'Stone masonry gravity retaining structure',
      },
    };
  }

  // Default fallback: Embankment dam
  return {
    ...ANCIENT_SIMULATION_STRUCTURES.find((s) => s.id === 'sudarshana')!,
    id: `embankment-${Date.now()}`,
    name: query.trim(),
    alternativeName: 'AI-Identified Ancient Embankment Dam',
    typeLabel: 'Composite Earthen & Stone Embankment Dam',
    kind: 'EMBANKMENT_DAM',
    location: 'Historical River Basin (Verify site location)',
    documented: {
      height: 'Not documented in local catalog; simulation baseline applied',
      embankment: 'Earthen bund with stone revetment',
    },
  };
}

export function classifyStructure(query: string): SimulationStructure {
  const match = findPredefinedStructure(query);
  if (match) return match;
  return heuristicClassifyStructure(query);
}

export function getDemoStructures(): SimulationStructure[] {
  return ANCIENT_SIMULATION_STRUCTURES;
}
