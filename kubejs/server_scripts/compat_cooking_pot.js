// Create cooking-pot equivalents of other mods' cooking recipes.
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

  when(["farm_and_charm", "farmersdelight"], 'chunkbound:compat/cooking_pot/farm_and_charm/pot_cooking/barley_soup', {
    type: "farmersdelight:cooking",
    recipe_book_tab: "meals",
    ingredients: [
      {
        tag: "farm_and_charm:barley"
      },
      {
        tag: "farm_and_charm:barley"
      },
      {
        tag: "farm_and_charm:water_bottles"
      },
      {
        item: "minecraft:egg"
      }
    ],
    container: {
      id: "minecraft:bowl",
      count: 1
    },
    result: {
      id: "farm_and_charm:barley_soup",
      count: 1
    }
  })

  when(["candlelight", "farmersdelight"], 'chunkbound:compat/cooking_pot/farm_and_charm/pot_cooking/chicken_teriyaki', {
    type: "farmersdelight:cooking",
    recipe_book_tab: "meals",
    ingredients: [
      {
        item: "candlelight:harvest_plate"
      },
      {
        item: "farmersdelight:chicken_cuts"
      },
      {
        tag: "c:foods/cabbage"
      }
    ],
    container: {
      id: "minecraft:bowl"
    },
    result: {
      id: "candlelight:chicken_teriyaki",
      count: 4
    }
  })

  when(["bakery", "farmersdelight"], 'chunkbound:compat/cooking_pot/farm_and_charm/pot_cooking/chocolate', {
    type: "farmersdelight:cooking",
    recipe_book_tab: "meals",
    ingredients: [
      {
        item: "minecraft:sugar"
      },
      {
        item: "minecraft:cocoa_beans"
      },
      {
        tag: "bakery:milk"
      }
    ],
    result: {
      id: "bakery:chocolate_truffle",
      count: 4
    }
  })

  when(["bakery", "farmersdelight"], 'chunkbound:compat/cooking_pot/farm_and_charm/pot_cooking/chocolate_jam', {
    type: "farmersdelight:cooking",
    recipe_book_tab: "meals",
    ingredients: [
      {
        tag: "bakery:milk"
      },
      {
        tag: "bakery:chocolate"
      },
      {
        item: "minecraft:sugar"
      }
    ],
    container: {
      id: "minecraft:glass_bottle"
    },
    result: {
      id: "bakery:chocolate_jam"
    }
  })

  when(["candlelight", "farmersdelight"], 'chunkbound:compat/cooking_pot/farm_and_charm/pot_cooking/chocolate_mousse', {
    type: "farmersdelight:cooking",
    recipe_book_tab: "meals",
    ingredients: [
      {
        item: "minecraft:cocoa_beans"
      },
      {
        tag: "farm_and_charm:milk"
      },
      {
        tag: "farm_and_charm:butter"
      }
    ],
    container: {
      id: "minecraft:bowl"
    },
    result: {
      id: "candlelight:chocolate_mousse",
      count: 4
    }
  })

  when(["farm_and_charm", "farmersdelight"], 'chunkbound:compat/cooking_pot/farm_and_charm/pot_cooking/corn_grits', {
    type: "farmersdelight:cooking",
    recipe_book_tab: "meals",
    ingredients: [
      {
        tag: "farm_and_charm:corn"
      },
      {
        tag: "farm_and_charm:corn"
      },
      {
        tag: "farm_and_charm:flour"
      }
    ],
    container: {
      id: "minecraft:bowl",
      count: 1
    },
    result: {
      id: "farm_and_charm:corn_grits",
      count: 1
    }
  })

  when(["farm_and_charm", "farmersdelight"], 'chunkbound:compat/cooking_pot/farm_and_charm/pot_cooking/goulash', {
    type: "farmersdelight:cooking",
    recipe_book_tab: "meals",
    ingredients: [
      {
        tag: "c:foods/onion"
      },
      {
        tag: "c:foods/cooked_beef"
      },
      {
        item: "farm_and_charm:simple_tomato_soup"
      },
      {
        item: "minecraft:carrot"
      },
      {
        item: "minecraft:potato"
      }
    ],
    result: {
      id: "farm_and_charm:goulash",
      count: 1
    }
  })

  when(["candlelight", "farmersdelight"], 'chunkbound:compat/cooking_pot/farm_and_charm/pot_cooking/khinkali', {
    type: "farmersdelight:cooking",
    recipe_book_tab: "meals",
    ingredients: [
      {
        item: "farmersdelight:minced_beef"
      },
      {
        tag: "c:foods/dough"
      }
    ],
    container: {
      id: "minecraft:bowl"
    },
    result: {
      id: "candlelight:khinkali",
      count: 4
    }
  })

  when(["candlelight", "farmersdelight"], 'chunkbound:compat/cooking_pot/farm_and_charm/pot_cooking/mushroom_soup', {
    type: "farmersdelight:cooking",
    recipe_book_tab: "meals",
    ingredients: [
      {
        tag: "candlelight:mushrooms"
      },
      {
        tag: "candlelight:red_effect"
      },
      {
        tag: "farm_and_charm:butter"
      },
      {
        tag: "farm_and_charm:milk"
      }
    ],
    container: {
      id: "minecraft:bowl"
    },
    result: {
      id: "candlelight:mushroom_soup",
      count: 1
    }
  })

  when(["farm_and_charm", "farmersdelight"], 'chunkbound:compat/cooking_pot/farm_and_charm/pot_cooking/nettle_tea', {
    type: "farmersdelight:cooking",
    recipe_book_tab: "meals",
    ingredients: [
      {
        tag: "farm_and_charm:water_bottles"
      },
      {
        item: "farm_and_charm:wild_nettle"
      },
      {
        item: "farm_and_charm:wild_nettle"
      }
    ],
    container: {
      id: "minecraft:glass_bottle",
      count: 1
    },
    result: {
      id: "farm_and_charm:nettle_tea",
      count: 1
    }
  })

  when(["farm_and_charm", "farmersdelight"], 'chunkbound:compat/cooking_pot/farm_and_charm/pot_cooking/onion_soup', {
    type: "farmersdelight:cooking",
    recipe_book_tab: "meals",
    ingredients: [
      {
        tag: "c:bread"
      },
      {
        tag: "c:foods/onion"
      },
      {
        tag: "c:foods/onion"
      }
    ],
    container: {
      id: "minecraft:bowl",
      count: 1
    },
    result: {
      id: "farm_and_charm:onion_soup",
      count: 1
    }
  })

  when(["candlelight", "farmersdelight"], 'chunkbound:compat/cooking_pot/farm_and_charm/pot_cooking/pasta_with_mozzarella', {
    type: "farmersdelight:cooking",
    recipe_book_tab: "meals",
    ingredients: [
      {
        tag: "c:foods/pasta"
      },
      {
        item: "minecraft:egg"
      },
      {
        tag: "candlelight:red_effect"
      },
      {
        tag: "brewinandchewin:foods/cheese_wedge"
      }
    ],
    container: {
      id: "minecraft:bowl"
    },
    result: {
      id: "candlelight:pasta_with_mozzarella",
      count: 4
    }
  })

  when(["farm_and_charm", "farmersdelight"], 'chunkbound:compat/cooking_pot/farm_and_charm/pot_cooking/potato_soup', {
    type: "farmersdelight:cooking",
    recipe_book_tab: "meals",
    ingredients: [
      {
        item: "minecraft:potato"
      },
      {
        tag: "c:foods/onion"
      }
    ],
    container: {
      id: "minecraft:bowl",
      count: 1
    },
    result: {
      id: "farm_and_charm:potato_soup",
      count: 1
    }
  })

  when(["bakery", "farmersdelight"], 'chunkbound:compat/cooking_pot/farm_and_charm/pot_cooking/pudding', {
    type: "farmersdelight:cooking",
    recipe_book_tab: "meals",
    ingredients: [
      {
        tag: "bakery:eggs"
      },
      {
        tag: "bakery:jam"
      },
      {
        tag: "bakery:milk"
      }
    ],
    result: {
      id: "bakery:pudding",
      count: 1
    }
  })

  when(["bakery", "farmersdelight"], 'chunkbound:compat/cooking_pot/farm_and_charm/pot_cooking/rabbit_stew', {
    type: "farmersdelight:cooking",
    recipe_book_tab: "meals",
    ingredients: [
      {
        item: "minecraft:potato"
      },
      {
        item: "minecraft:brown_mushroom"
      },
      {
        item: "minecraft:carrot"
      },
      {
        item: "minecraft:rabbit"
      }
    ],
    container: {
      id: "minecraft:bowl"
    },
    result: {
      id: "minecraft:rabbit_stew"
    }
  })

  when(["farm_and_charm", "farmersdelight"], 'chunkbound:compat/cooking_pot/farm_and_charm/pot_cooking/ribwort_tea', {
    type: "farmersdelight:cooking",
    recipe_book_tab: "meals",
    ingredients: [
      {
        tag: "farm_and_charm:water_bottles"
      },
      {
        item: "farm_and_charm:wild_ribwort"
      },
      {
        item: "farm_and_charm:wild_ribwort"
      }
    ],
    container: {
      id: "minecraft:glass_bottle",
      count: 1
    },
    result: {
      id: "farm_and_charm:ribwort_tea",
      count: 1
    }
  })

  when(["candlelight", "farmersdelight"], 'chunkbound:compat/cooking_pot/farm_and_charm/pot_cooking/salmon_on_white_wine', {
    type: "farmersdelight:cooking",
    recipe_book_tab: "meals",
    ingredients: [
      {
        item: "minecraft:salmon"
      },
      {
        tag: "candlelight:white_effect"
      },
      {
        tag: "farm_and_charm:butter"
      }
    ],
    container: {
      id: "minecraft:bowl"
    },
    result: {
      id: "candlelight:salmon_on_white_wine",
      count: 2
    }
  })

  when(["farm_and_charm", "farmersdelight"], 'chunkbound:compat/cooking_pot/farm_and_charm/pot_cooking/simple_tomato_soup', {
    type: "farmersdelight:cooking",
    recipe_book_tab: "meals",
    ingredients: [
      {
        tag: "c:foods/tomato"
      },
      {
        tag: "c:foods/tomato"
      },
      {
        tag: "cornexpansion:sweet_ingredient"
      }
    ],
    container: {
      id: "minecraft:bowl",
      count: 1
    },
    result: {
      id: "farm_and_charm:simple_tomato_soup",
      count: 1
    }
  })

  when(["bakery", "farmersdelight"], 'chunkbound:compat/cooking_pot/farm_and_charm/pot_cooking/strawberry_jam', {
    type: "farmersdelight:cooking",
    recipe_book_tab: "meals",
    ingredients: [
      {
        item: "farm_and_charm:strawberry"
      },
      {
        item: "farm_and_charm:strawberry"
      },
      {
        item: "farm_and_charm:strawberry"
      },
      {
        item: "minecraft:sugar"
      }
    ],
    container: {
      id: "minecraft:glass_bottle"
    },
    result: {
      id: "bakery:strawberry_jam"
    }
  })

  when(["farm_and_charm", "farmersdelight"], 'chunkbound:compat/cooking_pot/farm_and_charm/pot_cooking/strawberry_tea', {
    type: "farmersdelight:cooking",
    recipe_book_tab: "meals",
    ingredients: [
      {
        tag: "farm_and_charm:water_bottles"
      },
      {
        tag: "c:foods/strawberry"
      },
      {
        tag: "c:foods/strawberry"
      }
    ],
    container: {
      id: "minecraft:glass_bottle",
      count: 1
    },
    result: {
      id: "farm_and_charm:strawberry_tea",
      count: 1
    }
  })

  when(["candlelight", "farmersdelight"], 'chunkbound:compat/cooking_pot/farm_and_charm/pot_cooking/tomato_soup', {
    type: "farmersdelight:cooking",
    recipe_book_tab: "meals",
    ingredients: [
      {
        tag: "farm_and_charm:tomato"
      },
      {
        tag: "farm_and_charm:tomato"
      },
      {
        type: "neoforge:components",
        items: "minecraft:potion",
        components: {
          "minecraft:potion_contents": {
            potion: "minecraft:water"
          }
        }
      },
      {
        tag: "c:drinks/milk"
      }
    ],
    container: {
      id: "minecraft:bowl"
    },
    result: {
      id: "candlelight:tomato_soup",
      count: 4
    }
  })

  when(["farm_and_charm", "farmersdelight"], 'chunkbound:compat/cooking_pot/farm_and_charm/pot_cooking/yeast', {
    type: "farmersdelight:cooking",
    recipe_book_tab: "meals",
    ingredients: [
      {
        item: "minecraft:sugar"
      },
      {
        tag: "farm_and_charm:water_bottles"
      },
      {
        item: "minecraft:wheat"
      }
    ],
    container: {
      id: "minecraft:bowl",
      count: 1
    },
    result: {
      id: "farm_and_charm:yeast",
      count: 12
    }
  })
})
