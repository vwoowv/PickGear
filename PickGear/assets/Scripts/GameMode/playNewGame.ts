import { Sprite, SpriteFrame } from "cc";
import { getGameBackground } from "../Utility/getGameBackground";
import { ResourceManager } from "../ResourceManager";
import { gameInstance } from "../gameInstance";
import { gameModeManager } from "./gameModeManager";
import { getDancerSuit } from "../Character/getDancerSuit";
import { ECharacterType } from "../GameDefine";

export class playNewGame {
    async initialize() {
        const game = gameInstance.I;
        game.nodeCollection.allNodeOff();
        const backgroundResourcePathList = new getGameBackground(game.playing.currentSuitType).getBackgroundResourcePathList();
        await ResourceManager.I.loadResourceAndCache(backgroundResourcePathList, SpriteFrame);
        const dancerSuitResourcePathList = new getDancerSuit(ECharacterType.DoArin).getSuitResourcePathList();
        await ResourceManager.I.loadResourceAndCache(dancerSuitResourcePathList, SpriteFrame);
        game.nodeCollection.gameNode.active = true;
        const backgroundSprite = game.gameBackground.getComponent(Sprite);
        backgroundSprite.spriteFrame = null;
        const gameBackgroundPath = new getGameBackground(game.playing.currentSuitType).getBackgroundResourcePath();
        console.log(`gameBackgroundPath: ${gameBackgroundPath}, gameType: ${game.playing.currentSuitType}`);
        backgroundSprite.spriteFrame = await ResourceManager.I.loadResource(gameBackgroundPath, SpriteFrame);

        gameModeManager.I.playingToPrepare();
    }
}
