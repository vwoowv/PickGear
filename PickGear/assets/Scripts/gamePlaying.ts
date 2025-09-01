import { _decorator, Component, Node } from 'cc';
import { RootUI } from './RootUI';
import { EGameModeState } from './GameMode/gameModeStateEvent';
import { ECharacterSuitType, ECharacterType, EPlayingSequence } from './GameDefine';
import { getPlaySequenceFromState } from './Utility/getPlaySequenceFromState';
import { getPlayLevelFromState } from './Utility/getPlayLevelFromState';
import { ResourceManager } from './ResourceManager';
import { dancer } from './Character/dancer';
import { getCharacterTypeFromLevel } from './Utility/getCharacterTypeFromLevel';
import { gameModeManager } from './GameMode/gameModeManager';
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
    private currentTime: number = 0;

    update(deltaTime: number) {
        switch (this.currentSequence) {
            case EPlayingSequence.ShowSuit:
                this.updateShowSuit(deltaTime);
                break;
            case EPlayingSequence.GameRound:
                this.updateGameRound(deltaTime);
                break;
            case EPlayingSequence.Result:
                this.updateResult(deltaTime);
                break;
        }
    }

    private showSuitTime: number = 3;
    private updateShowSuit(deltaTime: number) {
        this.currentTime += deltaTime;
        if (this.currentTime > this.showSuitTime) {
            gameModeManager.I.playingToGameRound(this.currentLevel);
        }
    }

    private updateGameRound(deltaTime: number) {
    }

    private updateResult(deltaTime: number) {
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
        if (this.currentSequence === EPlayingSequence.Prepare) {
            this.onPrepare();
        }
        else if (this.currentSequence === EPlayingSequence.ShowSuit) {
            this.onShowSuit();
        }
        else if (this.currentSequence === EPlayingSequence.GameRound) {
            this.onGameRound();
        }
        else if (this.currentSequence === EPlayingSequence.Result) {
            this.onResult();
        }
    }

    private async onPrepare() {
        console.log('onPrepare');
        gameModeManager.I.playingToLevel1ShowSuit();
    }

    private currentDancer: dancer = null;
    private async onShowSuit() {
        console.log('onShowSuit');
        // 현재 레벨의 댄서와 맞출 복장을 보여준다
        RootUI.I.setupShowSuit(this.currentLevel);
        if (this.currentDancer != null) {
            this.dancerPos.removeChild(this.currentDancer.node);
            this.currentDancer.destroy();
            this.currentDancer = null;
        }
        this.currentDancer = await ResourceManager.I.spawnPrefab<dancer>("prefab/character/Dancer", this.dancerPos);
        this.currentDancer.initialize(new getCharacterTypeFromLevel(this.currentLevel).characterType);
        this.currentDancer.suitChange(this.currentSuitType);
        this.currentTime = 0;
    }

    private onGameRound() {
        console.log('onGameRound');
        RootUI.I.setupGameRound(this.currentLevel);
        this.currentDancer.takeOffSuit();
        this.currentTime = 0;
    }

    private onResult() {
        this.currentTime = 0;
    }
}
