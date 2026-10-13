import {
  CalculationStep,
  HydraulicCalculationResult,
  HydraulicInputs,
  MetricOutput,
} from './types.ts';
import { evaluateWarnings, getWorstSeverity } from './warningEngine.ts';

const G = 9.80665; // m/s²
const GAMMA_W = 9.80665; // kN/m³

/**
 * Diversion Weirs and Anicuts Hydraulic Calculation Model
 * Implements free and submerged weir overflow, approach velocity head,
 * downstream hydraulic jump (Bélanger equation), energy loss, and scouring sluice flow.
 */
export function calculateDiversionWeirs(inputs: HydraulicInputs): HydraulicCalculationResult {
  const P_w = Math.max(0.5, inputs.height ?? 2.5); // Weir height above riverbed (m)
  const b = Math.max(5.0, inputs.width ?? inputs.length ?? 180.0); // Weir crest length / active river width (m)
  const H_1 = Math.max(0.05, inputs.upstreamWaterLevel ?? 2.2); // Upstream head over crest (m)
  const H_2 = Math.max(0.0, inputs.downstreamWaterLevel ?? 0.8); // Downstream tailwater head above crest (m)
  const riverQ = Math.max(1.0, inputs.discharge ?? 900.0); // Entering river discharge (m³/s)
  const sluiceW = Math.max(0.0, inputs.gateWidth ?? 6.0); // Scouring sluice width (m)
  const sluiceH = Math.max(0.0, inputs.gateOpening ?? 1.5); // Scouring sluice opening (m)

  // 1. Approach Velocity & Velocity Head
  const uDepth = P_w + H_1;
  const approachArea = b * uDepth;
  const V_a = riverQ / Math.max(1.0, approachArea);
  const h_a = (V_a * V_a) / (2 * G);
  const H_e = H_1 + h_a; // Total energy head over crest

  // 2. Free Weir Flow Discharge
  // Broad-crested weir coefficient C_d ~ 1.705 m^(1/2)/s
  const C_d = 1.705;
  const Q_free = C_d * b * Math.pow(H_e, 1.5);

  // 3. Submergence Reduction Factor (Villemonte Equation)
  let submergenceRatio = 0;
  let submergenceFactor = 1.0;
  if (H_2 > 0 && H_2 < H_1) {
    submergenceRatio = H_2 / H_1;
    // Submergence begins reducing discharge when H_2 / H_1 > 0.67
    if (submergenceRatio > 0.67) {
      submergenceFactor = Math.pow(1 - Math.pow(submergenceRatio, 1.5), 0.385);
      submergenceFactor = Math.max(0.2, Math.min(1.0, submergenceFactor));
    }
  } else if (H_2 >= H_1) {
    submergenceRatio = 1.0;
    submergenceFactor = 0.2; // Drowned weir
  }

  const Q_weir_actual = Q_free * submergenceFactor;

  // 4. Scouring Sluice Discharge (Orifice flow through weir body)
  let Q_sluice = 0;
  if (sluiceW > 0 && sluiceH > 0) {
    const C_sluice = 0.62;
    const sluiceArea = sluiceW * sluiceH;
    const sluiceHead = P_w + H_1 - sluiceH / 2;
    Q_sluice = C_sluice * sluiceArea * Math.sqrt(2 * G * Math.max(0.1, sluiceHead));
  }

  const totalCapacity = Q_weir_actual + Q_sluice;

  // 5. Downstream Toe Hydraulics & Hydraulic Jump
  // Flow cascades down downstream face: toe depth y1 and velocity V1
  const fallH = Math.max(0.5, P_w + H_1 - Math.max(0.1, H_2));
  const V_toe = Math.sqrt(2 * G * fallH);
  const q_unit = Q_weir_actual / Math.max(1.0, b);
  const y_1 = Math.max(0.05, q_unit / Math.max(1.0, V_toe));
  const Fr_1 = V_toe / Math.sqrt(G * y_1);

  // Sequent (conjugate) depth y_2 from Bélanger momentum equation
  const y_2 = (y_1 / 2) * (Math.sqrt(1 + 8 * Fr_1 * Fr_1) - 1);

  // Energy dissipated in hydraulic jump (m)
  const deltaE = Math.pow(Math.max(0, y_2 - y_1), 3) / (4 * y_1 * Math.max(0.1, y_2));

  // Head difference across structure
  const deltaHead = Math.max(0, uDepth - (P_w + H_2));

  // Silt scour velocity at sluice apron
  const siltScourVelocity = Math.sqrt(2 * G * (P_w + H_1));

  // Step-by-step calculations
  const calculationSteps: CalculationStep[] = [
    {
      name: 'Approach Flow Velocity',
      symbol: 'V_a',
      formulaLatex: 'V_a = \\frac{Q}{b \\cdot (P_w + H_1)}',
      substitution: `\\frac{${riverQ.toFixed(1)}}{${b.toFixed(1)} \\times (${P_w.toFixed(2)} + ${H_1.toFixed(2)})}`,
      resultValue: V_a,
      unit: 'm/s',
      notes: 'Mean river velocity approaching the weir face.',
    },
    {
      name: 'Total Effective Energy Head',
      symbol: 'H_e',
      formulaLatex: 'H_e = H_1 + \\frac{V_a^2}{2g}',
      substitution: `${H_1.toFixed(2)} + \\frac{${V_a.toFixed(2)}^2}{2 \\times 9.81}`,
      resultValue: H_e,
      unit: 'm',
      notes: 'Combined static and dynamic head acting on weir crest.',
    },
    {
      name: 'Free Weir Discharge Capacity',
      symbol: 'Q_{free}',
      formulaLatex: 'Q_{free} = C_d \\cdot b \\cdot H_e^{3/2}',
      substitution: `1.705 \\times ${b.toFixed(1)} \\times (${H_e.toFixed(2)})^{1.5}`,
      resultValue: Q_free,
      unit: 'm³/s',
      notes: 'Discharge under free-overflow conditions without tailwater submergence.',
    },
    {
      name: 'Villemonte Submergence Factor',
      symbol: 'C_s',
      formulaLatex: 'C_s = \\left[1 - (H_2/H_1)^{1.5}\\right]^{0.385}',
      substitution: submergenceRatio > 0.67
        ? `\\left[1 - (${H_2.toFixed(2)} / ${H_1.toFixed(2)})^{1.5}\\right]^{0.385}`
        : '1.000 (Free un-submerged modular flow)',
      resultValue: submergenceFactor,
      unit: 'factor',
      notes: submergenceRatio > 0.67 ? 'Submerged flow: tailwater dampens overflow rate.' : 'Free overflow: modular discharge regime.',
    },
    {
      name: 'Actual Weir Discharge Capacity',
      symbol: 'Q_{weir}',
      formulaLatex: 'Q_{weir} = C_s \\cdot Q_{free}',
      substitution: `${submergenceFactor.toFixed(3)} \\times ${Q_free.toFixed(1)}`,
      resultValue: Q_weir_actual,
      unit: 'm³/s',
      notes: 'Weir discharge accounting for downstream water elevation.',
    },
    {
      name: 'Scouring Sluice Flow Rate',
      symbol: 'Q_{sluice}',
      formulaLatex: 'Q_{sluice} = C_c \\cdot A_s \\cdot \\sqrt{2g H_{sluice}}',
      substitution: `0.62 \\times (${sluiceW.toFixed(1)} \\times ${sluiceH.toFixed(1)}) \\times \\sqrt{2(9.81)(${P_w.toFixed(2)} + ${H_1.toFixed(2)} - ${sluiceH / 2})}`,
      resultValue: Q_sluice,
      unit: 'm³/s',
      notes: 'Low-level bed silt evacuation through scouring vents (*kalingu*).',
    },
    {
      name: 'Toe Froude Number',
      symbol: 'Fr_1',
      formulaLatex: 'Fr_1 = \\frac{V_{toe}}{\\sqrt{g \\cdot y_1}}',
      substitution: `\\frac{${V_toe.toFixed(2)}}{\\sqrt{9.81 \\times ${y_1.toFixed(3)}}}`,
      resultValue: Fr_1,
      unit: 'dimensionless',
      notes: 'Froude number of supercritical jet hitting downstream apron.',
    },
    {
      name: 'Conjugate Depth (Bélanger)',
      symbol: 'y_2',
      formulaLatex: 'y_2 = \\frac{y_1}{2} \\left(\\sqrt{1 + 8 Fr_1^2} - 1\\right)',
      substitution: `\\frac{${y_1.toFixed(3)}}{2} \\left(\\sqrt{1 + 8(${Fr_1.toFixed(2)})^2} - 1\\right)`,
      resultValue: y_2,
      unit: 'm',
      notes: 'Depth required downstream to force a stable hydraulic jump.',
    },
    {
      name: 'Hydraulic Jump Energy Loss',
      symbol: '\\Delta E',
      formulaLatex: '\\Delta E = \\frac{(y_2 - y_1)^3}{4 y_1 y_2}',
      substitution: `\\frac{(${y_2.toFixed(2)} - ${y_1.toFixed(2)})^3}{4(${y_1.toFixed(2)})(${y_2.toFixed(2)})}`,
      resultValue: deltaE,
      unit: 'm',
      notes: 'Head converted into turbulence, dissipating kinetic scour potential.',
    },
  ];

  const metrics: MetricOutput[] = [
    { label: 'Total Weir Capacity ($Q_{cap}$)', symbol: 'Q_cap', value: `${totalCapacity.toFixed(1)} m³/s`, rawNumber: totalCapacity, unit: 'm³/s', highlight: true },
    { label: 'Weir Crest Head ($H_1$)', symbol: 'H_1', value: `${H_1.toFixed(2)} m`, rawNumber: H_1, unit: 'm' },
    { label: 'Approach Velocity ($V_a$)', symbol: 'V_a', value: `${V_a.toFixed(2)} m/s`, rawNumber: V_a, unit: 'm/s' },
    { label: 'Tailwater Submergence', symbol: 'H_2/H_1', value: `${(submergenceRatio * 100).toFixed(1)}%`, rawNumber: submergenceRatio, unit: '%' },
    { label: 'Scouring Sluice Release', symbol: 'Q_sluice', value: `${Q_sluice.toFixed(1)} m³/s`, rawNumber: Q_sluice, unit: 'm³/s' },
    { label: 'Apron Toe Velocity ($V_1$)', symbol: 'V_1', value: `${V_toe.toFixed(2)} m/s`, rawNumber: V_toe, unit: 'm/s', highlight: true },
    { label: 'Jump Froude ($Fr_1$)', symbol: 'Fr_1', value: `${Fr_1.toFixed(2)} (${Fr_1 > 4.5 ? 'Stable Jump' : 'Oscillating'})`, rawNumber: Fr_1 },
    { label: 'Jump Energy Loss ($\\Delta E$)', symbol: 'Delta E', value: `${deltaE.toFixed(2)} m`, rawNumber: deltaE, unit: 'm' },
    { label: 'Active River Width ($b$)', symbol: 'b', value: `${b.toFixed(0)} m`, rawNumber: b, unit: 'm' },
  ];

  const warnings = evaluateWarnings('DIVERSION_WEIRS', {
    overflowCapacity: totalCapacity,
    riverDischarge: riverQ,
    upstreamHead: H_1,
    weirHeight: P_w,
    downstreamHead: H_2,
    submergenceRatio,
    apronVelocity: V_toe,
    jumpFroude: Fr_1,
  });

  const worstSeverity = getWorstSeverity(warnings);

  return {
    category: 'DIVERSION_WEIRS',
    primarySummary: `${totalCapacity.toFixed(0)} m³/s capacity (${riverQ > totalCapacity ? 'INSUFFICIENT' : 'ADEQUATE'})`,
    secondarySummary: `${Fr_1 > 1 ? `Fr=${Fr_1.toFixed(1)} hydraulic jump` : 'Submerged flow'}`,
    metrics,
    calculationSteps,
    warnings,
    overallRiskSeverity: worstSeverity,
    governingTheory: 'Broad-crested weir flow with Villemonte submergence correction, Bélanger hydraulic jump equations, and orifice scouring discharge.',
    assumptions: [
      `Broad-crested weir discharge coefficient C_d = ${C_d} m^(1/2)/s.`,
      `Weir height P_w = ${P_w.toFixed(2)} m above alluvial riverbed.`,
      `Active crest width b = ${b.toFixed(1)} m spanning river channel.`,
      'Hydrodynamic pressure transition across energy-dissipation stone apron.',
    ],
    uncertainties: [
      'Seasonal alluvial bed accretion can raise effective approach bed elevation, increasing approach velocity head.',
      'Timber sluice gate leakage and partial clogging may reduce scouring sluice capacity by 10–25%.',
    ],
    schematicData: {
      upstreamDepthM: uDepth,
      downstreamDepthM: P_w + H_2,
      structureHeightM: P_w,
      crestElevationM: P_w,
      effectiveWidthM: b,
      waterVelocityMs: V_toe,
      isOvertopping: false,
      isSupercritical: Fr_1 > 1,
      hydraulicJumpOccurred: Fr_1 > 1.7,
      froudeNumber: Fr_1,
      flowDirection: 'LEFT_TO_RIGHT',
      waterSurfaceProfile: [
        { x: 0, y: uDepth },
        { x: 45, y: P_w + H_1 },
        { x: 55, y: y_1 },
        { x: 75, y: y_2 },
        { x: 100, y: P_w + H_2 },
      ],
    },
  };
}
