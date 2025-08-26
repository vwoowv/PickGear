import { StateMachine, t } from "../StateMachine/stateMachine";
import { EGameModeEvent, EGameModeState, EGameRootModeEvent, EGameRootModeState } from "./gameModeStateEvent";
import { gameRootModeTransition } from "./gameRootModeTransition";

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

    private rootTransition = new gameRootModeTransition();

    public transitions = [
        t(EGameModeState.ShowSelection, EGameModeEvent.ShowSelectionEnd, EGameModeState.SingleDancerSuitRolling, this.onShowSelectionEnd),
    ];

    public initialize() {
    }

    private async onShowSelectionEnd() {
        console.log('onShowSelectionEnd');
    }

    private async onSelectType() {
        console.log('onSelectType');
    }

    private async onPlayGame() {
        console.log('onPlayGame');
    }
}
