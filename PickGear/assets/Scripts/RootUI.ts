import { _decorator, Button, Component, ProgressBar, RichText } from 'cc';
import { gameInstance } from './gameInstance';
const { ccclass, property } = _decorator;

@ccclass('RootUI')
export class RootUI extends Component {
    @property(gameInstance)
    private game: gameInstance = null;
    @property(Button)
    private startButton: Button = null;
    @property(RichText)
    private CountText: RichText = null;
    @property(RichText)
    private levelText: RichText = null;
    @property(ProgressBar)
    private timeProgressBar: ProgressBar = null;
    @property(RichText)
    private resultCountText: RichText = null;

    public onPickingButtonClick() {
        this.game.onStartButtonClick();
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

    public showLevelText(isShow: boolean) {
        this.levelText.node.active = isShow;
    }

    public setLevelText(level: number) {
        this.levelText.string = "LV." + level.toString();
    }
}
