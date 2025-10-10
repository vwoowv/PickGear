import { ECharacterSuitType, ECharacterType, EFaceType } from "../GameDefine";

export class getDancerFace {
    public getFaceResourcePath(dancerType: ECharacterType, suitType: ECharacterSuitType, faceType: EFaceType) {
        return `textures/Character/Face/${suitType}/${dancerType}/${suitType}_${dancerType}_${faceType}.png`;
    }
}
