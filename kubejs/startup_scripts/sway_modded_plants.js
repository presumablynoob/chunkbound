//Gives the pack's modded plants Sway's bend-away-from-the-player effect.
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
//THE TIMING IS THE WHOLE PROBLEM, so read this before changing the hook.
//All the bending lives in the wrapped model: SwayModel is a BakedModel wrapper
//that calls SwayBehaviorDeformer.deform, and Sway's ModelBlockRendererMixin only
//records the current block position for it. Interactive Foliage's
//NeoforgeFoliageHooks.wrapModels swaps those wrappers in on
//ModelEvent.ModifyBakingResult, for every block interactive AT BAKE TIME. A
//block made interactive after the bake has an unwrapped model that can never
//bend, and renders twice instead - the static unwrapped model from the chunk
//mesh, plus a bending copy from the GPU renderer.
//
//Enumerating the block registry cannot work, because no KubeJS hook runs between
//the block registries being complete and the models being baked. StartupEvents
//.postInit is the latest hook with full registries and still lands after the
//bake; ClientEvents.atlasSpriteRegistry never fires at all. That left reloading
//resources on every world join, which is not worth it.
//
//So this does not enumerate. SwayAPI.registerGlobalBehavior takes a
//Predicate<Block>, and BlockPipelineRegistry evaluates it lazily inside
//hasPipeline/buildPipeline - which is what isInteractive calls. The predicate
//therefore answers correctly at bake time no matter when it was handed over, and
//needs no populated registry when it is. StartupEvents.init is used because it
//runs before the first resource reload even starts.
//
//The five behaviours and their priorities mirror what SwayAPI.register sets up
//for a single block, where setPipeline assigns (i + 1) * 100 down the list, so a
//two-block plant is handled the way vanilla tall grass is. 1.0 is the multiplier
//every vanilla and Interactive Foliage entry uses.
//
//Sugar cane and the vines keep their own pipelines: they are not BushBlocks, so
//the predicate cannot reach them.

//Plants that do not come out right. An excluded block keeps vanilla behaviour -
//it stands still, but renders once. Grows from what is seen in game.
const SWAY_EXCLUDE = [
]

StartupEvents.init(event => {
  //Startup scripts run on both sides, and this reaches Sway's client behaviour
  //classes, so a dedicated server must not touch it.
  if (!Platform.isClientEnvironment()) return
  if (!Platform.isLoaded('sway')) return

  //tryLoadClass rather than loadClass: KubeJS throws on a class that is missing
  //*or* blocked by its class filter, and plants that do not bend are a better
  //outcome than a startup script that dies if Sway is ever removed.
  //(com.github.razorplay01 matches nothing in kubejs.classfilter.txt, and
  //ClassFilter.isAllowed0 falls through to allow, so it is reachable.)
  const SwayAPI = Java.tryLoadClass('com.github.razorplay01.sway.api.SwayAPI')
  const Builtin = Java.tryLoadClass('com.github.razorplay01.sway.client.behavior.BuiltinBehaviors')
  const BushBlock = Java.tryLoadClass('net.minecraft.world.level.block.BushBlock')
  const BuiltInRegistries = Java.tryLoadClass('net.minecraft.core.registries.BuiltInRegistries')

  if (!SwayAPI || !Builtin || !BushBlock || !BuiltInRegistries) {
    console.error('[sway] could not load Sway or Minecraft classes - modded plants will not bend')
    return
  }

  //SwayAPI.register does this before touching any key; the keys are null until
  //it has run.
  Builtin.ensureRegistered()

  const registry = SwayAPI.getRegistry()

  const isModdedPlant = block => {
    if (!(block instanceof BushBlock)) return false
    //Anything Sway or Interactive Foliage registered explicitly already has its
    //own pipeline. Leaving those to their own entries avoids stacking a second
    //copy of every behaviour on top.
    if (registry.containsKey(block)) return false
    if (SWAY_EXCLUDE.length === 0) return true
    return SWAY_EXCLUDE.indexOf(BuiltInRegistries.BLOCK.getKey(block).toString()) === -1
  }

  SwayAPI.registerGlobalBehavior(Builtin.ENTITY_COLLISION_KEY, 100, isModdedPlant)
  SwayAPI.registerGlobalBehavior(Builtin.PROXIMITY_FORCE_KEY, 200, isModdedPlant)
  SwayAPI.registerGlobalBehavior(Builtin.DOUBLE_PLANT_MULTIBLOCK_KEY, 300, isModdedPlant)
  SwayAPI.registerGlobalBehavior(Builtin.STANDARD_DEFORMATION_KEY, 400, isModdedPlant)
  SwayAPI.registerGlobalBehavior(Builtin.multiplierKey(1.0), 500, isModdedPlant)

  console.info('[sway] registered the modded-plant behaviours globally, ahead of model baking')
})

//Purely informational: the predicate above is lazy, so nothing has been counted
//by the time it is handed over. This reports what it actually matches once the
//registries are complete, which is the only way to see the scope of it.
StartupEvents.postInit(event => {
  if (!Platform.isClientEnvironment()) return
  if (!Platform.isLoaded('sway')) return

  const SwayAPI = Java.tryLoadClass('com.github.razorplay01.sway.api.SwayAPI')
  const BushBlock = Java.tryLoadClass('net.minecraft.world.level.block.BushBlock')
  const BuiltInRegistries = Java.tryLoadClass('net.minecraft.core.registries.BuiltInRegistries')

  if (!SwayAPI || !BushBlock || !BuiltInRegistries) return

  const perNamespace = {}
  let matched = 0

  BuiltInRegistries.BLOCK.forEach(block => {
    if (!(block instanceof BushBlock)) return
    if (!SwayAPI.isInteractive(block)) return

    const id = BuiltInRegistries.BLOCK.getKey(block).toString()
    const namespace = id.split(':')[0]
    perNamespace[namespace] = (perNamespace[namespace] || 0) + 1
    matched++
  })

  const summary = Object.keys(perNamespace)
    .sort()
    .map(ns => `${ns} ${perNamespace[ns]}`)
    .join(', ')

  console.info(`[sway] ${matched} plant blocks are interactive: ${summary}`)
})
