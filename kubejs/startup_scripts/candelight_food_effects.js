//Effects for Candlelight dishes that ship without one.
//Durations follow Candlelight's own range for effect foods (2400-6000 ticks).
//
//Each dish also re-states its saturation modifier. That is NOT cosmetic:
//KubeJS FoodBuilder reads FoodProperties.saturation() (the ABSOLUTE value) into
//its saturation field, but build() passes that field to
//FoodConstants.saturationByModifier(nutrition, value), which is
//nutrition * value * 2. So any modifyFood round-trip re-multiplies saturation
//even when only an effect is added. Setting the modifier back explicitly
//cancels that out and keeps each dish's shipped saturation.
//
//The modifiers below are the values Candlelight itself declares
//(CandlelightFoods), so nutrition and saturation both end up unchanged.
ItemEvents.modification(event => {

  //Brewed with milk and a water bottle -> Rested, 3 minutes
  //Candlelight: nutrition 6, modifier 0.6 -> 7.2 saturation
  event.modify('candlelight:tomato_soup', item => {
    item.modifyFood(food => {
      food.saturation(0.6)
      food.effect('farm_and_charm:rested', 3600, 0, 1.0)
    })
  })

  //The showpiece roast of the pack (10 nutrition) -> Feast, 5 minutes.
  //Feast is Sustenance + Satiation, which suits a centrepiece banquet dish
  //Candlelight: nutrition 10, modifier 0.7 -> 14.0 saturation
  event.modify('candlelight:beef_wellington', item => {
    item.modifyFood(food => {
      food.saturation(0.7)
      food.effect('farm_and_charm:feast', 6000, 0, 1.0)
    })
  })

  //Baked comfort food (10 nutrition) -> Comfort, 4 minutes.
  //Comfort grants natural regeneration regardless of hunger level
  //Candlelight: nutrition 10, modifier 0.7 -> 14.0 saturation
  event.modify('candlelight:lasagne', item => {
    item.modifyFood(food => {
      food.saturation(0.7)
      food.effect('farmersdelight:comfort', 4800, 0, 1.0)
    })
  })

  //A balanced plated main -> Well Served, 3 minutes.
  //Candlelight's own effect: hunger cannot fall below 8/20
  //This dish reuses vanilla Foods.GOLDEN_CARROT: nutrition 6, modifier 1.2
  //-> 14.4 saturation
  event.modify('candlelight:chicken_with_vegetables', item => {
    item.modifyFood(food => {
      food.saturation(1.2)
      food.effect('candlelight:well_served', 3600, 0, 1.0)
    })
  })
})
