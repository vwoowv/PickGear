import { ECharacterSuitType, ECharacterType, EFaceType } from "../GameDefine";

export class getDancerFace {
    public getFaceResourcePath(dancerType: ECharacterType, suitType: ECharacterSuitType, faceType: EFaceType): string {
        const suitTypeString = ECharacterSuitType[suitType];
        const dancerTypeString = ECharacterType[dancerType];
        const faceTypeString = EFaceType[faceType];
        return `textures/Character/Face/${suitTypeString}/${dancerTypeString}/${suitTypeString}_${dancerTypeString}_${faceTypeString}/spriteFrame`;
    }
}
