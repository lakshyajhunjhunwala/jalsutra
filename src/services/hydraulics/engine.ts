import {
  HydraulicCalculationResult,
  HydraulicInputs,
  SimulationCategory,
} from './types.ts';
import { calculateChannelsCanals } from './channelsCanals.ts';
import { calculateDiversionWeirs } from './diversionWeirs.ts';
import { calculateDamsEmbankments } from './damsEmbankments.ts';
import { calculateDrainageSystems } from './drainageSystems.ts';
import { calculateFloodManagement } from './floodManagement.ts';
import { calculateSluicesOutlets } from './sluicesOutlets.ts';
import { calculateIrrigationSystems } from './irrigationSystems.ts';
import { calculateReservoirsTanks } from './reservoirsTanks.ts';

/**
 * Validates inputs for physically impossible or invalid negative dimensions.
 * Appends explicit warnings rather than silently clamping dangerous inputs.
 */
function validateInputs(category: SimulationCategory, inputs: HydraulicInputs): string[] {
  const issues: string[] = [];

  if (inputs.height !== undefined && inputs.height <= 0) {
    issues.push('Structure height must be positive and non-zero.');
  }
  if (inputs.width !== undefined && inputs.width <= 0) {
    issues.push('Structure/bed width must be positive and non-zero.');
  }
  if (inputs.length !== undefined && inputs.length <= 0) {
    issues.push('Length must be positive and non-zero.');
  }
  if (inputs.bedSlope !== undefined && inputs.bedSlope <= 0) {
    issues.push('Bed slope must be positive for gravity-driven flow.');
  }
  if (inputs.manningN !== undefined && (inputs.manningN <= 0 || inputs.manningN > 0.2)) {
    issues.push('Manning n roughness must be between 0.008 and 0.20.');
  }
  if (inputs.upstreamWaterLevel !== undefined && inputs.upstreamWaterLevel < 0) {
    issues.push('Upstream water level cannot be negative.');
  }
  if (inputs.discharge !== undefined && inputs.discharge < 0) {
    issues.push('Discharge flow rate cannot be negative.');
  }

  return issues;
}

/**
 * Central Hydraulic Calculation Engine Dispatcher
 * Routes the simulation inquiry to the mathematically rigorous category-specific model.
 */
export function calculateHydraulics(
  category: SimulationCategory,
  inputs: HydraulicInputs
): HydraulicCalculationResult {
  const issues = validateInputs(category, inputs);

  let result: HydraulicCalculationResult;

  switch (category) {
    case 'CHANNELS_CANALS':
      result = calculateChannelsCanals(inputs);
      break;

    case 'IRRIGATION_SYSTEMS':
      result = calculateIrrigationSystems(inputs);
      break;

    case 'DAMS_EMBANKMENTS':
      result = calculateDamsEmbankments(inputs);
      break;

    case 'DIVERSION_WEIRS':
      result = calculateDiversionWeirs(inputs);
      break;

    case 'DRAINAGE_SYSTEMS':
      result = calculateDrainageSystems(inputs);
      break;

    case 'FLOOD_MANAGEMENT':
      result = calculateFloodManagement(inputs);
      break;

    case 'SLUICES_OUTLETS':
      result = calculateSluicesOutlets(inputs);
      break;

    case 'RESERVOIRS_TANKS':
      result = calculateReservoirsTanks(inputs);
      break;

    default:
      result = calculateChannelsCanals(inputs);
      break;
  }

  // If validation found physically impossible inputs, prepend a severe RED warning
  if (issues.length > 0) {
    result.warnings.unshift({
      id: `warn-validation-${Date.now()}`,
      severity: 'RED',
      parameterName: 'Input Dimensional Validation',
      currentValue: 'Invalid / Negative',
      unit: '',
      criterionLimit: 'Strictly Positive Physical Dimensions Required',
      title: 'Physically Impossible Input Combination Detected',
      concernExplanation: `Simulation inputs violate physical constraints: ${issues.join('; ')}`,
      affectedOutputs: ['All Dependent Outputs'],
      suggestedAction: 'Reset to standard dimensions or enter realistic non-negative parameters.',
      isFailureCondition: true,
    });
    result.overallRiskSeverity = 'RED';
  }

  return result;
}
