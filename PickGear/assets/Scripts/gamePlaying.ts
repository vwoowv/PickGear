import { _decorator, Component, Node } from 'cc';
import { RootUI } from './RootUI';
import { EGameModeState } from './GameMode/gameModeStateEvent';
import { ECharacterSuitType, ECharacterType, EPlayingSequence } from './GameDefine';
import { getPlaySequenceFromState } from './Utility/getPlaySequenceFromState';
import { getPlayLevelFromState } from './Utility/getPlayLevelFromState';
import { ResourceManager } from './ResourceManager';
import { dancer } from './Character/dancer';
import { getCharacterTypeFromLevel } from './Utility/getCharacterTypeFromLevel';
const { ccclass, property } = _decorator;

@ccclass('gamePlaying')
export class gamePlaying extends Component {
    @property(Node)
    private dancerPos: Node = null;
    @property(Node)
    private dancerResultPos: Node[] = [];
    private currentSequence: EPlayingSequence = EPlayingSequence.ShowSuit;
    public currentSuitType: ECharacterSuitType = ECharacterSuitType.YG;
    private currentLevel: number = 1;

    update(deltaTime: number) {

    }

    // 게임 시작. 이 안에서 게임 라운드를 관리한다
    public startNewGame() {
        // this.ui = this.uiNode.getComponent(RootUI);
        // this.ui.showCountText(false);
        // this.ui.showTimeProgressBar(false);
        // this.ui.showResultCountText(false);
        // this.ui.showLevelText(true);
        // this.ui.setLevelText(this.currentLevel);
    }

    public setGameType(gameType: ECharacterSuitType) {
        this.currentSuitType = gameType;
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
        RootUI.I.setupShowSuit(this.currentLevel);
        const currentDancer = await ResourceManager.I.spawnPrefab<dancer>("prefab/character/Dancer", this.dancerPos);
        currentDancer.initialize(new getCharacterTypeFromLevel(this.currentLevel).characterType);
        currentDancer.suitChange(this.currentSuitType);
    }

    private onGameRound() {
        console.log('onGameRound');
        RootUI.I.setupGameRound();
    }

    private onResult() {
    }
}
