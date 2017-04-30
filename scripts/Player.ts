/// <reference path="../lib/babylon.2.4.d.ts"/>
class Player extends BABYLON.Mesh {
  private static Instance: Player;
  public static Position(): BABYLON.Vector3 {
    return Player.Instance.position;
  }

  public model: BABYLON.AbstractMesh;
  public camPos: BABYLON.AbstractMesh;
  public forward: boolean;
  public back: boolean;
  public right: boolean;
  public left: boolean;
  public fly: boolean;

  constructor(position: BABYLON.Vector3) {
    console.log("Create Player");
    super("Player", Game.Scene);
    this.position = position;
    this.rotationQuaternion = BABYLON.Quaternion.Identity();
    this.camPos = new BABYLON.Mesh("Dummy", Game.Scene);
    this.camPos.parent = this;
    this.camPos.position = new BABYLON.Vector3(0, 0, 0);
    this.camPos.rotationQuaternion = BABYLON.Quaternion.Identity();
    Game.Camera.parent = this.camPos;
    this.RegisterControl();
    Player.Instance = this;
  }

  public RegisterControl(): void {
    let scene: BABYLON.Scene = Game.Scene;
    scene.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(
        BABYLON.ActionManager.OnKeyDownTrigger,
        (event: BABYLON.ActionEvent) => {
          if (event.sourceEvent.key === "z") {
            this.forward = true;
          }
          if (event.sourceEvent.key === "s") {
            this.back = true;
          }
          if (event.sourceEvent.key === "q") {
            this.left = true;
          }
          if (event.sourceEvent.key === "d") {
            this.right = true;
          }
          if (event.sourceEvent.keyCode === 32) {
            this.fly = true;
          }
        }
      )
    );
    scene.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(
        BABYLON.ActionManager.OnKeyUpTrigger,
        (event: BABYLON.ActionEvent) => {
          if (event.sourceEvent.key === "z") {
            this.forward = false;
          }
          if (event.sourceEvent.key === "s") {
            this.back = false;
          }
          if (event.sourceEvent.key === "q") {
            this.left = false;
          }
          if (event.sourceEvent.key === "d") {
            this.right = false;
          }
          if (event.sourceEvent.keyCode === 32) {
            this.fly = false;
          }
        }
      )
    );
    Game.Canvas.addEventListener("mousemove", (event: MouseEvent) => {
      if (Game.LockedMouse) {
        let movementX: number = event.movementX;
        let movementY: number = event.movementY;
        if (movementX > 20) {
          movementX = 20;
        }
        if (movementX < -20) {
          movementX = -20;
        }
        if (movementY > 20) {
          movementY = 20;
        }
        if (movementY < -20) {
          movementY = -20;
        }
        let rotationPower: number = movementX / 500;
        let localY: BABYLON.Vector3 = BABYLON.Vector3.TransformNormal(BABYLON.Axis.Y, Player.Instance.getWorldMatrix());
        let rotation: BABYLON.Quaternion = BABYLON.Quaternion.RotationAxis(localY, rotationPower);
        Player.Instance.rotationQuaternion = rotation.multiply(Player.Instance.rotationQuaternion);
        let rotationCamPower: number = movementY / 500;
        Player.Instance.camPos.rotate(BABYLON.Axis.X, rotationCamPower, BABYLON.Space.LOCAL);
      }
    });
  }

  public static GetMovin(): void {
    if (!Player.Instance) {
      return;
    }
    if (Player.Instance.forward) {
      if (Player.CanForward()) {
        let localZ: BABYLON.Vector3 = BABYLON.Vector3.TransformNormal(BABYLON.Axis.Z, Player.Instance.getWorldMatrix());
        Player.Instance.position.addInPlace(localZ.multiply(MeshTools.FloatVector(0.05)));
      }
    }
    if (Player.Instance.back) {
      let localZ: BABYLON.Vector3 = BABYLON.Vector3.TransformNormal(BABYLON.Axis.Z, Player.Instance.getWorldMatrix());
      Player.Instance.position.addInPlace(localZ.multiply(MeshTools.FloatVector(-0.05)));
    }
    if (Player.Instance.right) {
      let localX: BABYLON.Vector3 = BABYLON.Vector3.TransformNormal(BABYLON.Axis.X, Player.Instance.getWorldMatrix());
      Player.Instance.position.addInPlace(localX.multiply(MeshTools.FloatVector(0.05)));
    }
    if (Player.Instance.left) {
      let localX: BABYLON.Vector3 = BABYLON.Vector3.TransformNormal(BABYLON.Axis.X, Player.Instance.getWorldMatrix());
      Player.Instance.position.addInPlace(localX.multiply(MeshTools.FloatVector(-0.05)));
    }
  }

  public static StillStanding(): void {
    if (!Player.Instance) {
      return;
    }
    let currentUp: BABYLON.Vector3 = BABYLON.Vector3.Normalize(
      BABYLON.Vector3.TransformNormal(BABYLON.Axis.Y, Player.Instance.getWorldMatrix())
    );
    let targetUp: BABYLON.Vector3 = BABYLON.Vector3.Normalize(Player.Instance.position);
    let correctionAxis: BABYLON.Vector3 = BABYLON.Vector3.Cross(currentUp, targetUp);
    let correctionAngle: number = Math.abs(Math.asin(correctionAxis.length()));
    if (Player.Instance.fly) {
      Player.Instance.position.addInPlace(targetUp.multiply(MeshTools.FloatVector(0.05)));
    } else {
      let gravity: number = Player.DownRayCast();
      if (gravity !== 0) {
        Player.Instance.position.addInPlace(targetUp.multiply(MeshTools.FloatVector(gravity * 0.05)));
      }
    }
    if (correctionAngle > 0.001) {
      let rotation: BABYLON.Quaternion = BABYLON.Quaternion.RotationAxis(correctionAxis, correctionAngle / 5);
      Player.Instance.rotationQuaternion = rotation.multiply(Player.Instance.rotationQuaternion);
    }
  }

  public static DownRayCast(): number {
    let pos: BABYLON.Vector3 = Player.Instance.position;
    let dir: BABYLON.Vector3 = BABYLON.Vector3.Normalize(BABYLON.Vector3.Zero().subtract(Player.Instance.position));
    let ray: BABYLON.Ray = new BABYLON.Ray(pos, dir, 1.6);
    let hit: BABYLON.PickingInfo = Game.Scene.pickWithRay(
      ray,
      (mesh: BABYLON.Mesh) => {
        return mesh !== Player.Instance.model;
      }
    );
    if (!hit.pickedPoint) {
      return -1;
    }
    let d: number = hit.pickedPoint.subtract(pos).length();
    if (d < 1.5) {
      return 1;
    }
    return 0;
  }

  public static CanForward(): boolean {
    let pos: BABYLON.Vector3 = Player.Instance.position;
    let localZ: BABYLON.Vector3 = BABYLON.Vector3.TransformNormal(BABYLON.Axis.Z, Player.Instance.getWorldMatrix());
    let ray: BABYLON.Ray = new BABYLON.Ray(pos, localZ, 1);
    let hit: BABYLON.PickingInfo = Game.Scene.pickWithRay(
      ray,
      (mesh: BABYLON.Mesh) => {
        return mesh !== Player.Instance.model;
      }
    );
    if (hit.pickedPoint) {
      return false;
    }
    return true;
  }
}
