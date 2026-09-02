// Loot changes that used to be CBTweaks datapack files, moved to LootJS.
//
// LootJS sits alongside KubeJS in the hierarchy and is the right tool for loot -
// the reliable_* suite has no loot-table action beyond Reliable Remover's
// item-level filtering, which only strips removed items and cannot restructure
// a table.
//
// Note LootJS has no raw-JSON entry point the way ServerEvents.recipes has
// event.custom, so anything moved here has to be re-expressed with the builder
// API. Only changes whose intent survives that translation exactly belong here;
// the hand-written tables in CBTweaks that encode specific vanilla drops,
// weights or mod conditions are deliberately still datapack files.

// Kaleidoscope Cookery's three crops drop nothing. Their items are retired, and
// the crops themselves are unobtainable - KC ships no wild-crop feature and only
// tomato_crop appears in its village kitchen structures, which Reliable Replacer
// swaps for Farmer's Delight tomatoes.
//
// These were three `{}` datapack files. Deleting those outright would fall back
// to KC's own tables and start dropping the retired items again, so the empty
// table has to be asserted, not merely absent.
LootJS.lootTables(event => {
  const crops = [
    'kaleidoscope_cookery:lettuce_crop',
    'kaleidoscope_cookery:rice_crop',
    'kaleidoscope_cookery:tomato_crop'
  ]

  crops.forEach(block => event.getBlockTable(block).clear())
})

// Miner's Delight's breaking_infested_blocks global loot modifier is disabled.
// It gated on the mod's own minersdelight:block_tag condition, which
// AdvancedLootInfo cannot attribute to any block, so the silverfish egg drop
// happened but nothing in EMI advertised it. The drop now lives in the seven
// infested block loot tables instead, where ALI shows it under ali:block_loot -
// this stops it happening twice.
//
// Was a neoforge:false stanza in CBTweaks/data/minersdelight/loot_modifiers/.
LootJS.modifiers(event => {
  event.removeGlobalModifiers('minersdelight:breaking_infested_blocks')
})
