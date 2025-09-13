import { Sprite, SpriteFrame } from "cc";
import { getGameBackground } from "../Utility/getGameBackground";
import { ResourceManager } from "../ResourceManager";
import { gameInstance } from "../gameInstance";
import { gameModeManager } from "./gameModeManager";
import { getDancerSuit } from "../Character/getDancerSuit";
import { ECharacterType } from "../GameDefine";
import { dancerSprite } from "../Character/dancerResource";
import { delaySeconds } from "../Utility/delay";

export class playNewGame {
    async initialize() {
        const game = gameInstance.I;
        game.nodeCollection.allNodeOff();
        // const dancerSuitResourcePathList = new getDancerSuit(ECharacterType.DoArin).getSuitResourcePathList(game.playing.currentSuitType);
        // await ResourceManager.I.loadResourceAndCache(dancerSuitResourcePathList, SpriteFrame);
        // const dancerResourcePathList = dancerSprite.getAllResourcePath();
        // await ResourceManager.I.loadResourceAndCache(dancerResourcePathList, SpriteFrame);
        game.nodeCollection.gameNode.active = true;
        const backgroundSprite = game.gameBackground.getComponent(Sprite);
        backgroundSprite.spriteFrame = null;
        const gameBackgroundPath = new getGameBackground(game.playing.currentSuitType).getBackgroundResourcePath();
        console.log(`gameBackgroundPath: ${gameBackgroundPath}, gameType: ${game.playing.currentSuitType}`);
        backgroundSprite.spriteFrame = await ResourceManager.I.loadResource(gameBackgroundPath, SpriteFrame);

        await new delaySeconds().delay(0.5);
        gameModeManager.I.playingToPrepare();
    }
}
