import { _decorator, Component, Node } from 'cc';
import { gameInstance } from './gameInstance';
import { ECharacterSuitType } from './GameDefine';
const { ccclass, property } = _decorator;

@ccclass('SelectGameTypeNode')
export class SelectGameTypeNode extends Component {
    @property(gameInstance)
    public game: gameInstance = null;
    public onLevel1ButtonClick() {
        this.game.startGame(ECharacterSuitType.YG);
    }

    public onLevel2ButtonClick() {
        this.game.startGame(ECharacterSuitType.JYP);
    }

    public onLevel3ButtonClick() {
        this.game.startGame(ECharacterSuitType.SM);
    }

    public onLevel4ButtonClick() {
        this.game.startGame(ECharacterSuitType.HYBE);
    }
}
