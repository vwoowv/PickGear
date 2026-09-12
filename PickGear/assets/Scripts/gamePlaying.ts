import { _decorator, Component, Node, Vec3, isValid } from 'cc';
import { RootUI } from './RootUI';
import { EGameModeState } from './GameMode/gameModeStateEvent';
import { ECharacterSuitType, ECharacterType, EFaceType, EPlayingSequence } from './GameDefine';
import { getPlaySequenceFromState } from './Utility/getPlaySequenceFromState';
import { getPlayLevelFromState } from './Utility/getPlayLevelFromState';
import { ResourceManager } from './ResourceManager';
import { dancer } from './Character/dancer';
import { getCharacterTypeFromLevel } from './Utility/getCharacterTypeFromLevel';
import { gameModeManager } from './GameMode/gameModeManager';
import { RollingSuit } from './Character/RollingSuit';
import { gameInstance } from './gameInstance';
import { PickedSuitManager } from './PickedSuitManager';
import { gamePlayProperty } from './gamePlayProperty';
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
    @property(gamePlayProperty)
    private gameProperty: gamePlayProperty = null;
    private currentSequence: EPlayingSequence = EPlayingSequence.Exited;
    public currentSuitType: ECharacterSuitType = ECharacterSuitType.YG;
    private currentLevel: number = 1;
    private currentPoint: number = 0;
    private currentComboScore: number = 0;
    private currentComboCount: number = 0;
    private currentTime: number = 0;
    private showSuitTime: number = 2;
    private currentGameRoundTime: number = 0;
    private readonly gameRoundTime: number = 13;
    // private readonly gameRoundTime: number = 1;
    private readonly resultTime: number = 3;
    private get gameRoundTimeRate(): number {
        return this.currentTime / this.currentGameRoundTime;
    }
    private get gameRoundTimeRateReverse(): number {
        return 1 - this.gameRoundTimeRate;
    }
    private finalRoundSequence: number = 0;
    private perfect: boolean = true;
    private waitingTimeForNextDancer: number = 0;
    private restartPending: boolean = false;
    private parentMessageOrigin: string = '*';

    private sessionVersion = 0;
    private sessionActive = false;
    private paused = false;
    private stateLoading = false;
    private transitionPending = false;
    private stateVersion = 0;
    private resumeWaiters: Array<() => void> = [];

    public get sessionId(): number { return this.sessionVersion; }
    public get isSessionActive(): boolean { return this.sessionActive; }
    public isSessionCurrent(id: number): boolean {
        return this.sessionActive && id === this.sessionVersion && isValid(this, true);
    }

    public async waitUntilRunning(id: number): Promise<boolean> {
        while (this.isSessionCurrent(id) && this.paused) {
            await new Promise<void>((resolve) => this.resumeWaiters.push(resolve));
        }
        return this.isSessionCurrent(id);
    }

    private releaseResumeWaiters() {
        const waiters = this.resumeWaiters.splice(0);
        waiters.forEach((resolve) => resolve());
    }

    public beginSession(): number {
        this.endSession();
        this.sessionActive = true;
        this.currentSequence = EPlayingSequence.Prepare;
        return this.sessionVersion;
    }

    public endSession() {
        this.sessionActive = false;
        this.sessionVersion++;
        this.stateVersion++;
        this.paused = false;
        this.stateLoading = false;
        this.transitionPending = false;
        this.currentSequence = EPlayingSequence.Exited;
        this.releaseResumeWaiters();
        RootUI.I.setGamePaused(false);
        RootUI.I.hideExitConfirmation();
        RootUI.I.setExitButtonVisible(false);
        RootUI.I.resetTransientUI();
        gameInstance.I.stopGameAudio();
        this.garbageRollingSuit();
        this.pickedSuitList.clear();
        this.garbageDancer();
        this.currentPoint = this.currentComboScore = this.currentComboCount = 0;
        this.currentTime = this.currentGameRoundTime = this.nextRollingSuitTime = 0;
        this.currentLevel = 1;
        this.finalRoundSequence = this.waitingTimeForNextDancer = 0;
        this.showPickSuit = false;
    }

    public onTouchExitButton() {
        if (!this.sessionActive || this.paused || this.restartPending ||
            this.currentSequence === EPlayingSequence.EndGame) return;
        this.paused = true;
        gameInstance.I.pauseGameAudio();
        RootUI.I.setGamePaused(true);
        RootUI.I.showExitConfirmation(
            () => this.onTouchContinueButton(),
            () => { void this.confirmExit(); }
        );
    }

    public onTouchContinueButton() {
        if (!this.sessionActive || !this.paused || this.restartPending) return;
        RootUI.I.hideExitConfirmation();
        this.paused = false;
        RootUI.I.setGamePaused(false);
        gameInstance.I.resumeGameAudio();
        this.releaseResumeWaiters();
    }

    private async confirmExit() {
        if (!this.sessionActive || this.restartPending) return;
        this.restartPending = true;
        try {
            await gameModeManager.I.exitGame();
        } catch (error) {
            console.error('Failed to exit game', error);
        } finally {
            this.restartPending = false;
        }
    }

    private async advance(transition: () => Promise<void>) {
        if (this.transitionPending) return;
        const id = this.sessionId;
        this.transitionPending = true;
        try {
            await transition();
        } catch (error) {
            console.error('Game transition failed', error);
            if (this.isSessionCurrent(id)) await this.confirmExit();
        } finally {
            if (this.isSessionCurrent(id)) this.transitionPending = false;
        }
    }

    protected onLoad(): void {
        if (typeof window !== 'undefined') {
            window.addEventListener('message', this.onParentMessage);
        }
    }

    protected onDestroy(): void {
        this.sessionActive = false;
        this.sessionVersion++;
        this.releaseResumeWaiters();
        if (typeof window !== 'undefined') {
            window.removeEventListener('message', this.onParentMessage);
        }
    }

    private readonly onParentMessage = (event: MessageEvent): void => {
        if (event.source !== window.parent || event.data?.type !== 'RESTART_GAME') {
            return;
        }
        if (this.currentSequence !== EPlayingSequence.EndGame || this.restartPending) {
            return;
        }
        this.parentMessageOrigin = event.origin === 'null' ? '*' : event.origin;
        void this.onTouchRetryButton();
    };

    private postParentMessage(message: { type: string; score?: number }): void {
        if (typeof window !== 'undefined') {
            window.parent.postMessage(message, this.parentMessageOrigin);
        }
    }

    update(deltaTime: number) {
        if (!this.sessionActive || this.paused || this.stateLoading || this.transitionPending) return;
        this.pickedSuitList.update(deltaTime);
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
            void this.advance(() => gameModeManager.I.playingToGameRound(this.currentLevel));
        }
    }

    private updateGameRound(deltaTime: number) {
        this.currentTime += deltaTime;
        RootUI.I.setTimeProgressBar(this.gameRoundTimeRateReverse, this.currentTime, this.currentGameRoundTime);
        if (this.currentLevel > 4) {
            this.updateGameRoundOverLevel5(deltaTime);
        }
        else {
            this.updateGameRoundUnderLevel5(deltaTime);
        }
    }

    private garbageRollingSuit() {
        for (let i = 0; i < this.rollingSuitList.length; i++) {
            this.rollingSuitList[i].node.removeFromParent();
            this.rollingSuitList[i].node.destroy();
        }
        this.rollingSuitList = [];
        this.wrongSuitList = [];
    }

    private nextRollingSuitTime: number = 0;
    private rollingSuitList: RollingSuit[] = [];
    private wrongSuitList: RollingSuit[] = [];
    private readonly pickedSuitList: PickedSuitManager = new PickedSuitManager();
    private updateGameRoundUnderLevel5(deltaTime: number) {
        if (this.currentTime > this.currentGameRoundTime) {
            // 이번 라운드 종료. 게임 결과로 넘어간다
            void this.advance(() => gameModeManager.I.playingToShowSuit(this.currentLevel + 1));
            this.garbageRollingSuit();
            return;
        }

        this.nextRollingSuitTime -= deltaTime;
        if (this.nextRollingSuitTime <= 0 && this.currentGameRoundTime - this.currentTime > 0.5) {
            this.nextRollingSuitTime = 1 - this.currentLevel * 0.1;
            void this.newRandomRollingSuit().catch((error) => console.error('Failed to spawn suit', error));
        }

        this.updateRollingSuitList(deltaTime);
    }

    private getMoveSpeed(): number {
        return this.gameProperty.getSpeed(this.currentSuitType, this.currentLevel);
    }

    private randomCharacterTypeList: ECharacterType[] = [ECharacterType.DoArin, ECharacterType.SooHana, ECharacterType.SongUnbee, ECharacterType.EmmaMoon];
    private currentCharacterTypeIndex: number = 0;

    private shuffleCharacterTypeList(forceFrontType: ECharacterType | null = null) {
        // 마지막에 사용한 캐릭터가 새 셔플의 첫 번째로 나오지 않도록 보정
        const prevLast = this.randomCharacterTypeList[this.randomCharacterTypeList.length - 1];

        // 배열을 셔플하는 함수가 없으므로 직접 구현
        for (let i = this.randomCharacterTypeList.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.randomCharacterTypeList[i], this.randomCharacterTypeList[j]] = [this.randomCharacterTypeList[j], this.randomCharacterTypeList[i]];
        }

        // forceFrontType이 지정된 경우, 해당 타입을 첫 번째나 두 번째에 배치
        if (forceFrontType !== null) {
            this.moveForceFrontTypeToFront(forceFrontType, prevLast);
        }

        // 이전 마지막 요소가 첫 번째로 올라오면 두 번째 요소와 교환
        this.preventPrevLastAtFirst(prevLast);
        this.currentCharacterTypeIndex = 0;
    }

    private moveForceFrontTypeToFront(forceFrontType: ECharacterType, prevLast: ECharacterType) {
        const forceIndex = this.randomCharacterTypeList.indexOf(forceFrontType);
        if (forceIndex === -1 || forceIndex < 2) {
            return;
        }

        const targetIndex = this.selectTargetIndexForForceType(forceFrontType, prevLast);
        [this.randomCharacterTypeList[forceIndex], this.randomCharacterTypeList[targetIndex]] =
            [this.randomCharacterTypeList[targetIndex], this.randomCharacterTypeList[forceIndex]];
    }

    private selectTargetIndexForForceType(forceFrontType: ECharacterType, prevLast: ECharacterType): number {
        if (this.randomCharacterTypeList[0] === prevLast) {
            return 1; // 첫 번째가 prevLast면 두 번째로
        }
        if (forceFrontType === prevLast) {
            return 1; // forceFrontType이 prevLast면 두 번째로
        }
        // 랜덤하게 첫 번째나 두 번째 선택
        return Math.random() < 0.5 ? 0 : 1;
    }

    private preventPrevLastAtFirst(prevLast: ECharacterType) {
        if (this.randomCharacterTypeList.length > 1 && this.randomCharacterTypeList[0] === prevLast) {
            [this.randomCharacterTypeList[0], this.randomCharacterTypeList[1]] = [this.randomCharacterTypeList[1], this.randomCharacterTypeList[0]];
        }
    }

    private async newRandomRollingSuit() {
        const id = this.sessionId;
        const state = this.stateVersion;
        const newRollingSuit = await ResourceManager.I.spawnPrefab<RollingSuit>("prefab/suit/RollingSuit", this.rollingSuitPos);
        newRollingSuit.node.active = false;
        if (!await this.waitUntilRunning(id) || state !== this.stateVersion) {
            newRollingSuit.node.destroy();
            return;
        }
        try {
            const startPosition = new Vec3(this.characterRollingPosStart.position.x, 0, this.characterRollingPosStart.position.z);
            newRollingSuit.node.setPosition(startPosition);
            const characterType = this.randomCharacterTypeList[this.currentCharacterTypeIndex];
            await newRollingSuit.Initialize(characterType, this.currentSuitType, this.currentDancer.dancerType, this.getMoveSpeed());
            if (!await this.waitUntilRunning(id) || state !== this.stateVersion) {
                newRollingSuit.node.destroy();
                return;
            }
            newRollingSuit.node.active = true;
            this.rollingSuitList.push(newRollingSuit);
            this.currentCharacterTypeIndex++;
            if (this.currentCharacterTypeIndex >= this.randomCharacterTypeList.length) {
                this.shuffleCharacterTypeList();
            }
        } catch (error) {
            newRollingSuit.node.destroy();
            throw error;
        }
    }

    private getLastRollingSuit(): RollingSuit | null {
        if (this.rollingSuitList.length === 0) {
            return null;
        }

        let lastRollingSuit: RollingSuit = null;
        let maxX = -Infinity;
        for (const rollingSuit of this.rollingSuitList) {
            if (rollingSuit.node.position.x > maxX) {
                maxX = rollingSuit.node.position.x;
                lastRollingSuit = rollingSuit;
            }
        }
        return lastRollingSuit;
    }

    private hasLastRollingSuitPassedMiddlePoint(): boolean {
        const lastRollingSuit = this.getLastRollingSuit();
        if (lastRollingSuit == null) {
            return false;
        }

        const currentX = lastRollingSuit.currentPosition.x;
        // 중간 지점(x=0)을 지났는지 확인하고, 지난 후 100만큼 이동했는지 확인
        return currentX <= -300;
    }

    private updateGameRoundOverLevel5(deltaTime: number) {
        this.updateRollingSuitList(deltaTime);

        // 마지막 롤링 수트가 중간 지점을 지나 100 만큼 이동했다면 다음 댄서로 넘어간다
        const shouldMoveToNextDancer = this.hasLastRollingSuitPassedMiddlePoint();
        const isTimeUp = this.currentTime > this.finalRoundTime[this.finalRoundSequence];
        if (isTimeUp) {
            if (shouldMoveToNextDancer) {
                // 기다린 시간을 finalRoundTime에 반영
                if (this.waitingTimeForNextDancer > 0) {
                    for (let i = this.finalRoundSequence + 1; i < 4; i++) {
                        this.finalRoundTime[i] += this.waitingTimeForNextDancer;
                    }
                    this.currentGameRoundTime += this.waitingTimeForNextDancer;
                    this.waitingTimeForNextDancer = 0;
                }

                this.finalRoundSequence++;
                if (this.finalRoundSequence >= 4) {
                    // 게임 종료. 결과 보여준다
                    void this.advance(() => gameModeManager.I.playingToLevel5Result());
                    this.garbageRollingSuit();
                    return;
                }

                // 바뀌면서 지나간 옷들은 점수에 영향을 주지 못한다
                for (const rollingSuit of this.rollingSuitList) {
                    if (rollingSuit.node.position.x > 0) {
                        continue;
                    }
                    rollingSuit.isScoreEnabled = false;
                }

                this.setupFinalRound();
                this.shuffleCharacterTypeList(this.currentDancer.dancerType);
            }
            else {
                // 다음 캐릭터로 바뀌는 것을 기다리는 시간 기록
                this.waitingTimeForNextDancer += deltaTime;
            }
        }
        else if (!isTimeUp) {
            this.nextRollingSuitTime -= deltaTime;
            if (this.nextRollingSuitTime <= 0 && this.currentGameRoundTime - this.currentTime > 0.5) {
                this.nextRollingSuitTime = 1;
                void this.newRandomRollingSuit().catch((error) => console.error('Failed to spawn suit', error));
            }
        }
    }

    private updateScore(acquirePoint: number) {
        if (acquirePoint > 0) {
            if (this.currentComboScore < 0) {
                this.currentComboScore = 0;
            }
            this.currentComboScore += acquirePoint;
            this.currentComboCount++;
        }
        else {
            this.currentComboScore = acquirePoint;
            this.currentComboCount = 0;
        }
        this.currentPoint += this.currentComboScore;
        if (this.currentPoint < 0) {
            this.currentPoint = 0;
        }
        RootUI.I.setCurrentScoreText(this.currentPoint, this.currentComboScore);
    }

    private showPickSuitTime: number = 0.5;
    private updateRollingSuitList(deltaTime: number) {
        if (this.showPickSuit) {
            this.showPickSuitTime -= deltaTime;
            if (this.showPickSuitTime <= 0) {
                this.showPickSuit = false;
                this.showPickSuitTime = 0.5;
            }
            // return;
        }

        for (const rollingSuit of this.rollingSuitList) {
            const isPass = rollingSuit.roll(deltaTime, this.gameProperty.getPickDistanceThreshold(this.currentSuitType, this.currentLevel), this.currentDancer.dancerType);
            if (isPass === false && this.wrongSuitList.indexOf(rollingSuit) === -1) {
                if (rollingSuit.isScoreEnabled) {
                    this.perfect = false;
                    const acquirePoint = this.gameProperty.getScore(this.currentSuitType, this.currentLevel, true);
                    this.updateScore(acquirePoint);
                    RootUI.I.setFaceSpriteAndBackToNormal(this.currentDancer.dancerType, this.currentSuitType, EFaceType.Fail);
                    gameInstance.I.playAudioClip('sound/Kiss and cry_Game_No', 0.5);
                }
                this.wrongSuitList.push(rollingSuit);
            }
        }
    }

    private updateResult(deltaTime: number) {
        this.currentTime += deltaTime;
        if (this.currentTime > this.finalRoundTime[this.finalRoundSequence]) {
            this.finalRoundSequence++;
            if (this.finalRoundSequence >= 4) {
                void this.advance(() => gameModeManager.I.playingToEndGame());
                return;
            }
            this.dancerPos.removeAllChildren();
            this.dancerPos.addChild(this.allDancer[this.finalRoundSequence].node);
        }
    }

    public setGameType(gameType: ECharacterSuitType) {
        this.currentSuitType = gameType;
    }

    public async onTransitionChanged(currentMode: EGameModeState, sessionId: number = this.sessionId) {
        if (!await this.waitUntilRunning(sessionId)) return;
        const state = ++this.stateVersion;
        this.stateLoading = true;
        try {
            await this.applyTransition(currentMode);
        } finally {
            if (state === this.stateVersion) this.stateLoading = false;
        }
    }

    private applyTransition(currentMode: EGameModeState) {
        // enum 이름이 찍히도록 출력
        this.currentSequence = new getPlaySequenceFromState(currentMode).gameSequence;
        this.currentLevel = new getPlayLevelFromState(currentMode).currentLevel;
        console.log('onTransitionChanged', EGameModeState[currentMode], currentMode);
        console.log('onTransitionChanged. Level : ', this.currentLevel);
        console.log('onTransitionChanged. Sequence : ', EPlayingSequence[this.currentSequence], this.currentSequence);
        if (this.currentSequence === EPlayingSequence.Prepare) {
            return this.onPrepare();
        }
        else if (this.currentSequence === EPlayingSequence.ShowSuit) {
            return this.onShowSuit();
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
        const id = this.sessionId;
        this.currentPoint = 0;
        this.currentComboScore = 0;
        this.currentComboCount = 0;
        this.perfect = true;
        this.currentTime = 0;
        this.nextRollingSuitTime = 0;
        this.showPickSuit = false;
        this.showPickSuitTime = 0.5;
        this.shuffleCharacterTypeList();
        await gameInstance.I.playAudioClip('sound/Kiss and cry_Game', 1, true);
        if (!await this.waitUntilRunning(id)) return;
        await gameModeManager.I.playingToLevel1ShowSuit();
        if (this.isSessionCurrent(id)) this.postParentMessage({ type: 'GAME_START' });
    }

    private currentDancer: dancer = null;
    private allDancer: dancer[] = [];
    private async onShowSuit() {
        console.log('onShowSuit');
        const id = this.sessionId;
        // 현재 레벨의 댄서와 맞출 복장을 보여준다
        RootUI.I.setupShowSuit(this.currentLevel);
        this.garbageDancer();
        if (this.currentLevel > 4) {
            // 4명 전부 나온다
            for (let i = 0; i < 4; i++) {
                const created = await this.newDancer(i + 1, this.dancerResultPos[i], id);
                if (!created) return;
                this.allDancer[i] = created;
                await created.suitChange(this.currentSuitType);
                if (!await this.waitUntilRunning(id)) return;
            }
        }
        else {
            const created = await this.newDancer(this.currentLevel, this.dancerPos, id);
            if (!created) return;
            this.currentDancer = created;
            await created.suitChange(this.currentSuitType);
            if (!await this.waitUntilRunning(id)) return;
        }
        this.currentTime = 0;
    }

    private garbageDancer() {
        // 마지막 라운드의 currentDancer는 allDancer의 한 항목이다.
        if (this.currentDancer && this.allDancer.indexOf(this.currentDancer) === -1) {
            this.currentDancer.node.removeFromParent();
            this.currentDancer.node.destroy();
        }
        this.currentDancer = null;
        if (this.allDancer.length > 0) {
            for (let i = 0; i < 4; i++) {
                if (!this.allDancer[i]) {
                    continue;
                }
                this.allDancer[i].node.removeFromParent();
                this.allDancer[i].node.destroy();
                this.allDancer[i] = null;
            }
        }
    }

    private async newDancer(level: number, dancerPos: Node, id: number) {
        const newDancer = await ResourceManager.I.spawnPrefab<dancer>("prefab/character/Dancer", dancerPos);
        newDancer.node.active = false;
        if (!await this.waitUntilRunning(id)) {
            newDancer.node.destroy();
            return null;
        }
        try {
            await newDancer.initialize(new getCharacterTypeFromLevel(level).characterType);
        } catch (error) {
            newDancer.node.destroy();
            throw error;
        }
        if (!await this.waitUntilRunning(id)) {
            newDancer.node.destroy();
            return null;
        }
        newDancer.node.active = true;
        newDancer.showNameTag(true);
        return newDancer;
    }

    private finalRoundTime: number[] = [1, 1, 1, 1];
    private setupFinalRound() {
        this.dancerPos.removeAllChildren();
        this.currentDancer = this.allDancer[this.finalRoundSequence];
        this.currentDancer.node.setParent(this.dancerPos);
        this.currentDancer.takeOffSuit();
        RootUI.I.setFaceSprite(this.currentDancer.dancerType, this.currentSuitType, EFaceType.Normal);
    }

    private onGameRound() {
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
            this.waitingTimeForNextDancer = 0;
            this.setupFinalRound();
            if (this.currentDancer) {
                this.currentDancer.showNameTag(false);
            }
        }
        else {
            this.currentDancer.takeOffSuit();
            this.currentDancer.showNameTag(false);
        }

        this.currentGameRoundTime = this.gameRoundTime;
        this.currentTime = 0;
        RootUI.I.setupGameRound(this.currentLevel, this.currentPoint);
        RootUI.I.setTimeProgressBar(this.gameRoundTimeRateReverse, this.currentTime, this.currentGameRoundTime);
        RootUI.I.setFaceSprite(this.currentDancer.dancerType, this.currentSuitType, EFaceType.Normal);
    }

    private onResult() {
        this.currentTime = 0;
        this.finalRoundSequence = 0;
        this.dancerPos.removeAllChildren();
        let finalRoundTime: number = 0;
        for (let i = 0; i < 4; i++) {
            this.allDancer[i].suitChange(this.currentSuitType);
            finalRoundTime += this.resultTime * 0.25;
            this.finalRoundTime[i] = finalRoundTime;
        }
        this.dancerPos.addChild(this.allDancer[this.finalRoundSequence].node);
        RootUI.I.hideAllGroup();
    }

    private onEndGame() {
        console.log('onEndGame');
        RootUI.I.setExitButtonVisible(false);
        RootUI.I.setupResult(this.currentPoint, this.perfect);
        this.dancerPos.removeAllChildren();
        for (let i = 0; i < 4; i++) {
            this.dancerResultPos[i].addChild(this.allDancer[i].node);
        }
        this.postParentMessage({ type: 'GAME_OVER', score: this.currentPoint });
    }

    public async onTouchRetryButton() {
        if (this.currentSequence !== EPlayingSequence.EndGame || this.restartPending) {
            return;
        }
        this.restartPending = true;
        try {
            this.garbageDancer();
            await gameModeManager.I.rootPlayGame();
        } catch (error) {
            console.error('Failed to restart game', error);
            await gameModeManager.I.exitGame();
        } finally {
            this.restartPending = false;
        }
    }

    public onTouchHomeButton() {
        if (this.currentSequence === EPlayingSequence.EndGame) {
            void this.confirmExit();
        } else {
            this.onTouchExitButton();
        }
    }

    private showPickSuit: boolean = false;
    public onTouchPickSuitButton() {
        if (!this.sessionActive || this.paused || this.stateLoading || this.transitionPending ||
            this.currentSequence != EPlayingSequence.GameRound) {
            return;
        }

        // 가장 가까운 복장을 찾는다
        const nearestSuit = this.getPickedSuit();
        // 거리가 적절한지 판단
        // console.log(`nearestSuit.prevPosition.x : ${nearestSuit.prevPosition.x}, nearestSuit.currentPosition.x : ${nearestSuit.currentPosition.x}`);
        if (nearestSuit == null) {
            return;
        }

        console.log('pickSuit', nearestSuit.dancerType, nearestSuit.suitType);
        nearestSuit.pickSuit();
        if (nearestSuit.dancerType == this.currentDancer.dancerType && nearestSuit.suitType == this.currentSuitType) {
            this.rollingSuitList.splice(this.rollingSuitList.indexOf(nearestSuit), 1);
            this.pickedSuitList.addPickedSuit(nearestSuit);
            nearestSuit.node.setPosition(0, nearestSuit.node.position.y, nearestSuit.node.position.z);
            const acquirePoint = this.gameProperty.getScore(this.currentSuitType, this.currentLevel, false);
            this.updateScore(acquirePoint);
            RootUI.I.setFaceSpriteAndBackToNormal(this.currentDancer.dancerType, this.currentSuitType, EFaceType.Success);
            this.showPickSuit = true;
            gameInstance.I.playAudioClip('sound/Kiss and cry_Game_Yes', 0.5);
        }
        else {
            this.perfect = false;
            const acquirePoint = this.gameProperty.getScore(this.currentSuitType, this.currentLevel, true);
            this.updateScore(acquirePoint);
            RootUI.I.setFaceSpriteAndBackToNormal(this.currentDancer.dancerType, this.currentSuitType, EFaceType.Fail);
            gameInstance.I.playAudioClip('sound/Kiss and cry_Game_No', 0.5);
        }
    }

    private getPickedSuit(): RollingSuit {
        let nearestSuit: RollingSuit = null;
        if (this.rollingSuitList.length == 0) {
            return nearestSuit;
        }

        for (let i = 0; i < this.rollingSuitList.length; i++) {
            const currentPosition = this.rollingSuitList[i].node.position.x;
            const prevPosition = this.rollingSuitList[i].prevPosition.x;
            const distance = Math.abs(currentPosition);
            if (distance < this.gameProperty.getPickDistanceThreshold(this.currentSuitType, this.currentLevel) || (prevPosition < 0 && currentPosition > 0)) {
                nearestSuit = this.rollingSuitList[i];
            }
        }
        return nearestSuit;
    }
}
