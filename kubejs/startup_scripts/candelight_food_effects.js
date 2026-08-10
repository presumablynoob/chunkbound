//Effects for Candlelight dishes that ship without one.
//modifyFood edits the existing food component, so nutrition and saturation are kept.
//Durations follow Candlelight's own range for effect foods (2400-6000 ticks).
ItemEvents.modification(event => {

  //Brewed with milk and a water bottle -> Rested, 3 minutes
  event.modify('candlelight:tomato_soup', item => {
    item.modifyFood(food => {
      food.effect('farm_and_charm:rested', 3600, 0, 1.0)
    })
  })

  //The showpiece roast of the pack (10 nutrition) -> Feast, 5 minutes.
  //Feast is Sustenance + Satiation, which suits a centrepiece banquet dish
  event.modify('candlelight:beef_wellington', item => {
    item.modifyFood(food => {
      food.effect('farm_and_charm:feast', 6000, 0, 1.0)
    })
  })

  //Baked comfort food (10 nutrition) -> Comfort, 4 minutes.
  //Comfort grants natural regeneration regardless of hunger level
  event.modify('candlelight:lasagne', item => {
    item.modifyFood(food => {
      food.effect('farmersdelight:comfort', 4800, 0, 1.0)
    })
  })

  //A balanced plated main -> Well Served, 3 minutes.
  //Candlelight's own effect: hunger cannot fall below 8/20
  event.modify('candlelight:chicken_with_vegetables', item => {
    item.modifyFood(food => {
      food.effect('candlelight:well_served', 3600, 0, 1.0)
    })
  })
})
