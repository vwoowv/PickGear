import { _decorator, Component, Node } from 'cc';
import { RootUI } from './RootUI';
import { EGameModeState } from './GameMode/gameModeStateEvent';
import { EPlayingSequence } from './GameDefine';
import { getPlaySequenceFromState } from './Utility/getPlaySequenceFromState';
import { getPlayLevelFromState } from './Utility/getPlayLevelFromState';
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
        this.currentSequence = new getPlaySequenceFromState(currentMode).gameSequence;
        this.currentLevel = new getPlayLevelFromState(currentMode).currentLevel;
        console.log('onTransitionChanged', EGameModeState[currentMode], currentMode);
        console.log('onTransitionChanged. Level : ', this.currentLevel);
        console.log('onTransitionChanged. Sequence : ', EPlayingSequence[this.currentSequence], this.currentSequence);

        if (this.currentSequence === EPlayingSequence.ShowSuit) {
            this.onShowSuit();
        }
        else if (this.currentSequence === EPlayingSequence.GameRound) {
            this.onGameRound();
        }
        else if (this.currentSequence === EPlayingSequence.Result) {
            this.onResult();
        }
    }

    private onShowSuit() {
    }

    private onGameRound() {
    }

    private onResult() {
    }
}
