import { _decorator, Component, Enum, Font, SpriteFrame } from 'cc';
import { EGameMode } from './gameDefine';
import { gameManager } from './gameManager';
import { ResourceManager } from './ResourceManager';

const { ccclass, property } = _decorator;

@ccclass('gameModeData')
export class gameModeData extends Component {
    private gameManagerInstance: gameManager = null;

    @property({ type: Enum(EGameMode) })
    public currentGameMode: EGameMode = EGameMode.Version1;

    @property(Font)
    private versionFont: Font[] = [null, null, null];

    private backgroundName: string[] = ["background", "backgroundLake", "backgroundCity"];
    private gameDurationInSeconds: number[] = [44, 49, 74];

    private gameBgName: string[] = ["1522636431", "1522636440", "1522636433"];

    private gameSongKeywords: string[] = [
        "리듬킹 Into You",
        "리듬킹 Freeze The Fire",
        "리듬킹 Monster"
    ];

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
        if (this.currentGameMode == EGameMode.Version1) return 1;
        if (this.currentGameMode == EGameMode.Version2) return 2;
        if (this.currentGameMode == EGameMode.Version3) return 3;
        return 1;
    }

    private completeSelectGameMode() {
        if (!this.gameManagerInstance) {
            this.gameManagerInstance = this.node.getComponent(gameManager);
        }
        if (!this.gameManagerInstance) {
            this.gameManagerInstance = this.node.getComponent("gameManager") as gameManager;
        }

        if (this.gameManagerInstance) {
            this.gameManagerInstance.completeSelectGameMode();
        } else {
        }
    }

    public resultGame() {}

    public async getCurrentBackground(): Promise<SpriteFrame> {
        const bgPath = `textures/background/${this.backgroundName[this.currentGameMode]}/spriteFrame`;
        return await ResourceManager.I.loadResource(bgPath, SpriteFrame);
    }

    public getCurrentGameDuration(): number {
        return this.gameDurationInSeconds[this.currentGameMode];
    }

    public getCurrentGameBgName(): string {
        return this.gameBgName[this.currentGameMode];
    }

    public getCurrentSongKeyword(): string {
        return this.gameSongKeywords[this.currentGameMode];
    }

    public getCurrentVersionFont(): Font {
        return this.versionFont[this.currentGameMode];
    }
}