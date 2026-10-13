import { EngineeringWarning, SimulationCategory, WarningSeverity } from './types.ts';

/**
 * JalSutra Live Engineering Warning Engine
 * Evaluates calculated parameters against structural, hydraulic, and geotechnical limits.
 * Returns structured warnings containing parameter, current value, applicable threshold,
 * physical rationale, affected outputs, and remediation suggestions.
 */
export function evaluateWarnings(
  category: SimulationCategory,
  params: Record<string, any>
): EngineeringWarning[] {
  const warnings: EngineeringWarning[] = [];
  let warningCounter = 1;

  const addWarning = (warning: Omit<EngineeringWarning, 'id'>) => {
    warnings.push({
      ...warning,
      id: `warn-${category}-${warningCounter++}`,
    });
  };

  switch (category) {
    case 'CHANNELS_CANALS': {
      const v = Number(params.velocity || 0);
      const fb = Number(params.freeboard ?? 1.0);
      const fr = Number(params.froude || 0);
      const q = Number(params.discharge || 0);
      const cap = Number(params.capacity || 1);
      const tau = Number(params.shearStress || 0);

      // 1. Overtopping check
      if (fb < 0) {
        addWarning({
          severity: 'RED',
          parameterName: 'Bank Freeboard',
          currentValue: fb.toFixed(2),
          unit: 'm',
          criterionLimit: 'FB >= 0.0 m (Recommended FB >= 0.5 m)',
          title: 'Canal Bank Overtopping / Inundation Condition',
          concernExplanation:
            'Calculated water depth exceeds the canal bank crest. Water will breach banks, causing embankment washouts and uncontrolled lateral inundation.',
          affectedOutputs: ['Flow Depth', 'Bank Freeboard', 'Discharge Capacity'],
          suggestedAction: 'Increase bank height, widen canal bed, or steepen longitudinal slope.',
          isFailureCondition: true,
        });
      } else if (fb < 0.3) {
        addWarning({
          severity: 'ORANGE',
          parameterName: 'Bank Freeboard',
          currentValue: fb.toFixed(2),
          unit: 'm',
          criterionLimit: 'FB >= 0.5 m for historical earthen canals',
          title: 'Critically Low Freeboard Margin',
          concernExplanation:
            'Less than 0.3 m of freeboard remains. Wind-generated waves, surging, or slight debris accumulation risk spilling over banks.',
          affectedOutputs: ['Bank Freeboard'],
          suggestedAction: 'Raise bank crest or reduce inflow discharge.',
        });
      } else if (fb < 0.6) {
        addWarning({
          severity: 'YELLOW',
          parameterName: 'Bank Freeboard',
          currentValue: fb.toFixed(2),
          unit: 'm',
          criterionLimit: 'FB >= 0.6 m standard safety buffer',
          title: 'Marginal Freeboard Buffer',
          concernExplanation: 'Freeboard is approaching minimum operational threshold under design flow.',
          affectedOutputs: ['Bank Freeboard'],
          suggestedAction: 'Monitor high monsoonal runoff spikes.',
        });
      }

      // 2. Velocity criteria (Scour vs Silting)
      if (v > 2.2) {
        addWarning({
          severity: 'RED',
          parameterName: 'Flow Velocity',
          currentValue: v.toFixed(2),
          unit: 'm/s',
          criterionLimit: 'V <= 1.8 m/s for stone/earth lined channels',
          title: 'Severe Bed & Bank Scouring Velocity',
          concernExplanation:
            'Flow velocity exceeds permissible non-scouring threshold. Hydrodynamic shear will dislodge unmortared stones and erode earthen bed lining.',
          affectedOutputs: ['Mean Velocity', 'Boundary Shear Stress'],
          suggestedAction: 'Flatter longitudinal slope, widen bottom width, or add drop structures/cascades.',
        });
      } else if (v > 1.6) {
        addWarning({
          severity: 'ORANGE',
          parameterName: 'Flow Velocity',
          currentValue: v.toFixed(2),
          unit: 'm/s',
          criterionLimit: 'V <= 1.5 m/s maximum design velocity',
          title: 'Elevated Tractive Shear Velocity',
          concernExplanation: 'Velocity is high enough to induce gradual long-term bed degradation and bank undercutting.',
          affectedOutputs: ['Mean Velocity', 'Boundary Shear Stress'],
          suggestedAction: 'Consider lining channel bed or reducing bed gradient.',
        });
      } else if (v < 0.35 && q > 0.1) {
        addWarning({
          severity: 'YELLOW',
          parameterName: 'Flow Velocity',
          currentValue: v.toFixed(2),
          unit: 'm/s',
          criterionLimit: 'V >= 0.45 m/s minimum non-silting velocity',
          title: 'Sub-Critical Silt Deposition Velocity',
          concernExplanation:
            'Water is moving too slowly to maintain suspended sediment transport. Fine silt will settle, progressively choking canal conveyance.',
          affectedOutputs: ['Mean Velocity', 'Channel Conveyance Capacity'],
          suggestedAction: 'Increase bed slope slightly or narrow cross-section to maintain self-cleansing velocity.',
        });
      }

      // 3. Froude regime check
      if (fr > 0.85 && fr < 1.15) {
        addWarning({
          severity: 'YELLOW',
          parameterName: 'Froude Number',
          currentValue: fr.toFixed(2),
          unit: 'Fr',
          criterionLimit: 'Fr <= 0.80 or Fr >= 1.25 (Transcritical Instability Zone)',
          title: 'Transcritical Flow Surface Instability',
          concernExplanation:
            'Flow is near-critical (0.85 < Fr < 1.15). Water surface will experience standing waves, severe undulating surges, and erratic depth fluctuations.',
          affectedOutputs: ['Froude Number', 'Flow Depth'],
          suggestedAction: 'Adjust bed slope to establish definitively subcritical (Fr < 0.8) tranquil regime.',
        });
      }

      break;
    }

    case 'DIVERSION_WEIRS': {
      const uHead = Number(params.upstreamHead || 0);
      const weirH = Number(params.weirHeight || 0);
      const dsHead = Number(params.downstreamHead || 0);
      const cap = Number(params.overflowCapacity || 0);
      const floodQ = Number(params.riverDischarge || 0);
      const subRatio = Number(params.submergenceRatio || 0);
      const aprVel = Number(params.apronVelocity || 0);
      const fr1 = Number(params.jumpFroude || 0);

      // Inundation capacity
      if (floodQ > cap * 1.25) {
        addWarning({
          severity: 'RED',
          parameterName: 'Weir Overflow Capacity',
          currentValue: cap.toFixed(1),
          unit: 'm³/s',
          criterionLimit: `Discharge Demand = ${floodQ.toFixed(1)} m³/s`,
          title: 'Severe Upstream River Swell / Flank Flanking Risk',
          concernExplanation:
            'Peak flood discharge exceeds weir overflow capacity by over 25%. Floodwaters will flank river training bunds and inundate upstream delta plains.',
          affectedOutputs: ['Weir Overflow Capacity', 'Upstream Water Level'],
          suggestedAction: 'Widen overflow weir crest, lower weir crest height, or open auxiliary scouring sluices.',
          isFailureCondition: true,
        });
      } else if (floodQ > cap) {
        addWarning({
          severity: 'ORANGE',
          parameterName: 'Weir Overflow Capacity',
          currentValue: cap.toFixed(1),
          unit: 'm³/s',
          criterionLimit: `Discharge Demand = ${floodQ.toFixed(1)} m³/s`,
          title: 'Deficit Overflow Headroom',
          concernExplanation:
            'Weir discharge capacity is lower than peak river flow. Flood head will rise substantially above historical operating levels.',
          affectedOutputs: ['Weir Overflow Capacity', 'Upstream Water Level'],
          suggestedAction: 'Engage flood bypass channels or raise flank levees.',
        });
      }

      // Submergence check
      if (subRatio > 0.85) {
        addWarning({
          severity: 'YELLOW',
          parameterName: 'Tailwater Submergence Ratio',
          currentValue: `${(subRatio * 100).toFixed(1)}%`,
          unit: '%',
          criterionLimit: 'Submergence <= 70% for modular free weir flow',
          title: 'Drowned / Submerged Weir Flow Condition',
          concernExplanation:
            'Tailwater elevation is high enough to drown weir crest. Modular free-discharge relationship is suppressed; discharge coefficient drops by 15–30%.',
          affectedOutputs: ['Weir Overflow Capacity', 'Downstream Hydraulic Jump'],
          suggestedAction: 'Verify downstream river channel conveyance and backwater clearance.',
        });
      }

      // Downstream scour velocity
      if (aprVel > 3.5) {
        addWarning({
          severity: 'ORANGE',
          parameterName: 'Downstream Apron Velocity',
          currentValue: aprVel.toFixed(2),
          unit: 'm/s',
          criterionLimit: 'Apron Exit Velocity <= 2.8 m/s',
          title: 'High Kinetic Energy Scour at Toe Apron',
          concernExplanation:
            'Supercritical velocity exiting weir face exceeds alluvial sand transport threshold, risking deep scour hole formation immediately past stone apron.',
          affectedOutputs: ['Bed Silt-Scour Velocity', 'Energy Dissipation'],
          suggestedAction: 'Lengthen downstream boulder rip-rap apron or incorporate stepped energy dissipation blocks.',
        });
      }

      break;
    }

    case 'DAMS_EMBANKMENTS': {
      const fosSlide = Number(params.slidingFOS || 1.5);
      const fosOver = Number(params.overturningFOS || 2.0);
      const fb = Number(params.freeboard ?? 1.5);
      const isOvertopping = Boolean(params.isOvertopping);
      const spillCap = Number(params.spillwayCapacity || 0);
      const peakFlood = Number(params.peakFlood || 0);
      const exitGrad = Number(params.exitGradient || 0);
      const critGrad = Number(params.criticalGradient || 1.0);

      // Overtopping
      if (isOvertopping || fb < 0) {
        addWarning({
          severity: 'RED',
          parameterName: 'Crest Freeboard',
          currentValue: fb.toFixed(2),
          unit: 'm',
          criterionLimit: 'FB >= 0.0 m (No Overtopping)',
          title: 'CATASTROPHIC OVERTOPPING FAILURE MODE',
          concernExplanation:
            'Reservoir level exceeds embankment crest elevation. Earthen dam embankments are highly vulnerable to rapid head-cut breaching and washout when overtopped.',
          affectedOutputs: ['Freeboard Remaining', 'Overtopping Status', 'Dam Crest Elevation'],
          suggestedAction: 'Widen emergency surplus spillway, lower reservoir full-tank level, or raise dam embankment crest.',
          isFailureCondition: true,
        });
      } else if (fb < 1.0) {
        addWarning({
          severity: 'ORANGE',
          parameterName: 'Crest Freeboard',
          currentValue: fb.toFixed(2),
          unit: 'm',
          criterionLimit: 'FB >= 1.5 m for historical earthen bunds',
          title: 'Inadequate Wave Freeboard Safety Buffer',
          concernExplanation:
            'Remaining freeboard is under 1.0 meter. Monsoon storm wind setup and wave run-up can easily overtop embankment crest.',
          affectedOutputs: ['Freeboard Remaining'],
          suggestedAction: 'Increase spillway discharge width or restrict peak monsoon retention level.',
        });
      }

      // Sliding stability
      if (fosSlide < 1.1) {
        addWarning({
          severity: 'RED',
          parameterName: 'Sliding Factor of Safety',
          currentValue: fosSlide.toFixed(2),
          unit: 'FOS',
          criterionLimit: 'FOS >= 1.50 under design hydrostatic load',
          title: 'Basal Shear Sliding Instability',
          concernExplanation:
            'Sliding factor of safety is dangerously close to unity (FOS < 1.1). Total horizontal hydrostatic thrust exceeds foundation shear resistance.',
          affectedOutputs: ['Sliding Factor of Safety', 'Base Width'],
          suggestedAction: 'Flatten upstream/downstream slopes, widen base width, or construct downstream toe berm.',
          isFailureCondition: true,
        });
      } else if (fosSlide < 1.5) {
        addWarning({
          severity: 'ORANGE',
          parameterName: 'Sliding Factor of Safety',
          currentValue: fosSlide.toFixed(2),
          unit: 'FOS',
          criterionLimit: 'FOS >= 1.50 standard civil requirement',
          title: 'Marginal Sliding Safety Margin',
          concernExplanation:
            'FOS is below the standard 1.5 threshold. Foundation pore pressure spikes during intense monsoon could precipitate progressive sliding.',
          affectedOutputs: ['Sliding Factor of Safety'],
          suggestedAction: 'Provide upstream clay cutoff or add rockfill toe counterweight.',
        });
      }

      // Seepage / Piping
      if (exitGrad > critGrad * 0.5) {
        addWarning({
          severity: 'RED',
          parameterName: 'Seepage Exit Gradient',
          currentValue: exitGrad.toFixed(3),
          unit: 'i_exit',
          criterionLimit: `Safety limit <= ${(critGrad * 0.25).toFixed(3)} (1/4th critical)`,
          title: 'Internal Piping / Subsurface Boil Hazard',
          concernExplanation:
            'Exit hydraulic gradient exceeds safe threshold (approaching flotation). Subsurface piping will wash out foundation fines, creating collapse voids.',
          affectedOutputs: ['Seepage Indicators', 'Seepage Flow Rate'],
          suggestedAction: 'Deepen upstream impermeable cutoff trench or install downstream graded inverted filter.',
          isFailureCondition: true,
        });
      } else if (exitGrad > critGrad * 0.25) {
        addWarning({
          severity: 'YELLOW',
          parameterName: 'Seepage Exit Gradient',
          currentValue: exitGrad.toFixed(3),
          unit: 'i_exit',
          criterionLimit: `Safe threshold <= ${(critGrad * 0.25).toFixed(3)}`,
          title: 'Elevated Downstream Seepage Gradient',
          concernExplanation: 'Seepage emergence at toe requires monitoring for turbid water or boiling sands.',
          affectedOutputs: ['Seepage Indicators'],
          suggestedAction: 'Add toe drainage trench and rock riprap pitching.',
        });
      }

      // Spillway vs peak flood
      if (spillCap > 0 && peakFlood > spillCap * 1.15) {
        addWarning({
          severity: 'ORANGE',
          parameterName: 'Spillway Capacity',
          currentValue: `${spillCap.toFixed(1)} m³/s`,
          unit: 'm³/s',
          criterionLimit: `Peak Inflow Demand = ${peakFlood.toFixed(1)} m³/s`,
          title: 'Spillway Discharge Capacity Deficit',
          concernExplanation:
            'Surplus weir cannot evacuate peak catchment runoff calculated by hydrological empirical methods (e.g. Ryves/Inglis).',
          affectedOutputs: ['Spillway Capacity', 'Crest Freeboard'],
          suggestedAction: 'Lengthen surplus weir crest or provide secondary breach saddle.',
        });
      }

      break;
    }

    case 'DRAINAGE_SYSTEMS': {
      const surcharge = Number(params.surchargeRatio || 0);
      const v = Number(params.velocity || 0);
      const isPonding = Boolean(params.isPonding);
      const fillingPercent = Number(params.fillingPercent || 0);

      if (isPonding || surcharge > 1.0) {
        addWarning({
          severity: 'RED',
          parameterName: 'Drain Conveyance Surcharge Ratio',
          currentValue: surcharge.toFixed(2),
          unit: 'Q_in / Q_cap',
          criterionLimit: 'Ratio <= 1.00 (Gravity Free-Surface Flow)',
          title: 'Urban Sewer Backwater Surcharge & Street Inundation',
          concernExplanation:
            'Inflow volume exceeds maximum sewer pipe/vault carrying capacity. Water rises into manholes and overflows into ancient street conduits.',
          affectedOutputs: ['Drainage Capacity', 'Street Ponding Risk'],
          suggestedAction: 'Enlarge corbelled culvert dimensions or provide overflow relief channels.',
          isFailureCondition: true,
        });
      } else if (surcharge > 0.85) {
        addWarning({
          severity: 'ORANGE',
          parameterName: 'Drain Capacity Utilization',
          currentValue: `${(surcharge * 100).toFixed(0)}%`,
          unit: '%',
          criterionLimit: 'Capacity utilization <= 80% design guideline',
          title: 'High Sewer Surcharge Approaching Pressurization',
          concernExplanation: 'Sewer conduit is nearly full; vulnerable to blockages by floating debris.',
          affectedOutputs: ['Drainage Capacity'],
          suggestedAction: 'Clean sewer silt traps and inspect downstream outfall.',
        });
      }

      if (v < 0.6 && Number(params.discharge || 0) > 0.05) {
        addWarning({
          severity: 'YELLOW',
          parameterName: 'Sewer Flow Velocity',
          currentValue: v.toFixed(2),
          unit: 'm/s',
          criterionLimit: 'V >= 0.75 m/s self-cleansing sanitary minimum',
          title: 'Sub-Cleansing Velocity / Sediment Deposition Risk',
          concernExplanation:
            'Flow velocity is below sanitary self-cleansing threshold. Solid debris and organic waste will accumulate on invert, causing blockages.',
          affectedOutputs: ['Flow Velocity', 'Drainage Capacity'],
          suggestedAction: 'Steepen sewer gradient or flush with auxiliary storm inlet.',
        });
      }

      break;
    }

    case 'FLOOD_MANAGEMENT': {
      const peakIn = Number(params.peakInflow || 0);
      const peakOut = Number(params.peakOutflow || 0);
      const maxStorage = Number(params.maxStorageUsed || 0);
      const capStorage = Number(params.detentionCapacity || 1);
      const isOvertopping = Boolean(params.isOvertopping);

      if (isOvertopping || maxStorage > capStorage) {
        addWarning({
          severity: 'RED',
          parameterName: 'Detention Basin Capacity',
          currentValue: `${(maxStorage / 1000).toFixed(1)}k m³`,
          unit: 'm³',
          criterionLimit: `Max Capacity = ${(capStorage / 1000).toFixed(1)}k m³`,
          title: 'Flood Detention Basin Overflow / Sump Inundation',
          concernExplanation:
            'Inflow hydrograph volume completely filled detention storage. Uncontrolled flood spill occurs over perimeter dykes.',
          affectedOutputs: ['Storage Balance', 'Peak Outflow Discharge'],
          suggestedAction: 'Deepen settling basin, raise perimeter bunds, or increase controlled relief discharge.',
          isFailureCondition: true,
        });
      } else if (maxStorage > capStorage * 0.85) {
        addWarning({
          severity: 'ORANGE',
          parameterName: 'Storage Volume Consumed',
          currentValue: `${((maxStorage / capStorage) * 100).toFixed(0)}%`,
          unit: '%',
          criterionLimit: 'Storage consumption <= 85%',
          title: 'Critical Flood Storage Utilization',
          concernExplanation: 'Over 85% of detention volume is occupied; minimal buffer remains for subsequent storm pulses.',
          affectedOutputs: ['Storage Balance'],
          suggestedAction: 'Accelerate controlled draw-down releases before secondary rainfall arrives.',
        });
      }

      break;
    }

    case 'SLUICES_OUTLETS': {
      const v = Number(params.exitVelocity || 0);
      const q = Number(params.discharge || 0);
      const head = Number(params.head || 0);

      if (v > 10.0) {
        addWarning({
          severity: 'ORANGE',
          parameterName: 'Sluice Exit Velocity',
          currentValue: v.toFixed(2),
          unit: 'm/s',
          criterionLimit: 'Exit velocity <= 8.0 m/s for unlined downstream canals',
          title: 'Extreme Torricelli Jet Velocity / Severe Downstream Scour',
          concernExplanation:
            'Pressurized head creates high-velocity jet ($v = \\sqrt{2gh}$) exiting sluice tunnel. Destructive turbulence will tear up downstream bed riprap.',
          affectedOutputs: ['Exit Velocity', 'Scour Index'],
          suggestedAction: 'Incorporate baffle piers, cistern stilling basin, or operate gate at throttled aperture.',
        });
      } else if (v > 6.0) {
        addWarning({
          severity: 'YELLOW',
          parameterName: 'Sluice Exit Velocity',
          currentValue: v.toFixed(2),
          unit: 'm/s',
          criterionLimit: 'Exit velocity <= 5.0 m/s without stilling basin',
          title: 'High Scouring Potential at Sluice Outlet',
          concernExplanation: 'Requires granite bed pitching downstream of sluice headwall to avoid foundation undermining.',
          affectedOutputs: ['Exit Velocity'],
          suggestedAction: 'Inspect downstream stone apron pitching.',
        });
      }

      break;
    }

    case 'IRRIGATION_SYSTEMS': {
      const adequacy = Number(params.adequacyRatio || 1.0);
      const tailEndDeficit = Number(params.tailEndDeficit || 0);

      if (adequacy < 0.65) {
        addWarning({
          severity: 'RED',
          parameterName: 'Irrigation Water Adequacy Ratio',
          currentValue: `${(adequacy * 100).toFixed(0)}%`,
          unit: '%',
          criterionLimit: 'Adequacy >= 100% of Agrarian Crop Duty Demand',
          title: 'Severe Crop Water Deficit / Drought Failure Condition',
          concernExplanation:
            'Delivered canal discharge provides less than 65% of required agricultural crop water duty (delta). Substantial crop withering predicted.',
          affectedOutputs: ['Command Area Supported', 'Irrigation Water Adequacy Ratio'],
          suggestedAction: 'Increase headworks diversion intake or prioritize high-value core command acres.',
        });
      } else if (adequacy < 0.85) {
        addWarning({
          severity: 'ORANGE',
          parameterName: 'Irrigation Water Adequacy Ratio',
          currentValue: `${(adequacy * 100).toFixed(0)}%`,
          unit: '%',
          criterionLimit: 'Adequacy >= 90% recommended threshold',
          title: 'Tail-End Agrarian Water Deficit',
          concernExplanation:
            'Canal conveyance losses and transmission lag result in dry distributaries at distant tail-end villages (*Kadaikkodi*).',
          affectedOutputs: ['Tail-End Delivery Ratio'],
          suggestedAction: 'Enforce rotational water turn allocation (*Murai* system) or line main feeder canals.',
        });
      }

      break;
    }

    case 'RESERVOIRS_TANKS': {
      const supplyDays = Number(params.supplyDays || 180);
      const evapLossPercent = Number(params.evapLossPercent || 25);
      const siltationLossPercent = Number(params.siltationLossPercent || 15);

      if (supplyDays < 45) {
        addWarning({
          severity: 'RED',
          parameterName: 'Drought Reserve Supply',
          currentValue: `${supplyDays.toFixed(0)} days`,
          unit: 'days',
          criterionLimit: 'Minimum 90 days required for dry season survival',
          title: 'Critical Potable Water Exhaustion Risk',
          concernExplanation:
            'Stored reservoir volume cannot sustain local community demands through expected dry season duration. Extreme water scarcity imminent.',
          affectedOutputs: ['Estimated Village Drought Reserve', 'Stored Usable Volume'],
          suggestedAction: 'Deepen reservoir bed, desilt basin, or divert supplementary runoff.',
        });
      } else if (supplyDays < 90) {
        addWarning({
          severity: 'ORANGE',
          parameterName: 'Drought Reserve Supply',
          currentValue: `${supplyDays.toFixed(0)} days`,
          unit: 'days',
          criterionLimit: 'Reserve >= 120 days recommended buffer',
          title: 'Sub-Optimal Dry Season Reserve Margin',
          concernExplanation: 'Reservoir margin is tight; vulnerable if monsoon arrival is delayed by even 2–3 weeks.',
          affectedOutputs: ['Estimated Village Drought Reserve'],
          suggestedAction: 'Institute domestic rationing or limit agricultural draw-down.',
        });
      }

      if (evapLossPercent > 40) {
        addWarning({
          severity: 'YELLOW',
          parameterName: 'Evaporation Loss Fraction',
          currentValue: `${evapLossPercent.toFixed(1)}%`,
          unit: '%',
          criterionLimit: 'Evaporation loss <= 30% for efficient storage',
          title: 'High Surface Evaporation Dissipation',
          concernExplanation:
            'Shallow, high surface-area to depth ratio creates heavy thermal evaporation loss under tropical solar exposure.',
          affectedOutputs: ['Evaporative Loss Rate'],
          suggestedAction: 'Increase water depth or partition storage into deeper multi-tier cascading ponds.',
        });
      }

      break;
    }
  }

  // If no warnings were triggered, append a reassuring GREEN verification status
  if (warnings.length === 0) {
    warnings.push({
      id: `warn-${category}-ok`,
      severity: 'GREEN',
      parameterName: 'All Engineering Criteria',
      currentValue: 'Compliant',
      unit: '',
      criterionLimit: 'Within Safe Design Margins',
      title: 'Stable Hydraulic & Structural Equilibrium',
      concernExplanation:
        'All calculated hydrodynamic pressures, flow velocities, freeboards, and capacities are well within accepted civil and geotechnical safety envelopes.',
      affectedOutputs: ['All Primary Metrics'],
      suggestedAction: 'Operating normally. Maintain routine periodic masonry inspection.',
    });
  }

  return warnings;
}

export function getWorstSeverity(warnings: EngineeringWarning[]): WarningSeverity {
  const order: Record<WarningSeverity, number> = { GREEN: 0, YELLOW: 1, ORANGE: 2, RED: 3 };
  let worst: WarningSeverity = 'GREEN';
  for (const w of warnings) {
    if (order[w.severity] > order[worst]) {
      worst = w.severity;
    }
  }
  return worst;
}
