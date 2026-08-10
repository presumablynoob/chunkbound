// //Tomato Compat
// //Raw Bacon Compat
// ServerEvents.tags('item', event => {
//   event.add('c:hidden_from_recipe_viewers', 'farm_and_charm:bacon')
// })
// ServerEvents.recipes(event => {
//   event.replaceInput(
//     { input: 'farmersdelight:bacon' }, // filter: only recipes using this item
//     'farmersdelight:bacon',            // item to replace
//     '#c:foods/raw_bacon'                   // replace with the tag
//   )
//   event.replaceInput(
//     { input: 'farm_and_charm:bacon' }, // filter: only recipes using this item
//     'farm_and_charm:bacon',            // item to replace
//     '#c:foods/raw_bacon'                   // replace with the tag
//   )
// })

// //Chicken Parts Compat
// ServerEvents.tags('item', event => {
//     const oldChicken = 'farm_and_charm:chicken_parts'
//     const newChicken = 'farmersdelight:chicken_cuts'
//     const tagsToCheck = [
//       'c:raw_chicken',
//       'origins:meat'
//     ]

//     tagsToCheck.forEach(tagId => {
//         const ids = event.get(tagId).getObjectIds()
//         event.add(tagId, newChicken)
//         event.remove(tagId, oldChicken)
//     })
//     event.add('c:hidden_from_recipe_viewers', 'farm_and_charm:chicken_parts')
// })

// //Minced Beef Compat
// ServerEvents.tags('item', event => {
//     const oldBeef = 'farm_and_charm:minced_beef'
//     const newBeef = 'farmersdelight:minced_beef'
//     const tagsToCheck = [
//       'c:raw_beef',
//       'origins:meat'
//     ]

//     tagsToCheck.forEach(tagId => {
//         const ids = event.get(tagId).getObjectIds()
//         event.add(tagId, newBeef)
//         event.remove(tagId, oldBeef)
//     })
//     event.add('c:hidden_from_recipe_viewers', 'farm_and_charm:minced_beef')
// })

// //Pasta Compat
// ServerEvents.tags('item', event => {
//   event.add('c:hidden_from_recipe_viewers', 'farm_and_charm:raw_pasta')
// })

// //Dog Food Compat
// ServerEvents.tags('item', event => {
//   event.add('c:hidden_from_recipe_viewers', 'farmersdelight:dog_food')
//   const oldDogFood = 'farmersdelight:dog_food'
//   const newDogFood = 'farm_and_charm:dog_food'
//   const tagsToCheck = [
//         'minecraft:wolf_food',
//         'c:animal_foods'
//     ]

//   tagsToCheck.forEach(tagId => {
//       const ids = event.get(tagId).getObjectIds()
//       event.add(tagId, newDogFood)
//       event.remove(tagId, oldDogFood)
//   })
// })

// //Knife Retagging
// ServerEvents.tags('item', event => {
//   event.add("c:tools/knife", "bakery:bread_knife")
// });

