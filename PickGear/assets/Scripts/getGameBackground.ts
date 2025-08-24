import { EGameType } from "./GameDefine";

export class getGameBackground {
    private gameType: EGameType;
    private rootPath = 'textures/Background/';

    public constructor(gameType: EGameType) {
        this.gameType = gameType;
    }

    public getBackgroundResourcePath() : string {
        switch (this.gameType) {
            case EGameType.YG:
                return `${this.rootPath}YG Background shorts/spriteFrame`;
            case EGameType.JYP:
                return `${this.rootPath}JYP Background shorts/spriteFrame`;
            case EGameType.SM:
                return `${this.rootPath}SM Background shorts/spriteFrame`;
            case EGameType.HYBE:
                return `${this.rootPath}HYBE Background shorts/spriteFrame`;
            default:
                return null;
        }
    }
}