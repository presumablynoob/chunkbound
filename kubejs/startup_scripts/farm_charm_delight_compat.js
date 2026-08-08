ItemEvents.modification(event => {
  event.modify('bakery:chocolate_jam', item => {
    item.maxStackSize = 16
  })
  event.modify('bakery:strawberry_jam', item => {
    item.maxStackSize = 16
  })
})