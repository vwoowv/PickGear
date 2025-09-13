import { ECharacterSuitType, ECharacterType } from "../GameDefine";

export class getDancerSuit {
    private dancerType: ECharacterType;
    private rootPath = 'textures/Character/Suit/';

    public constructor(dancerType: ECharacterType) {
        this.dancerType = dancerType;
    }

    public getSuitResourcePathList() : string[] {
        return [
            this.getDoArinSuitResourcePath(ECharacterSuitType.HYBE),
            this.getDoArinSuitResourcePath(ECharacterSuitType.YG),
            this.getDoArinSuitResourcePath(ECharacterSuitType.JYP),
            this.getDoArinSuitResourcePath(ECharacterSuitType.SM),
            this.getEmmaMoonSuitResourcePath(ECharacterSuitType.HYBE),
            this.getEmmaMoonSuitResourcePath(ECharacterSuitType.YG),
            this.getEmmaMoonSuitResourcePath(ECharacterSuitType.JYP),
            this.getEmmaMoonSuitResourcePath(ECharacterSuitType.SM),
            this.getSongUnbeeSuitResourcePath(ECharacterSuitType.HYBE),
            this.getSongUnbeeSuitResourcePath(ECharacterSuitType.YG),
            this.getSongUnbeeSuitResourcePath(ECharacterSuitType.JYP),
            this.getSongUnbeeSuitResourcePath(ECharacterSuitType.SM),
            this.getSooHanaSuitResourcePath(ECharacterSuitType.HYBE),
            this.getSooHanaSuitResourcePath(ECharacterSuitType.YG),
            this.getSooHanaSuitResourcePath(ECharacterSuitType.JYP),
            this.getSooHanaSuitResourcePath(ECharacterSuitType.SM),
        ];
    }

    public getSuitResourcePath(suitType: ECharacterSuitType) {
        switch (this.dancerType) {
            case ECharacterType.DoArin:
                return this.getDoArinSuitResourcePath(suitType);
            case ECharacterType.EmmaMoon:
                return this.getEmmaMoonSuitResourcePath(suitType);
            case ECharacterType.SongUnbee:
                return this.getSongUnbeeSuitResourcePath(suitType);
            case ECharacterType.SooHana:
                return this.getSooHanaSuitResourcePath(suitType);
                break;
        }
    }

    private getDoArinSuitResourcePath(suitType: ECharacterSuitType) {
        switch (suitType) {
            case ECharacterSuitType.HYBE:
                return `${this.rootPath}HYBE/HYBE_DoArin/spriteFrame`;
            case ECharacterSuitType.YG:
                return `${this.rootPath}YG/YG_DoArin/spriteFrame`;
            case ECharacterSuitType.JYP:
                return `${this.rootPath}JYP/JYP_DoArin/spriteFrame`;
            case ECharacterSuitType.SM:
                return `${this.rootPath}SM/SM_DoArin/spriteFrame`;
            default:
                return null;
        }
    }

    private getEmmaMoonSuitResourcePath(suitType: ECharacterSuitType) {
        switch (suitType) {
            case ECharacterSuitType.HYBE:
                return `${this.rootPath}HYBE/HYBE_EmmaMoon/spriteFrame`;
            case ECharacterSuitType.YG:
                return `${this.rootPath}YG/YG_EmmaMoon/spriteFrame`;
            case ECharacterSuitType.JYP:
                return `${this.rootPath}JYP/JYP_EmmaMoon/spriteFrame`;
            case ECharacterSuitType.SM:
                return `${this.rootPath}SM/SM_EmmaMoon/spriteFrame`;
            default:
                return null;
        }
    }

    private getSongUnbeeSuitResourcePath(suitType: ECharacterSuitType) {
        switch (suitType) {
            case ECharacterSuitType.HYBE:
                return `${this.rootPath}HYBE/HYBE_SongUnbee/spriteFrame`;
            case ECharacterSuitType.YG:
                return `${this.rootPath}YG/YG_SongUnbee/spriteFrame`;
            case ECharacterSuitType.JYP:
                return `${this.rootPath}JYP/JYP_SongUnbee/spriteFrame`;
            case ECharacterSuitType.SM:
                return `${this.rootPath}SM/SM_SongUnbee/spriteFrame`;
            default:
                return null;
        }
    }

    private getSooHanaSuitResourcePath(suitType: ECharacterSuitType) {
        switch (suitType) {
            case ECharacterSuitType.HYBE:
                return `${this.rootPath}HYBE/HYBE_SooHana/spriteFrame`;
            case ECharacterSuitType.YG:
                return `${this.rootPath}YG/YG_SooHana/spriteFrame`;
            case ECharacterSuitType.JYP:
                return `${this.rootPath}JYP/JYP_SooHana/spriteFrame`;
            case ECharacterSuitType.SM:
                return `${this.rootPath}SM/SM_SooHana/spriteFrame`;
            default:
                return null;
        }
    }
}
