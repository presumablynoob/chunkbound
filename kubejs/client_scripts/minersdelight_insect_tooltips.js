//Tooltip lines for the effects added to the two insect breads in
//startup_scripts/minersdelight_food_caps.js.
//
//Miner's Delight registers most of its foods as Farm & Charm ConsumableItem
//(seasoned_arthropods and weird_caviar are, which is why their Nourishment
//shows up on its own), but insect_wrap and insect_sandwich are plain
//net.minecraft.world.item.Item. Nothing renders the food component's effects
//for a plain Item, so ours worked when eaten but were invisible in EMI.
//
//Item class is fixed at registration and cannot be changed by a datapack or by
//KubeJS, so the lines are drawn here to match how ConsumableItem presents them:
//inserted at line 1, directly under the item name and above the id, with the
//duration zero-padded to MM:SS. Colours follow vanilla rather than Farm &
//Charm's single tone - beneficial blue, harmful red - since one of these is a
//drawback.
//
//Keep these in step with the effects in the startup script.
ItemEvents.modifyTooltips(event => {

  const insectBreads = [
    'minersdelight:insect_wrap',
    'minersdelight:insect_sandwich'
  ]

  insectBreads.forEach(id => {
    event.modify(id, tooltip => {
      tooltip.insert(1, [
        Text.blue(Text.translate('effect.minecraft.haste').append(' (01:00)')),
        Text.red(Text.translate('effect.minecraft.infested').append(' (01:30)'))
      ])
    })
  })
})
