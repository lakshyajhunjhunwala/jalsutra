import { jsPDF } from 'jspdf';
import {
  TimelineMilestone,
  HistoricalEra,
  GeneratedYearPrompt,
  HISTORICAL_ERAS,
} from '../components/WaterEngineeringTimeline.tsx';

export interface PdfExportOptions {
  milestones: TimelineMilestone[];
  selectedEra: string;
  selectedCategory: string;
  selectedYearPrompt?: GeneratedYearPrompt | null;
  activeMilestone?: TimelineMilestone;
}

export function exportTimelinePdfDossier({
  milestones,
  selectedEra,
  selectedCategory,
  selectedYearPrompt,
  activeMilestone,
}: PdfExportOptions): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 15;
  const contentWidth = pageWidth - marginX * 2;
  let currentY = 16;

  const currentEraObj =
    selectedEra !== 'all' ? HISTORICAL_ERAS.find((e) => e.id === selectedEra) : null;

  const eraTitle = currentEraObj
    ? currentEraObj.name
    : 'Comprehensive Pan-Indian Chronology (3000 BCE – 1500 CE)';

  const categoryLabel =
    selectedCategory === 'all'
      ? 'All Hydraulic Structures & Treatises'
      : selectedCategory === 'dam_weir'
      ? 'Gravity Dams & River Diversion Weirs'
      : selectedCategory === 'reservoir_tank'
      ? 'Reservoirs & Water Clarification Tanks'
      : selectedCategory === 'urban_well'
      ? 'Highway Well Grids & Urban Drainage'
      : 'Engineering Treatises & Dam Statutes';

  // Helper for adding academic running header & footer
  const addHeaderAndFooter = (pageNum: number, totalPagesPlaceholder: boolean = false) => {
    // Header
    doc.setFont('times', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(110, 95, 80);
    doc.text(
      'JalaSutra Ancient Hydrology Archive · Academic Reference Dossier',
      marginX,
      9
    );
    doc.text('Primary Evidence & Hydraulic Physics', pageWidth - marginX, 9, { align: 'right' });

    doc.setDrawColor(215, 203, 188);
    doc.setLineWidth(0.3);
    doc.line(marginX, 11, pageWidth - marginX, 11);

    // Footer
    doc.line(marginX, pageHeight - 11, pageWidth - marginX, pageHeight - 11);
    doc.setFont('times', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120, 105, 90);
    doc.text(
      'Documented Inscriptions · ASI Stratigraphy · ICOLD Structural Protocols',
      marginX,
      pageHeight - 7
    );
    doc.text(
      `Page ${pageNum}`,
      pageWidth - marginX,
      pageHeight - 7,
      { align: 'right' }
    );
  };

  // Helper to ensure page overflow is cleanly handled
  const checkPageBreak = (neededHeight: number): void => {
    if (currentY + neededHeight > pageHeight - 18) {
      doc.addPage();
      currentY = 16;
    }
  };

  // ==========================================
  // TITLE BANNER (Page 1)
  // ==========================================
  doc.setFillColor(248, 244, 236);
  doc.rect(marginX, currentY, contentWidth, 32, 'F');
  doc.setDrawColor(139, 58, 28);
  doc.setLineWidth(0.8);
  doc.line(marginX, currentY, marginX, currentY + 32);

  doc.setFont('times', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(114, 47, 22); // Deep Terracotta
  doc.text(
    'ANCIENT WATER ENGINEERING & HYDROLOGY DOSSIER',
    marginX + 4,
    currentY + 8
  );

  doc.setFont('times', 'italic');
  doc.setFontSize(10.5);
  doc.setTextColor(60, 48, 38);
  doc.text(
    'Civil Engineering Trajectory, Epigraphical Corpus & Structural Forensic Analysis',
    marginX + 4,
    currentY + 14
  );

  doc.setFont('times', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 85, 70);
  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.text(
    `Scope: 3000 BCE to 1500 CE  |  Published for Academic Reference  |  Generated: ${dateStr}`,
    marginX + 4,
    currentY + 20
  );
  doc.text(
    'Standards: Epigraphia Indica · Corpus Inscriptionum Indicarum · ASI Excavation Memoirs · Arthashastra',
    marginX + 4,
    currentY + 25
  );

  currentY += 37;

  // ==========================================
  // METADATA & PARAMETERS STRIP
  // ==========================================
  doc.setFillColor(242, 236, 225);
  doc.rect(marginX, currentY, contentWidth, 18, 'F');
  doc.setDrawColor(205, 192, 175);
  doc.setLineWidth(0.3);
  doc.rect(marginX, currentY, contentWidth, 18, 'S');

  doc.setFont('times', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(50, 40, 30);

  doc.text('Visualized Period:', marginX + 3, currentY + 5);
  doc.setFont('times', 'normal');
  doc.text(eraTitle, marginX + 28, currentY + 5);

  doc.setFont('times', 'bold');
  doc.text('Structure Filter:', marginX + 3, currentY + 10);
  doc.setFont('times', 'normal');
  doc.text(categoryLabel, marginX + 28, currentY + 10);

  doc.setFont('times', 'bold');
  doc.text('Cataloged Works:', marginX + 3, currentY + 15);
  doc.setFont('times', 'normal');
  doc.text(`${milestones.length} Historical Engineering Sites Documented`, marginX + 28, currentY + 15);

  if (currentEraObj) {
    doc.text(
      `Chronological Span: ${currentEraObj.dateRangeLabel}`,
      pageWidth - marginX - 3,
      currentY + 5,
      { align: 'right' }
    );
  }

  currentY += 23;

  // ==========================================
  // FOCUSED RESEARCH INQUIRY BANNER (If a specific year is clicked)
  // ==========================================
  if (selectedYearPrompt) {
    checkPageBreak(38);
    doc.setFillColor(254, 252, 248);
    doc.rect(marginX, currentY, contentWidth, 34, 'F');
    doc.setDrawColor(139, 58, 28);
    doc.setLineWidth(0.6);
    doc.rect(marginX, currentY, contentWidth, 34, 'S');

    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(114, 47, 22);
    doc.text(
      `FOCUSED PERIOD RESEARCH INQUIRY: ${selectedYearPrompt.yearLabel} (${selectedYearPrompt.eraName})`,
      marginX + 3,
      currentY + 6
    );

    doc.setFont('times', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(70, 55, 42);
    doc.text('Hydraulic Paradigm:', marginX + 3, currentY + 11);
    doc.setFont('times', 'normal');
    const wrapTech = doc.splitTextToSize(selectedYearPrompt.waterTechniquesSummary, contentWidth - 36);
    doc.text(wrapTech[0] || '', marginX + 33, currentY + 11);

    doc.setFont('times', 'bold');
    doc.text('Academic Research Prompt:', marginX + 3, currentY + 17);
    doc.setFont('times', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(40, 32, 24);
    const wrapPrompt = doc.splitTextToSize(`"${selectedYearPrompt.prompt}"`, contentWidth - 6);
    doc.text(wrapPrompt.slice(0, 3), marginX + 3, currentY + 22);

    currentY += 38;
  }

  // ==========================================
  // SECTION HEADING: CHRONOLOGICAL CATALOGUE
  // ==========================================
  checkPageBreak(12);
  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(114, 47, 22);
  doc.text('CHRONOLOGICAL WATER ENGINEERING CATALOGUE', marginX, currentY + 4);
  doc.setDrawColor(139, 58, 28);
  doc.setLineWidth(0.5);
  doc.line(marginX, currentY + 6, marginX + 85, currentY + 6);
  currentY += 10;

  // ==========================================
  // MILESTONE DOSSIER ENTRIES
  // ==========================================
  milestones.forEach((m, idx) => {
    // Estimate entry height
    const baseHeight = 50;
    checkPageBreak(baseHeight);

    // Entry background container
    doc.setFillColor(idx % 2 === 0 ? 255 : 252, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 246);
    doc.rect(marginX, currentY, contentWidth, 4, 'F');

    // Milestone Header
    doc.setFont('times', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(114, 47, 22);
    doc.text(`${idx + 1}. [${m.yearLabel}]  ${m.title}`, marginX + 1, currentY + 4);

    if (m.sanskritOrLocalName) {
      doc.setFont('times', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(90, 75, 60);
      doc.text(m.sanskritOrLocalName, pageWidth - marginX - 1, currentY + 4, { align: 'right' });
    }

    currentY += 7;

    // Metadata Row
    doc.setFont('times', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(50, 42, 34);
    doc.text('Location:', marginX + 1, currentY);
    doc.setFont('times', 'normal');
    doc.text(`${m.location} (${m.region})`, marginX + 16, currentY);

    doc.setFont('times', 'bold');
    doc.text('Period & Ruler:', marginX + 80, currentY);
    doc.setFont('times', 'normal');
    doc.text(`${m.period}  ·  ${m.associatedRuler}`, marginX + 102, currentY);

    currentY += 4.5;

    doc.setFont('times', 'bold');
    doc.text('Classification:', marginX + 1, currentY);
    doc.setFont('times', 'normal');
    doc.text(m.category.replace('_', ' ').toUpperCase(), marginX + 22, currentY);

    doc.setFont('times', 'bold');
    doc.text('Evidence Type:', marginX + 80, currentY);
    doc.setFont('times', 'normal');
    doc.text(m.evidenceType, marginX + 102, currentY);

    currentY += 5;

    // Description text
    doc.setFont('times', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(40, 32, 24);
    const descLines = doc.splitTextToSize(m.description, contentWidth - 4);
    checkPageBreak(descLines.length * 3.8);
    doc.text(descLines, marginX + 2, currentY);
    currentY += descLines.length * 3.8 + 2;

    // Civil Engineering Innovations
    checkPageBreak(12);
    doc.setFont('times', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(70, 55, 42);
    doc.text('Identified Civil Engineering Innovations:', marginX + 2, currentY);
    currentY += 3.5;

    doc.setFont('times', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(45, 38, 30);
    m.engineeringInnovations.forEach((item) => {
      checkPageBreak(5);
      const bulletLines = doc.splitTextToSize(`• ${item}`, contentWidth - 8);
      doc.text(bulletLines, marginX + 4, currentY);
      currentY += bulletLines.length * 3.5;
    });

    // Primary Citation
    checkPageBreak(8);
    doc.setFont('times', 'bold');
    doc.setFontSize(7.8);
    doc.setTextColor(114, 47, 22);
    doc.text('Primary Epigraphic / Excavation Source:', marginX + 2, currentY + 1);
    doc.setFont('times', 'italic');
    doc.setTextColor(60, 50, 40);
    const citeLines = doc.splitTextToSize(`"${m.primarySource}"`, contentWidth - 8);
    doc.text(citeLines, marginX + 4, currentY + 4.5);
    currentY += citeLines.length * 3.6 + 6;

    // Divider line between items
    doc.setDrawColor(225, 215, 200);
    doc.setLineWidth(0.2);
    doc.line(marginX, currentY - 2, pageWidth - marginX, currentY - 2);
    currentY += 2;
  });

  // ==========================================
  // SECTION: ACADEMIC BIBLIOGRAPHY & PRIMARY CITATIONS
  // ==========================================
  checkPageBreak(50);
  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(114, 47, 22);
  doc.text('ACADEMIC BIBLIOGRAPHY & PRIMARY EPIGRAPHICAL CITATIONS', marginX, currentY + 5);
  doc.setDrawColor(139, 58, 28);
  doc.setLineWidth(0.5);
  doc.line(marginX, currentY + 7, marginX + 115, currentY + 7);
  currentY += 12;

  const bibliography = [
    'Archaeological Survey of India (ASI): Excavations at Dholavira 1990-2005 (R.S. Bisht). UNESCO World Heritage Nomination Dossier No. 1642, New Delhi, 2021.',
    'Bhandarkar, D.R. & Chhabra, B.: Inscriptions of the Early Gupta Kings. Corpus Inscriptionum Indicarum Vol. III, Archaeological Survey of India, New Delhi, 1981.',
    'Cotton, Sir Arthur: Reports on the Kaveri and Coleroon Anicuts and the Delta Irrigation Systems of the Madras Presidency. Public Works Department Records, Madras, 1836.',
    'Epigraphia Indica, Vol. VIII: "The Junagadh Rock Inscription of Rudradaman I (Saka Year 72 / 150 CE)", edited by F. Kielhorn, pp. 36-49, 1905.',
    'Epigraphia Indica, Vol. XIV: "Porumamilla Tank Inscription of Prince Bhaskara Bhavadurga (Saka 1291 / 1369 CE)", edited by J. Ramayya, pp. 97-109, 1917.',
    'Hultzsch, E.: Inscriptions of Asoka (New Edition). Corpus Inscriptionum Indicarum Vol. I, Clarendon Press, Oxford, 1925 (Includes Pillar Edict VII & Major Rock Edicts II & XII).',
    'Kangle, R.P.: The Kautiliya Arthashastra (3 Volumes: Text, Translation, and Commentary). Motilal Banarsidass, Delhi, 1965 (Book II Ch. 24 & Book III Ch. 9).',
    'Lal, B.B.: Excavations at Sringaverapura (1977-1986): Early Historic Brick Sluice and Siltation Tank Complex. Memoirs of the Archaeological Survey of India No. 88, New Delhi, 1993.',
    'Shukla, D.N.: Vastu-Sastra, Vol. I: Hindu Science of Architecture (Incorporating King Bhoja\'s 11th-Century Samarāṅgaṇa Sūtradhāra). Munshiram Manoharlal, New Delhi, 1961.',
    'Verma, P.K.: Traditional Hydraulic Architecture of the Deccan and Vijayanagara Empire: Sluices, Anicuts, and Aqueducts. Indian Journal of History of Science, 42(3), 2007.',
  ];

  doc.setFont('times', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(45, 38, 30);

  bibliography.forEach((entry, bIdx) => {
    checkPageBreak(8);
    const bibLines = doc.splitTextToSize(`[${bIdx + 1}]  ${entry}`, contentWidth - 4);
    doc.text(bibLines, marginX + 2, currentY);
    currentY += bibLines.length * 3.4 + 1.5;
  });

  // ==========================================
  // METHODOLOGY & EVIDENCE HIERARCHY
  // ==========================================
  checkPageBreak(25);
  currentY += 4;
  doc.setFillColor(245, 240, 230);
  doc.rect(marginX, currentY, contentWidth, 20, 'F');
  doc.setDrawColor(205, 192, 175);
  doc.setLineWidth(0.3);
  doc.rect(marginX, currentY, contentWidth, 20, 'S');

  doc.setFont('times', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(80, 50, 30);
  doc.text('METHODOLOGICAL STANDARD & EVIDENCE HIERARCHY NOTE:', marginX + 3, currentY + 4.5);

  doc.setFont('times', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(60, 48, 38);
  const methodText =
    'This dossier enforces a strict tripartite taxonomy: (1) Confirmed Historical Evidence grounded in contemporary epigraphy and stone inscriptions; (2) Archaeological Evidence established through ASI stratigraphic digs; and (3) Civil Engineering Deductions calculated via hydrostatic water pressure, weir discharge physics, and terrain gradient modeling. Conjectural interpretations are explicitly marked as hypothetical.';
  const wrapMethod = doc.splitTextToSize(methodText, contentWidth - 6);
  doc.text(wrapMethod, marginX + 3, currentY + 8.5);

  // Apply running header and footer across all generated pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addHeaderAndFooter(i);
  }

  // Generate safe sanitized filename
  const cleanEraName = currentEraObj
    ? currentEraObj.id.replace(/_/g, '-')
    : 'pan-indian-chronology';
  const cleanCat = selectedCategory !== 'all' ? `-${selectedCategory}` : '';
  const filename = `JalaSutra-Water-Engineering-Dossier-${cleanEraName}${cleanCat}.pdf`;

  // Download PDF file
  doc.save(filename);
}
