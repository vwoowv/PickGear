import { Sprite, SpriteFrame } from "cc";
import { getGameBackground } from "../getGameBackground";
import { ResourceManager } from "../ResourceManager";
import { gameInstance } from "../gameInstance";
import { gameModeManager } from "./gameModeManager";

export class playNewGame {
    async initialize() {
        const game = gameInstance.I;
        game.nodeCollection.allNodeOff();
        game.nodeCollection.gameNode.active = true;
        const gameBackgroundPath = new getGameBackground(game.playing.currentSuitType).getBackgroundResourcePath();
        console.log(`gameBackgroundPath: ${gameBackgroundPath}, gameType: ${game.playing.currentSuitType}`);
        game.gameBackground.getComponent(Sprite).spriteFrame = await ResourceManager.I.loadResource(gameBackgroundPath, SpriteFrame);

        gameModeManager.I.playingToPrepare();
    }
}
