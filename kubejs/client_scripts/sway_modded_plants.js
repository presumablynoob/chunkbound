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
//stands still while biomesoplenty:high_grass works.
//
//This makes the same SwayAPI.register call Interactive Foliage makes, but sweeps
//the block registry by class instead of naming ids, so a new plant mod is
//covered without editing a list - the failure mode those hardcoded lists already
//have. BushBlock is the common ancestor of essentially everything Sway registers
//by hand (DoublePlantBlock, TallGrassBlock, FlowerBlock, SaplingBlock, CropBlock
//and MushroomBlock all extend it), and regions_unexplored:windswept_grass is a
//RuDoublePlantBlock -> DoublePlantBlock -> BushBlock.
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
//
//BlockPipelineRegistry.setPipeline evicts the block's cached pipeline, so
//registering this late takes effect rather than being ignored.

//Any block that ends up looking wrong when it bends can be listed here.
const SWAY_EXCLUDE = [
]

let swayPlantsRegistered = false

ClientEvents.loggedIn(event => {
  if (swayPlantsRegistered) return
  swayPlantsRegistered = true

  if (!Platform.isLoaded('sway')) return

  //tryLoadClass rather than loadClass: KubeJS throws on a class that is missing
  //*or* blocked by its class filter, and plants that do not bend are a better
  //outcome than a handler that throws every time the player joins a world.
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
