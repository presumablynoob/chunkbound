// Create mixing equivalents of other mods' bowl and pot recipes.
//
// These recipes have no counterpart in any mod jar - the pack invents them - so no
// reliable_* rule can express them; RecipeRule$Action has no add. KubeJS is the next
// step down the hierarchy. Migrated out of CBTweaks/data/chunkbound/recipe/.
//
// The mod_loaded conditions each recipe carried in the datapack become Platform
// .isLoaded guards. event.custom takes the raw recipe JSON, which is what these
// modded types need - only create and kaleidoscope_cookery have KubeJS builders here.
ServerEvents.recipes(event => {
  const when = (mods, id, recipe) => {
    if (mods.every(m => Platform.isLoaded(m))) event.custom(recipe).id(id)
  }

  when(["cornexpansion", "create"], 'chunkbound:compat/mixing/cornexpansion/farm_and_charm/crafting_bowl/corn_dough', {
    type: "create:mixing",
    ingredients: [
      {
        item: "cornexpansion:corn_flour"
      },
      {
        item: "farm_and_charm:yeast"
      },
      {
        tag: "farm_and_charm:water_bottles"
      }
    ],
    results: [
      {
        id: "cornexpansion:corn_dough",
        count: 5
      }
    ]
  })

  when(["candlelight", "create"], 'chunkbound:compat/mixing/farm_and_charm/crafting_bowl/beef_tartare', {
    type: "create:mixing",
    ingredients: [
      {
        item: "farmersdelight:minced_beef"
      },
      {
        tag: "candlelight:bowls"
      },
      {
        tag: "c:foods/onion"
      }
    ],
    results: [
      {
        id: "candlelight:beef_tartare",
        count: 2
      }
    ]
  })

  when(["candlelight", "create"], 'chunkbound:compat/mixing/farm_and_charm/crafting_bowl/beetroot_salad', {
    type: "create:mixing",
    ingredients: [
      {
        item: "minecraft:beetroot"
      },
      {
        tag: "candlelight:bowls"
      },
      {
        tag: "brewinandchewin:foods/cheese_wedge"
      }
    ],
    results: [
      {
        id: "candlelight:beetroot_salad",
        count: 2
      }
    ]
  })

  when(["create", "farm_and_charm"], 'chunkbound:compat/mixing/farm_and_charm/crafting_bowl/butter', {
    type: "create:mixing",
    ingredients: [
      {
        tag: "farm_and_charm:milk"
      }
    ],
    results: [
      {
        id: "farm_and_charm:butter",
        count: 4
      }
    ]
  })

  when(["bakery", "create"], 'chunkbound:compat/mixing/farm_and_charm/crafting_bowl/cake_dough', {
    type: "create:mixing",
    ingredients: [
      {
        item: "farm_and_charm:flour"
      },
      {
        item: "minecraft:sugar"
      },
      {
        tag: "bakery:eggs"
      },
      {
        tag: "bakery:milk"
      }
    ],
    results: [
      {
        id: "bakery:cake_dough",
        count: 12
      }
    ]
  })

  when(["create", "farm_and_charm"], 'chunkbound:compat/mixing/farm_and_charm/crafting_bowl/cat_food', {
    type: "create:mixing",
    ingredients: [
      {
        tag: "c:foods/cooked_beef"
      },
      {
        tag: "farm_and_charm:raw_fishes"
      },
      {
        tag: "c:foods/raw_chicken"
      },
      {
        tag: "c:foods/raw_pork"
      }
    ],
    results: [
      {
        id: "farm_and_charm:cat_food",
        count: 6
      }
    ]
  })

  when(["create", "farm_and_charm"], 'chunkbound:compat/mixing/farm_and_charm/crafting_bowl/dog_food', {
    type: "create:mixing",
    ingredients: [
      {
        tag: "c:foods/cooked_beef"
      },
      {
        tag: "c:foods/raw_beef"
      },
      {
        tag: "farm_and_charm:bones"
      }
    ],
    results: [
      {
        id: "farm_and_charm:dog_food",
        count: 4
      }
    ]
  })

  when(["create", "farm_and_charm"], 'chunkbound:compat/mixing/farm_and_charm/crafting_bowl/dough', {
    type: "create:mixing",
    ingredients: [
      {
        tag: "farm_and_charm:flour"
      },
      {
        item: "farm_and_charm:yeast"
      },
      {
        tag: "farm_and_charm:water_bottles"
      }
    ],
    results: [
      {
        id: "farm_and_charm:dough",
        count: 5
      }
    ]
  })

  when(["create", "farm_and_charm"], 'chunkbound:compat/mixing/farm_and_charm/crafting_bowl/farmer_salad', {
    type: "create:mixing",
    ingredients: [
      {
        tag: "c:foods/tomato"
      },
      {
        tag: "c:foods/onion"
      },
      {
        tag: "c:foods/cabbage"
      },
      {
        tag: "c:foods/strawberry"
      }
    ],
    results: [
      {
        id: "farm_and_charm:farmer_salad",
        count: 2
      }
    ]
  })

  when(["candlelight", "create"], 'chunkbound:compat/mixing/farm_and_charm/crafting_bowl/fresh_garden_salad', {
    type: "create:mixing",
    ingredients: [
      {
        tag: "farm_and_charm:cabbage"
      },
      {
        tag: "farm_and_charm:tomato"
      },
      {
        tag: "candlelight:bowls"
      },
      {
        item: "minecraft:carrot"
      }
    ],
    results: [
      {
        id: "candlelight:fresh_garden_salad",
        count: 2
      }
    ]
  })

  when(["candlelight", "create"], 'chunkbound:compat/mixing/farm_and_charm/crafting_bowl/harvest_plate', {
    type: "create:mixing",
    ingredients: [
      {
        item: "minecraft:carrot"
      },
      {
        item: "minecraft:potato"
      },
      {
        tag: "farm_and_charm:tomato"
      },
      {
        tag: "candlelight:bowls"
      }
    ],
    results: [
      {
        id: "candlelight:harvest_plate",
        count: 3
      }
    ]
  })

  when(["create", "farm_and_charm"], 'chunkbound:compat/mixing/farm_and_charm/crafting_bowl/oatmeal_with_strawberries', {
    type: "create:mixing",
    ingredients: [
      {
        tag: "farm_and_charm:milk"
      },
      {
        tag: "farm_and_charm:oat"
      },
      {
        tag: "c:foods/strawberry"
      }
    ],
    results: [
      {
        id: "farm_and_charm:oatmeal_with_strawberries",
        count: 2
      }
    ]
  })

  when(["candlelight", "create"], 'chunkbound:compat/mixing/farm_and_charm/crafting_bowl/salad', {
    type: "create:mixing",
    ingredients: [
      {
        tag: "farm_and_charm:cabbage"
      },
      {
        tag: "farm_and_charm:tomato"
      },
      {
        tag: "candlelight:bowls"
      },
      {
        tag: "brewinandchewin:foods/cheese_wedge"
      }
    ],
    results: [
      {
        id: "candlelight:salad",
        count: 4
      }
    ]
  })

  when(["bakery", "create"], 'chunkbound:compat/mixing/farm_and_charm/crafting_bowl/sweet_dough', {
    type: "create:mixing",
    ingredients: [
      {
        item: "farm_and_charm:flour"
      },
      {
        item: "minecraft:sugar"
      },
      {
        tag: "bakery:eggs"
      },
      {
        tag: "bakery:water_bottles"
      }
    ],
    results: [
      {
        id: "bakery:sweet_dough",
        count: 12
      }
    ]
  })

  when(["candlelight", "create"], 'chunkbound:compat/mixing/farm_and_charm/crafting_bowl/tomato_mozzarella_salad', {
    type: "create:mixing",
    ingredients: [
      {
        tag: "brewinandchewin:foods/cheese_wedge"
      },
      {
        tag: "farm_and_charm:tomato"
      },
      {
        tag: "candlelight:bowls"
      }
    ],
    results: [
      {
        id: "candlelight:tomato_mozzarella_salad"
      }
    ]
  })
})
