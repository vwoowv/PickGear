import { _decorator, AudioClip, AudioSource, Component, isValid, Label, Node, ProgressBar, RichText, Sprite, Vec3 } from 'cc';
import { ResourceManager } from './ResourceManager';
import { egg } from './egg';
import { EggType, EGameState } from './gameDefine';
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
    public static get I(): gameManager { return gameManager._instance; }

    onLoad() {
        if (!gameManager._instance) gameManager._instance = this;
        else this.node.destroy();
    }

    @property(() => gameModeData)
    public gameMode: gameModeData = null;

    @property(Label) private currentTimeText: Label = null;
    @property(Label) private leftTimeText: Label = null;
    @property(ProgressBar) private timeProgressBar: ProgressBar = null;
    @property(Node) public eggParent: Node = null;
    @property(Node) public eggScoreParent: Node = null;
    @property(Node) public eggSpawnPoint_Left: Node = null;
    @property(Node) public eggSpawnPoint_Right: Node = null;
    @property(Node) public eggEndLine: Node = null;
    @property(Node) public selectGameModeNode: Node = null;
    @property(Node) public playStartingNode: Node = null;
    @property(Node) public playingNode: Node = null;
    @property(Node) public prepareNode: Node = null;
    @property(Node) private dragAreaNode: dragArea = null;
    @property(Node) public retryNode: Node = null;
    @property(Node) public retryNodeHeartNormal: Node = null;
    @property(RichText) private currentScoreText: RichText = null;
    @property(RichText) private currentLevelText: RichText = null;
    @property(RichText) private scoreText: RichText = null;
    @property(RichText) private coinText: RichText = null;
    @property(Node) private basket: Node = null;
    @property(AudioSource) public playSound: AudioSource = null;
    @property(AudioClip) public eggCatchSound: AudioClip[] = [];
    @property(AudioClip) public penaltySound: AudioClip = null;
    @property(AudioClip) public missSound: AudioClip = null;
    @property(Sprite) private background: Sprite = null;
    @property(Node) private OpeningNerdsGroup: Node = null;
    @property(openingEgg) private openingEggNormalList: openingEgg[] = [];
    @property(openingEgg) private openingEggNegativeList: openingEgg[] = [];
    @property(Node) private loadingNode: Node = null;

    private gameState: EGameState = EGameState.None;
    private timeLeft: number = 0;
    private currentScore: number = 0;
    private extensions: gameManagerExtensions = null;
    public perfect: boolean = false;
    private isSpawningEgg: boolean = false;
    private leftTimeToSpawnEgg: number = 1;
    private currentComboScore: number = 0;

    public markNotPerfect(reason: string) {
        if (this.perfect) console.log(`[perfect] broken: ${reason}`);
        this.perfect = false;
    }

    async start() {
        console.log("GameManager Start");
        if (this.loadingNode) this.loadingNode.active = true;

        this.extensions = this.node.addComponent(gameManagerExtensions);
        await this.extensions.initialize(this);
        this.selectGameMode();

        const midiData: midiJsonData = new midiJsonData();
        await midiData.loadMidiJsonData();
        console.log("GameManager Initialized");
    }

    update(deltaTime: number) {
        if (this.gameState == EGameState.Playing) {
            this.updatePlaying(deltaTime).catch(err => console.error(err));
        }
    }

    private selectGameMode() {
        console.log("State: SelectGameMode");
        this.gameState = EGameState.SelectGameMode;
        if(this.selectGameModeNode) this.selectGameModeNode.active = true;
        if(this.playStartingNode) this.playStartingNode.active = false;
        if(this.playingNode) this.playingNode.active = false;
        if(this.prepareNode) this.prepareNode.active = false;
        if(this.retryNode) this.retryNode.active = false;
    }

    // gameModeData에서 호출함
    public async completeSelectGameMode() {
        console.log("completeSelectGameMode 호출됨. 배경 로딩 시작...");
        try {
            // 배경 로딩
            const bgSprite = await this.gameMode.getCurrentBackground();
            if (this.background) {
                this.background.spriteFrame = bgSprite;
            }
            console.log("배경 로딩 완료. PrepareGame 진입.");
            await this.prepareGame();
        } catch (e) {
            console.error("completeSelectGameMode 에러:", e);
            await this.prepareGame();
        }
    }

    private async prepareGame() {
        console.log("PrepareGame 시작");
        this.gameState = EGameState.Prepare;
        this.selectGameModeNode.active = false;
        this.playStartingNode.active = false;
        this.playingNode.active = false;
        this.prepareNode.active = true;
        this.retryNode.active = false;

        this.basket.getComponent(basket).initialize();
        this.perfect = true;
        this.currentScore = 0;
        this.currentComboScore = 0;

        this.updateUIText();

        try {
            console.log("오프닝 캐릭터 세팅 중...");
            await this.setOpeningCharacter();
            console.log("오프닝 캐릭터 세팅 완료.");
        } catch (err) {
            console.error("오프닝 캐릭터 세팅 실패 (게임은 계속 진행함):", err);
        }

        console.log("자동으로 PlayStarting(연출)으로 전환합니다.");
        this.startPlayStarting();
    }

    private updateUIText() {
        const scoreStr = this.currentScore.toString();
        const levelStr = "LV." + this.gameMode.getCurrentLevelFromVersion().toString();

        if (this.scoreText) this.scoreText.string = new richTextMaker(scoreStr, "#020202", 3, "").resultText;
        if (this.coinText) this.coinText.string = new richTextMaker("00", "#020202", 3, "").resultText;
        if (this.currentScoreText) this.currentScoreText.string = new richTextMaker(scoreStr, "#020202", 3, "").resultText;
        if (this.currentLevelText) this.currentLevelText.string = new richTextMaker(levelStr, "#020202", 3, "").resultText;
    }

    private async setOpeningCharacter() {
        const level = this.gameMode.getCurrentLevelFromVersion();
        const prop = gameProperty.I;
        let hasNegativeScore = false;

        for (let i = 0; i < EggType.TotalCount; i++) {
            if (prop.getScore(level, i) < 0) {
                hasNegativeScore = true;
                break;
            }
        }
        if (this.OpeningNerdsGroup) this.OpeningNerdsGroup.active = hasNegativeScore;

        const positiveScores = [];
        const negativeScores = [];

        for (let i = 0; i < EggType.TotalCount; i++) {
            const score = prop.getScore(level, i);
            const image = prop.getImage(level, i);
            if (score > 0) positiveScores.push({ eggType: i, score, image });
            else if (score < 0) negativeScores.push({ eggType: i, score, image });
        }

        sortOpeningPositiveScores(level, positiveScores);

        const loadEggs = async (list: openingEgg[], data: any[]) => {
            let idx = 0;
            for (const item of data) {
                if (idx < list.length && list[idx]) {
                    try {
                        await list[idx].initialize(item.image, item.score);
                        list[idx].node.active = true;
                    } catch (e) {
                        console.warn(`Egg Init Failed: ${item.image}`, e);
                        list[idx].node.active = false;
                    }
                    idx++;
                }
            }
            for (let i = idx; i < list.length; i++) {
                if (list[i]) list[i].node.active = false;
            }
        };

        await loadEggs(this.openingEggNormalList, positiveScores);
        await loadEggs(this.openingEggNegativeList, negativeScores);
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
        this.perfect = true;
        this.timeLeft = this.gameMode.getCurrentGameDuration();
        this.retryNode.active = false;
        this.currentScore = 0;
        this.updateUIText();
    }

    private async updatePlaying(deltaTime: number) {
        const totalDuration = this.gameMode.getCurrentGameDuration();
        this.leftTimeToSpawnEgg -= deltaTime;

        if (this.leftTimeToSpawnEgg <= 0 && this.timeLeft - 2 > 0 && !this.isSpawningEgg) {
            this.isSpawningEgg = true;
            try {
                const spawnTime = await this.extensions.spawnRandomEgg(this.timeLeft, totalDuration, this.gameMode.currentGameMode);
                this.leftTimeToSpawnEgg = spawnTime;
            } finally {
                this.isSpawningEgg = false;
            }
        }

        this.timeLeft -= deltaTime;
        if (this.timeProgressBar) {
            this.timeProgressBar.progress = Math.max(0, this.timeLeft / totalDuration);
        }

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
        if (this.currentTimeText) this.currentTimeText.string = formatTime(totalDuration - this.timeLeft);
        if (this.leftTimeText) this.leftTimeText.string = formatTime(this.timeLeft);
    }

    private gameOver() {
        console.log("Game Over");
        this.gameState = EGameState.GameOver;
        this.eggParent.children.forEach(child => child.destroy());
        this.eggParent.removeAllChildren();
        this.playStartingNode.active = false;
        this.playingNode.active = false;
        this.prepareNode.active = false;
        this.retryNode.active = true;
        this.retryNode.getComponent(ResultNode).initialize(this);
        this.updateUIText();
        this.gameMode.resultGame();
    }

    public onHomeButtonClick() {
        this.selectGameMode();
    }

    public onRetryButtonClick() {
        this.restartCurrentStage();
    }

    private restartCurrentStage() {
        if (this.eggParent) {
            this.eggParent.children.forEach(child => child.destroy());
            this.eggParent.removeAllChildren();
        }
        this.isSpawningEgg = false;
        this.leftTimeToSpawnEgg = 1;
        this.timeLeft = this.gameMode.getCurrentGameDuration();
        this.perfect = true;
        this.currentScore = 0;
        this.currentComboScore = 0;
        if (this.timeProgressBar) this.timeProgressBar.progress = 1;
        this.updateUIText();

        const basketComp = this.basket?.getComponent(basket);
        basketComp?.initialize();

        this.extensions?.resetSpawnState();
        this.selectGameModeNode.active = false;
        this.retryNode.active = false;
        this.startPlayStarting();
    }

    private checkEggsInBasket() {
        if (!isValid(this.eggParent, true) || !isValid(this.basket, true)) return;

        const eggInBasket: Node[] = [];
        for (const eggNode of this.eggParent.children) {
            if (!isValid(eggNode, true)) continue;
            const distance: number = Vec3.distance(eggNode.worldPosition, this.basket.worldPosition);
            if (distance < 100) {
                this.processEggCatch(eggNode);
                eggInBasket.push(eggNode);
            }
        }
        for (const eggNode of eggInBasket) {
            eggNode.removeFromParent();
        }
    }

    private processEggCatch(eggNode: Node) {
        const level = this.gameMode.getCurrentLevelFromVersion();
        const currentEggScore = eggNode.getComponent(egg).getCurrentScore(level);

        if (currentEggScore < 0 && isValid(this.basket, true)) {
            this.markNotPerfect("caught_negative_egg");
            const basketComp = this.basket.getComponent(basket);
            if (basketComp) basketComp.flashRed(1);
        }

        if (currentEggScore > 0) this.currentComboScore += currentEggScore;
        else this.currentComboScore = currentEggScore;

        this.currentScore += this.currentComboScore;
        if (this.currentScore < 0) this.currentScore = 0;

        if (this.currentScoreText) {
            this.currentScoreText.string = new richTextMaker(this.currentScore.toString(), "#020202", 3, "").resultText;
        }

        const eggComponent = eggNode.getComponent(egg);
        eggComponent.onEggCatch(this.currentComboScore);

        if (this.currentComboScore < 0) this.currentComboScore = 0;
    }

    public resetComboScore() {
        this.currentComboScore = 0;
    }

    public onDragAreaTouchMove(x: number, y: number) {
        y = -410;
        if (x > 300) x = 300;
        else if (x < -300) x = -300;
        if (isValid(this.basket, true)) {
            this.basket.setPosition(x, y, 0);
        }
    }
}