import { ECharacterType } from "./GameDefine";

export class dancerSprite {
    public resourcePath: string;

    constructor(dancerType: ECharacterType) {
        this.resourcePath = `textures/Character/${ECharacterType[dancerType]}/spriteFrame`;
    }
}