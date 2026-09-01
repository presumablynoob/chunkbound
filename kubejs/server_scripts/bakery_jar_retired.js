// bakery:jar is retired in favour of minecraft:glass_bottle.
//
// Most of the retirement is handled elsewhere: the jar's own recipe is dropped
// by reliable_recipes/bakery.json, the item by reliable_remover/bakery.json,
// the nine blank_cake_interaction recipes retarget `give_item` in CBTweaks, and
// the five Farm & Charm jam recipes already retarget their container there too.
//
// These two are the leftovers. They are shipped by the Bakery jar under the
// farm_and_charm namespace, nothing shadows them, and they name bakery:jar as
// their `container` - a custom field of farm_and_charm:pot_cooking. Reliable
// Recipes' RecipeModifier only walks ingredients/input/item/items/reagent/
// result/results/output/tag, so no replace_input rule can reach `container`.
// KubeJS is the next step down the hierarchy, and re-adding the recipe with
// event.custom is the only way to rewrite an arbitrary field.
ServerEvents.recipes(event => {
  const rebottle = (id, json) => {
    event.remove({ id: id })
    event.custom(json).id(id)
  }

  rebottle('farm_and_charm:pot_cooking/chocolate', {
    type: 'farm_and_charm:pot_cooking',
    ingredients: [
      { item: 'minecraft:sugar' },
      { item: 'minecraft:cocoa_beans' },
      { tag: 'bakery:milk' }
    ],
    container: { id: 'minecraft:glass_bottle' },
    result: { id: 'bakery:chocolate_truffle', count: 4 },
    requiresLearning: false,
    requireContainer: false
  })

  rebottle('farm_and_charm:pot_cooking/pudding', {
    type: 'farm_and_charm:pot_cooking',
    ingredients: [
      { tag: 'bakery:eggs' },
      { tag: 'bakery:jam' },
      { tag: 'bakery:milk' }
    ],
    container: { id: 'minecraft:glass_bottle' },
    result: { id: 'bakery:pudding', count: 1 },
    requiresLearning: false,
    requireContainer: false
  })
})
