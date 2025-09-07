import { _decorator, Component, Node, Vec3 } from 'cc';
import { RootUI } from './RootUI';
import { EGameModeState } from './GameMode/gameModeStateEvent';
import { ECharacterSuitType, ECharacterType, EPlayingSequence } from './GameDefine';
import { getPlaySequenceFromState } from './Utility/getPlaySequenceFromState';
import { getPlayLevelFromState } from './Utility/getPlayLevelFromState';
import { ResourceManager } from './ResourceManager';
import { dancer } from './Character/dancer';
import { getCharacterTypeFromLevel } from './Utility/getCharacterTypeFromLevel';
import { gameModeManager } from './GameMode/gameModeManager';
import { delayMS, delaySeconds } from './Utility/delay';
import { RollingSuit } from './Character/RollingSuit';
const { ccclass, property } = _decorator;

@ccclass('gamePlaying')
export class gamePlaying extends Component {
    @property(Node)
    private dancerPos: Node = null;
    @property(Node)
    private dancerResultPos: Node[] = [];
    @property(Node)
    private rollingSuitPos: Node = null;
    @property(Node)
    private characterRollingPosStart: Node = null;
    @property(Node)
    private characterRollingPosEnd: Node = null;
    private currentSequence: EPlayingSequence = EPlayingSequence.ShowSuit;
    public currentSuitType: ECharacterSuitType = ECharacterSuitType.YG;
    private currentLevel: number = 1;
    private currentTime: number = 0;
    // private showSuitTime: number = 3;
    private showSuitTime: number = 1;
    private currentGameRoundTime: number = 0;
    // private readonly gameRoundTime: number = 14;
    private readonly gameRoundTime: number = 5;
    private readonly resultTime: number = 1;
    private get gameRoundTimeRate(): number {
        return this.currentTime / this.currentGameRoundTime;
    }
    private get gameRoundTimeRateReverse(): number {
        return 1 - this.gameRoundTimeRate;
    }
    private finalRoundSequence: number = 0;

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

    private updateShowSuit(deltaTime: number) {
        this.currentTime += deltaTime;
        if (this.currentTime > this.showSuitTime) {
            gameModeManager.I.playingToGameRound(this.currentLevel);
        }
    }

    private updateGameRound(deltaTime: number) {
        this.currentTime += deltaTime;
        RootUI.I.setTimeProgressBar(this.gameRoundTimeRateReverse);
        if (this.currentLevel > 4) {
            this.updateGameRoundOverLevel5(deltaTime);
        }
        else {
            this.updateGameRoundUnderLevel5(deltaTime);
        }
    }

    private nextRollingSuitTime: number = 0;
    private rollingSuitList: RollingSuit[] = [];
    private async updateGameRoundUnderLevel5(deltaTime: number) {
        if (this.currentTime > this.currentGameRoundTime) {
            // 이번 라운드 종료. 게임 결과로 넘어간다
            gameModeManager.I.playingToShowSuit(this.currentLevel + 1);
            for (let i = 0; i < this.rollingSuitList.length; i++) {
                this.rollingSuitPos.removeChild(this.rollingSuitList[i].node);
                this.rollingSuitList[i].destroy();
            }
            this.rollingSuitList = [];
        }

        this.nextRollingSuitTime -= deltaTime;
        if (this.nextRollingSuitTime <= 0 && this.currentGameRoundTime - this.currentTime > 0.5) {
            this.nextRollingSuitTime = 1;
            await this.newRandomRollingSuit();
        }

        for (let i = 0; i < this.rollingSuitList.length; i++) {
            this.rollingSuitList[i].roll(deltaTime);
        }
    }

    private randomCharacterType: number = 0;
    private async newRandomRollingSuit() {
        const newRollingSuit = await ResourceManager.I.spawnPrefab<RollingSuit>("prefab/suit/RollingSuit", this.rollingSuitPos);
        const startPosition: Vec3 = new Vec3(this.characterRollingPosStart.position.x, 0, this.characterRollingPosStart.position.z);
        newRollingSuit.node.setPosition(startPosition);
        newRollingSuit.Initialize(this.randomCharacterType, this.currentSuitType);
        this.rollingSuitList.push(newRollingSuit);
        this.randomCharacterType++;
        if (this.randomCharacterType >= ECharacterType.TotalCount) {
            this.randomCharacterType = 0;
        }
    }

    private updateGameRoundOverLevel5(deltaTime: number) {
        if (this.currentTime > this.finalRoundTime[this.finalRoundSequence]) {
            this.finalRoundSequence++;
            if (this.finalRoundSequence >= 4) {
                // 게임 종료. 결과 보여준다
                gameModeManager.I.playingToLevel5Result();
                return;
            }

            this.setupFinalRound();
        }
    }

    private updateResult(deltaTime: number) {
        this.currentTime += deltaTime;
        if (this.currentTime > this.finalRoundTime[this.finalRoundSequence]) {
            this.finalRoundSequence++;
            if (this.finalRoundSequence >= 4) {
                gameModeManager.I.playingToEndGame();
                return;
            }
            this.dancerPos.removeAllChildren();
            this.dancerPos.addChild(this.allDancer[this.finalRoundSequence].node);
        }
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
        else if (this.currentSequence === EPlayingSequence.EndGame) {
            this.onEndGame();
        }
    }

    private async onPrepare() {
        console.log('onPrepare');
        gameModeManager.I.playingToShowSuit(1);
    }

    private currentDancer: dancer = null;
    private allDancer: dancer[] = [];
    private async onShowSuit() {
        console.log('onShowSuit');
        // 현재 레벨의 댄서와 맞출 복장을 보여준다
        RootUI.I.setupShowSuit(this.currentLevel);
        this.garbageDancer();
        if (this.currentLevel > 4) {
            // 4명 전부 나온다
            for (let i = 0; i < 4; i++) {
                this.allDancer[i] = await this.newDancer(i + 1, this.dancerResultPos[i]);
                this.allDancer[i].suitChange(this.currentSuitType);
            }
        }
        else {
            this.currentDancer = await this.newDancer(this.currentLevel, this.dancerPos);
            this.currentDancer.suitChange(this.currentSuitType);
        }
        this.currentTime = 0;
    }

    private garbageDancer() {
        if (this.allDancer.length > 0) {
            for (let i = 0; i < 4; i++) {
                if (this.allDancer[i] === null) {
                    continue;
                }
                this.dancerResultPos[i].removeChild(this.allDancer[i].node);
                this.allDancer[i].destroy();
                this.allDancer[i] = null;
            }
        }

        if (this.currentDancer != null) {
            this.dancerPos.removeChild(this.currentDancer.node);
            this.currentDancer.destroy();
            this.currentDancer = null;
        }
    }

    private async newDancer(level: number, dancerPos: Node) {
        const newDancer = await ResourceManager.I.spawnPrefab<dancer>("prefab/character/Dancer", dancerPos);
        newDancer.initialize(new getCharacterTypeFromLevel(level).characterType);
        return newDancer;
    }

    private finalRoundTime: number[] = [1, 1, 1, 1];
    private setupFinalRound() {
        this.dancerPos.removeAllChildren();
        this.currentDancer = this.allDancer[this.finalRoundSequence];
        this.currentDancer.node.setParent(this.dancerPos);
        this.currentDancer.takeOffSuit();
    }

    private async onGameRound() {
        console.log('onGameRound');
        if (this.currentLevel > 4) {
            // 마지막 레벨에서는 4명이 한번씩 번갈아 가면서 나온다
            // 우선 첫번째 댄서를 준비한다
            let finalRoundTime: number = 0;
            for (let i = 0; i < 4; i++) {
                this.dancerResultPos[i].removeChild(this.allDancer[i].node);
                finalRoundTime += this.gameRoundTime * 0.25;
                this.finalRoundTime[i] = finalRoundTime;
            }

            this.finalRoundSequence = 0;
            this.setupFinalRound();
        }
        else {
            this.currentDancer.takeOffSuit();
        }

        this.currentGameRoundTime = this.gameRoundTime;
        this.currentTime = 0;
        RootUI.I.setupGameRound(this.currentLevel);
        RootUI.I.setTimeProgressBar(this.gameRoundTimeRateReverse);
    }

    private onResult() {
        this.currentTime = 0;
        this.finalRoundSequence = 0;
        this.dancerPos.removeAllChildren();
        for (let i = 0; i < 4; i++) {
            this.allDancer[i].suitChange(this.currentSuitType);
        }
        this.dancerPos.addChild(this.allDancer[this.finalRoundSequence].node);
        RootUI.I.hideAllGroup();
    }

    private onEndGame() {
        console.log('onEndGame');
        RootUI.I.setupResult();
        this.dancerPos.removeAllChildren();
        for (let i = 0; i < 4; i++) {
            this.dancerResultPos[i].addChild(this.allDancer[i].node);
        }
    }

    public onTouchRetryButton() {
        this.garbageDancer();
        gameModeManager.I.rootSelectGameType();
    }
}
