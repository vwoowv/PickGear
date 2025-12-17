import { _decorator, AudioClip, AudioSource, Component, instantiate, isValid, Label, Node, ParticleSystem, Prefab, ProgressBar, RichText, Sprite, Vec3 } from 'cc';
import { ResourceManager } from './ResourceManager';
import { egg } from './egg';
import { EggType, EGameState, EGameMode } from './gameDefine';
import { dragArea } from './dragArea';
import { gameModeData } from './gameModeData';
import { gameManagerExtensions } from './gameManagerExtensions';
import { playStartingNode } from './playStartingNode';
import { richTextMaker } from './richTextMaker';
import { gameProperty } from './gameProperty';
import { midiJsonData } from './midi/midiJsonData';
import { openingEgg } from './openingEgg';
import { sortOpeningPositiveScores } from './openingCharacterOrder';
import { ResultNode } from './ResultNode';
import { basket } from './basket';
const { ccclass, property } = _decorator;

@ccclass('gameManager')
export class gameManager extends Component {
    private static _instance: gameManager = null;

    // Singleton 인스턴스에 접근하는 getter
    public static get I(): gameManager {
        if (gameManager._instance === null) {
            console.error('gameManager Singleton이 초기화되지 않았습니다!');
        }
        return gameManager._instance;
    }

    onLoad() {
        if (gameManager._instance === null) {
            gameManager._instance = this;
        }
        else {
            this.node.destroy();
        }
    }

    @property(gameModeData)
    public gameMode: gameModeData = null;
    @property(Label)
    private currentTimeText: Label = null;
    @property(Label)
    private leftTimeText: Label = null;
    @property(ProgressBar)
    private timeProgressBar: ProgressBar = null;
    @property(Node)
    public eggParent: Node = null;
    @property(Node)
    public eggScoreParent: Node = null;
    @property(Node)
    public eggSpawnPoint_Left: Node = null;
    @property(Node)
    public eggSpawnPoint_Right: Node = null;
    @property(Node)
    public eggEndLine: Node = null;
    @property(Node)
    public selectGameModeNode: Node = null;
    @property(Node)
    public playStartingNode: Node = null;
    @property(Node)
    public playingNode: Node = null;
    @property(Node)
    public prepareNode: Node = null;
    @property(Node)
    private dragAreaNode: dragArea = null;
    @property(Node)
    public retryNode: Node = null;
    @property(Node)
    public retryNodeHeartNormal: Node = null;
    @property(RichText)
    private currentScoreText: RichText = null;
    @property(RichText)
    private currentLevelText: RichText = null;
    @property(RichText)
    private scoreText: RichText = null;
    @property(RichText)
    private coinText: RichText = null;
    @property(Node)
    private basket: Node = null;
    @property(AudioSource)
    public playSound: AudioSource = null;
    @property(AudioClip)
    public eggCatchSound: AudioClip[] = [];
    @property(AudioClip)
    public penaltySound: AudioClip = null;
    @property(AudioClip)
    public missSound: AudioClip = null;
    @property(Sprite)
    private background: Sprite = null;
    @property(Node)
    private OpeningNerdsGroup: Node = null;
    @property(openingEgg)
    private openingEggNormalList: openingEgg[] = [];
    @property(openingEgg)
    private openingEggNegativeList: openingEgg[] = [];
    @property(Node)
    private loadingNode: Node = null;
    private gameState: EGameState = EGameState.None;
    private timeLeft: number = 0;
    private currentScore: number = 0;
    private extensions: gameManagerExtensions = null;
    async start() {
        this.loadingNode.active = true;

        this.extensions = this.node.addComponent(gameManagerExtensions);
        await this.extensions.initialize(this);
        this.selectGameMode();

        const midiData: midiJsonData = new midiJsonData();
        await midiData.loadMidiJsonData();
    }

    update(deltaTime: number) {
        if (this.gameState == EGameState.Prepare) {
            this.updatePrepare(deltaTime);
        }
        else if (this.gameState == EGameState.PlayStarting) {
            this.updatePlayStarting(deltaTime);
        }
        else if (this.gameState == EGameState.Playing) {
            // async 함수의 예외가 unhandledrejection으로 튀면 "멈춘 것처럼" 보일 수 있어 여기서 흡수/로그
            this.updatePlaying(deltaTime).catch((err) => {
                console.error("[gameManager] updatePlaying error:", err);
            });
        }
        else if (this.gameState == EGameState.GameOver) {
            this.updateGameOver(deltaTime);
        }
    }

    private selectGameMode() {
        this.gameState = EGameState.SelectGameMode;
        this.selectGameModeNode.active = true;
        this.playStartingNode.active = false;
        this.playingNode.active = false;
        this.prepareNode.active = false;
        this.retryNode.active = false;
    }

    public async completeSelectGameMode() {
        this.background.spriteFrame = await this.gameMode.getCurrentBackground();
        await this.prepareGame();
    }

    private async prepareGame() {
        this.gameState = EGameState.Prepare;
        this.selectGameModeNode.active = false;
        this.playStartingNode.active = false;
        this.playingNode.active = false;
        this.prepareNode.active = true;
        this.retryNode.active = false;
        this.basket.getComponent(basket).initialize();
        this.currentScore = 0;
        this.currentComboScore = 0;
        this.scoreText.string = new richTextMaker(this.currentScore.toString(), "#020202", 3, "").resultText;
        this.coinText.string = new richTextMaker("00", "#020202", 3, "").resultText;
        this.currentScoreText.string = new richTextMaker(this.currentScore.toString(), "#020202", 3, "").resultText;
        this.currentLevelText.string = new richTextMaker("LV." + this.gameMode.getCurrentLevelFromVersion().toString(), "#020202", 3, "").resultText;
        await this.setOpeningCharacter();
    }

    private async setOpeningCharacter() {
        const level = this.gameMode.getCurrentLevelFromVersion();
        const prop = gameProperty.I;

        // 현재 레벨에서 하나라도 0보다 작은 점수를 가진 캐릭터가 있는지 확인
        let hasNegativeScore = false;
        for (let i = 0; i < EggType.TotalCount; i++) {
            if (prop.getScore(level, i) < 0) {
                hasNegativeScore = true;
                break;
            }
        }

        this.OpeningNerdsGroup.active = hasNegativeScore;

        // 스코어가 0보다 큰 캐릭터들을 정리
        const positiveScores: { eggType: EggType, score: number, image: string }[] = [];
        // 스코어가 0보다 작은 캐릭터들을 정리
        const negativeScores: { eggType: EggType, score: number, image: string }[] = [];

        for (let i = 0; i < EggType.TotalCount; i++) {
            const score = prop.getScore(level, i);
            const image = prop.getImage(level, i);
            if (score > 0) {
                positiveScores.push({ eggType: i, score, image });
            } else if (score < 0) {
                negativeScores.push({ eggType: i, score, image });
            }
        }

        // 레벨별 고정 배치 규칙 적용 (playStartingNode 와 동일)
        sortOpeningPositiveScores(level, positiveScores);

        // openingEggNormalList에 세팅
        let normalIndex = 0;
        for (const item of positiveScores) {
            if (normalIndex < this.openingEggNormalList.length && this.openingEggNormalList[normalIndex] != null) {
                await this.openingEggNormalList[normalIndex].initialize(item.image, item.score);
                this.openingEggNormalList[normalIndex].node.active = true;
                normalIndex++;
            }
        }
        // 나머지는 안 보이게 처리
        for (let i = normalIndex; i < this.openingEggNormalList.length; i++) {
            if (this.openingEggNormalList[i] != null) {
                this.openingEggNormalList[i].node.active = false;
            }
        }

        // openingEggNegativeList에 세팅
        let negativeIndex = 0;
        for (const item of negativeScores) {
            if (negativeIndex < this.openingEggNegativeList.length && this.openingEggNegativeList[negativeIndex] != null) {
                await this.openingEggNegativeList[negativeIndex].initialize(item.image, item.score);
                this.openingEggNegativeList[negativeIndex].node.active = true;
                negativeIndex++;
            }
        }
        // 나머지는 안 보이게 처리
        for (let i = negativeIndex; i < this.openingEggNegativeList.length; i++) {
            if (this.openingEggNegativeList[i] != null) {
                this.openingEggNegativeList[i].node.active = false;
            }
        }
    }

    private updatePrepare(deltaTime: number) {
        if (this.gameState != EGameState.Prepare) {
            return;
        }
    }

    private updatePlayStarting(deltaTime: number) {
        if (this.gameState != EGameState.PlayStarting) {
            return;
        }
    }

    public startPlayStarting() {
        this.gameState = EGameState.PlayStarting;
        this.playStartingNode.active = true;
        this.playStartingNode.getComponent(playStartingNode).initialize(this);
        this.playingNode.active = false;
        this.prepareNode.active = false;
        this.retryNode.active = false;
    }

    public startNewGame() {
        this.gameState = EGameState.Playing;
        this.playStartingNode.active = false;
        this.playingNode.active = true;
        this.prepareNode.active = false;
        this.timeLeft = this.gameMode.getCurrentGameDuration();
        this.retryNode.active = false;
        this.currentScore = 0;
        this.scoreText.string = new richTextMaker(this.currentScore.toString(), "#020202", 3, "").resultText;
        this.coinText.string = new richTextMaker("00", "#020202", 3, "").resultText;
        this.currentScoreText.string = new richTextMaker(this.currentScore.toString(), "#020202", 3, "").resultText;
        this.currentLevelText.string = new richTextMaker("LV." + this.gameMode.getCurrentLevelFromVersion().toString(), "#020202", 3, "").resultText;
    }

    private isSpawningEgg: boolean = false;
    private leftTimeToSpawnEgg: number = 1;
    private async updatePlaying(deltaTime: number) {
        if (this.gameState != EGameState.Playing) {
            return;
        }

        const totalDuration = this.gameMode.getCurrentGameDuration();
        this.leftTimeToSpawnEgg -= deltaTime;
        // 끝나기 1초전까지 스폰시킨다
        if (this.leftTimeToSpawnEgg <= 0 && this.timeLeft - 2 > 0 && this.isSpawningEgg == false) {
            this.isSpawningEgg = true;
            try {
                const spawnTime = await this.extensions.spawnRandomEgg(this.timeLeft, totalDuration, this.gameMode.currentGameMode);
                this.leftTimeToSpawnEgg = spawnTime;
            }
            finally {
                this.isSpawningEgg = false;
            }
        }
        this.timeLeft -= deltaTime;
        this.timeProgressBar.progress = this.timeLeft / totalDuration;
        if (this.timeLeft <= 0) {
            this.gameOver();
        }
        this.checkEggsInBasket();
        const formatTime = (time: number): string => {
            const integer = Math.floor(Math.max(0, time));
            const decimal = (time - integer).toFixed(2).substring(1);
            const integerStr = integer.toString();
            const paddedInteger = integerStr.length < 2 ? '0' + integerStr : integerStr;
            return paddedInteger + decimal;
        };
        this.currentTimeText.string = formatTime(totalDuration - this.timeLeft);
        this.leftTimeText.string = formatTime(this.timeLeft);
    }

    private gameOver() {
        this.gameState = EGameState.GameOver;
        this.eggParent.children.forEach(child => {
            child.destroy();
        });
        this.eggParent.removeAllChildren();
        this.playStartingNode.active = false;
        this.playingNode.active = false;
        this.prepareNode.active = false;
        this.retryNode.active = true;
        this.retryNode.getComponent(ResultNode).initialize(this);
        this.scoreText.string = new richTextMaker(this.currentScore.toString(), "#020202", 3, "").resultText;
        this.coinText.string = new richTextMaker("00", "#020202", 3, "").resultText;
        this.gameMode.resultGame();
    }

    private updateGameOver(deltaTime: number) {
        if (this.gameState != EGameState.GameOver) {
            return;
        }
    }

    public onHomeButtonClick() {
        this.selectGameMode();
    }

    public onRetryButtonClick() {
        this.restartCurrentStage();
    }

    private restartCurrentStage() {
        // 현재 선택된 스테이지(= gameModeData.currentGameMode / 버전 레벨)를 유지한 채 라운드만 재시작
        // 1) 남아있는 달걀 정리
        if (this.eggParent) {
            this.eggParent.children.forEach((child) => child.destroy());
            this.eggParent.removeAllChildren();
        }

        // 2) 스폰/타이머/점수 리셋
        this.isSpawningEgg = false;
        this.leftTimeToSpawnEgg = 1;
        this.timeLeft = this.gameMode.getCurrentGameDuration();
        this.currentScore = 0;
        this.currentComboScore = 0;
        this.timeProgressBar.progress = 1;

        // 3) UI 리셋
        this.scoreText.string = new richTextMaker(this.currentScore.toString(), "#020202", 3, "").resultText;
        this.coinText.string = new richTextMaker("00", "#020202", 3, "").resultText;
        this.currentScoreText.string = new richTextMaker(this.currentScore.toString(), "#020202", 3, "").resultText;
        this.currentLevelText.string = new richTextMaker("LV." + this.gameMode.getCurrentLevelFromVersion().toString(), "#020202", 3, "").resultText;

        // 4) 바구니 상태 초기화(색/스케일 등)
        const basketComp = this.basket?.getComponent(basket);
        basketComp?.initialize();

        // 5) 스폰 위치 상태 리셋
        this.extensions?.resetSpawnState();

        // 6) 화면 전환: 스테이지 선택으로 가지 않고 바로 시작 연출로
        this.selectGameModeNode.active = false;
        this.retryNode.active = false;
        this.startPlayStarting();
    }

    private currentComboScore: number = 0;
    private checkEggsInBasket() {
        // 안전 가드: 씬 세팅/파괴 타이밍 이슈로 null/invalid가 될 수 있음
        if (!isValid(this.eggParent, true) || !isValid(this.basket, true)) {
            return;
        }

        const eggInBasket: Node[] = [];
        for (const eggNode of this.eggParent.children) {
            if (!isValid(eggNode, true)) {
                continue;
            }
            // 서로 다른 부모를 가질 수 있으니 월드 좌표 기준으로 계산
            const distance: number = Vec3.distance(eggNode.worldPosition, this.basket.worldPosition);
            if (distance < 100) {
                console.log("egg in basket : " + eggNode.name);
                this.processEggCatch(eggNode);
                eggInBasket.push(eggNode);
                break;
            }
        }

        if (eggInBasket.length > 0) {
            for (const eggNode of eggInBasket) {
                eggNode.removeFromParent();
            }
        }
    }

    private processEggCatch(eggNode: Node) {
        const level = this.gameMode.getCurrentLevelFromVersion();
        const currentEggScore = eggNode.getComponent(egg).getCurrentScore(level);
        // 잘못 받은(패널티) 경우 바구니를 빨갛게 1초 표시
        if (currentEggScore < 0 && isValid(this.basket, true)) {
            const basketComp = this.basket.getComponent(basket);
            if (basketComp) {
                basketComp.flashRed(1);
            }
        }
        if (currentEggScore > 0) {
            this.currentComboScore += currentEggScore;
        }
        else {
            this.currentComboScore = currentEggScore;
        }
        this.currentScore += this.currentComboScore;
        if (this.currentScore < 0) {
            this.currentScore = 0;
        }
        this.currentScoreText.string = new richTextMaker(this.currentScore.toString(), "#020202", 3, "").resultText;
        const eggComponent = eggNode.getComponent(egg);
        eggComponent.onEggCatch(this.currentComboScore);
        if (this.currentComboScore < 0) {
            this.currentComboScore = 0;
        }
    }

    public resetComboScore() {
        this.currentComboScore = 0;
    }

    public onDragAreaTouchMove(x: number, y: number) {
        y = -410;
        // if (y > 0) {
        //     y = -170;
        // }
        // else if (y < -2) {
        //     y = -2;
        // }
        if (x > 300) {
            x = 300;
        }
        else if (x < -300) {
            x = -300;
        }
        if (isValid(this.basket, true)) {
            this.basket.setPosition(x, y, 0);
        }
    }
}
