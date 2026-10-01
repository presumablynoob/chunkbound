//Puts every consumable from the Kaleidoscope suite into NeoForge's food tags.
//
//None of the three mods tags its foods c:foods, so they were invisible to
//anything keyed on it - Selling Bin prices #c:foods, REMI groups it.
//
//Written as a predicate over the item registry rather than an id list, because
//food is a data component set in code: a list would silently miss whatever the
//next update adds. Two kinds of consumable, two tags:
//
//- eaten or drunk from the hand -> c:foods. A food component alone is not
//  enough: TeacupItem and ClayPotMilkTeaItem play the DRINK animation and apply
//  their effects directly, with no food component. TransmutationLunchBagItem
//  only eats while it holds other food, so its empty default stack reports
//  NONE and is correctly left out.
//- plated dishes eaten a bite at a time off the placed block (KC's
//  FoodBiteBlock, which Nether and End reuse through FoodBiteRegistry) ->
//  c:foods/edible_when_placed, the tag NeoForge gives vanilla cake. c:foods
//  includes it, so these are foods too.
//
//Retired items (reliable_remover/kaleidoscope_cookery.json) get added here
//like any other, then stripped again: Reliable Recipes' hidden-item pass runs at
//the RETURN of ReloadableServerResources.updateRegistryTags, after this event.

const KALEIDOSCOPE_NAMESPACES = ['kaleidoscope_cookery', 'kaleidoscope_nether', 'kaleidoscope_end']

ServerEvents.tags('item', event => {
  const BuiltInRegistries = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries')
  const DataComponents = Java.loadClass('net.minecraft.core.component.DataComponents')
  const BlockItem = Java.loadClass('net.minecraft.world.item.BlockItem')
  //tryLoadClass so the script keeps working if Kaleidoscope Cookery is removed.
  const FoodBiteBlock = Java.tryLoadClass('com.github.ysbbbbbb.kaleidoscopecookery.block.food.FoodBiteBlock')

  const eaten = []
  const placed = []

  BuiltInRegistries.ITEM.forEach(item => {
    const id = BuiltInRegistries.ITEM.getKey(item).toString()
    if (KALEIDOSCOPE_NAMESPACES.indexOf(id.split(':')[0]) === -1) return

    let anim = 'NONE'
    try {
      anim = String(item.getUseAnimation(item.getDefaultInstance()).name())
    } catch (e) {
      console.warn(`[kaleidoscope foods] could not read the use animation of ${id}: ${e}`)
    }

    if (item.components().has(DataComponents.FOOD) || anim === 'EAT' || anim === 'DRINK') {
      eaten.push(id)
    }
    if (FoodBiteBlock && item instanceof BlockItem && item.getBlock() instanceof FoodBiteBlock) {
      placed.push(id)
    }
  })

  eaten.forEach(id => event.add('c:foods', id))
  placed.forEach(id => event.add('c:foods/edible_when_placed', id))

  console.info(`[kaleidoscope foods] tagged ${eaten.length} c:foods and ${placed.length} c:foods/edible_when_placed`)
})
