import { SpriteFrame } from "cc";
import { getGameBackground } from "../Utility/getGameBackground";
import { ResourceManager } from "../ResourceManager";
import { gameModeManager } from "./gameModeManager";
import { delaySeconds } from "../Utility/delay";
import { gameInstanceUtility } from "./gameInstanceUtility";

export class playNewGame {
    async initialize() {
        const backgroundSprite = gameInstanceUtility.getBackgroundSprite();
        backgroundSprite.spriteFrame = null;
        const gameBackgroundPath = new getGameBackground(gameInstanceUtility.getCurrentSuitType()).getBackgroundResourcePath();
        console.log(`gameBackgroundPath: ${gameBackgroundPath}, gameType: ${gameInstanceUtility.getCurrentSuitType()}`);
        backgroundSprite.spriteFrame = await ResourceManager.I.loadResource(gameBackgroundPath, SpriteFrame);

        await new delaySeconds().delay(0.5);
        gameModeManager.I.playingToPrepare();
    }
}
