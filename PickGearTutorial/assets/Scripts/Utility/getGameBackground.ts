import { ECharacterSuitType } from "../GameDefine";

export class getGameBackground {
    private gameType: ECharacterSuitType;
    private rootPath = 'textures/Background/';

    public constructor(gameType: ECharacterSuitType) {
        this.gameType = gameType;
    }

    public getBackgroundResourcePath(): string {
        switch (this.gameType) {
            case ECharacterSuitType.YG:
                return `${this.rootPath}YG Background shorts/spriteFrame`;
            case ECharacterSuitType.JYP:
                return `${this.rootPath}JYP Background shorts/spriteFrame`;
            case ECharacterSuitType.SM:
                return `${this.rootPath}SM Background shorts/spriteFrame`;
            case ECharacterSuitType.HYBE:
                return `${this.rootPath}HYBE Background shorts/spriteFrame`;
            default:
                return null;
        }
    }

    public getBackgroundResourcePathList(): string[] {
        return [
            `${this.rootPath}YG Background shorts/spriteFrame`,
            `${this.rootPath}JYP Background shorts/spriteFrame`,
            `${this.rootPath}SM Background shorts/spriteFrame`,
            `${this.rootPath}HYBE Background shorts/spriteFrame`,
        ];
    }
}