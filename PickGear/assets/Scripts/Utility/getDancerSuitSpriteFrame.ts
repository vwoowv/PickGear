import { SpriteFrame } from "cc";
import { ECharacterSuitType, ECharacterType } from "../GameDefine";
import { ResourceManager } from "../ResourceManager";
import { getDancerSuit } from "../Character/getDancerSuit";

export class getDancerSuitSpriteFrame {
    public async getAsync(dancerType: ECharacterType, suitType: ECharacterSuitType): Promise<SpriteFrame> {
        const resourcePath = new getDancerSuit(dancerType).getSuitResourcePath(suitType);
        return await ResourceManager.I.loadResource(resourcePath, SpriteFrame);
    }
}
