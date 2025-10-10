import { _decorator, Component, ProgressBar, RichText, Node, Label, AnimationComponent, Sprite } from 'cc';
import { richTextMaker } from './Utility/richTextMaker';
import { ECharacterSuitType, EFaceType } from './GameDefine';
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
    @property(Node)
    private faceGroup: Node = null;
    @property(Sprite)
    private faceSprite: Sprite = null;
    @property(ProgressBar)
    private timeProgressBar: ProgressBar = null;
    @property(Label)
    private currentTimeText: Label = null;
    @property(Label)
    private leftTimeText: Label = null;
    @property(Node)
    private currentScoreGroup: Node = null;
    @property(RichText)
    private currentScoreText: RichText = null;
    @property(Node)
    private resultGroup: Node = null;
    @property(RichText)
    private resultScoreText: RichText = null;
    @property(Node)
    private currentShowScoreGroup: Node = null;
    @property(Label)
    private currentShowScoreText: Label = null;
    @property(Node)
    private loadingGroup: Node = null;
    @property(Node)
    public selectGameTypeNode: Node = null;
    @property(Node)
    public gameNode: Node = null;

    public hideAllNodeOff() {
        this.selectGameTypeNode.active = false;
        this.gameNode.active = false;
    }

    public showSelectGameTypeNode() {
        this.selectGameTypeNode.active = true;
    }

    public showGameNode() {
        this.selectGameTypeNode.active = false;
        this.gameNode.active = true;
    }

    public hideAllGroup() {
        this.currentScoreGroup.active = false;
        this.timeProgressBar.node.active = false;
        this.levelText.node.active = false;
        this.faceGroup.active = false;
        this.showSuitGroup.active = false;
        this.resultGroup.active = false;
        this.currentShowScoreGroup.active = false;
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
        this.faceGroup.active = true;
        this.timeProgressBar.node.active = true;
        this.currentScoreGroup.active = true;

        this.levelText.string = new richTextMaker("LV." + currentLevel.toString(), "020202", 3, "FFFFFF").resultText;
        this.timeProgressBar.progress = 1;
        this.currentScoreText.string = new richTextMaker(currentPoint.toString(), "020202", 3, "FFFFFF").resultText;
        this.currentShowScoreGroup.active = true;
        this.currentShowScoreGroup.getComponent(AnimationComponent).play("stop");
    }

    public setupResult(currentPoint: number) {
        this.hideAllGroup();
        this.resultGroup.active = true;
        this.resultScoreText.string = new richTextMaker("Total : " + currentPoint.toString(), "020202", 3, "FFFFFF").resultText;
    }

    public setTimeProgressBar(value: number, currentTimeInSeconds: number, totalTimeInSeconds: number) {
        this.timeProgressBar.progress = value;
        const seconds = Math.floor(currentTimeInSeconds);
        const decimal = Math.floor((currentTimeInSeconds - seconds) * 100);
        this.currentTimeText.string = `${seconds}:${decimal}`;
        const leftSeconds = Math.floor(totalTimeInSeconds - currentTimeInSeconds);
        const leftDecimal = Math.floor((totalTimeInSeconds - currentTimeInSeconds - leftSeconds) * 100);
        this.leftTimeText.string = `${leftSeconds}:${leftDecimal}`;
    }

    public setCurrentScoreText(currentPoint: number, acquirePoint: number) {
        this.currentScoreText.string = new richTextMaker(currentPoint.toString(), "020202", 3, "FFFFFF").resultText;
        this.currentShowScoreGroup.getComponent(AnimationComponent).play("Idle");
        if (acquirePoint > 0) {
            this.currentShowScoreText.string = "+" + acquirePoint.toString();
        }
        else {
            this.currentShowScoreText.string = acquirePoint.toString();
        }
    }

    public showLoadingGroup() {
        this.loadingGroup.active = true;
    }

    public hideLoadingGroup() {
        this.loadingGroup.active = false;
    }

    public setFaceSprite(characterSuitType: ECharacterSuitType, faceType: EFaceType) {
    }
}
