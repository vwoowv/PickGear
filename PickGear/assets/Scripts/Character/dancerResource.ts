import { ECharacterType } from "../GameDefine";

export class dancerSprite {
    public resourcePath: string;

    public static getAllResourcePath() : string[] {
        return [
            `textures/Character/${ECharacterType[ECharacterType.DoArin]}/spriteFrame`,
            `textures/Character/${ECharacterType[ECharacterType.EmmaMoon]}/spriteFrame`,
            `textures/Character/${ECharacterType[ECharacterType.SongUnbee]}/spriteFrame`,
            `textures/Character/${ECharacterType[ECharacterType.SooHana]}/spriteFrame`,
        ];
    }

    constructor(dancerType: ECharacterType) {
        this.resourcePath = `textures/Character/${ECharacterType[dancerType]}/spriteFrame`;
    }
}

export class nameTagSprite {
    public resourcePath: string;
    constructor(dancerType: ECharacterType) {
        this.resourcePath = `textures/Character/NameTag/${ECharacterType[dancerType]}/spriteFrame`;
    }
}