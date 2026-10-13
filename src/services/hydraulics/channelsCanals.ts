import {
  CalculationStep,
  HydraulicCalculationResult,
  HydraulicInputs,
  MetricOutput,
} from './types.ts';
import { evaluateWarnings, getWorstSeverity } from './warningEngine.ts';

const G = 9.80665; // standard gravitational acceleration m/s²
const RHO_W = 1000; // water density kg/m³
const GAMMA_W = 9.80665; // unit weight of water kN/m³

/**
 * Open Channels and Canals Hydraulic Calculation Model
 * Implements Manning's equation, open-channel flow area, wetted perimeter,
 * hydraulic radius, normal depth, conveyance, Froude number, and freeboard checks.
 */
export function calculateChannelsCanals(inputs: HydraulicInputs): HydraulicCalculationResult {
  // Input sanitation & physical defaults
  const b = Math.max(0.2, inputs.width ?? 4.0); // bottom width (m)
  const z = Math.max(0, inputs.sideSlope ?? 1.5); // side slope (1:z)
  const S = Math.max(0.00005, inputs.bedSlope ?? 0.0008); // longitudinal slope
  const n = Math.max(0.010, Math.min(0.080, inputs.manningN ?? 0.025)); // Manning n
  const bankH = Math.max(0.5, inputs.height ?? 2.5); // total bank height (m)
  const targetQ = Math.max(0, inputs.discharge ?? 6.5); // target discharge (m³/s)
  const specifiedDepth = inputs.upstreamWaterLevel; // optional specified operating depth

  // 1. Solve water depth y:
  // If depth is specified by user, compute discharge. If discharge is specified, solve normal depth y_n via Newton-Raphson.
  let y: number;
  let Q: number;
  let solvedIteratively = false;

  if (specifiedDepth !== undefined && specifiedDepth > 0) {
    y = Math.max(0.05, Math.min(bankH * 1.5, specifiedDepth));
    const area = (b + z * y) * y;
    const wettedP = b + 2 * y * Math.sqrt(1 + z * z);
    const R = area / wettedP;
    Q = (1 / n) * area * Math.pow(R, 2 / 3) * Math.sqrt(S);
  } else {
    // Solve normal depth y_n for targetQ via Newton-Raphson
    solvedIteratively = true;
    let yGuess = Math.max(0.2, Math.pow((targetQ * n) / (b * Math.sqrt(S)), 0.6));
    for (let iter = 0; iter < 40; iter++) {
      const A = (b + z * yGuess) * yGuess;
      const P = b + 2 * yGuess * Math.sqrt(1 + z * z);
      const R = A / P;
      const f = (1 / n) * A * Math.pow(R, 2 / 3) * Math.sqrt(S) - targetQ;
      if (Math.abs(f) < 1e-6) break;

      // Derivative dQ/dy
      const dAdy = b + 2 * z * yGuess;
      const dPdy = 2 * Math.sqrt(1 + z * z);
      const dRdy = (dAdy * P - A * dPdy) / (P * P);
      const dfdy = (1 / n) * Math.sqrt(S) * (dAdy * Math.pow(R, 2 / 3) + A * (2 / 3) * Math.pow(R, -1 / 3) * dRdy);
      const yNext = yGuess - f / Math.max(1e-5, dfdy);
      yGuess = Math.max(0.02, yNext);
    }
    y = yGuess;
    Q = targetQ;
  }

  // Hydraulic geometric parameters
  const A = (b + z * y) * y; // Cross-sectional area m²
  const P = b + 2 * y * Math.sqrt(1 + z * z); // Wetted perimeter m
  const R = A / P; // Hydraulic radius m
  const T = b + 2 * z * y; // Top width m
  const D_h = A / T; // Hydraulic mean depth m
  const V = Q / Math.max(1e-5, A); // Mean flow velocity m/s

  // Conveyance K = Q / sqrt(S)
  const K = (1 / n) * A * Math.pow(R, 2 / 3);

  // Full-bank capacity (when y = bankH)
  const A_full = (b + z * bankH) * bankH;
  const P_full = b + 2 * bankH * Math.sqrt(1 + z * z);
  const R_full = A_full / P_full;
  const Q_capacity = (1 / n) * A_full * Math.pow(R_full, 2 / 3) * Math.sqrt(S);

  // Froude number Fr = V / sqrt(g * D_h)
  const Fr = V / Math.sqrt(G * Math.max(0.01, D_h));

  // Critical depth y_c (analytical approximation for trapezoid: Q² / g = A_c³ / T_c)
  const y_c = Math.pow(Math.pow(Q / b, 2) / G, 1 / 3);

  // Freeboard
  const freeboard = bankH - y;
  const isOvertopping = freeboard < 0;

  // Boundary shear stress tau_0 = gamma_w * R * S (N/m²)
  const tau_0 = GAMMA_W * 1000 * R * S;

  // Unit stream power
  const streamPower = (GAMMA_W * 1000 * Q * S) / Math.max(0.1, b);

  // Step-by-step calculation record
  const calculationSteps: CalculationStep[] = [
    {
      name: 'Flow Area (Trapezoidal)',
      symbol: 'A',
      formulaLatex: 'A = (b + z \\cdot y) \\cdot y',
      substitution: `(${b.toFixed(2)} + ${z.toFixed(2)} \\times ${y.toFixed(3)}) \\times ${y.toFixed(3)}`,
      resultValue: A,
      unit: 'm²',
      notes: 'Area of flow cross-section based on bottom width and side slope.',
    },
    {
      name: 'Wetted Perimeter',
      symbol: 'P',
      formulaLatex: 'P = b + 2y\\sqrt{1 + z^2}',
      substitution: `${b.toFixed(2)} + 2(${y.toFixed(3)})\\sqrt{1 + ${z.toFixed(2)}^2}`,
      resultValue: P,
      unit: 'm',
      notes: 'Perimeter of channel boundary in contact with water.',
    },
    {
      name: 'Hydraulic Radius',
      symbol: 'R',
      formulaLatex: 'R = \\frac{A}{P}',
      substitution: `\\frac{${A.toFixed(3)}}{${P.toFixed(3)}}`,
      resultValue: R,
      unit: 'm',
      notes: 'Ratio of cross-sectional area to wetted perimeter.',
    },
    {
      name: "Manning's Mean Flow Velocity",
      symbol: 'V',
      formulaLatex: 'V = \\frac{1}{n} R^{2/3} S^{1/2}',
      substitution: `\\frac{1}{${n.toFixed(3)}} \\times (${R.toFixed(3)})^{2/3} \\times (${S.toFixed(5)})^{1/2}`,
      resultValue: V,
      unit: 'm/s',
      notes: 'Uniform open-channel flow velocity under steady-state friction equilibrium.',
    },
    {
      name: 'Discharge (Continuity Equation)',
      symbol: 'Q',
      formulaLatex: 'Q = A \\cdot V',
      substitution: `${A.toFixed(3)} \\text{ m}^2 \\times ${V.toFixed(3)} \\text{ m/s}`,
      resultValue: Q,
      unit: 'm³/s',
      notes: 'Volumetric flow rate conveyed down the canal.',
    },
    {
      name: 'Channel Conveyance Capacity',
      symbol: 'K',
      formulaLatex: 'K = \\frac{1}{n} A R^{2/3}',
      substitution: `\\frac{1}{${n.toFixed(3)}} \\times ${A.toFixed(3)} \\times (${R.toFixed(3)})^{2/3}`,
      resultValue: K,
      unit: 'm³/s',
      notes: 'Geometric carrying capability independent of bed slope.',
    },
    {
      name: 'Froude Number',
      symbol: 'Fr',
      formulaLatex: 'Fr = \\frac{V}{\\sqrt{g \\cdot D_h}}',
      substitution: `\\frac{${V.toFixed(3)}}{\\sqrt{9.81 \\times ${D_h.toFixed(3)}}}`,
      resultValue: Fr,
      unit: 'dimensionless',
      notes: Fr < 1 ? 'Subcritical flow (tranquil, gravity-dominated)' : 'Supercritical flow (rapid, inertia-dominated)',
    },
    {
      name: 'Available Bank Freeboard',
      symbol: 'FB',
      formulaLatex: 'FB = H_{bank} - y',
      substitution: `${bankH.toFixed(2)} - ${y.toFixed(3)}`,
      resultValue: freeboard,
      unit: 'm',
      notes: freeboard < 0 ? 'Overtopping condition! Water exceeds canal banks.' : 'Vertical safety margin against wave wash.',
    },
    {
      name: 'Boundary Shear Stress',
      symbol: '\\tau_0',
      formulaLatex: '\\tau_0 = \\gamma_w R S',
      substitution: `9807 \\times ${R.toFixed(3)} \\times ${S.toFixed(5)}`,
      resultValue: tau_0,
      unit: 'N/m²',
      notes: 'Tractive force exerted on canal bed and bank lining.',
    },
  ];

  const metrics: MetricOutput[] = [
    { label: 'Flow Discharge ($Q$)', symbol: 'Q', value: `${Q.toFixed(2)} m³/s`, rawNumber: Q, unit: 'm³/s', highlight: true },
    { label: 'Flow Depth ($y$)', symbol: 'y', value: `${y.toFixed(2)} m`, rawNumber: y, unit: 'm' },
    { label: 'Mean Velocity ($V$)', symbol: 'V', value: `${V.toFixed(2)} m/s`, rawNumber: V, unit: 'm/s', highlight: true },
    { label: 'Bank Freeboard', symbol: 'FB', value: `${freeboard.toFixed(2)} m`, rawNumber: freeboard, unit: 'm' },
    { label: 'Froude Number ($Fr$)', symbol: 'Fr', value: `${Fr.toFixed(2)} (${Fr < 1 ? 'Subcritical' : 'Supercritical'})`, rawNumber: Fr },
    { label: 'Bankfull Capacity ($Q_{cap}$)', symbol: 'Q_cap', value: `${Q_capacity.toFixed(2)} m³/s`, rawNumber: Q_capacity, unit: 'm³/s' },
    { label: 'Hydraulic Radius ($R$)', symbol: 'R', value: `${R.toFixed(2)} m`, rawNumber: R, unit: 'm' },
    { label: 'Bed Shear Stress ($\\tau_0$)', symbol: 'tau_0', value: `${tau_0.toFixed(2)} N/m²`, rawNumber: tau_0, unit: 'N/m²' },
    { label: 'Water Top Width ($T$)', symbol: 'T', value: `${T.toFixed(2)} m`, rawNumber: T, unit: 'm' },
  ];

  // Warnings evaluation
  const warnings = evaluateWarnings('CHANNELS_CANALS', {
    velocity: V,
    freeboard,
    froude: Fr,
    discharge: Q,
    capacity: Q_capacity,
    depth: y,
    bankHeight: bankH,
    shearStress: tau_0,
  });

  const worstSeverity = getWorstSeverity(warnings);

  // Schematic generation data
  const profile = [
    { x: 0, y: y },
    { x: 50, y: y },
    { x: 100, y: y },
  ];

  return {
    category: 'CHANNELS_CANALS',
    primarySummary: `${Q.toFixed(2)} m³/s @ ${V.toFixed(2)} m/s`,
    secondarySummary: `${freeboard > 0 ? `${freeboard.toFixed(2)} m freeboard` : 'OVERTOPPING RISK'}`,
    metrics,
    calculationSteps,
    warnings,
    overallRiskSeverity: worstSeverity,
    governingTheory: "Manning's Equation for Uniform Open-Channel Flow and Conservation of Mass (Continuity).",
    assumptions: [
      'Steady, uniform prismatic channel flow with constant cross-section.',
      `Manning roughness coefficient n = ${n.toFixed(3)} representing historical stone/earth lining.`,
      `Side slope z = ${z.toFixed(2)} (1:${z.toFixed(2)} V:H) and bottom width b = ${b.toFixed(2)} m.`,
      'Hydrostatic pressure distribution across the flow cross-section.',
    ],
    uncertainties: [
      'Long-term weed growth and boundary siltation may increase Manning n over time by 20–40%.',
      'Unlined canal reaches may experience bank slumping if shear stress exceeds critical tractive force.',
    ],
    schematicData: {
      upstreamDepthM: y,
      downstreamDepthM: y,
      structureHeightM: bankH,
      crestElevationM: bankH,
      effectiveWidthM: b,
      waterVelocityMs: V,
      isOvertopping,
      isSupercritical: Fr > 1,
      hydraulicJumpOccurred: false,
      froudeNumber: Fr,
      flowDirection: 'LEFT_TO_RIGHT',
      waterSurfaceProfile: profile,
    },
  };
}
