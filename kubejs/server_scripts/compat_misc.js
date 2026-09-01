// The remaining recipes the pack invents that fit no compat group.
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

  when(["farmersdelight", "kaleidoscope_cookery"], 'chunkbound:cutting/sashimi_from_salmon_slice', {
    type: "farmersdelight:cutting",
    ingredients: [
      {
        item: "farmersdelight:salmon_slice"
      }
    ],
    result: [
      {
        item: {
          count: 2,
          id: "kaleidoscope_cookery:sashimi"
        }
      }
    ],
    tool: [
      {
        type: "farmersdelight:item_ability",
        action: "knife_dig"
      },
      {
        tag: "c:tools/knife"
      }
    ]
  })

  when([], 'kaleidoscope_cookery:millstone/raw_noodles_from_rice', {
    type: "kaleidoscope_cookery:millstone",
    ingredient: {
      tag: "c:crops/rice"
    },
    result: {
      count: 1,
      id: "kaleidoscope_cookery:raw_noodles"
    }
  })
})
