import {
  CalculationStep,
  HydraulicCalculationResult,
  HydraulicInputs,
  MetricOutput,
} from './types.ts';
import { evaluateWarnings, getWorstSeverity } from './warningEngine.ts';

const G = 9.80665;
const GAMMA_W = 9.80665;

/**
 * Sluices, Gates, and Outlets Hydraulic Calculation Model
 * Implements submerged and free orifice discharge, Torricelli scouring exit velocity,
 * hydrodynamic gate thrust, and tailwater backpressure checks.
 */
export function calculateSluicesOutlets(inputs: HydraulicInputs): HydraulicCalculationResult {
  const b = Math.max(0.2, inputs.gateWidth ?? inputs.width ?? 1.2); // Gate width (m)
  const w = Math.max(0.05, inputs.gateOpening ?? 0.6); // Gate opening height (m)
  const H_us = Math.max(0.1, inputs.upstreamWaterLevel ?? 4.5); // Upstream head above sill (m)
  const H_ds = Math.max(0.0, inputs.downstreamWaterLevel ?? 0.4); // Downstream tailwater above sill (m)
  const H_wall = Math.max(H_us + 0.5, inputs.height ?? 6.0); // Headwall height (m)

  // 1. Determine Flow Regime: Free Weir vs Orifice Flow
  const isOrificeFlow = H_us > 1.2 * w; // Submerged top of gate
  const isSubmergedOutlet = H_ds > w; // Submerged downstream exit

  let Q: number;
  let V_exit: number;
  let effectiveHead: number;
  let C_d: number;

  if (isOrificeFlow) {
    // Orifice flow
    C_d = isSubmergedOutlet ? 0.60 : 0.62;
    effectiveHead = isSubmergedOutlet ? Math.max(0.05, H_us - H_ds) : Math.max(0.05, H_us - w / 2);
    V_exit = Math.sqrt(2 * G * effectiveHead);
    const A_orifice = b * w;
    Q = C_d * A_orifice * V_exit;
  } else {
    // Free weir flow over sill (under gate)
    C_d = 1.70;
    effectiveHead = H_us;
    Q = C_d * b * Math.pow(H_us, 1.5);
    V_exit = Q / Math.max(0.01, b * H_us);
  }

  // Hydrodynamic gate thrust (kN)
  // Hydrostatic pressure on closed portion of gate (between w and H_us)
  const gatePlateH = Math.max(0.2, H_wall - w);
  const avgPressureKNm2 = GAMMA_W * (H_us - w / 2);
  const totalGateThrustKN = avgPressureKNm2 * b * gatePlateH;

  // Downstream Froude number & scour index
  const dDepth = Math.max(0.1, isSubmergedOutlet ? H_ds : w * 0.62); // vena contracta depth
  const Fr_out = V_exit / Math.sqrt(G * dDepth);
  const scourIndex = (V_exit * V_exit) / (2 * G); // Velocity head available for bed scour (m)

  const calculationSteps: CalculationStep[] = [
    {
      name: isOrificeFlow ? 'Effective Orifice Head' : 'Weir Head',
      symbol: 'H_{eff}',
      formulaLatex: isSubmergedOutlet ? 'H_{eff} = H_{us} - H_{ds}' : 'H_{eff} = H_{us} - \\frac{w}{2}',
      substitution: isSubmergedOutlet ? `${H_us.toFixed(2)} - ${H_ds.toFixed(2)}` : `${H_us.toFixed(2)} - ${w.toFixed(2)}/2`,
      resultValue: effectiveHead,
      unit: 'm',
      notes: isSubmergedOutlet ? 'Drowned exit: head difference drives flow.' : 'Free exit: head above gate centroid drives flow.',
    },
    {
      name: 'Torricelli Theoretical Exit Velocity',
      symbol: 'v_{exit}',
      formulaLatex: 'v_{exit} = \\sqrt{2g H_{eff}}',
      substitution: `\\sqrt{2 \\times 9.81 \\times ${effectiveHead.toFixed(2)}}`,
      resultValue: V_exit,
      unit: 'm/s',
      notes: 'High-velocity jet shooting through the sluice opening.',
    },
    {
      name: 'Sluice Orifice Discharge',
      symbol: 'Q',
      formulaLatex: 'Q = C_d \\cdot (b \\cdot w) \\cdot \\sqrt{2g H_{eff}}',
      substitution: `${C_d.toFixed(2)} \\times (${b.toFixed(2)} \\times ${w.toFixed(2)}) \\times ${V_exit.toFixed(2)}`,
      resultValue: Q,
      unit: 'm³/s',
      notes: 'Volumetric release capacity across the sluice vent.',
    },
    {
      name: 'Hydrodynamic Sluice Plate Thrust',
      symbol: 'F_{thrust}',
      formulaLatex: 'F = \\gamma_w \\cdot (H_{us} - w/2) \\cdot b \\cdot H_{plate}',
      substitution: `9.81 \\times (${H_us.toFixed(2)} - ${w.toFixed(2)}/2) \\times ${b.toFixed(2)} \\times ${gatePlateH.toFixed(2)}`,
      resultValue: totalGateThrustKN,
      unit: 'kN',
      notes: 'Total hydrostatic force on timber/iron sluice gate plate.',
    },
  ];

  const metrics: MetricOutput[] = [
    { label: 'Sluice Discharge ($Q$)', symbol: 'Q', value: `${Q.toFixed(2)} m³/s`, rawNumber: Q, unit: 'm³/s', highlight: true },
    { label: 'Torricelli Jet Velocity ($V$)', symbol: 'V_exit', value: `${V_exit.toFixed(2)} m/s`, rawNumber: V_exit, unit: 'm/s', highlight: true },
    { label: 'Gate Opening ($w$)', symbol: 'w', value: `${w.toFixed(2)} m / ${(w * 100).toFixed(0)} cm`, rawNumber: w, unit: 'm' },
    { label: 'Upstream Sump Head ($H_{us}$)', symbol: 'H_us', value: `${H_us.toFixed(2)} m`, rawNumber: H_us, unit: 'm' },
    { label: 'Flow Regime', symbol: 'Regime', value: isOrificeFlow ? (isSubmergedOutlet ? 'Submerged Orifice' : 'Free Orifice Jet') : 'Free Weir Flow', unit: '' },
    { label: 'Jet Scour Head ($v^2/2g$)', symbol: 'h_scour', value: `${scourIndex.toFixed(2)} m`, rawNumber: scourIndex, unit: 'm' },
    { label: 'Total Gate Thrust', symbol: 'F', value: `${totalGateThrustKN.toFixed(1)} kN`, rawNumber: totalGateThrustKN, unit: 'kN' },
    { label: 'Gate Width ($b$)', symbol: 'b', value: `${b.toFixed(2)} m`, rawNumber: b, unit: 'm' },
  ];

  const warnings = evaluateWarnings('SLUICES_OUTLETS', {
    exitVelocity: V_exit,
    discharge: Q,
    head: effectiveHead,
    froude: Fr_out,
  });

  const worstSeverity = getWorstSeverity(warnings);

  return {
    category: 'SLUICES_OUTLETS',
    primarySummary: `${Q.toFixed(2)} m³/s release @ ${V_exit.toFixed(1)} m/s`,
    secondarySummary: `${isOrificeFlow ? 'Submerged Orifice Jet' : 'Weir Flow'} (${totalGateThrustKN.toFixed(0)} kN thrust)`,
    metrics,
    calculationSteps,
    warnings,
    overallRiskSeverity: worstSeverity,
    governingTheory: "Torricelli's Law of Efflux, Standard Orifice Discharge Equation, and Gate Hydrostatic Thrust Statics.",
    assumptions: [
      `Sluice vent width b = ${b.toFixed(2)} m, gate opening aperture w = ${w.toFixed(2)} m.`,
      `Discharge coefficient C_d = ${C_d.toFixed(2)} calibrated for historical stone/timber sluice barrel.`,
      'Atmospheric pressure at exit for free orifice; tailwater backpressure for submerged condition.',
    ],
    uncertainties: [
      'Debris jamming in sluice barrel can choke opening area by 15–50%.',
      'Vibrations caused by high-velocity cavitation under partial gate openings can fatigue stone lintels.',
    ],
    schematicData: {
      upstreamDepthM: H_us,
      downstreamDepthM: H_ds,
      structureHeightM: H_wall,
      crestElevationM: H_wall,
      effectiveWidthM: b,
      waterVelocityMs: V_exit,
      isOvertopping: false,
      isSupercritical: V_exit > 2.5,
      hydraulicJumpOccurred: false,
      froudeNumber: Fr_out,
      flowDirection: 'LEFT_TO_RIGHT',
      waterSurfaceProfile: [
        { x: 0, y: H_us },
        { x: 45, y: H_us },
        { x: 55, y: w },
        { x: 100, y: H_ds },
      ],
    },
  };
}
