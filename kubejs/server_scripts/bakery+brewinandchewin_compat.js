//Sweetberry Jam Compat
ServerEvents.tags('item', event => {
    const oldJam = 'bakery:sweetberry_jam'
    const newJam = 'brewinandchewin:sweet_berry_jam'
    const tagsToCheck = [
      'c:jams',
      'bakery:jam'
    ]

    tagsToCheck.forEach(tagId => {
        const ids = event.get(tagId).getObjectIds()
        event.add(tagId, newJam)
        event.remove(tagId, oldJam)
    })
    event.add('c:hidden_from_recipe_viewers', 'bakery:sweetberry_jam')
})
//Glowberry Jam Compat
ServerEvents.tags('item', event => {
    const oldJam = 'bakery:glowberry_jam'
    const newJam = 'brewinandchewin:glow_berry_marmalade'
    const tagsToCheck = [
      'c:jams',
      'bakery:jam'
    ]

    tagsToCheck.forEach(tagId => {
        const ids = event.get(tagId).getObjectIds()
        event.add(tagId, newJam)
        event.remove(tagId, oldJam)
    })
    event.add('c:hidden_from_recipe_viewers', 'bakery:glowberry_jam')
})

//Apple Jelly Compat
ServerEvents.tags('item', event => {
    const oldJam = 'bakery:apple_jam'
    const newJam = 'brewinandchewin:apple_jelly'
    const tagsToCheck = [
      'c:jams',
      'bakery:jam'
    ]

    tagsToCheck.forEach(tagId => {
        const ids = event.get(tagId).getObjectIds()
        event.add(tagId, newJam)
        event.remove(tagId, oldJam)
    })
    event.add('c:hidden_from_recipe_viewers', 'bakery:apple_jam')
})

//Dough Compat
ServerEvents.tags('item', event => {
  event.add('c:foods/dough', 'farm_and_charm:dough')
  event.add('c:hidden_from_recipe_viewers', 'farmersdelight:wheat_dough')
})
ServerEvents.recipes(event => {
  event.replaceInput(
    { input: 'farmersdelight:wheat_dough' },
    'farmersdelight:wheat_dough', 
    'farm_and_charm:dough' 
  )
})
