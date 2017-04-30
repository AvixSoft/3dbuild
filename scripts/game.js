var Game = (function () {
    function Game(canvasElement) {
        Game.Instance = this;
        Game.Canvas = document.getElementById(canvasElement);
        this._engine = new BABYLON.Engine(Game.Canvas, true);
    }
    Game.prototype.createScene = function () {
        Game.Scene = new BABYLON.Scene(this._engine);
        Game.Scene.actionManager = new BABYLON.ActionManager(Game.Scene);
        Game.Camera = new BABYLON.FreeCamera("Camera", BABYLON.Vector3.Zero(), Game.Scene);
        Game.Camera.minZ = 0.1;
        this._light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), Game.Scene);
        this._light.diffuse = new BABYLON.Color3(1, 1, 1);
        this._light.specular = new BABYLON.Color3(1, 1, 1);
        Game.CreateSky();
    };
    Game.CreateSky = function () {
        Game.Sky = BABYLON.MeshBuilder.CreateBox("Sky", { size: 1000, sideOrientation: 1 }, Game.Scene);
        Game.Sky.material = SharedMaterials.SkyMaterial();
    };
    Game.AnimateSky = function () {
        Game.Sky.rotation.x += 0.0001;
        Game.Sky.rotation.y += 0.0001;
        Game.Sky.rotation.z += 0.0001;
    };
    Game.prototype.animate = function () {
        var _this = this;
        this._engine.runRenderLoop(function () {
            Game.Scene.render();
            PlanetChunck.InitializeLoop();
            Player.StillStanding();
            Player.GetMovin();
            Game.AnimateSky();
        });
        window.addEventListener("resize", function () {
            _this._engine.resize();
        });
    };
    Game.LockMouse = function (event) {
        if (Game.LockedMouse) {
            console.log("No need to lock.");
            return;
        }
        Game.Canvas.requestPointerLock =
            Game.Canvas.requestPointerLock ||
                Game.Canvas.msRequestPointerLock ||
                Game.Canvas.mozRequestPointerLock ||
                Game.Canvas.webkitRequestPointerLock;
        if (Game.Canvas.requestPointerLock) {
            Game.Canvas.requestPointerLock();
            Game.LockedMouse = true;
            Game.ClientXOnLock = event.clientX;
            Game.ClientYOnLock = event.clientY;
            console.log("Lock");
        }
    };
    Game.UnlockMouse = function () {
        if (!Game.LockMouse) {
            return;
        }
        document.exitPointerLock();
        Game.LockedMouse = false;
        console.log("Unlock");
    };
    return Game;
}());
Game.LockedMouse = false;
Game.ClientXOnLock = -1;
Game.ClientYOnLock = -1;
window.addEventListener("DOMContentLoaded", function () {
    var game = new Game("renderCanvas");
    game.createScene();
    game.animate();
    PlanetEditor.RegisterControl();
    $("#cursor").css("top", $("#cursor").parent().height() / 2 - $("#cursor").height() / 2);
    $("#cursor").css("left", $("#cursor").parent().width() / 2 - $("#cursor").width() / 2);
    new Player(new BABYLON.Vector3(40, 40, 40));
    var planetTest = new Planet("paulita", 64);
    planetTest.AsyncInitialize();
    Game.Canvas.addEventListener("mouseup", function (event) {
        if (!Game.LockedMouse) {
            Game.LockMouse(event);
        }
        else {
            PlanetEditor.OnClick(planetTest);
        }
    });
    document.addEventListener("mousemove", function (event) {
        if (Game.LockedMouse) {
            if (event.clientX !== Game.ClientXOnLock) {
                Game.UnlockMouse();
            }
            else if (event.clientY !== Game.ClientYOnLock) {
                Game.UnlockMouse();
            }
        }
    });
});
