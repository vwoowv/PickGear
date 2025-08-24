import { _decorator, Button, Component, Node, ProgressBar, RichText, serializeTag } from 'cc';
import { GameManager } from './GameManager';
const { ccclass, property } = _decorator;

@ccclass('RootUI')
export class RootUI extends Component {
    @property(Button)
    private startButton: Button = null;
    @property(RichText)
    private CountText: RichText = null;
    @property(ProgressBar)
    private timeProgressBar: ProgressBar = null;
    @property(RichText)
    private resultCountText: RichText = null;

    public onPickingButtonClick() {
        // GameManager.I.touchSuit();
    }

    public setCountText(count: number) {
        this.showCountText(true);
        this.CountText.string = count.toString();
    }

    public showCountText(isShow: boolean) {
        this.CountText.node.active = isShow;
    }

    public showTimeProgressBar(isShow: boolean) {
        this.timeProgressBar.node.active = isShow;
    }

    public setTimeProgressBar(value: number) {
        this.timeProgressBar.progress = value;
    }

    public showResultCountText(isShow: boolean) {
        this.resultCountText.node.active = isShow;
    }

    public setResultCountText(count: number) {
        this.resultCountText.string = "점수 : " + count.toString();
    }
}
