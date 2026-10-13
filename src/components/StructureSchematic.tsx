import React from 'react';
import { SimulationStructure, SimulationValues } from '../data/ancientStructureSimulationData.ts';
import { HydraulicCalculationResult, SimulationCategory } from '../services/hydraulics/types.ts';

interface StructureSchematicProps {
  category?: SimulationCategory;
  structure: SimulationStructure;
  values: SimulationValues;
  calculationResult?: HydraulicCalculationResult;
}

export const StructureSchematic: React.FC<StructureSchematicProps> = ({
  category,
  structure,
  values,
  calculationResult,
}) => {
  // Infer active category if not explicitly provided
  const activeCategory: SimulationCategory =
    category ||
    (structure.kind === 'CANAL'
      ? 'CHANNELS_CANALS'
      : structure.kind === 'DIVERSION_WEIR'
      ? 'DIVERSION_WEIRS'
      : structure.kind === 'MASONRY_DAM' || structure.kind === 'GRAVITY_DAM' || structure.kind === 'EMBANKMENT_DAM'
      ? 'DAMS_EMBANKMENTS'
      : structure.kind === 'RESERVOIR_TANK' || structure.kind === 'STEPWELL'
      ? 'RESERVOIRS_TANKS'
      : structure.kind === 'QANAT'
      ? 'CHANNELS_CANALS'
      : 'DAMS_EMBANKMENTS');

  const svgWidth = 760;
  const svgHeight = 310;
  const groundY = 230;

  // Visual patterns and gradients
  const defs = (
    <defs>
      {/* Water Gradients */}
      <linearGradient id="schematicWater" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#76B5D7" stopOpacity="0.88" />
        <stop offset="60%" stopColor="#438DB8" stopOpacity="0.94" />
        <stop offset="100%" stopColor="#25597E" stopOpacity="0.98" />
      </linearGradient>
      <linearGradient id="aeratedWater" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#D8F3FE" stopOpacity="0.95" />
        <stop offset="100%" stopColor="#67B1D8" stopOpacity="0.85" />
      </linearGradient>
      <linearGradient id="overtoppingSheet" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#E2F5FE" stopOpacity="0.95" />
        <stop offset="50%" stopColor="#89CBED" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#317BA8" stopOpacity="0.95" />
      </linearGradient>

      {/* Material Patterns */}
      <pattern id="dressedMasonry" width="24" height="14" patternUnits="userSpaceOnUse">
        <rect width="23" height="6.5" fill="#8C8176" stroke="#665D54" strokeWidth="0.6" rx="0.5" />
        <rect x="12" y="7" width="23" height="6.5" fill="#82776C" stroke="#665D54" strokeWidth="0.6" rx="0.5" />
        <rect x="-12" y="7" width="23" height="6.5" fill="#82776C" stroke="#665D54" strokeWidth="0.6" rx="0.5" />
      </pattern>
      <pattern id="boulderSand" width="20" height="20" patternUnits="userSpaceOnUse">
        <circle cx="6" cy="6" r="4.5" fill="#695E54" stroke="#4F453C" strokeWidth="0.8" />
        <circle cx="16" cy="15" r="3.5" fill="#756A60" stroke="#4F453C" strokeWidth="0.8" />
        <circle cx="15" cy="4" r="2.5" fill="#5E534A" />
        <circle cx="4" cy="16" r="2.8" fill="#5E534A" />
      </pattern>
      <pattern id="compactedClay" width="12" height="12" patternUnits="userSpaceOnUse">
        <path d="M0 12 L12 0 M-3 3 L3 -3 M9 15 L15 9" stroke="#9E764B" strokeWidth="1.2" opacity="0.8" />
        <rect width="12" height="12" fill="#B38758" opacity="0.4" />
      </pattern>
      <pattern id="earthenRiprap" width="16" height="16" patternUnits="userSpaceOnUse">
        <path d="M0 16 L16 0 M-4 4 L4 -4 M12 20 L20 12" stroke="#8E7761" strokeWidth="1" />
        <circle cx="8" cy="8" r="2.5" fill="#6E5C4A" opacity="0.6" />
      </pattern>
      <pattern id="corbelledBrick" width="16" height="10" patternUnits="userSpaceOnUse">
        <rect width="15" height="4.5" fill="#A85741" stroke="#783424" strokeWidth="0.6" rx="0.5" />
        <rect x="8" y="5" width="15" height="4.5" fill="#984733" stroke="#783424" strokeWidth="0.6" rx="0.5" />
        <rect x="-8" y="5" width="15" height="4.5" fill="#984733" stroke="#783424" strokeWidth="0.6" rx="0.5" />
      </pattern>
    </defs>
  );

  // -------------------------------------------------------------
  // 1. OPEN CHANNELS & CANALS CROSS-SECTION
  // -------------------------------------------------------------
  if (activeCategory === 'CHANNELS_CANALS') {
    const bankH = Math.max(1.0, values.height || 2.5);
    const bottomW = Math.max(1.0, values.width || 4.0);
    const sideZ = Math.max(0, values.slope || 1.5);
    const flowY = Math.max(0.1, calculationResult?.schematicData.upstreamDepthM ?? values.upstreamLevel ?? 1.5);

    const scale = Math.min(32, 140 / bankH);
    const bankHPx = bankH * scale;
    const flowYPx = flowY * scale;
    const bottomWPx = Math.max(60, Math.min(220, bottomW * scale * 0.7));

    const cx = svgWidth / 2;
    const bedY = groundY - 20;
    const bankTopY = bedY - bankHPx;
    const waterSurfaceY = bedY - flowYPx;
    const isOvertopping = flowY > bankH;

    const bLeft = cx - bottomWPx / 2;
    const bRight = cx + bottomWPx / 2;
    const topSpread = sideZ * bankHPx * 0.7;
    const bankLeftX = bLeft - topSpread;
    const bankRightX = bRight + topSpread;

    const waterSpread = sideZ * flowYPx * 0.7;
    const wLeftX = isOvertopping ? bankLeftX - 40 : bLeft - waterSpread;
    const wRightX = isOvertopping ? bankRightX + 40 : bRight + waterSpread;

    return (
      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="mx-auto block w-full max-w-[800px] h-auto select-none">
        {defs}
        {/* Native Soil Surrounding Canal */}
        <rect x="0" y={bankTopY} width={svgWidth} height={svgHeight - bankTopY} fill="#D8CEBF" />
        <line x1="0" y1={bankTopY} x2={svgWidth} y2={bankTopY} stroke="#7D7061" strokeWidth="1.5" />

        {/* Trapezoidal Excavated Canal Cut */}
        <path
          d={`M ${bankLeftX - 60} ${bankTopY} L ${bankLeftX} ${bankTopY} L ${bLeft} ${bedY} L ${bRight} ${bedY} L ${bankRightX} ${bankTopY} L ${bankRightX + 60} ${bankTopY} L ${bankRightX + 60} ${svgHeight} L ${bankLeftX - 60} ${svgHeight} Z`}
          fill="#C4B7A5"
          stroke="#5C5042"
          strokeWidth="2"
        />

        {/* Canal Lining Riprap / Paving */}
        <path
          d={`M ${bankLeftX} ${bankTopY} L ${bLeft} ${bedY} L ${bRight} ${bedY} L ${bankRightX} ${bankTopY}`}
          fill="none"
          stroke="url(#dressedMasonry)"
          strokeWidth="10"
        />

        {/* Flowing Water Body */}
        <path
          d={`M ${wLeftX} ${waterSurfaceY} L ${bLeft} ${bedY} L ${bRight} ${bedY} L ${wRightX} ${waterSurfaceY} Z`}
          fill="url(#schematicWater)"
          stroke="#4FA1CE"
          strokeWidth="1.5"
        />

        {/* Overtopping Spill Sheet if Depth > Bank */}
        {isOvertopping && (
          <path
            d={`M ${bankLeftX - 80} ${waterSurfaceY} L ${bankRightX + 80} ${waterSurfaceY} L ${bankRightX} ${bankTopY} L ${bankLeftX} ${bankTopY} Z`}
            fill="url(#overtoppingSheet)"
            stroke="#C0392B"
            strokeWidth="2"
            strokeDasharray="4 2"
          />
        )}

        {/* Freeboard Vertical Indicator */}
        {!isOvertopping && (
          <g stroke="#8B3A1C" strokeWidth="1.2">
            <line x1={bankRightX + 15} y1={waterSurfaceY} x2={bankRightX + 15} y2={bankTopY} />
            <line x1={bankRightX + 10} y1={waterSurfaceY} x2={bankRightX + 20} y2={waterSurfaceY} />
            <line x1={bankRightX + 10} y1={bankTopY} x2={bankRightX + 20} y2={bankTopY} />
            <text x={bankRightX + 25} y={(waterSurfaceY + bankTopY) / 2 + 4} fill="#8B3A1C" fontSize="10" fontFamily="monospace" fontWeight="bold">
              FB: {(bankH - flowY).toFixed(2)}m
            </text>
          </g>
        )}

        {/* Dimension Labels */}
        <text x={cx} y={bedY + 16} textAnchor="middle" fill="#3D3227" fontSize="11" fontFamily="sans-serif" fontWeight="bold">
          Bed Width b = {bottomW.toFixed(1)} m
        </text>
        <text x={cx} y={waterSurfaceY - 8} textAnchor="middle" fill="#1A5276" fontSize="11" fontFamily="sans-serif" fontWeight="bold">
          Flow Depth y = {flowY.toFixed(2)} m · V = {(calculationResult?.schematicData.waterVelocityMs || 1.2).toFixed(2)} m/s
        </text>
        <text x={cx} y={bankTopY - 8} textAnchor="middle" fill="#5D4C3D" fontSize="10" fontFamily="sans-serif">
          Bank Height H = {bankH.toFixed(2)} m (Side Slope 1:{sideZ.toFixed(1)})
        </text>
      </svg>
    );
  }

  // -------------------------------------------------------------
  // 2. DIVERSION WEIR / ANICUT
  // -------------------------------------------------------------
  if (activeCategory === 'DIVERSION_WEIRS') {
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
        <path d={`M0 ${usWaterY} L${weirLeftX} ${usWaterY} L${weirLeftX} ${groundY} L0 ${groundY} Z`} fill="url(#schematicWater)" />

        {/* Downstream Channel Water & Tailwater */}
        <path d={`M${weirRightX + 60} ${dsWaterY} L${svgWidth} ${dsWaterY} L${svgWidth} ${groundY} L${weirRightX + 60} ${groundY} Z`} fill="url(#schematicWater)" />

        {/* Sinking Boulders Foundation Bed under Weir */}
        <rect x={weirLeftX - 35} y={groundY} width={weirWidthPx + 110} height="55" fill="url(#boulderSand)" stroke="#4D4238" strokeWidth="1.5" rx="3" />

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

        {/* Flow Arrows */}
        <g stroke="#E8F4FA" strokeWidth="2.5" fill="none" opacity="0.9">
          <path d="M 60 160 L 130 160 M 120 154 L 130 160 L 120 166" />
          <path d={`M ${weirRightX + 70} ${dsWaterY + 15} L ${weirRightX + 140} ${dsWaterY + 15} M ${weirRightX + 130} ${dsWaterY + 9} L ${weirRightX + 140} ${dsWaterY + 15} L ${weirRightX + 130} ${dsWaterY + 21}`} />
        </g>

        {/* Annotations */}
        <text x="20" y="30" fill="#241B12" fontSize="13" fontFamily="serif" fontWeight="bold">
          {structure.name} — Overflow Weir & Hydraulic Jump
        </text>
        <text x="20" y={usWaterY - 8} fill="#1D4E75" fontSize="11" fontFamily="sans-serif" fontWeight="bold">
          Upstream Head H₁ = {usHead.toFixed(2)} m
        </text>
        <text x={svgWidth - 180} y={dsWaterY - 8} fill="#1D4E75" fontSize="11" fontFamily="sans-serif" fontWeight="bold">
          Tailwater H₂ = {dsHead.toFixed(2)} m
        </text>
      </svg>
    );
  }

  // -------------------------------------------------------------
  // 3. DAMS & EMBANKMENTS
  // -------------------------------------------------------------
  if (activeCategory === 'DAMS_EMBANKMENTS') {
    const damH = Math.max(3, values.height || 12);
    const damHPx = Math.min(150, damH * 10);
    const damTopY = groundY - damHPx;
    const crestWPx = Math.max(25, (values.width || 6) * 4);

    const uSlope = Math.max(1.5, values.slope || 2.5);
    const dSlope = 2.0;
    const uSpreadPx = damHPx * (uSlope / 1.5);
    const dSpreadPx = damHPx * (dSlope / 1.5);

    const damLeftX = 380 - crestWPx / 2 - uSpreadPx;
    const damCrestLeftX = 380 - crestWPx / 2;
    const damCrestRightX = 380 + crestWPx / 2;
    const damRightX = 380 + crestWPx / 2 + dSpreadPx;

    const waterH = Math.max(0.5, values.upstreamLevel || 9.5);
    const waterHPx = Math.min(damHPx + 20, waterH * (damHPx / damH));
    const waterY = groundY - waterHPx;
    const isOvertopping = waterH > damH;

    return (
      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="mx-auto block w-full max-w-[800px] h-auto select-none">
        {defs}
        {/* Foundation Stratum */}
        <rect x="0" y={groundY} width={svgWidth} height={svgHeight - groundY} fill="#D0C4B4" />
        <line x1="0" y1={groundY} x2={svgWidth} y2={groundY} stroke="#7D7061" strokeWidth="2" />

        {/* Upstream Reservoir Water */}
        <path d={`M 0 ${waterY} L ${damLeftX + (groundY - waterY) * (uSpreadPx / damHPx)} ${waterY} L ${damLeftX} ${groundY} L 0 ${groundY} Z`} fill="url(#schematicWater)" />

        {/* Embankment Shoulders */}
        <path d={`M ${damLeftX} ${groundY} L ${damCrestLeftX} ${damTopY} L ${damCrestRightX} ${damTopY} L ${damRightX} ${groundY} Z`} fill="url(#earthenRiprap)" stroke="#524336" strokeWidth="2" />

        {/* Impervious Puddle Clay Core (Bhal) */}
        <path
          d={`M ${380 - crestWPx * 0.7} ${groundY} L ${380 - crestWPx * 0.3} ${damTopY + 10} L ${380 + crestWPx * 0.3} ${damTopY + 10} L ${380 + crestWPx * 0.7} ${groundY} Z`}
          fill="url(#compactedClay)"
          stroke="#7A5328"
          strokeWidth="1.5"
        />

        {/* Deep Cutoff Key Trench */}
        <rect x={380 - 15} y={groundY} width="30" height="28" fill="url(#compactedClay)" stroke="#7A5328" strokeWidth="1.5" />

        {/* Overtopping Spill Sheet if Modeled */}
        {isOvertopping && (
          <path
            d={`M ${damCrestLeftX - 30} ${waterY} L ${damCrestRightX + 10} ${waterY} L ${damRightX + 40} ${groundY} L ${damRightX} ${groundY} L ${damCrestRightX} ${damTopY} L ${damCrestLeftX} ${damTopY} Z`}
            fill="url(#overtoppingSheet)"
            stroke="#C0392B"
            strokeWidth="2.5"
            strokeDasharray="5 2"
          />
        )}

        {/* Freeboard Indicator */}
        {!isOvertopping && (
          <g stroke="#8B3A1C" strokeWidth="1.2">
            <line x1={damCrestLeftX - 12} y1={waterY} x2={damCrestLeftX - 12} y2={damTopY} />
            <line x1={damCrestLeftX - 18} y1={waterY} x2={damCrestLeftX - 6} y2={waterY} />
            <line x1={damCrestLeftX - 18} y1={damTopY} x2={damCrestLeftX - 6} y2={damTopY} />
            <text x={damCrestLeftX - 22} y={(waterY + damTopY) / 2 + 4} textAnchor="end" fill="#8B3A1C" fontSize="10" fontFamily="monospace" fontWeight="bold">
              FB: {(damH - waterH).toFixed(2)}m
            </text>
          </g>
        )}

        {/* Hydrostatic Force Vector Arrow */}
        <g stroke="#C0392B" strokeWidth="2.5" fill="#C0392B">
          <line x1={damLeftX - 45} y1={groundY - waterHPx / 3} x2={damLeftX + 15} y2={groundY - waterHPx / 3} />
          <polygon points={`${damLeftX + 15},${groundY - waterHPx / 3} ${damLeftX},${groundY - waterHPx / 3 - 5} ${damLeftX},${groundY - waterHPx / 3 + 5}`} />
          <text x={damLeftX - 50} y={groundY - waterHPx / 3 - 8} textAnchor="end" fill="#C0392B" fontSize="10" fontFamily="sans-serif" fontWeight="bold">
            Thrust P = {(calculationResult?.metrics.find((m) => m.symbol === 'P')?.value || '49 MN')}
          </text>
        </g>

        {/* Annotations */}
        <text x="20" y="30" fill="#241B12" fontSize="13" fontFamily="serif" fontWeight="bold">
          {structure.name} — Embankment Limit Equilibrium
        </text>
        <text x="20" y={waterY - 8} fill="#1D4E75" fontSize="11" fontFamily="sans-serif" fontWeight="bold">
          Reservoir Head H_w = {waterH.toFixed(2)} m
        </text>
        <text x={damCrestRightX + 25} y={damTopY - 6} fill="#3D3024" fontSize="10" fontFamily="sans-serif">
          Crest Height H = {damH.toFixed(1)} m
        </text>
      </svg>
    );
  }

  // -------------------------------------------------------------
  // 4. DRAINAGE & SEWERAGE SYSTEMS
  // -------------------------------------------------------------
  if (activeCategory === 'DRAINAGE_SYSTEMS') {
    const dVal = Math.max(0.4, values.pipeDiameter || values.height || 1.2);
    const scale = Math.min(65, 140 / dVal);
    const dPx = dVal * scale;
    const cx = svgWidth / 2;
    const cy = groundY - dPx / 2 - 20;

    const flowDepth = Math.max(0.05, calculationResult?.schematicData.upstreamDepthM ?? values.upstreamLevel ?? 0.6);
    const flowDPx = Math.min(dPx, flowDepth * scale);
    const isSurcharged = flowDepth >= dVal;

    return (
      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="mx-auto block w-full max-w-[800px] h-auto select-none">
        {defs}
        {/* Ancient Street Pavement Level */}
        <rect x="0" y={40} width={svgWidth} height={svgHeight - 40} fill="#D4C9BA" />
        <rect x="0" y={40} width={svgWidth} height="20" fill="url(#dressedMasonry)" />
        <text x="25" y="32" fill="#3D3227" fontSize="12" fontFamily="serif" fontWeight="bold">
          Mohenjo-daro / Roman Ancient Urban Street Level
        </text>

        {/* Vertical Street Access Manhole / Chute */}
        <rect x={cx - 30} y={60} width="60" height={cy - dPx / 2 - 60} fill="#B5A795" stroke="#635445" strokeWidth="2" />

        {/* Corbelled Brick Vault Exterior */}
        <rect x={cx - dPx / 2 - 16} y={cy - dPx / 2 - 16} width={dPx + 32} height={dPx + 32} fill="url(#corbelledBrick)" stroke="#542B20" strokeWidth="2" rx="4" />

        {/* Drain Conduit Void */}
        <rect x={cx - dPx / 2} y={cy - dPx / 2} width={dPx} height={dPx} fill="#2B241C" stroke="#3D3226" strokeWidth="2" />

        {/* Effluent / Storm Water Flow Level */}
        <rect x={cx - dPx / 2} y={cy + dPx / 2 - flowDPx} width={dPx} height={flowDPx} fill="url(#schematicWater)" />

        {/* Street Ponding Spill if Surcharged */}
        {isSurcharged && (
          <g>
            <rect x={cx - 140} y={40} width="280" height="15" fill="url(#overtoppingSheet)" stroke="#C0392B" strokeWidth="1.5" />
            <text x={cx} y={28} textAnchor="middle" fill="#C0392B" fontSize="11" fontFamily="sans-serif" fontWeight="bold">
              ⚠️ STREET INUNDATION / BACKWATER SURCHARGE
            </text>
          </g>
        )}

        {/* Annotations */}
        <text x={cx + dPx / 2 + 25} y={cy} fill="#1D4E75" fontSize="11" fontFamily="sans-serif" fontWeight="bold">
          Flow Depth: {flowDepth.toFixed(2)} m
        </text>
        <text x={cx + dPx / 2 + 25} y={cy + 18} fill="#695847" fontSize="10" fontFamily="sans-serif">
          Vault Span: {dVal.toFixed(2)} m
        </text>
      </svg>
    );
  }

  // -------------------------------------------------------------
  // 5. SLUICES, GATES & OUTLETS
  // -------------------------------------------------------------
  if (activeCategory === 'SLUICES_OUTLETS') {
    const hHead = Math.max(1.5, values.upstreamLevel || 4.5);
    const gateW = Math.max(0.1, values.gateOpening || 0.6);
    const headwallH = Math.max(hHead + 1.0, values.height || 6.0);

    const scale = 25;
    const hHeadPx = hHead * scale;
    const headwallHPx = Math.min(170, headwallH * scale);
    const wallY = groundY - headwallHPx;
    const waterY = groundY - hHeadPx;

    const gateOpeningPx = Math.max(12, gateW * scale);
    const wallLeftX = 330;
    const wallRightX = 370;

    return (
      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="mx-auto block w-full max-w-[800px] h-auto select-none">
        {defs}
        {/* Bed Level & Foundation */}
        <rect x="0" y={groundY} width={svgWidth} height={svgHeight - groundY} fill="#D4C9BA" />
        <line x1="0" y1={groundY} x2={svgWidth} y2={groundY} stroke="#756758" strokeWidth="2" />

        {/* Upstream Deep Reservoir Water Sump */}
        <rect x="0" y={waterY} width={wallLeftX} height={groundY - waterY} fill="url(#schematicWater)" />

        {/* Masonry Sluice Headwall Pier */}
        <rect x={wallLeftX} y={wallY} width="40" height={headwallHPx} fill="url(#dressedMasonry)" stroke="#4A3F33" strokeWidth="2" />

        {/* Vertical Timber/Iron Sluice Gate Shutter Plate */}
        <rect x={wallLeftX + 14} y={wallY - 20} width="12" height={headwallHPx - gateOpeningPx} fill="#2E241B" stroke="#120E0A" strokeWidth="1.5" />
        <rect x={wallLeftX + 18} y={wallY - 45} width="4" height="25" fill="#5E4A38" />

        {/* Sluice Opening Orifice Void */}
        <rect x={wallLeftX} y={groundY - gateOpeningPx} width="40" height={gateOpeningPx} fill="#14100C" />

        {/* High-Velocity Torricelli Exit Jet */}
        <path
          d={`M ${wallRightX} ${groundY - gateOpeningPx} Q ${wallRightX + 80} ${groundY - gateOpeningPx * 0.7} ${wallRightX + 180} ${groundY - 14} L ${wallRightX + 180} ${groundY} L ${wallRightX} ${groundY} Z`}
          fill="url(#aeratedWater)"
          stroke="#4CA0CD"
          strokeWidth="1.5"
        />

        {/* Downstream Stilling Pool */}
        <rect x={wallRightX + 180} y={groundY - 24} width={svgWidth - (wallRightX + 180)} height="24" fill="url(#schematicWater)" opacity="0.85" />

        {/* Jet Velocity Arrow Vector */}
        <g stroke="#C0392B" strokeWidth="2.5" fill="#C0392B">
          <line x1={wallRightX + 25} y1={groundY - gateOpeningPx / 2} x2={wallRightX + 110} y2={groundY - gateOpeningPx / 2} />
          <polygon points={`${wallRightX + 110},${groundY - gateOpeningPx / 2} ${wallRightX + 98},${groundY - gateOpeningPx / 2 - 5} ${wallRightX + 98},${groundY - gateOpeningPx / 2 + 5}`} />
          <text x={wallRightX + 120} y={groundY - gateOpeningPx / 2 + 4} fill="#C0392B" fontSize="10" fontFamily="sans-serif" fontWeight="bold">
            v = {(calculationResult?.metrics.find((m) => m.symbol === 'V_exit')?.value || '9.6 m/s')}
          </text>
        </g>

        {/* Annotations */}
        <text x="25" y="32" fill="#241B12" fontSize="13" fontFamily="serif" fontWeight="bold">
          {structure.name} — Scouring Sluice Gate Orifice Efflux
        </text>
        <text x="25" y={waterY - 8} fill="#1D4E75" fontSize="11" fontFamily="sans-serif" fontWeight="bold">
          Sump Head H = {hHead.toFixed(2)} m
        </text>
        <text x={wallRightX + 15} y={wallY + 15} fill="#5E4E3F" fontSize="10" fontFamily="sans-serif">
          Gate Aperture w = {gateW.toFixed(2)} m
        </text>
      </svg>
    );
  }

  // -------------------------------------------------------------
  // 6. FLOOD MANAGEMENT & DETENTION
  // -------------------------------------------------------------
  if (activeCategory === 'FLOOD_MANAGEMENT') {
    const basinD = Math.max(2.0, values.height || 6.0);
    const peakStage = Math.max(0.5, calculationResult?.schematicData.upstreamDepthM ?? values.upstreamLevel ?? 4.2);
    const isOvertopping = peakStage > basinD;

    return (
      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="mx-auto block w-full max-w-[800px] h-auto select-none">
        {defs}
        {/* Natural Valley Base */}
        <rect x="0" y={groundY} width={svgWidth} height={svgHeight - groundY} fill="#D4C9BA" />

        {/* Flood Retention Basin Sump */}
        <path
          d={`M 60 70 L 140 ${groundY} L 620 ${groundY} L 700 70 L 760 70 L 760 ${svgHeight} L 0 ${svgHeight} L 0 70 Z`}
          fill="#C6B8A5"
          stroke="#5E5042"
          strokeWidth="2"
        />

        {/* Flood Water Volume */}
        <path
          d={`M 100 ${groundY - (peakStage / basinD) * 140} L 140 ${groundY} L 620 ${groundY} L 660 ${groundY - (peakStage / basinD) * 140} Z`}
          fill="url(#schematicWater)"
        />

        {/* Emergency Weir Spillway Crest */}
        <rect x="620" y={groundY - 105} width="60" height="105" fill="url(#dressedMasonry)" stroke="#4A3F33" strokeWidth="1.5" />

        {/* Annotations */}
        <text x="25" y="32" fill="#241B12" fontSize="13" fontFamily="serif" fontWeight="bold">
          {structure.name} — Flood Detention Storage Balance
        </text>
        <text x="380" y={groundY - 50} textAnchor="middle" fill="#FFFFFF" fontSize="12" fontFamily="sans-serif" fontWeight="bold">
          Stage: {peakStage.toFixed(2)}m / {basinD.toFixed(1)}m capacity · {(calculationResult?.primarySummary || '')}
        </text>
      </svg>
    );
  }

  // -------------------------------------------------------------
  // 7. RESERVOIRS, STEPWELLS & TRADITIONAL TANKS
  // -------------------------------------------------------------
  const cisternD = Math.max(3.0, values.height || 10.0);
  const cisternW = Math.max(10.0, values.width || 29.0);
  const waterDepth = Math.max(0.5, values.upstreamLevel || 7.5);

  const cx = svgWidth / 2;
  const tiers = 6;
  const cisternTopY = 70;
  const cisternBedY = groundY;
  const tierHPx = (cisternBedY - cisternTopY) / tiers;

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="mx-auto block w-full max-w-[800px] h-auto select-none">
      {defs}
      {/* Ground Mass */}
      <rect x="0" y={cisternTopY} width={svgWidth} height={svgHeight - cisternTopY} fill="#D4C9BA" />

      {/* Stepped Inverted Pyramid Tiers */}
      {Array.from({ length: tiers }).map((_, idx) => {
        const tY = cisternTopY + idx * tierHPx;
        const inset = idx * 28;
        return (
          <rect
            key={idx}
            x={120 + inset}
            y={tY}
            width={svgWidth - 240 - inset * 2}
            height={tierHPx}
            fill={idx % 2 === 0 ? '#B8A894' : '#A99884'}
            stroke="#5C4D3D"
            strokeWidth="1.2"
          />
        );
      })}

      {/* Impounded Cistern Water Pool */}
      <path
        d={`M ${cx - 160} ${cisternBedY - (waterDepth / cisternD) * (cisternBedY - cisternTopY)} L ${cx - 70} ${cisternBedY} L ${cx + 70} ${cisternBedY} L ${cx + 160} ${cisternBedY - (waterDepth / cisternD) * (cisternBedY - cisternTopY)} Z`}
        fill="url(#schematicWater)"
        stroke="#4FA1CE"
        strokeWidth="1.5"
      />

      {/* Annotations */}
      <text x="25" y="35" fill="#241B12" fontSize="13" fontFamily="serif" fontWeight="bold">
        {structure.name} — Stepped Cistern Geometry & Evaporation Retention
      </text>
      <text x={cx} y={cisternBedY - 15} textAnchor="middle" fill="#FFFFFF" fontSize="11" fontFamily="sans-serif" fontWeight="bold">
        Water Column Depth: {waterDepth.toFixed(1)} m · Usable Volume: {(calculationResult?.primarySummary || '')}
      </text>
    </svg>
  );
};
