import { StateMachine, t } from "../StateMachine/stateMachine";
import { EGameRootModeEvent, EGameRootModeState } from "./gameModeStateEvent";

export class gameRootModeTransition extends StateMachine<EGameRootModeState, EGameRootModeEvent> {
    constructor() {
        super(EGameRootModeState.Begin, []);
        this.addTransitions([
            t(EGameRootModeState.Begin, EGameRootModeEvent.SelectType, EGameRootModeState.SelectType, this.onSelectType),
            t(EGameRootModeState.SelectType, EGameRootModeEvent.PlayGame, EGameRootModeState.PlayGame, this.onPlayGame),
        ]);
    }

    private async onSelectType() {
        console.log('onSelectType');
    }

    private async onPlayGame() {
        console.log('onPlayGame');
    }
}