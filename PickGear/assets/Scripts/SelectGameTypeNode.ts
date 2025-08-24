import { _decorator, Component, Node } from 'cc';
import { gameInstance } from './gameInstance';
import { EGameType } from './GameDefine';
const { ccclass, property } = _decorator;

@ccclass('SelectGameTypeNode')
export class SelectGameTypeNode extends Component {
    @property(gameInstance)
    public game: gameInstance = null;
    public onLevel1ButtonClick() {
        this.game.startGame(EGameType.YG);
    }

    public onLevel2ButtonClick() {
        this.game.startGame(EGameType.JYP);
    }

    public onLevel3ButtonClick() {
        this.game.startGame(EGameType.SM);
    }

    public onLevel4ButtonClick() {
        this.game.startGame(EGameType.HYBE);
    }
}
