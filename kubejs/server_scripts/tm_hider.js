ServerEvents.tags('item', event => {
    //Hiding TMs/TRs from EMI
    const TR = event.get('simpletms:tr_items').getObjectIds()
    TR.forEach(disc => {event.add('c:hidden_from_recipe_viewers', disc)})
    const TM = event.get('simpletms:tm_items').getObjectIds()
    TM.forEach(disc => {event.add('c:hidden_from_recipe_viewers', disc)})

})
