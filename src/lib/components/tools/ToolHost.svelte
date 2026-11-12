<script>
  import AddressingModes from './AddressingModes.svelte';
  import AmdahlCalculator from './AmdahlCalculator.svelte';
  import AmdahlCompare from './AmdahlCompare.svelte';
  import BranchPredictorFSM from './BranchPredictorFSM.svelte';
  import CacheSimulator from './CacheSimulator.svelte';
  import ClockConverter from './ClockConverter.svelte';
  import ClockDrill from './ClockDrill.svelte';
  import ConceptMap from './ConceptMap.svelte';
  import CpiMixCalculator from './CpiMixCalculator.svelte';
  import CpuRace from './CpuRace.svelte';
  import CpuTimeSolver from './CpuTimeSolver.svelte';
  import CycleCompareTool from './CycleCompareTool.svelte';
  import DatapathTool from './DatapathTool.svelte';
  import DependencyFinder from './DependencyFinder.svelte';
  import DFlipFlopTool from './DFlipFlopTool.svelte';
  import HazardDistanceDemo from './HazardDistanceDemo.svelte';
  import ThreeClockDatapath from './ThreeClockDatapath.svelte';
  import InstructionEncoder from './InstructionEncoder.svelte';
  import HazardDrill from './HazardDrill.svelte';
  import IsaMicroarchSorter from './IsaMicroarchSorter.svelte';
  import LaundryPipeline from './LaundryPipeline.svelte';
  import AbstractionLayers from './AbstractionLayers.svelte';
  import MipsSimulator from './MipsSimulator.svelte';
  import MockTest from './MockTest.svelte';
  import NumberWheel from './NumberWheel.svelte';
  import NumberLab from './NumberLab.svelte';
  import ArrayOffsetTool from './ArrayOffsetTool.svelte';
  import OneLineOfC from './OneLineOfC.svelte';
  import PipelineBandwidth from './PipelineBandwidth.svelte';
  import PipelineSimulator from './PipelineSimulator.svelte';
  import PseudoExpander from './PseudoExpander.svelte';
  import SingleCycleTiming from './SingleCycleTiming.svelte';
  import ScientificNotationLab from './ScientificNotationLab.svelte';
  import StageWalkTool from './StageWalkTool.svelte';
  import StallCpiTool from './StallCpiTool.svelte';
  import TranslationStepper from './TranslationStepper.svelte';
  import VirtualMemoryTool from './VirtualMemoryTool.svelte';

  let { name, opts = {} } = $props();

  const REGISTRY = {
    addrModes: AddressingModes,
    amdahl: AmdahlCalculator,
    amdahlCompare: AmdahlCompare,
    bpFSM: BranchPredictorFSM,
    cacheSim: CacheSimulator,
    clockConv: ClockConverter,
    clockDrill: ClockDrill,
    conceptMap: ConceptMap,
    cpiMix: CpiMixCalculator,
    cpuRace: CpuRace,
    cpuTime: CpuTimeSolver,
    cycleCompare: CycleCompareTool,
    datapath: DatapathTool,
    depFinder: DependencyFinder,
    dff: DFlipFlopTool,
    distance: HazardDistanceDemo,
    dp3: ThreeClockDatapath,
    encoder: InstructionEncoder,
    hazDrill: HazardDrill,
    isaSort: IsaMicroarchSorter,
    laundry: LaundryPipeline,
    layers: AbstractionLayers,
    mips: MipsSimulator,
    mock: MockTest,
    numWheel: NumberWheel,
    numlab: NumberLab,
    offset: ArrayOffsetTool,
    oneLine: OneLineOfC,
    pipeBW: PipelineBandwidth,
    pipeSim: PipelineSimulator,
    pseudo: PseudoExpander,
    scTiming: SingleCycleTiming,
    sciLab: ScientificNotationLab,
    stageWalk: StageWalkTool,
    stallCPI: StallCpiTool,
    translate: TranslationStepper,
    vmTrans: VirtualMemoryTool
  };

  const Comp = $derived(REGISTRY[name]);
</script>

{#if Comp}
  <Comp {opts} />
{:else}
  <div class="card err-msg">Tool not found: <code>{name}</code></div>
{/if}
