<script>
  // Tools are loaded on demand: one chunk per tool.
  const loaders = import.meta.glob(['./*.svelte', '!./ToolHost.svelte', '!./ToolShell.svelte', '!./FormulaVisualiser.svelte']);

  const REGISTRY = {
  addrModes: 'AddressingModes',
  amdahl: 'AmdahlCalculator',
  amdahlCompare: 'AmdahlCompare',
  bpFSM: 'BranchPredictorFSM',
  cacheSim: 'CacheSimulator',
  clockConv: 'ClockConverter',
  clockDrill: 'ClockDrill',
  conceptMap: 'ConceptMap',
  cpiMix: 'CpiMixCalculator',
  cpuRace: 'CpuRace',
  cpuTime: 'CpuTimeSolver',
  cycleCompare: 'CycleCompareTool',
  datapath: 'DatapathTool',
  depFinder: 'DependencyFinder',
  dff: 'DFlipFlopTool',
  distance: 'HazardDistanceDemo',
  dp3: 'ThreeClockDatapath',
  encoder: 'InstructionEncoder',
  hazDrill: 'HazardDrill',
  isaSort: 'IsaMicroarchSorter',
  laundry: 'LaundryPipeline',
  layers: 'AbstractionLayers',
  mips: 'MipsSimulator',
  mock: 'MockTest',
  numWheel: 'NumberWheel',
  numlab: 'NumberLab',
  offset: 'ArrayOffsetTool',
  oneLine: 'OneLineOfC',
  pipeBW: 'PipelineBandwidth',
  pipeSim: 'PipelineSimulator',
  pseudo: 'PseudoExpander',
  scTiming: 'SingleCycleTiming',
  sciLab: 'ScientificNotationLab',
  stageWalk: 'StageWalkTool',
  stallCPI: 'StallCpiTool',
  translate: 'TranslationStepper',
  vmTrans: 'VirtualMemoryTool'
  };

  let { name, opts = {} } = $props();

  const load = $derived.by(() => {
    const file = REGISTRY[name];
    return file ? loaders['./' + file + '.svelte']?.() : null;
  });
</script>

{#if load}
  {#await load then mod}
    {@const Comp = mod.default}
    <Comp {opts} />
  {/await}
{:else}
  <div class="card err-msg">Tool not found: <code>{name}</code></div>
{/if}
