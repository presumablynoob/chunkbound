//Tomato Compat
//Hides Kaleidoscope Cookery tomatoes
ServerEvents.tags('item', event => {
  event.add('c:hidden_from_recipe_viewers', 'kaleidoscope_cookery:tomato')
  event.add('c:hidden_from_recipe_viewers', 'kaleidoscope_cookery:tomato_seed')
})
//Moves tag membership from Kaleidoscope Cookery to Let's Do tomatoes
//KC's pot/stockpot recipes (scramble egg, borscht) use #c:crops/tomato,
//so after this retag they only accept the Farm & Charm tomato
ServerEvents.tags('item', event => {
    const oldTomato = 'kaleidoscope_cookery:tomato'
    const newTomato = 'farm_and_charm:tomato'
    const tagsToCheck = [
        'c:crops/tomato',
        'c:vegetables/tomato',
        'c:foods/vegetable',
        'c:foods',
        'c:vegetables'
    ]

    tagsToCheck.forEach(tagId => {
        event.add(tagId, newTomato)
        event.remove(tagId, oldTomato)
    })

    //Seeds tag introduced by Kaleidoscope Cookery
    event.add('c:seeds/tomato', 'farm_and_charm:tomato_seeds')
    event.remove('c:seeds/tomato', 'kaleidoscope_cookery:tomato_seed')
})
//Replaces Kaleidoscope Cookery tomato recipes
//(tomato platter hardcodes the KC tomato; seed recipe is redundant since
//Farm & Charm has its own tomato -> seeds recipe)
ServerEvents.recipes(event => {
    event.replaceInput({}, 'kaleidoscope_cookery:tomato', 'farm_and_charm:tomato')
    event.replaceOutput({}, 'kaleidoscope_cookery:tomato', 'farm_and_charm:tomato')
    event.remove({ output: 'kaleidoscope_cookery:tomato_seed' })
    event.replaceInput({}, 'kaleidoscope_cookery:tomato_seed', 'farm_and_charm:tomato_seeds')
})
