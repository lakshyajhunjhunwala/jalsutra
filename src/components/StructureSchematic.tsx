import React from 'react';
import { SimulationStructure, SimulationValues } from '../data/ancientStructureSimulationData.ts';

interface StructureSchematicProps {
  structure: SimulationStructure;
  values: SimulationValues;
}

export const StructureSchematic: React.FC<StructureSchematicProps> = ({ structure, values }) => {
  const kind = structure.kind;

  // Visual helper calculations
  const svgWidth = 760;
  const svgHeight = 310;
  const groundY = 230;

  // Patterns and Gradients definition
  const defs = (
    <defs>
      {/* Water gradients */}
      <linearGradient id="schematicWater" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#76B5D7" stopOpacity="0.88" />
        <stop offset="60%" stopColor="#438DB8" stopOpacity="0.94" />
        <stop offset="100%" stopColor="#25597E" stopOpacity="0.98" />
      </linearGradient>
      <linearGradient id="aquiferGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#6CA6C8" stopOpacity="0.5" />
        <stop offset="100%" stopColor="#2E6287" stopOpacity="0.75" />
      </linearGradient>
      <linearGradient id="aeratedWater" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#C9EDFB" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#5DA0C4" stopOpacity="0.8" />
      </linearGradient>

      {/* Masonry block patterns */}
      <pattern id="dressedMasonry" width="24" height="14" patternUnits="userSpaceOnUse">
        <rect width="23" height="6.5" fill="#8C8176" stroke="#665D54" strokeWidth="0.6" rx="0.5" />
        <rect x="12" y="7" width="23" height="6.5" fill="#82776C" stroke="#665D54" strokeWidth="0.6" rx="0.5" />
        <rect x="-12" y="7" width="23" height="6.5" fill="#82776C" stroke="#665D54" strokeWidth="0.6" rx="0.5" />
      </pattern>
      <pattern id="cyclopeanStone" width="36" height="24" patternUnits="userSpaceOnUse">
        <rect width="34" height="11" fill="#7D7368" stroke="#524A42" strokeWidth="1" rx="1" />
        <rect x="18" y="12" width="34" height="11" fill="#73695F" stroke="#524A42" strokeWidth="1" rx="1" />
        <rect x="-18" y="12" width="34" height="11" fill="#73695F" stroke="#524A42" strokeWidth="1" rx="1" />
      </pattern>
      <pattern id="boulderSand" width="20" height="20" patternUnits="userSpaceOnUse">
        <circle cx="6" cy="6" r="4.5" fill="#695E54" stroke="#4F453C" strokeWidth="0.8" />
        <circle cx="16" cy="15" r="3.5" fill="#756A60" stroke="#4F453C" strokeWidth="0.8" />
        <circle cx="15" cy="4" r="2.5" fill="#5E534A" />
        <circle cx="4" cy="16" r="2.8" fill="#5E534A" />
      </pattern>
      <pattern id="compactedClay" width="12" height="12" patternUnits="userSpaceOnUse">
        <path d="M0 12 L12 0 M-3 3 L3 -3 M9 15 L15 9" stroke="#9E764B" strokeWidth="1.2" opacity="0.8" />
        <rect width="12" height="12" fill="#B38758" opacity="0.35" />
      </pattern>
      <pattern id="earthenRiprap" width="16" height="16" patternUnits="userSpaceOnUse">
        <path d="M0 16 L16 0 M-4 4 L4 -4 M12 20 L20 12" stroke="#8E7761" strokeWidth="1" />
        <circle cx="8" cy="8" r="2" fill="#6E5C4A" opacity="0.6" />
      </pattern>
    </defs>
  );

  // -------------------------------------------------------------
  // 1. DIVERSION WEIR / ANICUT (Kallanai / Dujiangyan)
  // -------------------------------------------------------------
  if (kind === 'DIVERSION_WEIR') {
    const weirHeight = Math.max(1.5, Math.min(6.0, values.height));
    const weirHeightPx = weirHeight * 22;
    const weirTopY = groundY - weirHeightPx;
    const weirWidthPx = Math.max(40, Math.min(120, values.width * 3.5));
    const weirLeftX = 300 - weirWidthPx / 2;
    const weirRightX = 300 + weirWidthPx / 2;

    const usHead = Math.max(0.2, values.upstreamLevel);
    const usWaterY = Math.max(70, groundY - weirHeightPx - usHead * 14);
    const dsHead = Math.max(0.1, values.downstreamLevel);
    const dsWaterY = Math.min(groundY - 12, groundY - dsHead * 16);

    return (
      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="mx-auto block w-full max-w-[800px] h-auto select-none">
        {defs}
        {/* River Bed Alluvial Sand & Foundation */}
        <rect x="0" y={groundY} width={svgWidth} height={svgHeight - groundY} fill="#D4C9BA" />
        <rect x="0" y={groundY + 12} width={svgWidth} height="40" fill="url(#boulderSand)" opacity="0.85" />
        <line x1="0" y1={groundY} x2={svgWidth} y2={groundY} stroke="#8C7F72" strokeWidth="2" />

        {/* Upstream River Channel Water */}
        <path
          d={`M0 ${usWaterY} L${weirLeftX} ${usWaterY} L${weirLeftX} ${groundY} L0 ${groundY} Z`}
          fill="url(#schematicWater)"
        />

        {/* Downstream Channel Water & Tailwater */}
        <path
          d={`M${weirRightX + 60} ${dsWaterY} L${svgWidth} ${dsWaterY} L${svgWidth} ${groundY} L${weirRightX + 60} ${groundY} Z`}
          fill="url(#schematicWater)"
        />

        {/* Chola Sinking Boulders Foundation Bed under Weir */}
        <rect
          x={weirLeftX - 35}
          y={groundY}
          width={weirWidthPx + 110}
          height="55"
          fill="url(#boulderSand)"
          stroke="#4D4238"
          strokeWidth="1.5"
          rx="3"
        />

        {/* Stone Masonry Weir Body with Curved Apron */}
        <path
          d={`
            M ${weirLeftX - 20} ${groundY}
            L ${weirLeftX} ${weirTopY + 12}
            Q ${weirLeftX + 15} ${weirTopY} ${weirLeftX + 35} ${weirTopY}
            L ${weirRightX} ${weirTopY + 5}
            Q ${weirRightX + 35} ${weirTopY + 15} ${weirRightX + 65} ${groundY}
            Z
          `}
          fill="url(#dressedMasonry)"
          stroke="#473E36"
          strokeWidth="2"
        />

        {/* Overflow Water Sheet / Nappe Cascading Over Crest */}
        <path
          d={`
            M ${weirLeftX} ${usWaterY}
            Q ${weirLeftX + 30} ${usWaterY - 3} ${weirLeftX + 35} ${weirTopY}
            L ${weirRightX} ${weirTopY + 3}
            Q ${weirRightX + 30} ${weirTopY + 10} ${weirRightX + 55} ${dsWaterY + 6}
            Q ${weirRightX + 80} ${dsWaterY - 8} ${weirRightX + 110} ${dsWaterY}
            L ${weirRightX + 60} ${dsWaterY + 10}
            Q ${weirRightX + 35} ${weirTopY + 18} ${weirLeftX + 10} ${weirTopY + 18}
            Z
          `}
          fill="url(#aeratedWater)"
          stroke="#7AB7D6"
          strokeWidth="1.5"
        />

        {/* Silt Scour Sluice Vent (Kalingu) */}
        <rect x={weirLeftX + 15} y={groundY - 18} width="22" height="18" fill="#1C1814" rx="2" />
        <rect x={weirLeftX + 23} y={groundY - 34} width="6" height="18" fill="#524337" />
        <path d={`M${weirLeftX + 37} ${groundY - 8} Q${weirLeftX + 70} ${groundY - 5} ${weirRightX + 50} ${groundY - 4}`} fill="none" stroke="#6EB8DB" strokeWidth="4" opacity="0.75" />

        {/* Flow Arrows */}
        <g stroke="#E8F4FA" strokeWidth="2.5" fill="none" opacity="0.9">
          <path d="M 60 160 L 130 160 M 120 154 L 130 160 L 120 166" />
          <path d="M 160 175 L 230 175 M 220 169 L 230 175 L 220 181" />
          <path d={`M ${weirRightX + 120} ${dsWaterY + 15} L ${weirRightX + 200} ${dsWaterY + 15} M ${weirRightX + 190} ${dsWaterY + 9} L ${weirRightX + 200} ${dsWaterY + 15} L ${weirRightX + 190} ${dsWaterY + 21}`} stroke="#33749C" />
        </g>

        {/* Technical Labels */}
        <text x="35" y={usWaterY - 10} fill="#184869" fontSize="12" fontWeight="bold">Upstream River Approach (Cauvery)</text>
        <text x="35" y={usWaterY + 16} fill="#1D5378" fontSize="10">Head $H_u$ = {usHead.toFixed(2)}m</text>
        <text x={weirLeftX - 10} y={weirTopY - 14} fill="#8B3A1C" fontSize="11" fontWeight="bold">Stone Diversion Weir ({weirHeight.toFixed(1)}m Crest)</text>
        <text x={weirRightX + 75} y={dsWaterY - 12} fill="#1B4969" fontSize="11" fontWeight="bold">Downstream Regulated Flow</text>
        <text x={weirLeftX - 30} y={groundY + 32} fill="#FDFBFA" fontSize="10" fontWeight="bold">Self-Sinking Boulder Foundation in Sand</text>
        <text x={weirLeftX + 5} y={groundY + 48} fill="#EBE3DA" fontSize="9">Ancient Chola unmortared alluvial embedment</text>
        <text x="18" y={groundY + 62} fill="#695D51" fontSize="10">Deep Alluvial Riverbed</text>
        <text x={weirLeftX + 10} y={groundY - 22} fill="#8B3A1C" fontSize="9" fontWeight="bold">Scour Sluice (*kalingu*)</text>
      </svg>
    );
  }

  // -------------------------------------------------------------
  // 2. EMBANKMENT DAM (Sudarshana Lake / Marib / Porumamilla)
  // -------------------------------------------------------------
  if (kind === 'EMBANKMENT_DAM') {
    const damHeight = Math.max(4, Math.min(24, values.height));
    const damHeightPx = Math.min(150, damHeight * 9);
    const crestY = groundY - damHeightPx;
    const crestWidthPx = Math.max(28, Math.min(80, values.width * 5));
    const usSlopeRun = Math.max(70, Math.min(180, (values.slope || 2.5) * damHeightPx * 0.45));
    const dsSlopeRun = Math.max(60, Math.min(160, 2.0 * damHeightPx * 0.42));

    const crestCenterX = 380;
    const crestLeftX = crestCenterX - crestWidthPx / 2;
    const crestRightX = crestCenterX + crestWidthPx / 2;
    const usToeX = crestLeftX - usSlopeRun;
    const dsToeX = crestRightX + dsSlopeRun;

    const waterHead = Math.max(0.5, Math.min(damHeight - 0.5, values.upstreamLevel));
    const waterLevelY = Math.max(crestY + 12, groundY - (waterHead / damHeight) * damHeightPx);
    const waterContactX = crestLeftX - ((groundY - waterLevelY) / damHeightPx) * usSlopeRun;

    // Clay core geometry
    const coreTopWidth = crestWidthPx * 0.5;
    const coreBaseWidth = coreTopWidth + damHeightPx * 0.45;
    const coreTopLeft = crestCenterX - coreTopWidth / 2;
    const coreTopRight = crestCenterX + coreTopWidth / 2;
    const coreBaseLeft = crestCenterX - coreBaseWidth / 2;
    const coreBaseRight = crestCenterX + coreBaseWidth / 2;

    return (
      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="mx-auto block w-full max-w-[800px] h-auto select-none">
        {defs}
        {/* Foundation & Bedrock */}
        <rect x="0" y={groundY} width={svgWidth} height={svgHeight - groundY} fill="#C9BDAE" />
        <line x1="0" y1={groundY} x2={svgWidth} y2={groundY} stroke="#7D7063" strokeWidth="2" />
        {/* Core Cut-off Trench in Bedrock */}
        <polygon
          points={`
            ${coreBaseLeft + 8},${groundY}
            ${coreBaseLeft + 18},${groundY + 30}
            ${coreBaseRight - 18},${groundY + 30}
            ${coreBaseRight - 8},${groundY}
          `}
          fill="url(#compactedClay)"
          stroke="#694B2C"
          strokeWidth="1.2"
        />

        {/* Upstream Reservoir Pool */}
        <polygon
          points={`0,${waterLevelY} ${waterContactX},${waterLevelY} ${usToeX},${groundY} 0,${groundY}`}
          fill="url(#schematicWater)"
        />

        {/* Embankment Body (Outer Shell / Earthen Bund) */}
        <polygon
          points={`
            ${usToeX},${groundY}
            ${crestLeftX},${crestY}
            ${crestRightX},${crestY}
            ${dsToeX},${groundY}
          `}
          fill="url(#earthenRiprap)"
          stroke="#5C4D3E"
          strokeWidth="2"
        />

        {/* Upstream Stone Pitching (Riprap Protection) */}
        <path
          d={`M ${usToeX} ${groundY} L ${crestLeftX} ${crestY}`}
          stroke="url(#dressedMasonry)"
          strokeWidth="10"
          strokeLinecap="round"
        />

        {/* Impervious Central Compacted Clay Core */}
        <polygon
          points={`
            ${coreBaseLeft},${groundY}
            ${coreTopLeft},${crestY + 10}
            ${coreTopRight},${crestY + 10}
            ${coreBaseRight},${groundY}
          `}
          fill="url(#compactedClay)"
          stroke="#735233"
          strokeWidth="1.5"
        />

        {/* Downstream Rockfill Toe Drain Filter */}
        <polygon
          points={`
            ${dsToeX - 45},${groundY}
            ${dsToeX - 25},${groundY - 26}
            ${dsToeX},${groundY - 4}
            ${dsToeX},${groundY}
          `}
          fill="url(#boulderSand)"
          stroke="#4D4238"
          strokeWidth="1.2"
        />

        {/* Dynamic Phreatic Seepage Line */}
        <path
          d={`
            M ${waterContactX} ${waterLevelY}
            Q ${coreTopLeft + 10} ${waterLevelY + 8} ${crestCenterX} ${waterLevelY + 28}
            Q ${coreBaseRight - 5} ${groundY - 20} ${dsToeX - 20} ${groundY - 1}
          `}
          fill="none"
          stroke="#2A6B94"
          strokeWidth="2.2"
          strokeDasharray="5 3"
        />

        {/* Bottom Sluice Conduit (*pranali*) */}
        <rect x={usToeX + 25} y={groundY - 14} width={dsToeX - usToeX - 35} height="12" fill="#2E241B" rx="1.5" />
        <rect x={usToeX + 35} y={groundY - 12} width={dsToeX - usToeX - 55} height="8" fill="#478AA8" opacity="0.7" />

        {/* Hydrostatic Pressure Triangular Indicator */}
        <polygon
          points={`
            ${usToeX - 70},${waterLevelY}
            ${usToeX - 70},${groundY}
            ${usToeX - 15},${groundY}
          `}
          fill="#3B7D9E"
          opacity="0.25"
          stroke="#2A6482"
          strokeWidth="1"
        />
        <line x1={usToeX - 70} y1={groundY} x2={usToeX - 15} y2={groundY} stroke="#1F536E" strokeWidth="2" />
        <text x={usToeX - 68} y={groundY + 15} fill="#1D4E6B" fontSize="9" fontWeight="bold">Hydrostatic Pressure $\frac{1}{2}\rho gh^2$</text>

        {/* Labels */}
        <text x="25" y={waterLevelY - 10} fill="#184869" fontSize="12" fontWeight="bold">Reservoir Storage Pool</text>
        <text x="25" y={waterLevelY + 16} fill="#1C5378" fontSize="10">Head: {waterHead.toFixed(1)}m / Freeboard: {(damHeight - waterHead).toFixed(1)}m</text>
        <text x={crestLeftX - 12} y={crestY - 12} fill="#453424" fontSize="11" fontWeight="bold">Crest ({values.width}m width)</text>
        <text x={crestCenterX - 20} y={crestY + 36} fill="#FFFBF5" fontSize="10" fontWeight="bold">Clay Core</text>
        <text x={dsToeX - 60} y={crestY + 55} fill="#275C7E" fontSize="9" fontWeight="bold">Phreatic Seepage Line</text>
        <text x={dsToeX - 25} y={groundY - 32} fill="#3D3328" fontSize="9">Rock Toe</text>
        <text x={usToeX + 50} y={groundY - 18} fill="#FFF9F0" fontSize="9">Bottom Sluice Conduit (*pranali*)</text>
        <text x="35" y={groundY + 28} fill="#695D51" fontSize="10">Bedrock & Cut-off Trench</text>
      </svg>
    );
  }

  // -------------------------------------------------------------
  // 3. MASONRY / GRAVITY DAM (Bhojpur / Roman Proserpina)
  // -------------------------------------------------------------
  if (kind === 'MASONRY_DAM' || kind === 'GRAVITY_DAM') {
    const damHeight = Math.max(5, Math.min(30, values.height));
    const damHeightPx = Math.min(170, damHeight * 8.5);
    const crestY = groundY - damHeightPx;
    const baseWidthPx = Math.max(60, Math.min(180, (values.width || 8) * 6.5));
    const crestWidthPx = Math.max(24, baseWidthPx * 0.35);

    const damLeftX = 320;
    const damRightX = damLeftX + baseWidthPx;
    const crestRightX = damLeftX + crestWidthPx;

    const waterHead = Math.max(0.5, Math.min(damHeight - 0.5, values.upstreamLevel));
    const waterLevelY = Math.max(crestY + 10, groundY - (waterHead / damHeight) * damHeightPx);

    const isRoman = structure.id === 'proserpina' || structure.name.toLowerCase().includes('roman');

    return (
      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="mx-auto block w-full max-w-[800px] h-auto select-none">
        {defs}
        {/* Solid Bedrock with Keyway */}
        <rect x="0" y={groundY} width={svgWidth} height={svgHeight - groundY} fill="#B8ADA0" />
        <polygon
          points={`
            ${damLeftX + 20},${groundY}
            ${damLeftX + 35},${groundY + 25}
            ${damLeftX + 75},${groundY + 25}
            ${damLeftX + 90},${groundY}
          `}
          fill="#786D62"
          stroke="#4F453B"
          strokeWidth="1.5"
        />
        <line x1="0" y1={groundY} x2={svgWidth} y2={groundY} stroke="#6E6256" strokeWidth="2" />

        {/* Upstream Deep Reservoir Water */}
        <polygon
          points={`0,${waterLevelY} ${damLeftX},${waterLevelY} ${damLeftX},${groundY} 0,${groundY}`}
          fill="url(#schematicWater)"
        />

        {/* Main Cyclopean Masonry Gravity Wall Body */}
        <polygon
          points={`
            ${damLeftX},${groundY}
            ${damLeftX},${crestY}
            ${crestRightX},${crestY}
            ${damRightX},${groundY}
          `}
          fill="url(#cyclopeanStone)"
          stroke="#473E36"
          strokeWidth="2.5"
        />

        {/* Roman External Buttresses (if Proserpina or Roman) */}
        {isRoman && (
          <g>
            <polygon
              points={`
                ${damRightX - 35},${groundY}
                ${crestRightX + 15},${crestY + 35}
                ${crestRightX + 30},${crestY + 35}
                ${damRightX},${groundY}
              `}
              fill="url(#dressedMasonry)"
              stroke="#3D342C"
              strokeWidth="1.5"
            />
            <polygon
              points={`
                ${damRightX + 10},${groundY}
                ${crestRightX + 45},${crestY + 55}
                ${crestRightX + 58},${crestY + 55}
                ${damRightX + 35},${groundY}
              `}
              fill="url(#dressedMasonry)"
              stroke="#3D342C"
              strokeWidth="1.5"
            />
          </g>
        )}

        {/* Hydrostatic Pressure Distribution Triangle */}
        <polygon
          points={`
            ${damLeftX - 90},${waterLevelY}
            ${damLeftX - 90},${groundY}
            ${damLeftX},${groundY}
          `}
          fill="#3B7D9E"
          opacity="0.22"
          stroke="#2A6482"
          strokeWidth="1"
        />
        {/* Horizontal Force Arrows */}
        {[0.3, 0.6, 0.9].map((fraction) => {
          const arrowY = waterLevelY + (groundY - waterLevelY) * fraction;
          const arrowLength = (fraction * 75);
          return (
            <g key={fraction} stroke="#1A5173" strokeWidth="1.8" fill="none">
              <line x1={damLeftX - arrowLength} y1={arrowY} x2={damLeftX - 3} y2={arrowY} />
              <polyline points={`${damLeftX - 9},${arrowY - 3} ${damLeftX - 2},${arrowY} ${damLeftX - 9},${arrowY + 3}`} fill="#1A5173" />
            </g>
          );
        })}

        {/* Weight & Resultant Vectors */}
        <g stroke="#8B3A1C" strokeWidth="2.2" fill="#8B3A1C">
          <line x1={damLeftX + baseWidthPx * 0.42} y1={crestY + damHeightPx * 0.3} x2={damLeftX + baseWidthPx * 0.42} y2={crestY + damHeightPx * 0.85} />
          <polygon points={`${damLeftX + baseWidthPx * 0.42 - 4},${crestY + damHeightPx * 0.85 - 2} ${damLeftX + baseWidthPx * 0.42},${crestY + damHeightPx * 0.85 + 7} ${damLeftX + baseWidthPx * 0.42 + 4},${crestY + damHeightPx * 0.85 - 2}`} />
          <text x={damLeftX + baseWidthPx * 0.42 + 8} y={crestY + damHeightPx * 0.58} fill="#8B3A1C" fontSize="10" fontWeight="bold">Weight $W$</text>
        </g>

        {/* Sluice / Intake Conduit */}
        <rect x={damLeftX} y={groundY - 18} width={baseWidthPx} height="14" fill="#241B12" />
        <rect x={damLeftX + 5} y={groundY - 15} width={baseWidthPx - 10} height="8" fill="#4B90B0" opacity="0.65" />

        {/* Labels */}
        <text x="30" y={waterLevelY - 12} fill="#184869" fontSize="12" fontWeight="bold">Deep Reservoir Basin</text>
        <text x="30" y={waterLevelY + 16} fill="#1C5378" fontSize="10">Thrust head: {waterHead.toFixed(1)}m</text>
        <text x={damLeftX + 15} y={crestY - 10} fill="#3B2E22" fontSize="11" fontWeight="bold">Masonry Gravity Wall ({damHeight.toFixed(0)}m)</text>
        <text x={damRightX + 15} y={crestY + 65} fill="#4A3F33" fontSize="10">{isRoman ? 'Roman Exterior Buttresses' : 'Stepped Downstream Batter'}</text>
        <text x={damLeftX + 35} y={groundY + 38} fill="#3D342C" fontSize="9" fontWeight="bold">Foundation Shear Key into Bedrock</text>
        <text x="25" y={groundY + 28} fill="#6E6256" fontSize="10">Solid Rock Strata</text>
      </svg>
    );
  }

  // -------------------------------------------------------------
  // 4. RESERVOIR / CISTERN TANK (Dholavira / Sringaverapura)
  // -------------------------------------------------------------
  if (kind === 'RESERVOIR_TANK') {
    const basinDepth = Math.max(3, Math.min(14, values.basinDepth || values.height));
    const basinDepthPx = basinDepth * 14;
    const basinBottomY = Math.min(270, 110 + basinDepthPx);
    const waterLevel = Math.max(0.5, values.upstreamLevel);
    const waterY = Math.max(115, basinBottomY - waterLevel * 14);

    return (
      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="mx-auto block w-full max-w-[800px] h-auto select-none">
        {defs}
        {/* Natural Bedrock Terrain */}
        <rect x="0" y="90" width={svgWidth} height={svgHeight - 90} fill="#C7BAA9" />

        {/* Excavated Stepped Basin Cutout */}
        <polygon
          points={`
            160,90
            180,120
            205,120
            225,150
            250,150
            270,180
            290,180
            305,${basinBottomY}
            580,${basinBottomY}
            595,180
            615,180
            635,150
            660,150
            680,120
            705,120
            725,90
            ${svgWidth},90
            ${svgWidth},${svgHeight}
            0,${svgHeight}
            0,90
          `}
          fill="#857769"
        />

        {/* Stored Water Pool */}
        <polygon
          points={`
            240,${waterY}
            305,${basinBottomY}
            580,${basinBottomY}
            645,${waterY}
          `}
          fill="url(#schematicWater)"
        />

        {/* Upstream Desilting Chamber / Inlet Flume */}
        <rect x="15" y="65" width="130" height="45" fill="url(#dressedMasonry)" stroke="#453B32" strokeWidth="1.5" />
        <rect x="22" y="72" width="116" height="32" fill="#5892B3" opacity="0.8" />
        <path d="M 0 85 L 140 85" stroke="#D1EDFB" strokeWidth="3" />
        <circle cx="50" cy="98" r="2.5" fill="#42352A" />
        <circle cx="75" cy="100" r="3" fill="#42352A" />
        <circle cx="105" cy="97" r="2.8" fill="#42352A" />
        <text x="25" y="60" fill="#8B3A1C" fontSize="10" fontWeight="bold">Inlet Vortex Desilting Chamber</text>
        <text x="25" y="103" fill="#E8F4FA" fontSize="8">Silt Particles Settling</text>

        {/* Masonry Steps Lining the Basin */}
        <path
          d={`
            M 160 90 L 180 120 L 205 120 L 225 150 L 250 150 L 270 180 L 290 180 L 305 ${basinBottomY}
            L 580 ${basinBottomY} L 595 180 L 615 180 L 635 150 L 660 150 L 680 120 L 705 120 L 725 90
          `}
          fill="none"
          stroke="url(#dressedMasonry)"
          strokeWidth="14"
          strokeLinejoin="round"
        />

        {/* Subterranean Sluice Conduit */}
        <rect x="575" y={basinBottomY - 14} width="145" height="12" fill="#241B13" rx="2" />
        <rect x="580" y={basinBottomY - 12} width="135" height="8" fill="#539ABF" opacity="0.75" />

        {/* Labels */}
        <text x="360" y={waterY - 14} fill="#184869" fontSize="13" fontWeight="bold">Main Retaining Storage Basin</text>
        <text x="360" y={waterY + 18} fill="#E9F5FB" fontSize="11" fontWeight="bold">Filtered Potable Storage ({waterLevel.toFixed(1)}m Depth)</text>
        <text x="180" y="185" fill="#3D3227" fontSize="10" fontWeight="bold">31 Stone Access Flights</text>
        <text x="590" y={basinBottomY - 20} fill="#8B3A1C" fontSize="9" fontWeight="bold">Subterranean Sluice Portal</text>
        <text x="380" y={basinBottomY + 22} fill="#FBF8F4" fontSize="10">Chiseled Sedimentary Bedrock Terraces</text>
      </svg>
    );
  }

  // -------------------------------------------------------------
  // 5. QANAT (Ancient Persian Qanat of Gonabad / Turpan Karez)
  // -------------------------------------------------------------
  if (kind === 'QANAT') {
    const slope = Math.max(0.0005, values.slope || 0.0012);
    const shafts = [100, 210, 320, 430, 540, 640];

    return (
      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="mx-auto block w-full max-w-[800px] h-auto select-none">
        {defs}
        {/* Mountain Slope & Desert Plain Soil */}
        <polygon
          points={`
            0,70
            180,105
            450,155
            ${svgWidth},195
            ${svgWidth},${svgHeight}
            0,${svgHeight}
          `}
          fill="#C4B7A6"
        />
        <path d={`M 0 70 Q 220 115 ${svgWidth} 195`} stroke="#8C7D6D" strokeWidth="2.5" fill="none" />

        {/* Mountain Foothill Aquifer Water Table */}
        <polygon
          points={`
            0,120
            160,140
            400,185
            ${svgWidth},215
            ${svgWidth},${svgHeight}
            0,${svgHeight}
          `}
          fill="url(#aquiferGradient)"
        />
        <path d={`M 0 120 Q 200 145 ${svgWidth} 215`} stroke="#2B6B91" strokeWidth="2" strokeDasharray="6 3" fill="none" />

        {/* Sloping Subterranean Gravity Tunnel Gallery (Kūrah) */}
        <path
          d={`M 40 185 C 200 195 450 208 ${svgWidth - 60} 220`}
          fill="none"
          stroke="#423428"
          strokeWidth="28"
          strokeLinecap="round"
        />
        {/* Flowing Water Stream inside Tunnel */}
        <path
          d={`M 40 189 C 200 199 450 212 ${svgWidth - 60} 224`}
          fill="none"
          stroke="#5EA7CC"
          strokeWidth="12"
          strokeLinecap="round"
        />

        {/* Vertical Shafts (Chāh) with Surface Rings */}
        {shafts.map((shaftX, index) => {
          const surfaceY = 70 + (shaftX / svgWidth) * 125;
          const tunnelY = 185 + (shaftX / svgWidth) * 35;
          const isMotherWell = index === 0;

          return (
            <g key={shaftX}>
              {/* Surface spoil ring collar */}
              <ellipse cx={shaftX} cy={surfaceY - 2} rx="12" ry="5" fill="#8F7E6D" stroke="#5E4F40" strokeWidth="1.2" />
              {/* Vertical Shaft */}
              <line x1={shaftX} y1={surfaceY} x2={shaftX} y2={tunnelY - 10} stroke="#423428" strokeWidth="14" />
              <line x1={shaftX} y1={surfaceY} x2={shaftX} y2={tunnelY - 10} stroke="#2E231A" strokeWidth="10" />
              {/* Shaft Label */}
              <text x={shaftX - 16} y={surfaceY - 12} fill="#5C4533" fontSize="9" fontWeight="bold">
                {isMotherWell ? 'Mādar-chāh (300m)' : `Shaft #${index + 1}`}
              </text>
            </g>
          );
        })}

        {/* Daylight Outlet (Mazhar) & Surface Canals */}
        <polygon
          points={`
            ${svgWidth - 60},210
            ${svgWidth},205
            ${svgWidth},235
            ${svgWidth - 60},230
          `}
          fill="#4D96BC"
          stroke="#276487"
          strokeWidth="1.5"
        />

        {/* Technical Callouts */}
        <text x="25" y="45" fill="#1A4A6B" fontSize="12" fontWeight="bold">Mountain Alluvial Aquifer (Water Table)</text>
        <text x="25" y="60" fill="#2E5C7D" fontSize="10">Unconfined mountain recharge zone</text>
        <text x="260" y="235" fill="#FFFBF5" fontSize="11" fontWeight="bold">Underground Gallery Gradient $S$ = {(slope * 100).toFixed(3)}%</text>
        <text x={svgWidth - 145} y="180" fill="#1C5378" fontSize="11" fontWeight="bold">Daylight Outlet (*mazhar*)</text>
        <text x={svgWidth - 145} y="195" fill="#2E658C" fontSize="9">Zero-evaporation desert conveyance</text>
      </svg>
    );
  }

  // -------------------------------------------------------------
  // 6. STEPWELL (Chand Baori / Rani ki Vav)
  // -------------------------------------------------------------
  if (kind === 'STEPWELL') {
    const tiers = Math.max(5, Math.min(13, values.tiers || 13));
    const tierStepY = 160 / tiers;
    const tierStepX = 140 / tiers;

    const waterY = Math.max(120, 240 - (values.upstreamLevel / 30) * 120);

    return (
      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="mx-auto block w-full max-w-[800px] h-auto select-none">
        {defs}
        {/* Soil Surroundings */}
        <rect x="0" y="60" width={svgWidth} height={svgHeight - 60} fill="#BDB09E" />

        {/* Stepped Inverted Pyramid Cutout */}
        <polygon
          points={`
            60,60
            ${60 + tiers * tierStepX},${60 + tiers * tierStepY}
            ${svgWidth - 220 - tiers * tierStepX},${60 + tiers * tierStepY}
            ${svgWidth - 220},60
            ${svgWidth},60
            ${svgWidth},${svgHeight}
            0,${svgHeight}
            0,60
          `}
          fill="#807262"
        />

        {/* Deep Water Pool */}
        <polygon
          points={`
            160,${waterY}
            260,240
            400,240
            500,${waterY}
          `}
          fill="url(#schematicWater)"
        />

        {/* Stepped Tiers (Left Side) */}
        {Array.from({ length: tiers }).map((_, i) => {
          const stepX = 60 + i * tierStepX;
          const stepY = 60 + i * tierStepY;
          return (
            <rect
              key={`left-${i}`}
              x={stepX}
              y={stepY}
              width={tierStepX * 1.5}
              height={tierStepY}
              fill="url(#dressedMasonry)"
              stroke="#4D4236"
              strokeWidth="0.8"
            />
          );
        })}

        {/* Stepped Tiers (Right Side) */}
        {Array.from({ length: tiers }).map((_, i) => {
          const stepX = svgWidth - 220 - (i + 1) * tierStepX;
          const stepY = 60 + i * tierStepY;
          return (
            <rect
              key={`right-${i}`}
              x={stepX}
              y={stepY}
              width={tierStepX * 1.5}
              height={tierStepY}
              fill="url(#dressedMasonry)"
              stroke="#4D4236"
              strokeWidth="0.8"
            />
          );
        })}

        {/* Multi-Storey Columned Royal Pavilion (Far Right) */}
        <g>
          <rect x={svgWidth - 190} y="60" width="160" height="180" fill="url(#dressedMasonry)" stroke="#4A3D31" strokeWidth="1.5" />
          {[75, 115, 155, 195].map((archY) => (
            <g key={archY}>
              <rect x={svgWidth - 175} y={archY} width="35" height="30" fill="#241B12" rx="4" />
              <rect x={svgWidth - 125} y={archY} width="35" height="30" fill="#241B12" rx="4" />
              <rect x={svgWidth - 75} y={archY} width="35" height="30" fill="#241B12" rx="4" />
            </g>
          ))}
          <text x={svgWidth - 165} y="50" fill="#8B3A1C" fontSize="10" fontWeight="bold">Carved Arcaded Pavilions</text>
        </g>

        {/* Water Table Indicators */}
        <line x1="0" y1="130" x2={svgWidth - 220} y2="130" stroke="#3782AB" strokeWidth="1.8" strokeDasharray="5 3" />
        <text x="15" y="125" fill="#1C5578" fontSize="9" fontWeight="bold">Post-Monsoon High Water Level</text>
        <line x1="0" y1="210" x2={svgWidth - 220} y2="210" stroke="#1D4E6E" strokeWidth="1.8" strokeDasharray="5 3" />
        <text x="15" y="205" fill="#163F5C" fontSize="9" fontWeight="bold">Dry-Season Summer Water Level</text>

        {/* Labels */}
        <text x="240" y="45" fill="#2E241B" fontSize="12" fontWeight="bold">Chand Baori 13-Tier Geometric Stairwell</text>
        <text x="260" y={waterY + 24} fill="#FFFBF5" fontSize="11" fontWeight="bold">Groundwater Sump ({values.upstreamLevel}m depth)</text>
        <text x="260" y="265" fill="#E8DEC8" fontSize="10">Deep Alluvial Aquifer Direct Infiltration</text>
      </svg>
    );
  }

  // Fallback schematic
  return (
    <div className="p-8 text-center text-xs text-[#7A6D5E]">
      Visual cross-section generated for {structure.name} ({structure.kind})
    </div>
  );
};
