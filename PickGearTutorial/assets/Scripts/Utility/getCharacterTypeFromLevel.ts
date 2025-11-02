import { ECharacterType } from "../GameDefine";

export class getCharacterTypeFromLevel {
    public characterType: ECharacterType;
    public constructor(currentLevel: number) {
        this.characterType = ECharacterType.DoArin;
        switch (currentLevel) {
            case 1:
                this.characterType = ECharacterType.DoArin;
                break;
            case 2:
                this.characterType = ECharacterType.SooHana;
                break;
            case 3:
                this.characterType = ECharacterType.SongUnbee;
                break;
            case 4:
                this.characterType = ECharacterType.EmmaMoon;
                break;
        }
    }
}
