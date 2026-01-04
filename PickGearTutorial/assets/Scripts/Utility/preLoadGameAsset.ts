import { IAssetLists, ResourceManager } from "../ResourceManager";
import { ECharacterSuitType, ECharacterType } from "../GameDefine";
import { getDancerSuit } from "../Character/getDancerSuit";

export class preLoadGameAsset {
    async preLoadGameAsset() {
        const assetLists: IAssetLists = {
            prefabs: [],
            audioClips: [],
            spriteFrames: [],
        };
        for (let i = 0; i < ECharacterType.TotalCount; i++) {
            const characterType = i as ECharacterType;
            const resourcePath = new getDancerSuit(characterType).getSuitResourcePath(ECharacterSuitType.YG);
            assetLists.spriteFrames.push(resourcePath);
        }
        assetLists.audioClips.push('sound/Kiss and cry_Game');
        await ResourceManager.I.preloadGameAssets(assetLists);
    }
}
