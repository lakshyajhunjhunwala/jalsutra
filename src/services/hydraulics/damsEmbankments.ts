import {
  CalculationStep,
  HydraulicCalculationResult,
  HydraulicInputs,
  MetricOutput,
} from './types.ts';
import { evaluateWarnings, getWorstSeverity } from './warningEngine.ts';

const G = 9.80665; // m/s²
const RHO_W = 1000; // kg/m³
const GAMMA_W = 9.80665; // kN/m³

/**
 * Dams and Embankments Hydraulic & Geotechnical Calculation Model
 * Implements reservoir storage, spillway capacity, freeboard, overtopping detection,
 * hydrostatic horizontal thrust, deadweight, foundation uplift, sliding & overturning FOS,
 * Darcy seepage discharge, Bligh creep exit gradient, and slope stability.
 */
export function calculateDamsEmbankments(inputs: HydraulicInputs): HydraulicCalculationResult {
  const H_dam = Math.max(2.0, inputs.height ?? 12.0); // Dam height (m)
  const L_dam = Math.max(10.0, inputs.length ?? 450.0); // Embankment length (m)
  const b_crest = Math.max(2.0, inputs.topWidth ?? inputs.width ?? 6.0); // Crest width (m)
  const z_u = Math.max(1.0, inputs.sideSlope ?? 2.5); // Upstream slope z_u:1 (H:V)
  const z_d = 2.0; // Downstream slope z_d:1 (H:V)
  const H_water = Math.max(0.2, inputs.upstreamWaterLevel ?? 9.5); // Reservoir water depth at dam (m)

  const gamma_mat = Math.max(16.0, inputs.materialDensity ?? 20.5); // Embankment unit weight kN/m³
  const mu_f = Math.max(0.3, Math.min(0.85, inputs.foundationFrictionCoeff ?? 0.52)); // Friction coefficient
  const k_seep = Math.max(1e-9, inputs.soilPermeability ?? 2.5e-6); // Darcy k (m/s)

  const L_spill = Math.max(5.0, inputs.spillwayWidth ?? 30.0); // Spillway width (m)
  const H_spill_crest = Math.max(1.0, inputs.spillwayCrestElevation ?? (H_dam - 2.0)); // Spillway crest elevation (m)
  const catchmentArea = Math.max(1.0, inputs.catchmentAreaKm2 ?? 65.0); // Catchment area (km²)

  // 1. Embankment Geometry
  const b_base = b_crest + (z_u + z_d) * H_dam; // Base width (m)
  const area_cross = ((b_crest + b_base) / 2) * H_dam; // Cross-sectional area m²
  const vol_dam_m3 = area_cross * L_dam; // Volume of earth/masonry m³
  const freeboard = H_dam - H_water;
  const isOvertopping = freeboard < 0;

  // 2. Reservoir Storage Volume
  // Prismatic valley storage model: V = 0.35 * A_catchment_effective * H_water or stage-storage
  const valleySpreadRatio = 350.0; // valley width spread factor m/m of depth
  const storageM3 = (1 / 3) * (valleySpreadRatio * H_water) * (valleySpreadRatio * 1.5 * H_water) * H_water * 0.15;
  const storageMCM = storageM3 / 1e6; // Million Cubic Meters (MCM)

  // 3. Peak Monsoon Runoff (Ryves empirical formula for Peninsular India: Q = C * A^(2/3))
  const ryvesC = 550.0;
  const peakFloodCumecs = (ryvesC * Math.pow(catchmentArea, 2 / 3)) / 35.315; // convert cusecs to cumecs

  // 4. Spillway Capacity (Broad-crested weir equation over surplus crest)
  const headOverSpillway = Math.max(0, H_water - H_spill_crest);
  const C_w = 1.70;
  const spillwayCapacity = C_w * L_spill * Math.pow(headOverSpillway, 1.5);

  // 5. Hydrostatic Pressure and Horizontal Thrust
  // P = 0.5 * gamma_w * H_water² per meter length
  const thrustPerMeterKN = 0.5 * GAMMA_W * H_water * H_water;
  const totalThrustMN = (thrustPerMeterKN * L_dam) / 1000; // MegaNewtons

  // 6. Embankment Deadweight Resistance
  const weightPerMeterKN = area_cross * gamma_mat;
  const totalWeightMN = (weightPerMeterKN * L_dam) / 1000;

  // 7. Foundation Uplift Force
  const upliftPerMeterKN = 0.5 * GAMMA_W * H_water * b_base * 0.55; // 0.55 uplift reduction factor
  const totalUpliftMN = (upliftPerMeterKN * L_dam) / 1000;
  const netWeightMN = Math.max(0.1, totalWeightMN - totalUpliftMN);

  // 8. Sliding Factor of Safety (FOS_sliding)
  const slidingFOS = (mu_f * netWeightMN) / Math.max(0.01, totalThrustMN);

  // 9. Overturning Factor of Safety (FOS_overturning about downstream toe)
  // Resisting moment arm ~ b_base * 0.55; Overturning thrust arm = H_water / 3
  const resistingMomentMNm = netWeightMN * (b_base * 0.55);
  const overturningMomentMNm = totalThrustMN * (H_water / 3);
  const overturningFOS = resistingMomentMNm / Math.max(0.01, overturningMomentMNm);

  // 10. Seepage Indicators (Darcy flow & Exit gradient)
  // Flownet shape factor Nf/Nd ~ 0.35 for trapezoidal embankment with core
  const shapeFactor = 0.35;
  const seepagePerMeterM3s = k_seep * H_water * shapeFactor;
  const totalSeepageLps = seepagePerMeterM3s * L_dam * 1000; // Liters per second

  // Bligh's creep path length L_creep ~ base width + 2 * cutoff depth
  const cutoffDepth = H_dam * 0.25;
  const creepLength = b_base + 2 * cutoffDepth;
  const exitGradient = H_water / Math.max(1.0, creepLength);
  const criticalGradient = 1.0; // standard critical flotation gradient for sand/silt

  // 11. Slope Stability Indicator
  // Taylor's approximation for downstream dry/steady seepage slope
  const phi_rad = ((inputs.frictionAngle ?? 28.0) * Math.PI) / 180;
  const beta_d = Math.atan(1 / z_d);
  const slopeStabilityFOS = Math.tan(phi_rad) / Math.tan(beta_d);

  // Step-by-step calculations
  const calculationSteps: CalculationStep[] = [
    {
      name: 'Hydrostatic Horizontal Thrust',
      symbol: 'P',
      formulaLatex: 'P = \\frac{1}{2} \\gamma_w H_{water}^2 \\cdot L',
      substitution: `0.5 \\times 9.81 \\times (${H_water.toFixed(2)})^2 \\times ${L_dam.toFixed(1)} / 1000`,
      resultValue: totalThrustMN,
      unit: 'MN',
      notes: 'Total horizontal hydrostatic water thrust pushing the dam embankment downstream.',
    },
    {
      name: 'Embankment Deadweight',
      symbol: 'W',
      formulaLatex: 'W = \\gamma_{mat} \\cdot A_{dam} \\cdot L',
      substitution: `${gamma_mat.toFixed(1)} \\times ${area_cross.toFixed(2)} \\text{ m}^2 \\times ${L_dam.toFixed(1)} / 1000`,
      resultValue: totalWeightMN,
      unit: 'MN',
      notes: 'Gravity deadweight providing stabilizing normal force on foundation.',
    },
    {
      name: 'Sliding Factor of Safety',
      symbol: 'FOS_{slide}',
      formulaLatex: 'FOS_{slide} = \\frac{\\mu \\cdot (W - U)}{P}',
      substitution: `\\frac{${mu_f.toFixed(2)} \\times (${totalWeightMN.toFixed(2)} - ${totalUpliftMN.toFixed(2)})}{${totalThrustMN.toFixed(2)}}`,
      resultValue: slidingFOS,
      unit: 'ratio',
      notes: slidingFOS >= 1.5 ? 'Safe against basal shear sliding (FOS >= 1.5).' : 'High sliding shear failure risk (FOS < 1.5).',
    },
    {
      name: 'Overturning Factor of Safety',
      symbol: 'FOS_{over}',
      formulaLatex: 'FOS_{over} = \\frac{M_{resist}}{M_{overturn}}',
      substitution: `\\frac{${resistingMomentMNm.toFixed(1)}}{${overturningMomentMNm.toFixed(1)}}`,
      resultValue: overturningFOS,
      unit: 'ratio',
      notes: overturningFOS >= 2.0 ? 'Robust rotational equilibrium about downstream toe.' : 'Potential tension at upstream heel.',
    },
    {
      name: 'Spillway Evacuation Capacity',
      symbol: 'Q_{spill}',
      formulaLatex: 'Q_{spill} = C_w \\cdot L_{spill} \\cdot H_{spill}^{1.5}',
      substitution: headOverSpillway > 0
        ? `1.70 \\times ${L_spill.toFixed(1)} \\times (${headOverSpillway.toFixed(2)})^{1.5}`
        : '0.00 m³/s (Water level below spillway crest)',
      resultValue: spillwayCapacity,
      unit: 'm³/s',
      notes: 'Free-surface flood discharge through emergency surplus weir.',
    },
    {
      name: 'Seepage Exit Gradient',
      symbol: 'i_{exit}',
      formulaLatex: 'i_{exit} = \\frac{H_{water}}{L_{creep}}',
      substitution: `\\frac{${H_water.toFixed(2)}}{${creepLength.toFixed(1)}}`,
      resultValue: exitGradient,
      unit: 'm/m',
      notes: exitGradient < criticalGradient * 0.25 ? 'Safe from subsurface piping boil (exit gradient < 0.25).' : 'Piping risk at downstream toe.',
    },
  ];

  const metrics: MetricOutput[] = [
    { label: 'Sliding Factor of Safety', symbol: 'FOS_slide', value: `${slidingFOS.toFixed(2)}x (Min: 1.5x)`, rawNumber: slidingFOS, unit: 'x', highlight: true },
    { label: 'Freeboard Remaining', symbol: 'FB', value: `${freeboard.toFixed(2)} m (Min: 1.5m)`, rawNumber: freeboard, unit: 'm', highlight: true },
    { label: 'Horizontal Hydrostatic Thrust', symbol: 'P', value: `${totalThrustMN.toFixed(2)} MN`, rawNumber: totalThrustMN, unit: 'MN' },
    { label: 'Embankment Deadweight', symbol: 'W', value: `${totalWeightMN.toFixed(2)} MN`, rawNumber: totalWeightMN, unit: 'MN' },
    { label: 'Overturning FOS', symbol: 'FOS_over', value: `${overturningFOS.toFixed(2)}x (Min: 2.0x)`, rawNumber: overturningFOS, unit: 'x' },
    { label: 'Estimated Impounded Storage', symbol: 'V', value: `${storageMCM.toFixed(2)} MCM (${storageM3.toFixed(0)} m³)`, rawNumber: storageMCM, unit: 'MCM' },
    { label: 'Peak Monsoon Inflow (Ryves)', symbol: 'Q_peak', value: `${peakFloodCumecs.toFixed(1)} m³/s`, rawNumber: peakFloodCumecs, unit: 'm³/s' },
    { label: 'Spillway Discharge Capacity', symbol: 'Q_spill', value: `${spillwayCapacity.toFixed(1)} m³/s`, rawNumber: spillwayCapacity, unit: 'm³/s' },
    { label: 'Base Width ($b_{base}$)', symbol: 'b_base', value: `${b_base.toFixed(1)} m`, rawNumber: b_base, unit: 'm' },
    { label: 'Seepage Flow Rate', symbol: 'Q_seep', value: `${totalSeepageLps.toFixed(2)} L/s`, rawNumber: totalSeepageLps, unit: 'L/s' },
    { label: 'Seepage Exit Gradient', symbol: 'i_exit', value: `${exitGradient.toFixed(3)} (Limit: 0.25)`, rawNumber: exitGradient, unit: 'gradient' },
  ];

  const warnings = evaluateWarnings('DAMS_EMBANKMENTS', {
    slidingFOS,
    overturningFOS,
    freeboard,
    isOvertopping,
    spillwayCapacity,
    peakFlood: peakFloodCumecs,
    exitGradient,
    criticalGradient,
  });

  const worstSeverity = getWorstSeverity(warnings);

  return {
    category: 'DAMS_EMBANKMENTS',
    primarySummary: `FS = ${slidingFOS.toFixed(2)}x sliding (${slidingFOS >= 1.5 ? 'STABLE' : 'CRITICAL'})`,
    secondarySummary: `${freeboard > 0 ? `${freeboard.toFixed(2)} m freeboard` : 'OVERTOPPING FAILURE'}`,
    metrics,
    calculationSteps,
    warnings,
    overallRiskSeverity: worstSeverity,
    governingTheory: 'Classical Limit Equilibrium Statics, Hydrostatic Moment Equilibrium, Bligh Creep Piping Theory, and Ryves Empirical Monsoon Runoff.',
    assumptions: [
      `Embankment crest height H = ${H_dam.toFixed(2)} m with upstream slope ${z_u}:1 and downstream slope ${z_d}:1.`,
      `Material composite density gamma = ${gamma_mat.toFixed(1)} kN/m³ (compacted clay core + rock riprap shoulders).`,
      `Foundation friction coefficient mu = ${mu_f.toFixed(2)} with partial uplift relief.`,
      'Hydrostatic triangular pressure distribution acting on upstream wetted face.',
    ],
    uncertainties: [
      'Pore-water pressure buildup inside earthen core during rapid reservoir drawdown is not modeled in steady-state limit equilibrium.',
      'Subsurface bedrock fissures or weathered fault lines can significantly increase foundation uplift above idealized 0.55 factor.',
    ],
    schematicData: {
      upstreamDepthM: H_water,
      downstreamDepthM: 0.5,
      structureHeightM: H_dam,
      crestElevationM: H_dam,
      effectiveWidthM: b_base,
      waterVelocityMs: 0.2,
      isOvertopping,
      isSupercritical: false,
      hydraulicJumpOccurred: false,
      froudeNumber: 0.1,
      flowDirection: 'LEFT_TO_RIGHT',
      waterSurfaceProfile: [
        { x: 0, y: H_water },
        { x: 40, y: H_water },
        { x: 60, y: isOvertopping ? H_dam + 0.3 : 0.5 },
        { x: 100, y: 0.5 },
      ],
    },
  };
}
