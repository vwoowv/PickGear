import { ECharacterSuitType } from "../GameDefine";
import { gameModeManager } from "./gameModeManager";
import { gameInstance } from "../gameInstance";
import { Sprite } from "cc";

export class gameInstanceUtility {
    public static getBackgroundSprite(): Sprite {
        return gameInstance.I.gameBackground.getComponent(Sprite);
    }

    public static getCurrentSuitType(): ECharacterSuitType {
        return gameInstance.I.playing.currentSuitType;
    }
}
