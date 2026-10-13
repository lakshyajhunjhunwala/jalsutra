import { calculateHydraulics } from '../engine.ts';
import { runSensitivityAnalysis } from '../sensitivityEngine.ts';
import { HydraulicInputs } from '../types.ts';

function assert(condition: any, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertClose(actual: number, expected: number, tolerance: number, message: string) {
  const diff = Math.abs(actual - expected);
  if (diff > tolerance) {
    throw new Error(`${message}: Expected ${expected} ± ${tolerance}, got ${actual} (diff: ${diff})`);
  }
}

console.log('=== STARTING JALSUTRA HYDRAULIC SIMULATION ENGINE TESTS ===\n');

// -------------------------------------------------------------
// Test Suite 1: Open Channels & Canals (Manning & Normal Depth)
// -------------------------------------------------------------
console.log('[Test Suite 1] Open Channels and Canals...');

// Reference Case: Rectangular channel, b = 4m, y = 1.5m, S = 0.001, n = 0.02
// A = 4 * 1.5 = 6 m²; P = 4 + 2*1.5 = 7 m; R = 6/7 = 0.8571 m
// V = (1/0.02) * (0.8571)^(2/3) * (0.001)^0.5 = 50 * 0.9024 * 0.03162 = 1.4266 m/s
// Q = 6 * 1.4266 = 8.56 m³/s
const chanInputs: HydraulicInputs = {
  width: 4.0,
  height: 3.0,
  sideSlope: 0.0, // rectangular
  upstreamWaterLevel: 1.5,
  bedSlope: 0.001,
  manningN: 0.02,
};
const chanRes = calculateHydraulics('CHANNELS_CANALS', chanInputs);
const vMetric = chanRes.metrics.find((m) => m.symbol === 'V');
const qMetric = chanRes.metrics.find((m) => m.symbol === 'Q');
const fbMetric = chanRes.metrics.find((m) => m.symbol === 'FB');

assert(vMetric !== undefined && qMetric !== undefined, 'Velocity and discharge metrics must be present');
assertClose(vMetric.rawNumber!, 1.4266, 0.05, 'Manning velocity verification');
assertClose(qMetric.rawNumber!, 8.56, 0.3, 'Manning discharge verification');
assertClose(fbMetric?.rawNumber!, 1.5, 0.01, 'Freeboard verification (3.0m - 1.5m = 1.5m)');
console.log('  ✓ Reference rectangular channel Manning calculation verified.');

// Monotonicity: Increasing bed slope must increase velocity
const steepInputs: HydraulicInputs = { ...chanInputs, bedSlope: 0.004 };
const steepRes = calculateHydraulics('CHANNELS_CANALS', steepInputs);
assert(
  steepRes.metrics.find((m) => m.symbol === 'V')!.rawNumber! > vMetric.rawNumber!,
  'Steeper slope must yield higher velocity'
);
console.log('  ✓ Physical monotonicity: Steeper slope increases velocity.');

// Capacity exceedance / Overtopping trigger
const overtoppingInputs: HydraulicInputs = { ...chanInputs, upstreamWaterLevel: 3.5, height: 2.5 };
const overtoppingRes = calculateHydraulics('CHANNELS_CANALS', overtoppingInputs);
assert(overtoppingRes.schematicData.isOvertopping === true, 'Overtopping must be triggered when depth > bank height');
assert(
  overtoppingRes.warnings.some((w) => w.severity === 'RED' && w.isFailureCondition),
  'RED overtopping failure warning must be raised'
);
console.log('  ✓ Channel overtopping failure condition detected and marked RED.');

// Near-zero flow
const zeroFlowChan = calculateHydraulics('CHANNELS_CANALS', { ...chanInputs, discharge: 0.001, upstreamWaterLevel: 0.05 });
assert(zeroFlowChan.metrics.find((m) => m.symbol === 'Q')!.rawNumber! > 0, 'Near-zero flow handles without crashing');
console.log('  ✓ Near-zero flow numerical stability verified.');

// -------------------------------------------------------------
// Test Suite 2: Diversion Weirs & Anicuts
// -------------------------------------------------------------
console.log('\n[Test Suite 2] Diversion Weirs and Anicuts...');

// Free flow broad-crested weir: Q = 1.705 * b * H^1.5
// b = 100m, H1 = 2m => Q = 1.705 * 100 * 2^1.5 = 170.5 * 2.8284 = 482.25 m³/s
const weirInputs: HydraulicInputs = {
  height: 3.0,
  width: 100.0,
  upstreamWaterLevel: 2.0,
  downstreamWaterLevel: 0.2, // un-submerged
  discharge: 450.0,
};
const weirRes = calculateHydraulics('DIVERSION_WEIRS', weirInputs);
const weirCap = weirRes.metrics.find((m) => m.symbol === 'Q_cap');
assert(weirCap !== undefined, 'Weir capacity metric must exist');
assert(weirCap.rawNumber! > 450, 'Weir capacity must reflect broad-crested formula');
console.log(`  ✓ Free weir discharge: ${weirCap.rawNumber?.toFixed(1)} m³/s.`);

// Villemonte Submergence: High tailwater must reduce discharge
const submergedWeirInputs: HydraulicInputs = {
  ...weirInputs,
  downstreamWaterLevel: 1.8, // 90% submergence ratio
};
const submergedWeirRes = calculateHydraulics('DIVERSION_WEIRS', submergedWeirInputs);
const subCap = submergedWeirRes.metrics.find((m) => m.symbol === 'Q_cap')!.rawNumber!;
assert(subCap < weirCap.rawNumber!, 'Submerged weir must have lower capacity than free weir');
assert(
  submergedWeirRes.warnings.some((w) => w.parameterName.includes('Submergence')),
  'Submergence warning must be issued'
);
console.log('  ✓ Villemonte submergence reduces discharge and raises diagnostic warning.');

// -------------------------------------------------------------
// Test Suite 3: Dams & Embankments
// -------------------------------------------------------------
console.log('\n[Test Suite 3] Dams and Embankments...');

// Hydrostatic Thrust: P = 0.5 * gamma_w * H_w^2 * L
// H_w = 10m, L = 100m => P = 0.5 * 9.807 * 100 * 100 / 1000 = 49.035 MN
const damInputs: HydraulicInputs = {
  height: 14.0,
  length: 100.0,
  width: 6.0,
  sideSlope: 2.5,
  upstreamWaterLevel: 10.0,
  materialDensity: 20.0,
  foundationFrictionCoeff: 0.55,
};
const damRes = calculateHydraulics('DAMS_EMBANKMENTS', damInputs);
const pThrust = damRes.metrics.find((m) => m.symbol === 'P')!.rawNumber!;
const fosSlide = damRes.metrics.find((m) => m.symbol === 'FOS_slide')!.rawNumber!;
assertClose(pThrust, 49.035, 1.5, 'Hydrostatic thrust verification');
assert(fosSlide > 0.5, 'Sliding factor of safety must be positive');
console.log(`  ✓ Hydrostatic thrust verified at ${pThrust.toFixed(2)} MN with FOS_sliding = ${fosSlide.toFixed(2)}x.`);

// Dam Overtopping: Water level higher than dam crest
const damOvertopping = calculateHydraulics('DAMS_EMBANKMENTS', {
  ...damInputs,
  height: 8.0,
  upstreamWaterLevel: 9.5,
});
assert(damOvertopping.schematicData.isOvertopping === true, 'Dam overtopping detected');
assert(damOvertopping.overallRiskSeverity === 'RED', 'Dam overtopping marked RED severity');
console.log('  ✓ Dam overtopping condition triggers RED severity.');

// -------------------------------------------------------------
// Test Suite 4: Drainage Systems
// -------------------------------------------------------------
console.log('\n[Test Suite 4] Drainage Systems...');

const drainInputs: HydraulicInputs = {
  pipeDiameter: 1.0,
  bedSlope: 0.003,
  manningN: 0.015,
  discharge: 0.6,
};
const drainRes = calculateHydraulics('DRAINAGE_SYSTEMS', drainInputs);
const qFull = drainRes.metrics.find((m) => m.symbol === 'Q_full')!.rawNumber!;
const srMetric = drainRes.metrics.find((m) => m.symbol === 'SR')!.rawNumber!;
assert(qFull > 0, 'Full pipe capacity must be computed');
assert(srMetric > 0, 'Surcharge ratio must be computed');
console.log(`  ✓ Drainage capacity: Q_full = ${qFull.toFixed(3)} m³/s, SR = ${srMetric.toFixed(2)}x.`);

// Surcharge overflow when inflow exceeds pipe capacity
const floodedDrain = calculateHydraulics('DRAINAGE_SYSTEMS', { ...drainInputs, discharge: 5.0 });
assert(floodedDrain.overallRiskSeverity === 'RED', 'Surcharged sewer overflow marked RED');
console.log('  ✓ Surcharged sewer overflow detected and marked RED.');

// -------------------------------------------------------------
// Test Suite 5: Flood Management & Conservation of Mass
// -------------------------------------------------------------
console.log('\n[Test Suite 5] Flood Management & Mass Conservation...');

const floodInputs: HydraulicInputs = {
  peakInflow: 300.0,
  baseflow: 20.0,
  floodDurationHours: 12.0,
  detentionVolumeM3: 500000.0,
  height: 7.0,
};
const floodRes = calculateHydraulics('FLOOD_MANAGEMENT', floodInputs);
const attMetric = floodRes.metrics.find((m) => m.symbol === 'eta_att')!.rawNumber!;
const oPeakMetric = floodRes.metrics.find((m) => m.symbol === 'O_peak')!.rawNumber!;
assert(attMetric > 0 && attMetric < 100, 'Attenuation percentage must be between 0 and 100%');
assert(oPeakMetric < 300.0, 'Peak outflow must be smaller than peak inflow due to detention buffer');
console.log(`  ✓ Flood peak attenuated by ${attMetric.toFixed(1)}% (300 m³/s down to ${oPeakMetric.toFixed(1)} m³/s).`);

// -------------------------------------------------------------
// Test Suite 6: Sluices & Outlets
// -------------------------------------------------------------
console.log('\n[Test Suite 6] Sluices and Outlets (Torricelli Jet)...');

// Efflux velocity v = sqrt(2gh)
// h = 5m => v = sqrt(2 * 9.807 * 5) = sqrt(98.07) = 9.903 m/s
const sluiceInputs: HydraulicInputs = {
  gateWidth: 1.5,
  gateOpening: 0.5,
  upstreamWaterLevel: 5.0,
  downstreamWaterLevel: 0.2,
};
const sluiceRes = calculateHydraulics('SLUICES_OUTLETS', sluiceInputs);
const vExit = sluiceRes.metrics.find((m) => m.symbol === 'V_exit')!.rawNumber!;
assertClose(vExit, 9.65, 0.4, 'Torricelli exit velocity verification');
console.log(`  ✓ Torricelli exit velocity verified at ${vExit.toFixed(2)} m/s.`);

// -------------------------------------------------------------
// Test Suite 7: Parameter Sensitivity Analysis
// -------------------------------------------------------------
console.log('\n[Test Suite 7] Parameter Sensitivity Engine...');

const sens = runSensitivityAnalysis({
  category: 'CHANNELS_CANALS',
  baselineInputs: chanInputs,
  parameterKey: 'bedSlope',
  modifiedValue: 0.003,
});

assert(sens.sweepPoints.length > 5, 'Sensitivity sweep must produce multiple points');
assert(sens.percentChange > 0, 'Slope increase percent change must be positive');
assert(sens.outputPercentChange > 0, 'Velocity should increase with steeper slope');
console.log(`  ✓ Sensitivity sweep produced ${sens.sweepPoints.length} points; slope +${sens.percentChange.toFixed(0)}% yields velocity +${sens.outputPercentChange.toFixed(1)}%.`);

// -------------------------------------------------------------
// Test Suite 8: Negative / Invalid Inputs
// -------------------------------------------------------------
console.log('\n[Test Suite 8] Input Validation & Negative Handling...');

const invalidRes = calculateHydraulics('CHANNELS_CANALS', {
  width: -5.0,
  height: -2.0,
});
assert(invalidRes.overallRiskSeverity === 'RED', 'Invalid negative inputs must trigger RED severity');
assert(
  invalidRes.warnings.some((w) => w.title.includes('Physically Impossible')),
  'Explicit validation warning must be generated'
);
console.log('  ✓ Negative input dimensions flagged visibly without crashing.');

console.log('\n=== ALL JALSUTRA HYDRAULIC SIMULATION ENGINE TESTS PASSED! ===');
