import {
  CalculationStep,
  HydraulicCalculationResult,
  HydraulicInputs,
  MetricOutput,
} from './types.ts';
import { evaluateWarnings, getWorstSeverity } from './warningEngine.ts';

const G = 9.80665;

/**
 * Drainage and Sewerage Systems Hydraulic Model
 * Implements storm and waste gravity conveyance, circular and corbelled rectangular
 * conduit hydraulics via Manning equation, backwater surcharge ratio, and street ponding risk.
 */
export function calculateDrainageSystems(inputs: HydraulicInputs): HydraulicCalculationResult {
  const isCircular = (inputs.pipeDiameter !== undefined && inputs.pipeDiameter > 0);
  const D = Math.max(0.3, inputs.pipeDiameter ?? 1.2); // Pipe diameter or conduit height (m)
  const b = Math.max(0.3, inputs.width ?? 0.8); // Box culvert width (m)
  const h_box = Math.max(0.3, inputs.height ?? 1.2); // Box culvert height (m)
  const S = Math.max(0.0001, inputs.bedSlope ?? 0.0025); // Invert slope
  const n = Math.max(0.010, Math.min(0.040, inputs.manningN ?? 0.016)); // Manning roughness (brick/terracotta/stone)
  const Q_in = Math.max(0.01, inputs.discharge ?? 0.85); // Inflow rate (m³/s)

  // 1. Full-Conduit Hydraulic Capacity (Q_full)
  let A_full: number;
  let P_full: number;
  let R_full: number;

  if (isCircular) {
    A_full = (Math.PI / 4) * D * D;
    P_full = Math.PI * D;
    R_full = D / 4;
  } else {
    A_full = b * h_box;
    P_full = 2 * (b + h_box);
    R_full = A_full / P_full;
  }

  const Q_full = (1 / n) * A_full * Math.pow(R_full, 2 / 3) * Math.sqrt(S);
  const V_full = Q_full / A_full;

  // 2. Partial-Flow Depth (y) and Velocity (V)
  const surchargeRatio = Q_in / Math.max(1e-4, Q_full);
  const isPonding = surchargeRatio > 1.0;

  let y: number;
  let A: number;
  let P: number;
  let R: number;
  let V: number;

  if (!isPonding) {
    // Normal gravity flow: solve depth
    if (isCircular) {
      // Semi-empirical approximation for circular partial depth
      const theta = 2 * Math.acos(Math.max(-1, Math.min(1, 1 - 2 * Math.min(0.95, Math.pow(surchargeRatio, 0.45)))));
      y = (D / 2) * (1 - Math.cos(theta / 2));
      A = (D * D / 8) * (theta - Math.sin(theta));
      P = (D / 2) * theta;
      R = A / Math.max(0.01, P);
      V = (1 / n) * Math.pow(R, 2 / 3) * Math.sqrt(S);
    } else {
      // Rectangular box conduit
      y = Math.min(h_box, Math.max(0.05, Math.pow((Q_in * n) / (b * Math.sqrt(S)), 0.6)));
      A = b * y;
      P = b + 2 * y;
      R = A / P;
      V = Q_in / Math.max(0.01, A);
    }
  } else {
    // Surcharged / Pressurized pipe flow
    y = isCircular ? D : h_box;
    A = A_full;
    P = P_full;
    R = R_full;
    V = Q_in / A_full; // Forced pressurized velocity
  }

  const fillingPercent = Math.min(100, (y / (isCircular ? D : h_box)) * 100);
  const excessPondingQ = isPonding ? Q_in - Q_full : 0;
  const selfCleansingThreshold = 0.75; // m/s standard for ancient stone/clay drains

  const calculationSteps: CalculationStep[] = [
    {
      name: 'Full Conduit Capacity (Manning)',
      symbol: 'Q_{full}',
      formulaLatex: 'Q_{full} = \\frac{1}{n} A_{full} R_{full}^{2/3} S^{1/2}',
      substitution: `\\frac{1}{${n.toFixed(3)}} \\times ${A_full.toFixed(3)} \\times (${R_full.toFixed(3)})^{2/3} \\times (${S.toFixed(5)})^{1/2}`,
      resultValue: Q_full,
      unit: 'm³/s',
      notes: 'Maximum gravity flow capacity before pressurized pipe surcharge occurs.',
    },
    {
      name: 'Conduit Surcharge Ratio',
      symbol: 'SR',
      formulaLatex: 'SR = \\frac{Q_{in}}{Q_{full}}',
      substitution: `\\frac{${Q_in.toFixed(3)}}{${Q_full.toFixed(3)}}`,
      resultValue: surchargeRatio,
      unit: 'ratio',
      notes: surchargeRatio <= 1.0 ? 'Gravity open-surface flow' : 'Pressurized surcharge! Overflow risk.',
    },
    {
      name: 'Actual Flow Velocity',
      symbol: 'V',
      formulaLatex: 'V = \\frac{Q_{in}}{A}',
      substitution: `${Q_in.toFixed(3)} / ${A.toFixed(3)}`,
      resultValue: V,
      unit: 'm/s',
      notes: V >= selfCleansingThreshold ? 'Self-cleansing velocity achieved (>= 0.75 m/s).' : 'Sub-cleansing velocity; sediment settling risk.',
    },
  ];

  const metrics: MetricOutput[] = [
    { label: 'Conduit Capacity ($Q_{full}$)', symbol: 'Q_full', value: `${Q_full.toFixed(3)} m³/s`, rawNumber: Q_full, unit: 'm³/s', highlight: true },
    { label: 'Actual Inflow ($Q_{in}$)', symbol: 'Q_in', value: `${Q_in.toFixed(3)} m³/s`, rawNumber: Q_in, unit: 'm³/s' },
    { label: 'Surcharge Ratio', symbol: 'SR', value: `${surchargeRatio.toFixed(2)}x (${(surchargeRatio * 100).toFixed(0)}%)`, rawNumber: surchargeRatio, unit: 'ratio', highlight: true },
    { label: 'Conduit Flow Depth ($y$)', symbol: 'y', value: `${y.toFixed(2)} m (${fillingPercent.toFixed(0)}% full)`, rawNumber: y, unit: 'm' },
    { label: 'Flow Velocity ($V$)', symbol: 'V', value: `${V.toFixed(2)} m/s`, rawNumber: V, unit: 'm/s' },
    { label: 'Excess Ponding Spill', symbol: 'Q_pond', value: `${excessPondingQ.toFixed(3)} m³/s`, rawNumber: excessPondingQ, unit: 'm³/s' },
    { label: 'Conduit Dimensions', symbol: 'Dim', value: isCircular ? `Diameter D = ${D.toFixed(2)} m` : `${b.toFixed(2)}m × ${h_box.toFixed(2)}m Box`, unit: 'm' },
  ];

  const warnings = evaluateWarnings('DRAINAGE_SYSTEMS', {
    surchargeRatio,
    velocity: V,
    isPonding,
    fillingPercent,
    discharge: Q_in,
  });

  const worstSeverity = getWorstSeverity(warnings);

  return {
    category: 'DRAINAGE_SYSTEMS',
    primarySummary: `${(surchargeRatio * 100).toFixed(0)}% capacity utilized (${isPonding ? 'SURCHARGE OVERFLOW' : 'GRAVITY FLOW'})`,
    secondarySummary: `${V.toFixed(2)} m/s velocity (${V >= 0.75 ? 'Self-cleansing' : 'Silting risk'})`,
    metrics,
    calculationSteps,
    warnings,
    overallRiskSeverity: worstSeverity,
    governingTheory: "Manning's Pipe Flow Equation, Partial Flow Depth Geometry, and Continuity Conservation.",
    assumptions: [
      `Conduit geometry: ${isCircular ? `Circular pipe D = ${D.toFixed(2)} m` : `Corbelled box culvert ${b.toFixed(2)} m × ${h_box.toFixed(2)} m`}.`,
      `Roughness n = ${n.toFixed(3)} representing historical fired terracotta or dressed stone paving.`,
      `Invert slope S = ${S.toFixed(5)} (${(S * 1000).toFixed(1)} m/km gradient).`,
    ],
    uncertainties: [
      'Debris, urban silt, or organic buildup can reduce cross-sectional area and double effective roughness.',
      'Downstream tidal or high-river backwater can reduce effective hydraulic gradient S to near zero.',
    ],
    schematicData: {
      upstreamDepthM: y,
      downstreamDepthM: y,
      structureHeightM: isCircular ? D : h_box,
      crestElevationM: isCircular ? D : h_box,
      effectiveWidthM: isCircular ? D : b,
      waterVelocityMs: V,
      isOvertopping: isPonding,
      isSupercritical: false,
      hydraulicJumpOccurred: false,
      froudeNumber: 0.4,
      flowDirection: 'LEFT_TO_RIGHT',
      waterSurfaceProfile: [
        { x: 0, y: y },
        { x: 50, y: y },
        { x: 100, y: y },
      ],
    },
  };
}
