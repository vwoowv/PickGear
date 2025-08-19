import { _decorator, AudioClip, AudioSource, Component, instantiate, Node, ParticleSystem, Prefab, ProgressBar, RichText, Vec3 } from 'cc';
import { ResourceManager } from './ResourceManager';
import { egg } from './egg';
import { EggType, EGameState } from './gameDefine';
import { dragArea } from './dragArea';
import { gameModeData } from './gameModeData';
const { ccclass, property } = _decorator;

@ccclass('gameManager')
export class gameManager extends Component {
    @property(gameModeData)
    private gameMode: gameModeData = null;
    @property(ProgressBar)
    private timeProgressBar: ProgressBar = null;
    @property(Node)
    private eggParent: Node = null;
    @property(Node)
    private eggSpawnPoint_Left: Node = null;
    @property(Node)
    private eggSpawnPoint_Right: Node = null;
    @property(Node)
    private eggEndLine: Node = null;
    @property(Node)
    private selectGameModeNode: Node = null;
    @property(Node)
    private playingNode: Node = null;
    @property(Node)
    private prepareNode: Node = null;
    @property(Node)
    private dragAreaNode: dragArea = null;
    @property(Node)
    private retryNode: Node = null;
    @property(RichText)
    private scoreText: RichText = null;
    @property(Node)
    private basket: Node = null;
    @property(AudioSource)
    private playSound: AudioSource = null;
    @property(AudioClip)
    private eggCatchSound: AudioClip[] = [];
    private gameState: EGameState = EGameState.None;
    private timeLeftValue: number = 10;
    private timeLeft: number = this.timeLeftValue;
    private currentScore: number = 0;
    async start() {
        this.selectGameMode();
    }

    update(deltaTime: number) {
        if (this.gameState == EGameState.Prepare) {
            this.updatePrepare(deltaTime);
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
        this.playingNode.active = false;
        this.prepareNode.active = false;
        this.retryNode.active = false;
    }

    public completeSelectGameMode() {
        this.prepareGame();
    }

    private prepareGame() {
        this.gameState = EGameState.Prepare;
        this.selectGameModeNode.active = false;
        this.playingNode.active = false;
        this.prepareNode.active = true;
        this.retryNode.active = false;
        this.currentScore = 0;
        this.scoreText.string = this.currentScore.toString();
    }

    private updatePrepare(deltaTime: number) {
        if (this.gameState != EGameState.Prepare) {
            return;
        }
    }

    public startNewGame() {
        this.gameState = EGameState.Playing;
        this.playingNode.active = true;
        this.prepareNode.active = false;
        this.timeLeft = this.timeLeftValue;
        this.retryNode.active = false;
        this.currentScore = 0;
        this.scoreText.string = this.currentScore.toString();
    }

    private leftTimeToSpawnEgg: number = 0;
    private async updatePlaying(deltaTime: number) {
        if (this.gameState != EGameState.Playing) {
            return;
        }
        this.leftTimeToSpawnEgg -= deltaTime;
        // 끝나기 1초전까지 스폰시킨다
        if (this.leftTimeToSpawnEgg <= 0 && this.timeLeft - 1 > 0) {
            this.spawnRandomEgg();
            this.leftTimeToSpawnEgg = 1;
        }
        this.timeLeft -= deltaTime;
        this.timeProgressBar.progress = this.timeLeft / this.timeLeftValue;
        if (this.timeLeft <= 0) {
            this.gameOver();
        }
        this.checkEggsInBasket();
    }

    private gameOver() {
        this.gameState = EGameState.GameOver;
        this.eggParent.children.forEach(child => {
            child.destroy();
        });
        this.eggParent.removeAllChildren();
        this.playingNode.active = false;
        this.prepareNode.active = false;
        this.retryNode.active = true;
        this.scoreText.string = this.currentScore.toString();
    }

    private updateGameOver(deltaTime: number) {
        if (this.gameState != EGameState.GameOver) {
            return;
        }
    }

    private onRetryButtonClick() {
        this.prepareGame();
    }

    private async checkEggsInBasket() {
        for (const eggNode of this.eggParent.children) {
            const distance: number = eggNode.position.clone().subtract(this.basket.position).length();
            if (distance < 100) {
                console.log("egg in basket");
                this.currentScore += 1;
                const hitEffect = await ResourceManager.I.loadResource<Prefab>("effect/box/boxHit2D", Prefab);
                const hitEffectNode = instantiate(hitEffect);
                const hitEffectPosition = new Vec3(eggNode.position.x, eggNode.position.y - 100, eggNode.position.z);
                hitEffectNode.setPosition(hitEffectPosition);
                hitEffectNode.setScale(100, 100, 100);
                this.playingNode.addChild(hitEffectNode);
                const eggComponent = eggNode.getComponent(egg);
                if (eggComponent.currentType == EggType.Happy) {
                    this.playSound.playOneShot(this.eggCatchSound[1]);
                }
                else {
                    this.playSound.playOneShot(this.eggCatchSound[0]);
                }
                this.eggParent.removeChild(eggNode);
                eggNode.destroy();
                break;
            }
        }
    }

    private async spawnRandomEgg() {
        const newEgg = await ResourceManager.I.spawnPrefab<egg>("prefab/Egg", this.eggParent);
        const randomEgg = Math.floor(Math.random() * EggType.TotalCount);
        newEgg.initialize(randomEgg, this.eggEndLine);
        const xPosition = Math.random() * (this.eggSpawnPoint_Right.position.x - this.eggSpawnPoint_Left.position.x) + this.eggSpawnPoint_Left.position.x;
        const eggPosition = new Vec3(xPosition, this.eggSpawnPoint_Right.position.y, this.eggSpawnPoint_Right.position.z);
        newEgg.node.setPosition(eggPosition);
    }

    public onDragAreaTouchMove(x: number, y: number) {
        if (y > 0) {
            y = 0;
        }
        else if (y < -100) {
            y = -100;
        }
        this.basket.setPosition(x, y, 0);
    }
}
