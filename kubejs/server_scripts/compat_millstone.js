// Kaleidoscope Cookery millstone equivalents of other mods' milling.
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

  when(["cornexpansion", "kaleidoscope_cookery"], 'chunkbound:compat/millstone/cornexpansion/farm_and_charm/mincer/corn_flour', {
    type: "kaleidoscope_cookery:millstone",
    ingredient: {
      item: "cornexpansion:dried_kernels"
    },
    result: {
      id: "cornexpansion:corn_flour",
      count: 2
    }
  })

  when(["cornexpansion", "kaleidoscope_cookery"], 'chunkbound:compat/millstone/cornexpansion/farm_and_charm/mincer/cornmeal', {
    type: "kaleidoscope_cookery:millstone",
    ingredient: {
      tag: "cornexpansion:seeds/corn"
    },
    result: {
      id: "cornexpansion:cornmeal",
      count: 2
    }
  })

  when(["farm_and_charm", "kaleidoscope_cookery"], 'chunkbound:compat/millstone/farm_and_charm/mincer/fertilizer', {
    type: "kaleidoscope_cookery:millstone",
    ingredient: {
      item: "minecraft:rotten_flesh"
    },
    result: {
      id: "farm_and_charm:fertilizer",
      count: 1
    }
  })

  when(["farm_and_charm", "kaleidoscope_cookery"], 'chunkbound:compat/millstone/farm_and_charm/mincer/flour', {
    type: "kaleidoscope_cookery:millstone",
    ingredient: {
      tag: "farm_and_charm:wheat"
    },
    result: {
      id: "farm_and_charm:flour",
      count: 4
    }
  })

  when(["farm_and_charm", "kaleidoscope_cookery"], 'chunkbound:compat/millstone/farm_and_charm/mincer/lettuce_seeds', {
    type: "kaleidoscope_cookery:millstone",
    ingredient: {
      tag: "c:foods/cabbage"
    },
    result: {
      id: "farmersdelight:cabbage_seeds",
      count: 3
    }
  })

  when(["farm_and_charm", "kaleidoscope_cookery"], 'chunkbound:compat/millstone/farm_and_charm/mincer/strawberry_seeds', {
    type: "kaleidoscope_cookery:millstone",
    ingredient: {
      item: "farm_and_charm:strawberry"
    },
    result: {
      id: "farm_and_charm:strawberry_seeds",
      count: 4
    }
  })

  when(["farm_and_charm", "kaleidoscope_cookery"], 'chunkbound:compat/millstone/farm_and_charm/mincer/tomato_seeds', {
    type: "kaleidoscope_cookery:millstone",
    ingredient: {
      tag: "c:foods/tomato"
    },
    result: {
      id: "farmersdelight:tomato_seeds",
      count: 3
    }
  })
})
