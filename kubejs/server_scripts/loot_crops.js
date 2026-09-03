// Crop and flower loot that used to be CBTweaks datapack files.
//
// None of these were retirement artifacts - every one ADDS drops on top of the
// mod's own table, which is why deleting the files outright would have quietly
// removed content rather than being a no-op.
//
// Unlike recipes, LootJS has no raw-JSON entry point, so these are hand
// translations rather than the original JSON moved across. An API or signature
// mistake throws at script load and shows up in the log; a semantic mistake
// (wrong chance, wrong condition) does not, so the in-game checks matter.
LootJS.lootTables(event => {

  // Farmer's Delight cabbages: keep FD's own two pools and append ours.
  // 10% caterpillar on a mature plant. The only true "append" of the four.
  event.getBlockTable('farmersdelight:cabbages').createPool(pool => {
    pool.when(c => c.matchBlock('farmersdelight:cabbages', { age: '7' }))
    pool.addEntry(
      LootEntry.ofItem('kaleidoscope_cookery:caterpillar').when(c => c.randomChance(0.1))
    )
  })

  // Both barley crops drop Farm & Charm barley unless sheared, so the pack has a
  // single barley rather than three. These replace the mod's pool outright.
  //
  // The player gate is load-bearing and deliberate: these are double-tall plants,
  // and breaking either half destroys the other as a knock-on that carries no
  // tool and no breaking entity. A `half: lower` gate can therefore never see
  // your shears. Gating on the player instead yields exactly one drop from
  // either half, at the cost of explosions and pistons dropping nothing.
  // Alternatives go through LootEntry.alternative into addEntry. There is an
  // addAlternativesLoot, but it lives on the loot *modifier* builder
  // (LootJS.modifiers), not on a pool - calling it here throws
  // "Cannot find function addAlternativesLoot in object MutableLootPool",
  // which aborts the whole lootTables handler and silently leaves every table
  // after the throw untouched.
  const barley = (block, sheared) => {
    event.getBlockTable(block).clear().createPool(pool => {
      pool.when(c => c.matchEntity({ type: 'minecraft:player' }))
      pool.addEntry(LootEntry.alternative(
        LootEntry.ofItem(sheared).when(c => c.matchTool('minecraft:shears')),
        LootEntry.of('farm_and_charm:barley', [2, 5])
      ))
    })
  }

  barley('biomesoplenty:barley', 'biomesoplenty:barley')
  barley('regions_unexplored:barley', 'regions_unexplored:barley')
})
