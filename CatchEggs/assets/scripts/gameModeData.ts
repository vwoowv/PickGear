import { _decorator, Component, Enum, Node, SpriteFrame } from 'cc';
import { EGameMode } from './gameDefine';
import { gameManager } from './gameManager';
import { ResourceManager } from './ResourceManager';
const { ccclass, property } = _decorator;

@ccclass('gameModeData')
export class gameModeData extends Component {
    private gameManagerInstance: gameManager = null;
    @property({ type: Enum(EGameMode) })
    private currentGameMode: EGameMode = EGameMode.Version1;
    @property(Node)
    private enemyParent: Node[] = [];
    private backgroundName: string[] = ["background", "backgroundLake", "backgroundCity"];

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

    public async getCurrentBackground(): Promise<SpriteFrame> {
        return await ResourceManager.I.loadResource(`textures/background/${this.backgroundName[this.currentGameMode]}/spriteFrame`, SpriteFrame);
    }
}
