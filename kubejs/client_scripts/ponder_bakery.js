//Scenes use our own structure instead of the default ponderjs:basic. It ships in
//the CBResources pack at assets/chunkbound/ponder/basic.nbt
const PONDER_STRUCTURE = "chunkbound:basic";

Ponder.tags((event) => {
    event.createTag("chunkbound:utils", "minecraft:grass_block", "Chunkbound.", "Pondering for Chunkbound!", [
        "bakery:baker_station"
    ]);
});

Ponder.registry((event) => {

    //Cake Function
    function simpleCakeScene(cakeId, jamItem, jamLabel, displayName) {
        event.create(cakeId).scene("preping", `Baking a ${displayName}!`, PONDER_STRUCTURE, (scene, util) => {
            scene.showStructure();
            scene.world.setBlock([2.5, 1, 2.5], "bakery:baker_station", false);
            scene.idle(20);

            scene.showControls(50, [2.5, 3, 2.5], "down")
                .withItem("bakery:cake_dough")
                .rightClick();
            scene.text(50, "Place Cake Dough onto Caking Station.", [2.25, 2, 2.5])
                .placeNearTarget();
            scene.world.setBlock([2.5, 2, 2.5], "bakery:blank_cake", true);
            scene.addKeyframe();

            scene.idle(70);

            scene.showControls(80, [2.5, 3, 2.5], "down")
                .withItem(jamItem)
                .rightClick();
            scene.text(80, `Using ${jamLabel}, interact with the Blank Cake.`, [2.25, 2, 2.5])
                .placeNearTarget();
            scene.addKeyframe();

            scene.idle(20);

            scene.world.setBlock([2.5, 2, 2.5], cakeId, true);

            scene.idle(80);

            scene.text(80, `Voila! Your ${displayName} is ready!`, [2.25, 2, 2.5])
                .placeNearTarget()
                .colored(PonderPalette.OUTPUT);
        });
    }

    //Cupcake Function
    function simpleCupcakeScene(cupcakeId, jamItem, jamLabel, displayName, blockName) {
        event.create(cupcakeId).scene("preping", `Baking ${displayName}!`, PONDER_STRUCTURE, (scene, util) => {
            scene.showStructure();
            scene.world.setBlock([2.5, 1, 2.5], "bakery:baker_station", false);
            scene.idle(20);

            scene.showControls(50, [2.5, 3, 2.5], "down")
                .withItem("bakery:cake_dough")
                .rightClick();
            scene.text(50, "Place Cake Dough onto Caking Station.", [2.25, 2, 2.5])
                .placeNearTarget();
            scene.world.setBlock([2.5, 2, 2.5], "bakery:blank_cake", true);
            scene.addKeyframe();

            scene.idle(70);

            scene.showControls(80, [2.5, 3, 2.5], "down")
                .withItem("bakery:bread_knife")
                .rightClick();
            scene.text(80, "Using a Knife, interact with the Blank Cake to turn it into Blank Cupcakes.", [2.25, 2, 2.5])
                .placeNearTarget();
            scene.addKeyframe();
            scene.idle(20);
            scene.world.setBlock([2.5, 2, 2.5], "bakery:blank_cake[cake=false,cookie=false,cupcake=true]", true);

            scene.idle(80);

            scene.showControls(80, [2.5, 3, 2.5], "down")
                .withItem(jamItem)
                .rightClick();
            scene.text(80, `Using ${jamLabel}, interact with the Blank Cupcakes.`, [2.25, 2, 2.5])
                .placeNearTarget();
            scene.addKeyframe();
            scene.idle(20);
            scene.world.setBlock([2.5, 2, 2.5], blockName, true);

            scene.idle(80);

            scene.text(80, `Voila! Your ${displayName} are ready!`, [2.25, 2, 2.5])
                .placeNearTarget()
                .colored(PonderPalette.OUTPUT);
        });
    }

    //Cookie Function
    function simpleCookieScene(cookieId, jamItem, jamLabel, displayName, blockName) {
        event.create(cookieId).scene("preping", `Baking ${displayName}!`, PONDER_STRUCTURE, (scene, util) => {
            scene.showStructure();
            scene.world.setBlock([2.5, 1, 2.5], "bakery:baker_station", false);
            scene.idle(20);

            scene.showControls(50, [2.5, 3, 2.5], "down")
                .withItem("bakery:cake_dough")
                .rightClick();
            scene.text(50, "Place Cake Dough onto Caking Station.", [2.25, 2, 2.5])
                .placeNearTarget();
            scene.world.setBlock([2.5, 2, 2.5], "bakery:blank_cake", true);
            scene.addKeyframe();

            scene.idle(70);

            scene.showControls(80, [2.5, 3, 2.5], "down")
                .withItem("bakery:bread_knife")
                .rightClick();
            scene.text(80, "With a Knife, interact with the Blank Cake to turn it into Blank Cupcakes.", [2.25, 2, 2.5])
                .placeNearTarget();
            scene.addKeyframe();
            scene.idle(20);
            scene.world.setBlock([2.5, 2, 2.5], "bakery:blank_cake[cake=false,cookie=false,cupcake=true]", true);

            scene.idle(80);

            scene.showControls(80, [2.5, 3, 2.5], "down")
                .withItem("bakery:rolling_pin")
                .rightClick();
            scene.text(80, "With a Rolling Pin, interact with the Blank Cupcakes to turn them into Blank Cookies.", [2.25, 2, 2.5])
                .placeNearTarget();
            scene.addKeyframe();
            scene.idle(20);
            scene.world.setBlock([2.5, 2, 2.5], "bakery:blank_cake[cake=false,cookie=true,cupcake=false]", true);

            scene.idle(80);

            scene.showControls(80, [2.5, 3, 2.5], "down")
                .withItem(jamItem)
                .rightClick();
            scene.text(80, `Using ${jamLabel}, interact with the Blank Cookies.`, [2.25, 2, 2.5])
                .placeNearTarget();
            scene.addKeyframe();
            scene.idle(20);
            scene.world.setBlock([2.5, 2, 2.5], blockName, true);

            scene.idle(80);

            scene.text(80, `Voila! Your ${displayName} are ready!`, [2.25, 2, 2.5])
                .placeNearTarget()
                .colored(PonderPalette.OUTPUT);
        });
    }

    // Each entry: [resultId, jamItem, jamLabel, displayName]
    const simpleCakes = [
        ["bakery:strawberry_cake", "bakery:strawberry_jam", "Strawberry Jam", "Strawberry Cake"],
        ["bakery:sweetberry_cake", "bakery:sweetberry_jam", "Sweetberry Jam", "Sweetberry Cake"],
        ["bakery:chocolate_cake", "bakery:chocolate_jam", "Chocolate Spread", "Chocolate Cake"],
        ["bakery:chocolate_gateau", "bakery:chocolate_truffle", "Chocolate Truffle", "Chocolate Gateau"]
    ];

    //Each entry: [cupcakeId, jamItem, jamLabel, displayName, blockName]
    const simpleCupcakes = [
        ["bakery:strawberry_cupcake", "bakery:strawberry_jam", "Strawberry Jam", "Strawberry Cupcakes", "bakery:strawberry_cupcake_block"],
        ["bakery:sweetberry_cupcake", "bakery:sweetberry_jam", "Sweetberry Jam", "Sweetberry Cupcakes", "bakery:sweetberry_cupcake_block"],
        ["bakery:apple_cupcake", "bakery:apple_jam", "Apple Jam", "Apple Cupcakes", "bakery:apple_cupcake_block"]
    ];

    //Each entry: [cookieId, jamItem, jamLabel, displayName, blockName]
    const simpleCookies = [
        ["bakery:strawberry_glazed_cookie", "bakery:strawberry_jam", "Strawberry Jam", "Strawberry Glazed Cookies", "bakery:strawberry_cookie_block"],
        ["bakery:sweetberry_glazed_cookie", "bakery:sweetberry_jam", "Sweetberry Jam", "Sweetberry Glazed Cookies", "bakery:sweetberry_cookie_block"],
        ["bakery:chocolate_glazed_cookie", "bakery:chocolate_jam", "Chocolate Spread", "Chocolate Glazed Cookies", "bakery:chocolate_cookie_block"]
    ];

    simpleCakes.forEach(([cakeId, jamItem, jamLabel, displayName]) =>
        simpleCakeScene(cakeId, jamItem, jamLabel, displayName)
    );

    simpleCupcakes.forEach(([cupcakeId, jamItem, jamLabel, displayName, blockName]) =>
        simpleCupcakeScene(cupcakeId, jamItem, jamLabel, displayName, blockName)
    );

    simpleCookies.forEach(([cookieId, jamItem, jamLabel, displayName, blockName]) =>
        simpleCookieScene(cookieId, jamItem, jamLabel, displayName, blockName)
    );
});
