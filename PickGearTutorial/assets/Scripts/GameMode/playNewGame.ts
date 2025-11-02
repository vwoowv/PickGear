import { SpriteFrame } from "cc";
import { getGameBackground } from "../Utility/getGameBackground";
import { IAssetLists, ResourceManager } from "../ResourceManager";
import { gameModeManager } from "./gameModeManager";
import { delaySeconds } from "../Utility/delay";
import { gameInstanceUtility } from "./gameInstanceUtility";
import { getDancerSuit } from "../Character/getDancerSuit";
import { ECharacterType } from "../GameDefine";

export class playNewGame {
    async initialize() {
        const currentSuitType = gameInstanceUtility.getCurrentSuitType();
        const backgroundSprite = gameInstanceUtility.getBackgroundSprite();
        backgroundSprite.spriteFrame = null;
        const gameBackgroundPath = new getGameBackground(currentSuitType).getBackgroundResourcePath();
        console.log(`gameBackgroundPath: ${gameBackgroundPath}, gameType: ${currentSuitType}`);
        backgroundSprite.spriteFrame = await ResourceManager.I.loadResource(gameBackgroundPath, SpriteFrame);

        const assetLists: IAssetLists = {
            prefabs: [],
            audioClips: [],
            spriteFrames: [],
        };
        for (let i = 0; i < ECharacterType.TotalCount; i++) {
            const characterType = i as ECharacterType;
            const resourcePath = new getDancerSuit(characterType).getSuitResourcePath(currentSuitType);
            assetLists.spriteFrames.push(resourcePath);
        }
        await ResourceManager.I.preloadGameAssets(assetLists);

        await new delaySeconds().delay(0.5);
        gameModeManager.I.playingToPrepare();
    }
}
