// Farm & Charm pot-cooking equivalents of other mods' recipes.
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

  when(["brewinandchewin", "farm_and_charm"], 'chunkbound:compat/pot_cooking/brewinandchewin/cooking/cheesy_pasta', {
    type: "farm_and_charm:pot_cooking",
    ingredients: [
      {
        item: "brewinandchewin:flaxen_cheese_wedge"
      },
      {
        tag: "c:foods/pasta"
      },
      {
        tag: "c:foods/tomato"
      },
      {
        tag: "c:foods/safe_raw_fish"
      }
    ],
    requireContainer: true,
    container: {
      id: "minecraft:bowl",
      count: 1
    },
    result: {
      count: 1,
      id: "brewinandchewin:cheesy_pasta"
    },
    requiresLearning: false
  })

  when(["brewinandchewin", "farm_and_charm"], 'chunkbound:compat/pot_cooking/brewinandchewin/cooking/creamy_onion_soup', {
    type: "farm_and_charm:pot_cooking",
    ingredients: [
      {
        tag: "brewinandchewin:foods/cheese_wedge"
      },
      {
        tag: "c:foods/onion"
      },
      {
        tag: "c:foods/vegetable"
      },
      {
        tag: "c:foods/bread"
      }
    ],
    requireContainer: true,
    container: {
      id: "minecraft:bowl",
      count: 1
    },
    result: {
      count: 1,
      id: "brewinandchewin:creamy_onion_soup"
    },
    requiresLearning: false
  })

  when(["brewinandchewin", "farm_and_charm"], 'chunkbound:compat/pot_cooking/brewinandchewin/cooking/fiery_fondue_pot', {
    type: "farm_and_charm:pot_cooking",
    ingredients: [
      {
        item: "farmersdelight:tomato_sauce"
      },
      {
        tag: "c:crops/potato"
      },
      {
        tag: "c:drinks/milk"
      },
      {
        item: "brewinandchewin:scarlet_cheese_wheel"
      },
      {
        item: "farmersdelight:ham"
      },
      {
        tag: "c:foods/bread"
      }
    ],
    requireContainer: true,
    container: {
      id: "minecraft:cauldron",
      count: 1
    },
    result: {
      count: 1,
      id: "brewinandchewin:fiery_fondue_pot"
    },
    requiresLearning: false
  })

  when(["brewinandchewin", "farm_and_charm"], 'chunkbound:compat/pot_cooking/brewinandchewin/cooking/horror_lasagna', {
    type: "farm_and_charm:pot_cooking",
    ingredients: [
      {
        item: "brewinandchewin:scarlet_cheese_wedge"
      },
      {
        tag: "c:crops/beetroot"
      },
      {
        item: "farmersdelight:tomato_sauce"
      },
      {
        tag: "c:foods/pasta"
      },
      {
        tag: "brewinandchewin:foods/cheese_wedge"
      }
    ],
    requireContainer: true,
    container: {
      id: "minecraft:bowl",
      count: 1
    },
    result: {
      count: 1,
      id: "brewinandchewin:horror_lasagna"
    },
    requiresLearning: false
  })

  when(["brewinandchewin", "farm_and_charm"], 'chunkbound:compat/pot_cooking/brewinandchewin/cooking/scarlet_pierogi', {
    type: "farm_and_charm:pot_cooking",
    ingredients: [
      {
        item: "brewinandchewin:scarlet_cheese_wedge"
      },
      {
        tag: "c:crops/potato"
      },
      {
        tag: "c:foods/dough"
      },
      {
        item: "minecraft:nether_wart"
      },
      {
        tag: "c:foods/cabbage"
      }
    ],
    requireContainer: true,
    container: {
      id: "minecraft:bowl",
      count: 1
    },
    result: {
      count: 1,
      id: "brewinandchewin:scarlet_pierogi"
    },
    requiresLearning: false
  })

  when(["brewinandchewin", "farm_and_charm"], 'chunkbound:compat/pot_cooking/brewinandchewin/cooking/vegetable_omelet', {
    type: "farm_and_charm:pot_cooking",
    ingredients: [
      {
        tag: "brewinandchewin:foods/cheese_wedge"
      },
      {
        tag: "c:eggs"
      },
      {
        tag: "c:eggs"
      },
      {
        tag: "c:foods/onion"
      },
      {
        tag: "c:crops/carrot"
      }
    ],
    requireContainer: true,
    container: {
      id: "minecraft:bowl",
      count: 1
    },
    result: {
      count: 1,
      id: "brewinandchewin:vegetable_omelet"
    },
    requiresLearning: false
  })

  when(["culturaldelights", "farm_and_charm"], 'chunkbound:compat/pot_cooking/culturalrecipes/cooking/creamed_corn', {
    type: "farm_and_charm:pot_cooking",
    ingredients: [
      {
        tag: "c:drinks/milk"
      },
      {
        tag: "c:crops/corn"
      },
      {
        tag: "c:crops/corn"
      }
    ],
    requireContainer: true,
    container: {
      id: "minecraft:bowl",
      count: 1
    },
    result: {
      count: 1,
      id: "culturaldelights:creamed_corn"
    },
    requiresLearning: false
  })

  when(["culturaldelights", "farm_and_charm"], 'chunkbound:compat/pot_cooking/culturalrecipes/cooking/eggplant_parmesan_block', {
    type: "farm_and_charm:pot_cooking",
    ingredients: [
      {
        tag: "c:crops/eggplant"
      },
      {
        tag: "c:drinks/milk"
      },
      {
        tag: "c:eggs"
      },
      {
        item: "farmersdelight:raw_pasta"
      },
      {
        item: "farmersdelight:tomato_sauce"
      },
      {
        tag: "c:foods/bread"
      }
    ],
    requireContainer: true,
    container: {
      id: "minecraft:bowl",
      count: 1
    },
    result: {
      count: 1,
      id: "culturaldelights:eggplant_parmesan_block"
    },
    requiresLearning: false
  })

  when(["culturaldelights", "farm_and_charm"], 'chunkbound:compat/pot_cooking/culturalrecipes/cooking/elote', {
    type: "farm_and_charm:pot_cooking",
    ingredients: [
      {
        tag: "c:drinks/milk"
      },
      {
        tag: "c:crops/corn"
      },
      {
        tag: "c:crops/onion"
      }
    ],
    requireContainer: true,
    container: {
      id: "minecraft:stick",
      count: 1
    },
    result: {
      count: 1,
      id: "culturaldelights:elote"
    },
    requiresLearning: false
  })

  when(["culturaldelights", "farm_and_charm"], 'chunkbound:compat/pot_cooking/culturalrecipes/cooking/poached_eggplants', {
    type: "farm_and_charm:pot_cooking",
    ingredients: [
      {
        tag: "c:crops/eggplant"
      },
      {
        tag: "c:crops/onion"
      },
      {
        item: "farmersdelight:tomato_sauce"
      },
      {
        tag: "c:eggs"
      }
    ],
    requireContainer: true,
    container: {
      id: "minecraft:bowl",
      count: 1
    },
    result: {
      count: 1,
      id: "culturaldelights:poached_eggplants"
    },
    requiresLearning: false
  })

  when(["culturaldelights", "farm_and_charm"], 'chunkbound:compat/pot_cooking/culturalrecipes/cooking/spicy_curry', {
    type: "farm_and_charm:pot_cooking",
    ingredients: [
      {
        item: "minecraft:blaze_powder"
      },
      {
        item: "farmersdelight:tomato_sauce"
      },
      {
        item: "farmersdelight:cooked_rice"
      },
      {
        tag: "c:crops/onion"
      },
      {
        tag: "c:foods/cooked_chicken"
      },
      {
        tag: "c:drinks/milk"
      }
    ],
    requireContainer: true,
    container: {
      id: "minecraft:bowl",
      count: 1
    },
    result: {
      count: 1,
      id: "culturaldelights:spicy_curry"
    },
    requiresLearning: false
  })

  when(["endersdelight", "farm_and_charm"], 'chunkbound:compat/pot_cooking/endersdelight/cooking/amberveil_stew', {
    type: "farm_and_charm:pot_cooking",
    ingredients: [
      {
        item: "endersdelight:amberveil"
      },
      {
        item: "endersdelight:voidpepper"
      },
      {
        item: "endersdelight:ethereal_saffron"
      },
      {
        item: "minecraft:chorus_flower"
      }
    ],
    requireContainer: true,
    container: {
      id: "endersdelight:shulker_bowl",
      count: 1
    },
    result: {
      id: "endersdelight:amberveil_stew"
    },
    requiresLearning: false
  })

  when(["endersdelight", "farm_and_charm"], 'chunkbound:compat/pot_cooking/endersdelight/cooking/amberveiled_curry', {
    type: "farm_and_charm:pot_cooking",
    ingredients: [
      {
        item: "endersdelight:amberveil"
      },
      {
        item: "endersdelight:voidpepper"
      },
      {
        item: "minecraft:chorus_flower"
      },
      {
        item: "endersdelight:chorusflame"
      }
    ],
    requireContainer: true,
    container: {
      id: "endersdelight:shulker_bowl",
      count: 1
    },
    result: {
      id: "endersdelight:amberveiled_curry"
    },
    requiresLearning: false
  })

  when(["endersdelight", "farm_and_charm"], 'chunkbound:compat/pot_cooking/endersdelight/cooking/chicken_curry', {
    type: "farm_and_charm:pot_cooking",
    ingredients: [
      {
        item: "endersdelight:chorusflame"
      },
      {
        item: "endersdelight:ethereal_saffron"
      },
      {
        item: "endersdelight:voidpepper"
      },
      {
        item: "minecraft:chicken"
      },
      {
        item: "farmersdelight:chicken_cuts"
      },
      {
        item: "farmersdelight:rice"
      }
    ],
    requireContainer: true,
    container: {
      id: "endersdelight:shulker_bowl",
      count: 1
    },
    result: {
      id: "endersdelight:chicken_curry"
    },
    requiresLearning: false
  })

  when(["endersdelight", "farm_and_charm"], 'chunkbound:compat/pot_cooking/endersdelight/cooking/chorus_stew', {
    type: "farm_and_charm:pot_cooking",
    ingredients: [
      {
        item: "minecraft:chorus_fruit"
      },
      {
        item: "minecraft:chorus_flower"
      }
    ],
    requireContainer: true,
    container: {
      id: "endersdelight:shulker_bowl",
      count: 1
    },
    result: {
      id: "endersdelight:chorus_stew"
    },
    requiresLearning: false
  })

  when(["endersdelight", "farm_and_charm"], 'chunkbound:compat/pot_cooking/endersdelight/cooking/ender_paella', {
    type: "farm_and_charm:pot_cooking",
    ingredients: [
      {
        tag: "endersdelight:enderman_sight"
      },
      {
        tag: "endersdelight:shulker_loot"
      },
      {
        item: "minecraft:chorus_flower"
      },
      {
        item: "farmersdelight:rice"
      }
    ],
    requireContainer: true,
    container: {
      id: "endersdelight:shulker_bowl",
      count: 1
    },
    result: {
      id: "endersdelight:ender_paella"
    },
    requiresLearning: false
  })

  when(["endersdelight", "farm_and_charm"], 'chunkbound:compat/pot_cooking/endersdelight/cooking/endermite_stew', {
    type: "farm_and_charm:pot_cooking",
    ingredients: [
      {
        tag: "endersdelight:enderman_loot"
      },
      {
        item: "endersdelight:mite_crust"
      }
    ],
    requireContainer: true,
    container: {
      id: "endersdelight:shulker_bowl",
      count: 1
    },
    result: {
      id: "endersdelight:endermite_stew"
    },
    requiresLearning: false
  })

  when(["endersdelight", "farm_and_charm"], 'chunkbound:compat/pot_cooking/endersdelight/cooking/pearl_pasta', {
    type: "farm_and_charm:pot_cooking",
    ingredients: [
      {
        tag: "endersdelight:enderman_loot"
      },
      {
        tag: "c:foods/pasta"
      },
      {
        item: "endersdelight:chorus_juice"
      }
    ],
    requireContainer: true,
    container: {
      id: "endersdelight:shulker_bowl",
      count: 1
    },
    result: {
      id: "endersdelight:pearl_pasta"
    },
    requiresLearning: false
  })

  when(["endersdelight", "farm_and_charm"], 'chunkbound:compat/pot_cooking/endersdelight/cooking/steak_fries', {
    type: "farm_and_charm:pot_cooking",
    ingredients: [
      {
        item: "endersdelight:voidpepper"
      },
      {
        item: "minecraft:beef"
      },
      {
        tag: "c:drinks/milk"
      },
      {
        item: "minecraft:potato"
      }
    ],
    requireContainer: true,
    container: {
      id: "endersdelight:shulker_bowl",
      count: 1
    },
    result: {
      id: "endersdelight:steak_fries"
    },
    requiresLearning: false
  })

  when(["endersdelight", "farm_and_charm"], 'chunkbound:compat/pot_cooking/endersdelight/cooking/stuffed_shulker', {
    type: "farm_and_charm:pot_cooking",
    ingredients: [
      {
        item: "endersdelight:shulker_mollusk"
      },
      {
        item: "minecraft:chorus_fruit"
      },
      {
        item: "farmersdelight:rice"
      },
      {
        item: "farmersdelight:tomato"
      },
      {
        item: "minecraft:brown_mushroom"
      }
    ],
    requireContainer: true,
    container: {
      id: "minecraft:shulker_shell",
      count: 1
    },
    result: {
      count: 1,
      id: "endersdelight:stuffed_shulker"
    },
    requiresLearning: false
  })

  when(["endersdelight", "farm_and_charm"], 'chunkbound:compat/pot_cooking/endersdelight/cooking/veil_of_flames_risotto', {
    type: "farm_and_charm:pot_cooking",
    ingredients: [
      {
        item: "endersdelight:amberveil"
      },
      {
        item: "endersdelight:ethereal_saffron"
      },
      {
        item: "minecraft:chorus_flower"
      },
      {
        item: "endersdelight:chorusflame"
      }
    ],
    requireContainer: true,
    container: {
      id: "endersdelight:shulker_bowl",
      count: 1
    },
    result: {
      id: "endersdelight:veil_of_flames_risotto"
    },
    requiresLearning: false
  })

  when(["farm_and_charm", "farmersdelight"], 'chunkbound:compat/pot_cooking/farmersdelight/cooking/beetroot_soup', {
    type: "farm_and_charm:pot_cooking",
    ingredients: [
      {
        tag: "c:crops/beetroot"
      },
      {
        tag: "c:crops/beetroot"
      },
      {
        tag: "c:crops/beetroot"
      }
    ],
    requireContainer: true,
    container: {
      id: "minecraft:bowl",
      count: 1
    },
    result: {
      count: 1,
      id: "minecraft:beetroot_soup"
    },
    requiresLearning: false
  })

  when(["farm_and_charm", "farmersdelight"], 'chunkbound:compat/pot_cooking/farmersdelight/cooking/mushroom_stew', {
    type: "farm_and_charm:pot_cooking",
    ingredients: [
      {
        item: "minecraft:brown_mushroom"
      },
      {
        item: "minecraft:red_mushroom"
      }
    ],
    requireContainer: true,
    container: {
      id: "minecraft:bowl",
      count: 1
    },
    result: {
      count: 1,
      id: "minecraft:mushroom_stew"
    },
    requiresLearning: false
  })

  when(["farm_and_charm", "farmersdelight"], 'chunkbound:compat/pot_cooking/farmersdelight/cooking/rabbit_stew', {
    type: "farm_and_charm:pot_cooking",
    ingredients: [
      {
        tag: "c:crops/potato"
      },
      {
        item: "minecraft:rabbit"
      },
      {
        tag: "c:crops/carrot"
      },
      {
        type: "neoforge:compound",
        children: [
          {
            item: "minecraft:brown_mushroom"
          },
          {
            item: "minecraft:red_mushroom"
          }
        ]
      }
    ],
    requireContainer: true,
    container: {
      id: "minecraft:bowl",
      count: 1
    },
    result: {
      count: 1,
      id: "minecraft:rabbit_stew"
    },
    requiresLearning: false
  })

  when(["farm_and_charm", "farmersdelight"], 'chunkbound:compat/pot_cooking/farmersdelight/cooking/stuffed_pumpkin_block', {
    type: "farm_and_charm:pot_cooking",
    ingredients: [
      {
        tag: "c:crops/rice"
      },
      {
        tag: "c:crops/onion"
      },
      {
        item: "minecraft:brown_mushroom"
      },
      {
        tag: "c:crops/potato"
      },
      {
        tag: "c:foods/berry"
      },
      {
        type: "neoforge:difference",
        base: {
          tag: "c:foods/vegetable"
        },
        subtracted: {
          item: "minecraft:melon_slice"
        }
      }
    ],
    requireContainer: true,
    container: {
      id: "minecraft:pumpkin",
      count: 1
    },
    result: {
      count: 1,
      id: "farmersdelight:stuffed_pumpkin_block"
    },
    requiresLearning: false
  })

  when(["farm_and_charm", "spawn"], 'chunkbound:compat/pot_cooking/spawn/cooking/clam_chowder', {
    type: "farm_and_charm:pot_cooking",
    ingredients: [
      {
        item: "spawn:cooked_clam"
      },
      {
        item: "minecraft:potato"
      },
      {
        item: "farmersdelight:milk_bottle"
      }
    ],
    requireContainer: true,
    container: {
      id: "minecraft:bowl",
      count: 1
    },
    result: {
      id: "spawn:clam_chowder",
      count: 1
    },
    requiresLearning: false
  })

  when(["farm_and_charm", "spawn"], 'chunkbound:compat/pot_cooking/spawn/cooking/crab_boil_block', {
    type: "farm_and_charm:pot_cooking",
    ingredients: [
      {
        item: "spawn:coastal_crab_bucket"
      },
      {
        item: "minecraft:potato"
      },
      {
        item: "minecraft:potato"
      },
      {
        item: "farmersdelight:bacon"
      },
      {
        item: "farmersdelight:onion"
      }
    ],
    requireContainer: true,
    container: {
      id: "minecraft:bowl",
      count: 1
    },
    result: {
      id: "spawn:crab_boil_block",
      count: 1
    },
    requiresLearning: false
  })
})
