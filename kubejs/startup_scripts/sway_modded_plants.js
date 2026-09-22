//Registers the pack's modded plants with Sway, so they bend away from the
//player like vanilla grass does.
//
//Sway has no tags and no block list in its config - SwayAPI.isInteractive is
//just "is this block in the registry", and SwayRegistry.initialize() fills it
//with about 90 hardcoded vanilla blocks and nothing else. Modded coverage comes
//from Interactive Foliage, which Sway depends on: its ModCompatRegistry calls
//SwayAPI.register(block, 1.0f) for hardcoded id lists covering Biomes O' Plenty,
//Farmer's Delight, Serene Shrubbery and No Man's Land. Nothing in either mod
//covers Regions Unexplored, Oh The Biomes We've Gone, Eternal Starlight or any
//of the pack's other plant mods, which is why regions_unexplored:windswept_grass
//stood still while biomesoplenty:high_grass worked.
//
//This makes the same SwayAPI.register call Interactive Foliage makes, but sweeps
//the block registry by class instead of naming ids, so a new plant mod is
//covered without editing a list - the failure mode those hardcoded lists already
//have. BushBlock is the common ancestor of essentially everything Sway registers
//by hand (DoublePlantBlock, TallGrassBlock, FlowerBlock, SaplingBlock, CropBlock
//and MushroomBlock all extend it), and regions_unexplored:windswept_grass is a
//RuDoublePlantBlock -> DoublePlantBlock -> BushBlock.
//
//postInit is the latest hook that still has full block registries, and it is
//too late for the models to be wrapped: the reload that bakes them starts before
//it. That matters more than it sounds, because ALL the bending lives in the
//wrapped model - SwayModel is a BakedModel wrapper that calls
//SwayBehaviorDeformer.deform. A block whose model was not wrapped never bends,
//and the plant instead draws twice: the static unwrapped model from the chunk
//mesh, plus the bending copy from Interactive Foliage's GPU renderer.
//
//So the plants registered here need one resource reload before they look right.
//F3+T does it. Turning off the GPU renderer does NOT - that removes the bending
//copy and leaves the static one, so the plants stop reacting altogether. Tried
//in game; see the Sway section in CLAUDE.md before reaching for it again.
//
//postInit does run after Interactive Foliage's own two registries -
//ModTemplate.onInitialize does Sway's vanilla set and onRegistriesReady does the
//compat lists - so the isInteractive check below really does skip everything
//already covered.
//
//1.0 is the multiplier every vanilla block and every Interactive Foliage compat
//entry uses, so this gives modded plants the same strength as their vanilla
//counterparts. SwayAPI.register sets the standard pipeline - entity collision,
//proximity force, double-plant multiblock, standard deformation - so a two-block
//plant is handled the way vanilla tall grass is.
//
//Sugar cane and the vines are deliberately left alone: Sway gives them their own
//pipelines in registerSugarCane/registerVines, and neither is a BushBlock, so the
//filter below cannot reach them.

//Plants that do not come out right when Sway is given them. An excluded block
//keeps its vanilla behaviour - it stands still, but it renders once and looks
//correct, which is better than a plant that draws twice.
//
//Add an id here when a plant renders doubled or otherwise misbehaves in game.
//There is no way to predict it from the jars, so this list only grows from
//things actually seen.
const SWAY_EXCLUDE = [
  //Draws two models until a resource reload.
  'regions_unexplored:windswept_grass'
]

StartupEvents.postInit(event => {
  //Startup scripts run on both sides. Everything below is client rendering, and
  //SwayAPI.register reaches into Sway's client behaviour classes, so a dedicated
  //server must not touch it.
  if (!Platform.isClientEnvironment()) return
  if (!Platform.isLoaded('sway')) return

  //tryLoadClass rather than loadClass: KubeJS throws on a class that is missing
  //*or* blocked by its class filter, and plants that do not bend are a better
  //outcome than a startup script that dies if Sway is ever removed.
  //(com.github.razorplay01 matches nothing in kubejs.classfilter.txt, and
  //ClassFilter.isAllowed0 falls through to allow, so it is reachable.)
  const SwayAPI = Java.tryLoadClass('com.github.razorplay01.sway.api.SwayAPI')
  const BushBlock = Java.tryLoadClass('net.minecraft.world.level.block.BushBlock')
  const BuiltInRegistries = Java.tryLoadClass('net.minecraft.core.registries.BuiltInRegistries')

  if (!SwayAPI || !BushBlock || !BuiltInRegistries) {
    console.error('[sway] could not load SwayAPI, BushBlock or BuiltInRegistries - no modded plants registered')
    return
  }

  const perNamespace = {}
  let added = 0

  BuiltInRegistries.BLOCK.forEach(block => {
    if (!(block instanceof BushBlock)) return
    //Already handled by Sway itself or by Interactive Foliage's compat lists.
    if (SwayAPI.isInteractive(block)) return

    const id = BuiltInRegistries.BLOCK.getKey(block).toString()
    if (SWAY_EXCLUDE.indexOf(id) !== -1) return

    SwayAPI.register(block, 1.0)
    added++
    const namespace = id.split(':')[0]
    perNamespace[namespace] = (perNamespace[namespace] || 0) + 1
  })

  const summary = Object.keys(perNamespace)
    .sort()
    .map(ns => `${ns} ${perNamespace[ns]}`)
    .join(', ')

  console.info(`[sway] registered ${added} modded plants: ${summary}`)
})
