import { gameNodePackage } from "./gameNodePackage";
import { gameRootModeTransition } from "./gameRootModeTransition";
import { Node } from "cc";

export class gameModeManager {
    private static _instance: gameModeManager = null;
    public static get I(): gameModeManager {
        if (gameModeManager._instance === null) {
            gameModeManager._instance = new gameModeManager();
        }
        return gameModeManager._instance;
    }

    private constructor() {
        if (gameModeManager._instance) {
            throw new Error('gameModeManager는 싱글톤입니다. I 프로퍼티를 통해 접근하세요.');
        }
        gameModeManager._instance = this;
    }

    private rootTransition: gameRootModeTransition = null;
    private nodePackage: gameNodePackage = null;

    // public transitions = [
    //     t(EGameModeState.ShowSelection, EGameModeEvent.ShowSelectionEnd, EGameModeState.SingleDancerSuitRolling, this.onShowSelectionEnd),
    // ];

    public initialize(uiNode: Node, gameInstanceNode: Node) {
        this.nodePackage = new gameNodePackage();
        this.nodePackage.uiNode = uiNode;
        this.nodePackage.gameInstanceNode = gameInstanceNode;
        this.rootTransition = new gameRootModeTransition();
    }

    rootSelectGameType = async () => this.rootTransition.selectType();
    rootPlayGame = async () => this.rootTransition.playGame();

    // private async onShowSelectionEnd() {
    //     console.log('onShowSelectionEnd');
    // }
}
