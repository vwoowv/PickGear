import { RootUI } from "../RootUI";
import { StateMachine, t } from "../StateMachine/stateMachine";
import { preLoadGameAsset } from "../Utility/preLoadGameAsset";
import { EGameRootModeEvent, EGameRootModeState } from "./gameModeStateEvent";
import { playNewGame } from "./playNewGame";

export class gameRootModeTransition extends StateMachine<EGameRootModeState, EGameRootModeEvent> {
    constructor() {
        super(EGameRootModeState.Begin, []);
        this.addTransitions([
            t(EGameRootModeState.Begin, EGameRootModeEvent.SelectType, EGameRootModeState.SelectType, this.onSelectType),
            t(EGameRootModeState.SelectType, EGameRootModeEvent.PlayGame, EGameRootModeState.PlayGame, this.onPlayGame),
            t(EGameRootModeState.PlayGame, EGameRootModeEvent.SelectType, EGameRootModeState.SelectType, this.onSelectType),
            t(EGameRootModeState.PlayGame, EGameRootModeEvent.PlayGame, EGameRootModeState.PlayGame, this.onPlayGame),
        ]);
    }

    selectType = async () => this.dispatch(EGameRootModeEvent.SelectType);
    playGame = async () => this.dispatch(EGameRootModeEvent.PlayGame);

    private async onSelectType() {
        console.log('onSelectType');
        RootUI.I.hideAllNodeOff();
        RootUI.I.hideAllGroup();
        // 여기서 리소스 로딩을 해야 한다
        RootUI.I.showLoadingGroup();
        await new preLoadGameAsset().preLoadGameAsset();
        RootUI.I.hideLoadingGroup();
        this.playGame();
    }

    private async onPlayGame() {
        console.log('onPlayGame');
        RootUI.I.showGameNode();
        await new playNewGame().initialize();
    }
}