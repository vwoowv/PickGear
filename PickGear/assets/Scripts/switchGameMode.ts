import { EGameMode } from "./GameDefine";
import { gameInstance } from "./gameInstance";

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

    private switchPlayGame() {
        this.game.nodeCollection.gameNode.active = true;
    }
}