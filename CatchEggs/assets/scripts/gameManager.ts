import { _decorator, AudioClip, AudioSource, Component, instantiate, Label, Node, ParticleSystem, Prefab, ProgressBar, RichText, Sprite, Vec3 } from 'cc';
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
            this.updatePlaying(deltaTime);
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
        this.currentScore = 0;
        this.currentComboScore = 0;
        this.scoreText.string = new richTextMaker(this.currentScore.toString(), "#020202", 3, "").resultText;
        this.coinText.string = new richTextMaker("0000", "#020202", 3, "").resultText;
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
        this.coinText.string = new richTextMaker("0000", "#020202", 3, "").resultText;
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
            const spawnTime = await this.extensions.spawnRandomEgg(this.timeLeft, totalDuration, this.gameMode.currentGameMode);
            this.leftTimeToSpawnEgg = spawnTime;
            this.isSpawningEgg = false;
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
        this.scoreText.string = new richTextMaker(this.currentScore.toString(), "#020202", 3, "").resultText;
        this.coinText.string = new richTextMaker("0000", "#020202", 3, "").resultText;
        this.gameMode.resultGame();
    }

    private updateGameOver(deltaTime: number) {
        if (this.gameState != EGameState.GameOver) {
            return;
        }
    }

    private onRetryButtonClick() {
        this.selectGameMode();
    }

    private currentComboScore: number = 0;
    private checkEggsInBasket() {
        const eggInBasket: Node[] = [];
        for (const eggNode of this.eggParent.children) {
            const distance: number = eggNode.position.clone().subtract(this.basket.position).length();
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
        this.basket.setPosition(x, y, 0);
    }
}
