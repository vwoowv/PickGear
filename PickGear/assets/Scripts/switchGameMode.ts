import { EGameMode } from "./GameDefine";
import { gameInstance } from "./gameInstance";

export class switchGameMode {
    private game: gameInstance;

    public constructor(game: gameInstance) {
        this.game = game;
    }

    public switchMode(gameMode: EGameMode) {
        switch (gameMode) {
            case EGameMode.SelectType:
                this.switchSelectType();
                break;
        }
    }

    private switchSelectType() {
        this.game.gameMode = EGameMode.SelectType;
        this.game.nodeCollection.selectGameTypeNode.active = true;
        this.game.nodeCollection.gameNode.active = false;
    }
}