import { _decorator, Component, Node } from 'cc';
import { RootUI } from './RootUI';
import { EGameModeState } from './GameMode/gameModeStateEvent';
import { EPlayingSequence } from './GameDefine';
const { ccclass, property } = _decorator;

@ccclass('gamePlaying')
export class gamePlaying extends Component {
    @property(Node)
    private uiNode: Node = null;
    private ui: RootUI = null;
    private currentSequence: EPlayingSequence = EPlayingSequence.ShowSuit;
    private currentLevel: number = 1;

    update(deltaTime: number) {

    }

    // 게임 시작. 이 안에서 게임 라운드를 관리한다
    public startNewGame() {
        this.ui = this.uiNode.getComponent(RootUI);
        this.ui.showCountText(false);
        this.ui.showTimeProgressBar(false);
        this.ui.showResultCountText(false);
        this.ui.showLevelText(true);
        this.ui.setLevelText(this.currentLevel);
    }

    public onTransitionChanged(currentMode: EGameModeState) {
        // enum 이름이 찍히도록 출력
        console.log('onTransitionChanged', EGameModeState[currentMode], currentMode);
    }
}
