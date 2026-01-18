import { _decorator, Component, Node, Vec3 } from 'cc';
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
import { AppleMusicManager } from './Utility/AppleMusicManager';
import { Spotify } from './Utility/spotify';
const { ccclass, property } = _decorator;
/*

p8 : -----BEGIN PRIVATE KEY-----\nMIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgw9xLMO0FenC1tX/1\nQ0lbptAit7lDwHdPFQA8KqrWIz+gCgYIKoZIzj0DAQehRANCAARxWkbLEeMS29IZ\ng0gKfzZ2Z2C+tGn3hPkKTUogJ1beeHTsR+u/LtT9mBK2DIQLL8ac2bYhO07wxDvT\nmDcYQiap\n-----END PRIVATE KEY-----


*/
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
    private currentSequence: EPlayingSequence = EPlayingSequence.ShowSuit;
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

    update(deltaTime: number) {
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
            gameModeManager.I.playingToGameRound(this.currentLevel);
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
            this.rollingSuitPos.removeChild(this.rollingSuitList[i].node);
            this.rollingSuitList[i].destroy();
        }
        this.rollingSuitList = [];
        this.wrongSuitList = [];
    }

    private nextRollingSuitTime: number = 0;
    private rollingSuitList: RollingSuit[] = [];
    private wrongSuitList: RollingSuit[] = [];
    private readonly pickedSuitList: PickedSuitManager = new PickedSuitManager();
    private async updateGameRoundUnderLevel5(deltaTime: number) {
        if (this.currentTime > this.currentGameRoundTime) {
            // 이번 라운드 종료. 게임 결과로 넘어간다
            gameModeManager.I.playingToShowSuit(this.currentLevel + 1);
            this.garbageRollingSuit();
        }

        this.nextRollingSuitTime -= deltaTime;
        if (this.nextRollingSuitTime <= 0 && this.currentGameRoundTime - this.currentTime > 0.5) {
            this.nextRollingSuitTime = 1 - this.currentLevel * 0.1;
            await this.newRandomRollingSuit();
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
        const newRollingSuit = await ResourceManager.I.spawnPrefab<RollingSuit>("prefab/suit/RollingSuit", this.rollingSuitPos);
        const startPosition: Vec3 = new Vec3(this.characterRollingPosStart.position.x, 0, this.characterRollingPosStart.position.z);
        newRollingSuit.node.setPosition(startPosition);
        const currentCharacterType = this.randomCharacterTypeList[this.currentCharacterTypeIndex];
        newRollingSuit.Initialize(currentCharacterType, this.currentSuitType, this.currentDancer.dancerType, this.getMoveSpeed());
        this.rollingSuitList.push(newRollingSuit);
        this.currentCharacterTypeIndex++;
        if (this.currentCharacterTypeIndex >= this.randomCharacterTypeList.length) {
            this.shuffleCharacterTypeList();
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

    private async updateGameRoundOverLevel5(deltaTime: number) {
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
                    gameModeManager.I.playingToLevel5Result();
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
                await this.newRandomRollingSuit();
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

    // --- 부모 창(Next.js)과 통신하기 위한 메서드 ---
    private checkParentAuth(): Promise<{ isLoggedIn: boolean, provider: string }> {
        return new Promise((resolve) => {
            // 타임아웃 설정 (1초 내 응답 없으면 테스트 모드 진입)
            const timeout = setTimeout(() => {
                window.removeEventListener('message', listener);
                
                // (기존 코드) 무조건 로그인 성공으로 처리
                // console.log("Parent not responding. Using MOCK LOGIN for testing.");
                // resolve({ isLoggedIn: true, provider: 'spotify' });

                // (수정된 코드) 사용자에게 어떤 상태로 시작할지 물어봄
                if (typeof window !== 'undefined' && window.confirm) {
                    const isMockLogin = window.confirm(
                        "[테스트 모드] 부모 창의 응답이 없습니다.\n\n" +
                        "▶ [확인]: Apple Music 로그인 테스트 (팝업)\n" +
                        "▶ [취소]: Spotify 로그인 테스트 (페이지 이동)"
                    );

                    if (isMockLogin) {
                        // (기존 코드) 확인 시 Apple
                        // console.log("테스트 모드: 로그인 성공 (Apple) 선택됨");
                        // resolve({ isLoggedIn: true, provider: 'apple' });

                        // (수정된 코드) 확인 시 Apple
                        console.log("테스트 모드: Apple 로그인 시도");
                        resolve({ isLoggedIn: true, provider: 'apple' });
                    } else {
                        // (기존 코드) 취소 시 로그인 실패
                        // console.log("테스트 모드: 로그인 실패 선택됨");
                        // resolve({ isLoggedIn: false, provider: null });

                        // (수정된 코드) 취소 시 Spotify 로그인 테스트
                        console.log("테스트 모드: Spotify 로그인 시도");
                        resolve({ isLoggedIn: true, provider: 'spotify' });
                    }
                } else {
                    // confirm 불가 환경이면 기본값 false
                    resolve({ isLoggedIn: false, provider: null });
                }

            }, 1000);

            const listener = (event: MessageEvent) => {
                // 부모로부터 인증 상태 응답을 받았을 때
                if (event.data && event.data.type === 'AUTH_STATUS_RESPONSE') {
                    clearTimeout(timeout);
                    window.removeEventListener('message', listener);
                    resolve(event.data.payload);
                }
            };

            window.addEventListener('message', listener);
            
            // (기존 코드) iframe 내부인 경우 부모에게 요청 전송
            // if (window.parent && window.parent !== window) {
            //     window.parent.postMessage({ type: 'CHECK_AUTH' }, '*');
            // } else {
            //     // iframe이 아닌 경우 (에디터 테스트 등)
            //     clearTimeout(timeout);
            //     resolve({ isLoggedIn: false, provider: null });
            // }

            // (수정된 코드) 에디터나 로컬 환경에서도 요청을 보냄
            window.parent.postMessage({ type: 'CHECK_AUTH' }, '*');
        });
    }

    // --- 음악 제공자에 따른 재생 로직 ---
    private async playMusicByProvider(provider: string) {
        try {
            if (provider === 'apple') {
                const appleMusic = new AppleMusicManager();
                // (기존 코드) 
                // await appleMusic.playMyMusic(); 
                
                // (참고) AppleMusicManager 내부에서 music.authorize()가 호출되어 팝업이 뜹니다.
                await appleMusic.playMyMusic();
            } else if (provider === 'spotify') {
                // Spotify 로직
                console.log('Spotify Playback Requested');
                
                // (수정된 코드) Spotify 로그인 테스트를 위해 실제 Spotify 로그인 페이지를 새 창으로 띄움
                if (typeof window !== 'undefined') {
                    const popup = window.open('https://accounts.spotify.com/login', 'SpotifyLogin', 'width=500,height=600');
                    // 로그인 창이 닫힐 때까지 대기(최대 2분)
                    await this.waitForPopupClose(popup, 120_000);
                }
                await Spotify.I.playLevelMusic(0);

                // 구현 전까지는 안전하게 로컬 오디오 폴백
                await gameInstance.I.playAudioClip('sound/Kiss and cry_Game');
            } else {
                throw new Error('Unknown provider');
            }
        } catch (e) {
            console.warn(`${provider} Music play failed, fallback to local audio`, e);
            await gameInstance.I.playAudioClip('sound/Kiss and cry_Game');
        }
    }

    private async waitForPopupClose(popup: Window | null, timeoutMs: number) {
        if (!popup) return;
        const start = Date.now();
        await new Promise<void>((resolve) => {
            const timer = setInterval(() => {
                if (popup.closed || (Date.now() - start) > timeoutMs) {
                    clearInterval(timer);
                    resolve();
                }
            }, 300);
        });
    }

    private async onPrepare() {
        console.log('onPrepare');
        this.currentPoint = 0;
        this.currentComboScore = 0;
        this.currentComboCount = 0;
        this.perfect = true;
        
        /* eslint-disable */
        // (기존) Spotify 재생 (주석 처리 유지)
        // try {
        //     await Spotify.I.playLevelMusic(0);
        // } catch (e) {
        //     console.warn('Spotify play failed, fallback to local audio', e);
        //     await gameInstance.I.playAudioClip('sound/Kiss and cry_Game');
        // }
        /* eslint-enable */

        // (기존) Apple Music 자동 재생 로직 주석 처리 (부모 인증 확인 후 실행하도록 변경)
        /*
        try {
            const appleMusic = new AppleMusicManager();
            await appleMusic.playMyMusic();
        } catch (e) {
            console.warn('Apple Music play failed, fallback to local audio', e);
            await gameInstance.I.playAudioClip('sound/Kiss and cry_Game');
        }
        */

        // 1. 부모 창(Next.js)에 인증 상태 확인 요청 (또는 테스트 모드 선택)
        const authStatus = await this.checkParentAuth();

        // 2. 로그인 상태 확인 (Spotify 또는 Apple Music인 경우만 인정)
        if (authStatus.isLoggedIn && (authStatus.provider === 'apple' || authStatus.provider === 'spotify')) {
            console.log(`User logged in via ${authStatus.provider}. Playing streaming music.`);
            await this.playMusicByProvider(authStatus.provider);
        } else {
            // 3. 로그인 안되어 있거나, 일반 로그인 상태 -> 로그인 모달 요청
            console.log('User not logged in with Music Provider. Requesting Login Modal.');
            
            // (기존 코드) 부모 창이 있을 때만 전송
            // if (window.parent && window.parent !== window) {
            //     window.parent.postMessage({ type: 'REQUEST_LOGIN' }, '*');
            // }
            
            // (수정된 코드) 무조건 메시지 전송 (로그 확인용)
            console.log('Sending REQUEST_LOGIN message to parent (or self in editor)...');
            window.parent.postMessage({ type: 'REQUEST_LOGIN' }, '*');
            
            // 모달 요청 후, 게임이 멈추지 않게 로컬 오디오 재생하며 진행
            await gameInstance.I.playAudioClip('sound/Kiss and cry_Game');
        }

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
        RootUI.I.setupResult(this.currentPoint, this.perfect);
        this.dancerPos.removeAllChildren();
        for (let i = 0; i < 4; i++) {
            this.dancerResultPos[i].addChild(this.allDancer[i].node);
        }
    }

    public onTouchRetryButton() {
        this.garbageDancer();
        gameModeManager.I.rootPlayGame();
    }

    public onTouchHomeButton() {
        this.garbageDancer();
        gameModeManager.I.rootSelectGameType();
    }

    private showPickSuit: boolean = false;
    public onTouchPickSuitButton() {
        if (this.currentSequence != EPlayingSequence.GameRound) {
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
