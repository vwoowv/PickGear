import { _decorator, Component, Enum, Node, SpriteFrame } from 'cc';
import { EGameMode } from './gameDefine';
import { gameManager } from './gameManager';
import { ResourceManager } from './ResourceManager';
const { ccclass, property } = _decorator;

@ccclass('gameModeData')
export class gameModeData extends Component {
    private gameManagerInstance: gameManager = null;
    @property({ type: Enum(EGameMode) })
    public currentGameMode: EGameMode = EGameMode.Version1;
    @property(Node)
    private enemyParent: Node[] = [];
    @property(Node)
    private enemyParent_Result: Node[] = [];
    private backgroundName: string[] = ["background", "backgroundLake", "backgroundCity"];
    private gameDurationInSeconds: number[] = [44, 49, 74];
    private gameBgName: string[] = ["sound/Sanrio1_Full_Version", "sound/Sanrio2_Full_Version", "sound/Sanrio3_Full_Version"];

    private onTouchVersion1Button() {
        this.currentGameMode = EGameMode.Version1;
        this.completeSelectGameMode();
    }

    private onTouchVersion2Button() {
        this.currentGameMode = EGameMode.Version2;
        this.completeSelectGameMode();
    }

    private onTouchVersion3Button() {
        this.currentGameMode = EGameMode.Version3;
        this.completeSelectGameMode();
    }

    public getCurrentLevelFromVersion(): number {
        if (this.currentGameMode == EGameMode.Version1) {
            return 1;
        }
        else if (this.currentGameMode == EGameMode.Version2) {
            return 2;
        }
        else if (this.currentGameMode == EGameMode.Version3) {
            return 3;
        }
        return 0;
    }

    private completeSelectGameMode() {
        this.enemyParent.forEach(enemy => {
            enemy.active = false;
        });
        this.enemyParent[this.currentGameMode].active = true;
        if (this.gameManagerInstance == null) {
            this.gameManagerInstance = this.node.getComponent(gameManager)
        }
        this.gameManagerInstance.completeSelectGameMode();
    }

    public resultGame() {
        this.enemyParent_Result.forEach(enemy => {
            enemy.active = false;
        });
        this.enemyParent_Result[this.currentGameMode].active = true;
    }

    public async getCurrentBackground(): Promise<SpriteFrame> {
        return await ResourceManager.I.loadResource(`textures/background/${this.backgroundName[this.currentGameMode]}/spriteFrame`, SpriteFrame);
    }

    public getCurrentGameDuration(): number {
        return this.gameDurationInSeconds[this.currentGameMode];
    }

    public getCurrentGameBgName(): string {
        return this.gameBgName[this.currentGameMode];
    }
}
