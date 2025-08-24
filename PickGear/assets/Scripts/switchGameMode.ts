import { Sprite, SpriteFrame } from "cc";
import { EGameMode } from "./GameDefine";
import { gameInstance } from "./gameInstance";
import { getGameBackground } from "./getGameBackground";
import { ResourceManager } from "./ResourceManager";

export class switchGameMode {
    private game: gameInstance;

    public constructor(game: gameInstance) {
        this.game = game;
    }

    public switchMode(gameMode: EGameMode) {
        this.game.gameMode = gameMode;
        this.allNodeOff();
        switch (gameMode) {
            case EGameMode.SelectType:
                this.switchSelectType();
                break;
            case EGameMode.PlayGame:
                this.switchPlayGame();
                break;
        }
    }

    private allNodeOff() {
        this.game.nodeCollection.selectGameTypeNode.active = false;
        this.game.nodeCollection.gameNode.active = false;
    }

    private switchSelectType() {
        this.game.nodeCollection.selectGameTypeNode.active = true;
    }

    private async switchPlayGame() {
        this.game.nodeCollection.gameNode.active = true;

        const gameBackgroundPath = new getGameBackground(this.game.gameType).getBackgroundResourcePath();
        console.log(`gameBackgroundPath: ${gameBackgroundPath}, gameType: ${this.game.gameType}`);
        this.game.gameBackground.getComponent(Sprite).spriteFrame = await ResourceManager.I.loadResource(gameBackgroundPath, SpriteFrame);
    }
}