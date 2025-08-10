import { _decorator, Button, Component, Node, RichText, serializeTag } from 'cc';
import { GameManager } from './GameManager';
const { ccclass, property } = _decorator;

@ccclass('RootUI')
export class RootUI extends Component {
    @property(Button)
    private startButton: Button = null;
    @property(RichText)
    private CountText: RichText = null;

    public onStartButtonClick() {
        GameManager.I.startGame();
        this.startButton.node.active = false;
    }

    public setCountText(count: number) {
        this.showCountText(true);
        this.CountText.string = count.toString();
    }

    public showCountText(isShow: boolean) {
        this.CountText.node.active = isShow;
    }
}
