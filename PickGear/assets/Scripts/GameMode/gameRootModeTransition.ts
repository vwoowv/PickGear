import { gameInstance } from "../gameInstance";
import { StateMachine, t } from "../StateMachine/stateMachine";
import { EGameRootModeEvent, EGameRootModeState } from "./gameModeStateEvent";
import { playNewGame } from "./playNewGame";

export class gameRootModeTransition extends StateMachine<EGameRootModeState, EGameRootModeEvent> {
    constructor() {
        super(EGameRootModeState.Begin, []);
        this.addTransitions([
            t(EGameRootModeState.Begin, EGameRootModeEvent.SelectType, EGameRootModeState.SelectType, this.onSelectType),
            t(EGameRootModeState.SelectType, EGameRootModeEvent.PlayGame, EGameRootModeState.PlayGame, this.onPlayGame),
        ]);
    }

    selectType = async () => this.dispatch(EGameRootModeEvent.SelectType);
    playGame = async () => this.dispatch(EGameRootModeEvent.PlayGame);

    private async onSelectType() {
        console.log('onSelectType');
        const game = gameInstance.I;
        game.nodeCollection.allNodeOff();
        game.nodeCollection.selectGameTypeNode.active = true;
    }

    private async onPlayGame() {
        console.log('onPlayGame');
        await new playNewGame().initialize();
    }
}