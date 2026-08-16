//Caps Miner's Delight composite dishes at 1.25x the food value of their ingredients.
//
//Only multi-ingredient crafted/cooked dishes are touched. Smelted variants
//(baked_squid, smoked_bat_wing, ...) and base drops (cave_carrot, bat_wing, ...)
//keep their shipped values, since vanilla cooking is itself well above 1.25x.
//
//Base totals use the LOWEST-value member of any ingredient tag, so a dish can
//never beat 1.25x no matter which valid ingredients the player actually used.
//Non-food inputs (mushrooms, wheat, eggs, dough, bowls, sticks) count as zero.
//Recipes that yield a stack are divided by the output count, and feast blocks
//by their serving count (fake_meatloaf 4, glazed_arachnid_limbs 4,
//stuffed_squid 5).
//
//IMPORTANT - the second number is a saturation MODIFIER, not the saturation.
//KubeJS FoodBuilder.build() passes it through
//FoodConstants.saturationByModifier(nutrition, value), which is
//nutrition * value * 2. So modifier = targetSaturation / (nutrition * 2).
//Passing an absolute saturation here multiplies it instead of capping it.
//The comment on each line records the absolute saturation it works out to.
//
//Note FoodBuilder's constructor reads the ABSOLUTE saturation back into that
//same field, so any modifyFood round-trip re-multiplies saturation even when
//saturation is not touched. Every entry below therefore sets it explicitly.
//
//Nutrition is floored at 1 so nothing becomes inedible.
ItemEvents.modification(event => {

  //[nutrition, saturationModifier]
  const caps = {
    //Cooking pot dishes
    'minersdelight:pasta_with_veggieballs': [11, 0.3],   //6.6 saturation
    'minersdelight:cave_soup': [3, 0.317],               //1.9
    'minersdelight:bat_soup': [2, 0.125],                //0.5
    'minersdelight:bat_rolls': [1, 0.1],                 //0.2
    'minersdelight:glow_ink_pasta': [6, 0.183],          //2.2
    'minersdelight:insect_stew': [7, 0.307],             //1.5
    'minersdelight:takoyaki': [5, 0.22],                 //2.2

    //Feast servings
    'minersdelight:plate_of_fake_meatloaf': [3, 0.367],  //2.2
    'minersdelight:bowl_of_stuffed_squid': [2, 0.25],    //1.0
    //Nutrition already under its cap; only the saturation comes down
    'minersdelight:plate_of_glazed_arachnid_limbs': [12, 0.296], //7.1

    //Crafted dishes
    'minersdelight:cave_hamburger': [12, 0.408],         //9.8
    'minersdelight:vegan_hamburger': [11, 0.564],        //12.4
    'minersdelight:vegan_wrap': [10, 0.53],              //10.6
    'minersdelight:insect_sandwich': [10, 0.47],         //9.4
    'minersdelight:insect_wrap': [11, 0.441],            //9.7
    'minersdelight:improvised_barbecue_stick': [7, 0.157], //2.2
    'minersdelight:seasoned_arthropods': [12, 0.358],    //3.8
    'minersdelight:weird_caviar': [3, 0.067],            //0.4

    //Bars - crunchy_bar yields 4, nutritional_bar yields 4, bat_cookie yields 8
    'minersdelight:crunchy_bar': [5, 0.15],              //1.5
    'minersdelight:nutritional_bar': [10, 0.41],         //8.2
    'minersdelight:golden_nutritional_bar': [10, 0.69],  //13.8
    'minersdelight:bat_cookie': [1, 0.05]                //0.1
  }

  //Effects applied on top of the caps, as [effect, ticks, amplifier, probability].
  //These must be set in the SAME modifyFood call as the values above - a second
  //modifyFood pass would re-trigger the saturation round-trip described in the
  //header and undo the cap.
  //The two insect breads trade a short Haste for a longer Infested: quicker
  //mining, but taking damage bursts silverfish out of you.
  const effects = {
    'minersdelight:insect_wrap': [
      ['minecraft:haste', 1200, 0, 1.0],      //1:00 Haste I
      ['minecraft:infested', 1800, 0, 1.0]    //1:30 Infested
    ],
    'minersdelight:insect_sandwich': [
      ['minecraft:haste', 1200, 0, 1.0],      //1:00 Haste I
      ['minecraft:infested', 1800, 0, 1.0]    //1:30 Infested
    ]
  }

  Object.keys(caps).forEach(id => {
    const nutrition = caps[id][0]
    const saturationModifier = caps[id][1]
    const itemEffects = effects[id]
    event.modify(id, item => {
      item.modifyFood(food => {
        food.nutrition(nutrition)
        food.saturation(saturationModifier)
        if (itemEffects) {
          itemEffects.forEach(e => food.effect(e[0], e[1], e[2], e[3]))
        }
      })
    })
  })
})
