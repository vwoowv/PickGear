import { _decorator, Component, Node } from 'cc';
import { RootUI } from './RootUI';
import { EGameModeState } from './GameMode/gameModeStateEvent';
import { ECharacterType, EPlayingSequence } from './GameDefine';
import { getPlaySequenceFromState } from './Utility/getPlaySequenceFromState';
import { getPlayLevelFromState } from './Utility/getPlayLevelFromState';
import { ResourceManager } from './ResourceManager';
import { dancer } from './Character/dancer';
const { ccclass, property } = _decorator;

@ccclass('gamePlaying')
export class gamePlaying extends Component {
    @property(Node)
    private uiNode: Node = null;
    @property(Node)
    private dancerPos: Node = null;
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

    private async onShowSuit() {
        console.log('onShowSuit');
        // 현재 레벨의 댄서와 맞출 복장을 보여준다
        const newDancer1 = await ResourceManager.I.spawnPrefab<dancer>("prefab/character/Dancer", this.dancerPos);
        newDancer1.initialize(ECharacterType.DoArin);
    }

    private onGameRound() {
    }

    private onResult() {
    }
}
