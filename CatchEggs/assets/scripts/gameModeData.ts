import { _decorator, Component, Enum, Node } from 'cc';
import { EGameMode } from './gameDefine';
import { gameManager } from './gameManager';
const { ccclass, property } = _decorator;

@ccclass('gameModeData')
export class gameModeData extends Component {
    private gameManagerInstance: gameManager = null;
    @property({ type: Enum(EGameMode) })
    private currentGameMode: EGameMode = EGameMode.Version1;

    private onTouchVersion1Button() {
        this.currentGameMode = EGameMode.Version1;
        this.gameManagerInstance = this.node.getComponent(gameManager)
        this.gameManagerInstance.completeSelectGameMode();
    }

    private onTouchVersion2Button() {
        this.currentGameMode = EGameMode.Version2;
        this.gameManagerInstance = this.node.getComponent(gameManager)
        this.gameManagerInstance.completeSelectGameMode();
    }

    private onTouchVersion3Button() {
        this.currentGameMode = EGameMode.Version3;
        this.gameManagerInstance = this.node.getComponent(gameManager)
        this.gameManagerInstance.completeSelectGameMode();
    }
}
