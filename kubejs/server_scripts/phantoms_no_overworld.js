// Phantoms are Overworld-only in vanilla, spawned by the insomnia spawner rather
// than from any biome's spawn list. Chunkbound moves them: never in the Overworld,
// and instead in soul/undead Nether biomes and throughout the End.
//
// Only the *deny* half lives here. The spawning half is data, in CBTweaks:
//   data/chunkbound/neoforge/biome_modifier/phantoms_nether_souls.json
//   data/chunkbound/neoforge/biome_modifier/phantoms_end.json
// KubeJS 2101 has no worldgen or biome API, so a biome spawn list cannot be
// edited from a script - do not try to move those files here.
//
// Use EntityEvents.spawned, NOT EntityEvents.checkSpawn. checkSpawn only fires
// for BaseSpawner and world generation, so the insomnia spawner walks straight
// past it; the previous version of this rule used checkSpawn and let phantoms
// through. spawned fires for anything about to be added to a level.
//
// Note this also fires for entities loaded from a save, so a phantom already
// stored in an Overworld chunk is removed when that chunk loads. That is
// intended here.

const PHANTOM_BANNED_DIMENSION = 'minecraft:overworld'

// Incendium rewrites the Nether's noise settings from vanilla's 128 blocks to
// 192 (min_y 0, height 192), moving the bedrock roof from ~127 up to ~191. That
// hands a flying mob 64 extra blocks of open air to spawn in, and
// neoforge:add_spawns has no height field to limit it with - so the cap is
// enforced here instead. 128 is vanilla's old ceiling, which keeps the spawnable
// column the size the biome weights were balanced against.
const NETHER_DIMENSION = 'minecraft:the_nether'
const NETHER_PHANTOM_MAX_Y = 128

EntityEvents.spawned('minecraft:phantom', event => {
    const dimension = event.level.dimension

    if (dimension == PHANTOM_BANNED_DIMENSION) {
        event.cancel()
        return
    }

    if (dimension == NETHER_DIMENSION && event.entity.y >= NETHER_PHANTOM_MAX_Y) {
        event.cancel()
    }
})
