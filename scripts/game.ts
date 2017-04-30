/// <reference path="../lib/babylon.2.4.d.ts"/>
class Game {

  public static Instance: Game;
  public static Canvas: HTMLCanvasElement;
  private _engine: BABYLON.Engine;
  public static Scene: BABYLON.Scene;
  public static Camera: BABYLON.Camera;
  private _light: BABYLON.Light;

  public static LockedMouse: boolean = false;
  public static ClientXOnLock: number = -1;
  public static ClientYOnLock: number = -1;

  constructor(canvasElement: string) {
    Game.Instance = this;
    Game.Canvas = document.getElementById(canvasElement) as HTMLCanvasElement;
    this._engine = new BABYLON.Engine(Game.Canvas, true);
  }

  createScene(): void {
    Game.Scene = new BABYLON.Scene(this._engine);
    Game.Scene.actionManager = new BABYLON.ActionManager(Game.Scene);

    Game.Camera = new BABYLON.FreeCamera("Camera", BABYLON.Vector3.Zero(), Game.Scene);

    this._light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), Game.Scene);
    this._light.diffuse = new BABYLON.Color3(1, 1, 1);
    this._light.specular = new BABYLON.Color3(1, 1, 1);
  }

  animate(): void {
    this._engine.runRenderLoop(() => {
      Game.Scene.render();
      PlanetChunck.InitializeLoop();
      Player.StillStanding();
      Player.GetMovin();
    });

    window.addEventListener("resize", () => {
      this._engine.resize();
    });
  }

  public static LockMouse(event: MouseEvent): void {
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
  }

  public static UnlockMouse(): void {
    if (!Game.LockMouse) {
      return;
    }
    document.exitPointerLock();
    Game.LockedMouse = false;
    console.log("Unlock");
  }
}

window.addEventListener("DOMContentLoaded", () => {
  let game: Game = new Game("renderCanvas");
  game.createScene();
  game.animate();

  new Player(new BABYLON.Vector3(40, 40, 40));

  let planetTest: Planet = new Planet("paulita", 64);
  planetTest.AsyncInitialize();

  Game.Canvas.addEventListener("mouseup", (event: MouseEvent) => {
    if (!Game.LockedMouse) {
      Game.LockMouse(event);
    } else {
      PlanetEditor.OnClick(planetTest);
    }
  });

  document.addEventListener("mousemove", (event: MouseEvent) => {
    if (Game.LockedMouse) {
      if (event.clientX !== Game.ClientXOnLock) {
        Game.UnlockMouse();
      } else if (event.clientY !== Game.ClientYOnLock) {
        Game.UnlockMouse();
      }
    }
  });
});
