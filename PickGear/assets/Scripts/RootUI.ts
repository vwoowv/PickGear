import { _decorator, Component, ProgressBar, RichText, Node } from 'cc';
import { gameInstance } from './gameInstance';
import { richTextMaker } from './Utility/richTextMaker';
const { ccclass, property } = _decorator;

@ccclass('RootUI')
export class RootUI extends Component {
    private static _instance: RootUI = null;
    public static get I(): RootUI {
        if (RootUI._instance === null) {
            RootUI._instance = new RootUI();
        }
        return RootUI._instance;
    }

    protected onLoad(): void {
        if (RootUI._instance === null) {
            RootUI._instance = this;
        } else {
            this.node.destroy();
        }
    }

    @property(Node)
    private showSuitGroup: Node = null;
    @property(Node)
    private showSuitArrow: Node = null;
    @property(RichText)
    private showSuitLevelText: RichText = null;
    @property(RichText)
    private levelText: RichText = null;
    @property(ProgressBar)
    private timeProgressBar: ProgressBar = null;
    @property(Node)
    private currentScoreGroup: Node = null;
    @property(RichText)
    private currentScoreText: RichText = null;

    public onPickingButtonClick() {
        gameInstance.I.onStartButtonClick();
    }

    private hideAllGroup() {
        this.currentScoreGroup.active = false;
        this.timeProgressBar.node.active = false;
        this.levelText.node.active = false;
        this.showSuitGroup.active = false;
    }

    public setupShowSuit(currentLevel: number) {
        this.hideAllGroup();
        this.showSuitGroup.active = true;
        this.showSuitArrow.active = currentLevel < 5;
        this.showSuitLevelText.string = new richTextMaker("LV." + currentLevel.toString(), "020202", 3, "FFFFFF").resultText;
    }

    public setupShowAllSuit() {
        this.hideAllGroup();
    }

    public setupGameRound(currentLevel: number) {
        this.hideAllGroup();
        this.levelText.node.active = true;
        this.timeProgressBar.node.active = true;
        this.currentScoreGroup.active = true;

        this.levelText.string = new richTextMaker("LV." + currentLevel.toString(), "020202", 3, "FFFFFF").resultText;
        this.timeProgressBar.progress = 1;
        this.currentScoreText.string = new richTextMaker("0", "020202", 3, "FFFFFF").resultText;
    }

    public setTimeProgressBar(value: number) {
        this.timeProgressBar.progress = value;
    }

    // public setCountText(count: number) {
    //     this.showCountText(true);
    //     this.CountText.string = count.toString();
    // }

    // public showCountText(isShow: boolean) {
    //     this.CountText.node.active = isShow;
    // }

    // public showTimeProgressBar(isShow: boolean) {
    //     this.timeProgressBar.node.active = isShow;
    // }


    // public showResultCountText(isShow: boolean) {
    //     this.resultCountText.node.active = isShow;
    // }

    // public setResultCountText(count: number) {
    //     this.resultCountText.string = "점수 : " + count.toString();
    // }

    // public showLevelText(isShow: boolean) {
    //     this.levelText.node.active = isShow;
    // }

    // public setLevelText(level: number) {
    //     this.levelText.string = "LV." + level.toString();
    // }
}
