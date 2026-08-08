//Tomato Compat
//Hides Farmer's Delight tomatoes
ServerEvents.tags('item', event => {
  event.add('c:hidden_from_recipe_viewers', 'farmersdelight:tomato')
  event.add('c:hidden_from_recipe_viewers', 'farmersdelight:rotten_tomato')
  event.add('c:hidden_from_recipe_viewers', 'farmersdelight:tomato_seeds')
})
//Adds additional tagging to Let's Do tomatoes
ServerEvents.tags('item', event => {
    const oldTomato = 'farmersdelight:tomato'
    const newTomato = 'farm_and_charm:tomato'
    const tagsToCheck = [
        'c:crops/tomato',
        'c:foods/vegetable',
        'c:foods',
        'c:foods/tomato',
        'c:vegetables'
    ]

    tagsToCheck.forEach(tagId => {
        const ids = event.get(tagId).getObjectIds()
        event.add(tagId, newTomato)
        event.remove(tagId, oldTomato)
    })
})
//Replaces Farmer's Delight tomato recipes
ServerEvents.recipes(event => {
    event.replaceInput({}, 'farmersdelight:tomato', 'farm_and_charm:tomato')
    event.replaceOutput({}, 'farmersdelight:tomato', 'farm_and_charm:tomato')
    event.remove({ output: 'farmersdelight:tomato_seeds' })
})
//Replaces Farmer's Delight tomato shrub cutting board recipes
ServerEvents.recipes(event => {
  event.remove({ type: 'farmersdelight:cutting', input: 'farmersdelight:wild_tomatoes' })

  const wildTomatoInputs = [
    'farmersdelight:wild_tomatoes',
    'farm_and_charm:wild_tomatoes'
  ]

  wildTomatoInputs.forEach(input => {
    event.custom({
      type: 'farmersdelight:cutting',
      ingredients: [
        { item: input }
      ],
      result: [
        { item: { count: 1, id: 'farm_and_charm:tomato_seeds' } },
        { chance: 0.2, item: { count: 1, id: 'farm_and_charm:tomato' } },
        { chance: 0.1, item: { count: 1, id: 'minecraft:green_dye' } }
      ],
      tool: [
        { type: 'farmersdelight:item_ability', action: 'knife_dig' },
        { tag: 'c:tools/knife' }
      ]
    })
  })
})
//Replace Wandering Trader trade table
MoreJS.wandererTrades(event => {
  event.removeTrades({
    output: 'farmersdelight:tomato_seeds'
  })
  event.addTrade(1, 'minecraft:emerald', 'farm_and_charm:tomato_seeds')
})

//Onion Compat
ServerEvents.tags('item', event => {
  event.add('c:hidden_from_recipe_viewers', 'farmersdelight:onion')
})
//Adds additional tagging to Let's Do onions
ServerEvents.tags('item', event => {
    const oldTomato = 'farmersdelight:onion'
    const newTomato = 'farm_and_charm:onion'
    const tagsToCheck = [
        'c:crops/onion',
        'c:foods/vegetable',
        'c:foods',
        'c:foods/onion',
        'c:vegetables'
    ]

    tagsToCheck.forEach(tagId => {
        const ids = event.get(tagId).getObjectIds()
        event.add(tagId, newTomato)
        event.remove(tagId, oldTomato)
    })
})

ServerEvents.recipes(event => {
    event.replaceInput({}, 'farmersdelight:onion', 'farm_and_charm:onion')
    event.replaceOutput({}, 'farmersdelight:onion', 'farm_and_charm:onion')
})

ServerEvents.recipes(event => {
  event.remove({ type: 'farmersdelight:cutting', input: 'farmersdelight:wild_onions' })

  const wildOnionInputs = [
    'farmersdelight:wild_onions',
    'farm_and_charm:wild_onions'
  ]

  wildOnionInputs.forEach(input => {
    event.custom({
    type: "farmersdelight:cutting",
    ingredients: [
      { "item": input }
    ],
    result: [
      {item: {count: 1, id: "farm_and_charm:onion" } },
      {item: {count: 2, id: "minecraft:magenta_dye"}},
      {chance: 0.1, item: {count: 1, id: "minecraft:lime_dye"}}
    ],
    "tool": [
      {type: "farmersdelight:item_ability", action: "knife_dig"},
      {"tag": "c:tools/knife"}
    ]
    })
  })
})
//Replace Wandering Trader trade table
MoreJS.wandererTrades(event => {
  event.removeTrades({
    output: 'farmersdelight:onion'
  })
  event.addTrade(1, 'minecraft:emerald', 'farm_and_charm:onion')
  console.log(JSON.stringify(event.trades))
})

//Cabbage Compat
ServerEvents.tags('item', event => {
  event.add('c:hidden_from_recipe_viewers', 'farm_and_charm:lettuce')
  event.add('c:hidden_from_recipe_viewers', 'farm_and_charm:lettuce_seeds')

  const oldCabbage = 'farm_and_charm:lettuce'
  const newCabbage = 'farmersdelight:cabbage'
  const tagsToCheck = [
        'c:crops/cabbage'
    ]

  tagsToCheck.forEach(tagId => {
      const ids = event.get(tagId).getObjectIds()
      event.add(tagId, newCabbage)
      event.remove(tagId, oldCabbage)
  })
})
ServerEvents.recipes(event => {
    event.replaceInput({}, 'farm_and_charm:lettuce', 'farmersdelight:cabbage')
    event.replaceOutput({}, 'farm_and_charm:lettuce', 'farmersdelight:cabbage')
    event.remove({ output: 'farm_and_charm:lettuce_seeds' })
})

//Raw Bacon Compat
ServerEvents.tags('item', event => {
  event.add('c:hidden_from_recipe_viewers', 'farm_and_charm:bacon')
})
ServerEvents.recipes(event => {
  event.replaceInput(
    { input: 'farmersdelight:bacon' }, // filter: only recipes using this item
    'farmersdelight:bacon',            // item to replace
    '#c:foods/raw_bacon'                   // replace with the tag
  )
  event.replaceInput(
    { input: 'farm_and_charm:bacon' }, // filter: only recipes using this item
    'farm_and_charm:bacon',            // item to replace
    '#c:foods/raw_bacon'                   // replace with the tag
  )
})

//Chicken Parts Compat
ServerEvents.tags('item', event => {
    const oldChicken = 'farm_and_charm:chicken_parts'
    const newChicken = 'farmersdelight:chicken_cuts'
    const tagsToCheck = [
      'c:raw_chicken',
      'origins:meat'
    ]

    tagsToCheck.forEach(tagId => {
        const ids = event.get(tagId).getObjectIds()
        event.add(tagId, newChicken)
        event.remove(tagId, oldChicken)
    })
    event.add('c:hidden_from_recipe_viewers', 'farm_and_charm:chicken_parts')
})

//Minced Beef Compat
ServerEvents.tags('item', event => {
    const oldBeef = 'farm_and_charm:minced_beef'
    const newBeef = 'farmersdelight:minced_beef'
    const tagsToCheck = [
      'c:raw_beef',
      'origins:meat'
    ]

    tagsToCheck.forEach(tagId => {
        const ids = event.get(tagId).getObjectIds()
        event.add(tagId, newBeef)
        event.remove(tagId, oldBeef)
    })
    event.add('c:hidden_from_recipe_viewers', 'farm_and_charm:minced_beef')
})

//Pasta Compat
ServerEvents.tags('item', event => {
  event.add('c:hidden_from_recipe_viewers', 'farm_and_charm:raw_pasta')
})

//Dog Food Compat
ServerEvents.tags('item', event => {
  event.add('c:hidden_from_recipe_viewers', 'farmersdelight:dog_food')
  const oldDogFood = 'farmersdelight:dog_food'
  const newDogFood = 'farm_and_charm:dog_food'
  const tagsToCheck = [
        'minecraft:wolf_food',
        'c:animal_foods'
    ]

  tagsToCheck.forEach(tagId => {
      const ids = event.get(tagId).getObjectIds()
      event.add(tagId, newDogFood)
      event.remove(tagId, oldDogFood)
  })
})

//Knife Retagging
ServerEvents.tags('item', event => {
  event.add("c:tools/knife", "bakery:bread_knife")
});

