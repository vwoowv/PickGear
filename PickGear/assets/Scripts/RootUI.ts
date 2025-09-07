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
    @property(Node)
    private resultGroup: Node = null;
    @property(RichText)
    private resultScoreText: RichText = null;

    public hideAllGroup() {
        this.currentScoreGroup.active = false;
        this.timeProgressBar.node.active = false;
        this.levelText.node.active = false;
        this.showSuitGroup.active = false;
        this.resultGroup.active = false;
    }

    public setupShowSuit(currentLevel: number) {
        this.hideAllGroup();
        this.showSuitGroup.active = true;
        this.showSuitArrow.active = currentLevel < 5;
        this.showSuitLevelText.string = new richTextMaker("LV." + currentLevel.toString(), "020202", 3, "FFFFFF").resultText;
    }

    public setupGameRound(currentLevel: number, currentPoint: number) {
        this.hideAllGroup();
        this.levelText.node.active = true;
        this.timeProgressBar.node.active = true;
        this.currentScoreGroup.active = true;

        this.levelText.string = new richTextMaker("LV." + currentLevel.toString(), "020202", 3, "FFFFFF").resultText;
        this.timeProgressBar.progress = 1;
        this.setCurrentScoreText(currentPoint);
    }

    public setupResult(currentPoint: number) {
        this.hideAllGroup();
        this.resultGroup.active = true;
        this.resultScoreText.string = new richTextMaker("Total : " + currentPoint.toString(), "020202", 3, "FFFFFF").resultText;
    }

    public setTimeProgressBar(value: number) {
        this.timeProgressBar.progress = value;
    }

    public setCurrentScoreText(currentPoint: number) {
        this.currentScoreText.string = new richTextMaker(currentPoint.toString(), "020202", 3, "FFFFFF").resultText;
    }
}
