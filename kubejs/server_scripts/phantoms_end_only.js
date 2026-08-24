const PHANTOM_SPAWN_INTERVAL = 20 * 20   // check every 20 seconds
const PHANTOM_SPAWN_CHANCE = 0.1
const PHANTOM_LIMIT_DISTANCE = 64
const PHANTOM_INSOMNIA_TICKS = 3 * 24000
const PHANTOM_MIN_COUNT = 1
const PHANTOM_MAX_COUNT = 3
const GameRules = Java.loadClass('net.minecraft.world.level.GameRules')
const PHANTOM_REST_OBJECTIVE = 'cb_phantom_rest'

ServerEvents.loaded(event => {
    event.server.runCommandSilent(
        `scoreboard objectives add ${PHANTOM_REST_OBJECTIVE} minecraft.custom:minecraft.time_since_rest`
    )
})

// Block phantom spawns outside the End
EntityEvents.checkSpawn(event => {
    if (event.entity.type == 'minecraft:phantom') {
        const dimension = event.entity.level.dimension
        if (dimension != 'minecraft:the_end') {
            event.cancel()
        }
    }
})

ServerEvents.tick(event => {
    if (event.server.tickCount % PHANTOM_SPAWN_INTERVAL != 0) return

    event.server.players.forEach(player => {
        const level = player.level

        if (level.dimension != 'minecraft:the_end') return
        if (player.gameMode == 'spectator') return
        if (level.difficulty == 'peaceful') return
        if (!level.gameRules.getBoolean(GameRules.RULE_DOINSOMNIA)) return
        if (!level.gameRules.getBoolean(GameRules.RULE_DOMOBSPAWNING)) return

        if (Math.random() >= PHANTOM_SPAWN_CHANCE) return

        const count = PHANTOM_MIN_COUNT + Math.floor(Math.random() * (PHANTOM_MAX_COUNT - PHANTOM_MIN_COUNT + 1))

        for (let i = 0; i < count; i++) {
            const offsetX = (Math.random() - 0.5) * 6
            const offsetZ = (Math.random() - 0.5) * 6
            player.runCommandSilent(
                `execute if score @s ${PHANTOM_REST_OBJECTIVE} matches ${PHANTOM_INSOMNIA_TICKS}.. unless entity @e[type=minecraft:phantom,distance=..${PHANTOM_LIMIT_DISTANCE}] run summon minecraft:phantom ~${offsetX.toFixed(2)} ~10 ~${offsetZ.toFixed(2)}`
            )
        }
    })
})