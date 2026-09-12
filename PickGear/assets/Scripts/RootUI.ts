import { _decorator, Component, ProgressBar, RichText, Node, Label, AnimationComponent, Sprite, SpriteFrame, BlockInputEvents, UITransform, Graphics, Color, Button, Widget, Tween, isValid } from 'cc';
import { gameInstance } from './gameInstance';
import { richTextMaker } from './Utility/richTextMaker';
import { ECharacterSuitType, ECharacterType, EFaceType } from './GameDefine';
import { getDancerFace } from './Character/getDancerFace';
import { ResourceManager } from './ResourceManager';
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
    @property(Node)
    private resultBackgroundSuccess: Node = null;
    @property(Node)
    private resultBackgroundFail: Node = null;
    @property(Node)
    private resultBackgroundPass: Node = null;
    @property(RichText)
    private resultScoreText: RichText = null;
    @property(Node)
    private currentShowScoreGroup: Node = null;
    @property(Label)
    private currentShowScoreText: Label = null;
    @property(Node)
    private loadingGroup: Node = null;
    @property(ProgressBar)
    private loadingProgressBar: ProgressBar = null;
    @property(Label)
    private loadingProgressText: Label = null;
    @property(Node)
    public selectGameTypeNode: Node = null;
    @property(Node)
    public gameNode: Node = null;

    private exitButton: Node = null;
    private exitConfirmation: Node = null;
    private continueAction: () => void = null;
    private exitAction: () => void = null;
    private gamePaused = false;
    private pausedAnimations: AnimationComponent[] = [];
    private faceRequest = 0;

    // 기존 씬 참조를 유지하며 게임 UI 안에 버튼과 팝업을 생성한다.
    private ensureExitUI() {
        if (this.exitButton) return;
        this.exitButton = this.createExitAction(this.gameNode, 'ExitButton', '나가기', 132, 58,
            new Color(40, 36, 55, 235), () => gameInstance.I.playing.onTouchExitButton());
        const placement = this.exitButton.addComponent(Widget);
        placement.isAlignTop = true;
        placement.isAlignRight = true;
        placement.top = 180;
        placement.right = 24;
        placement.alignMode = Widget.AlignMode.ALWAYS;

        this.exitConfirmation = this.createExitPanel(this.gameNode, 'ExitConfirmation', 720, 1280,
            new Color(15, 12, 25, 190));
        const stretch = this.exitConfirmation.addComponent(Widget);
        stretch.isAlignTop = stretch.isAlignBottom = true;
        stretch.isAlignLeft = stretch.isAlignRight = true;
        stretch.top = stretch.bottom = stretch.left = stretch.right = 0;
        stretch.alignMode = Widget.AlignMode.ALWAYS;
        this.exitConfirmation.addComponent(BlockInputEvents);
        const card = this.createExitPanel(this.exitConfirmation, 'ExitCard', 600, 350, new Color(255, 251, 247));
        this.createExitLabel(card, '게임을 나갈까요?', 38, 560, 60).setPosition(0, 95);
        this.createExitLabel(card, '진행 중인 점수는 사라집니다.', 26, 560, 50).setPosition(0, 25);
        this.createExitAction(card, 'ContinueButton', '계속하기', 240, 76,
            new Color(67, 53, 102), () => this.continueAction?.()).setPosition(-132, -90);
        this.createExitAction(card, 'ConfirmExitButton', '나가기', 240, 76,
            new Color(161, 54, 75), () => this.exitAction?.()).setPosition(132, -90);
        this.exitConfirmation.active = false;
        this.exitButton.active = false;
    }

    private createExitPanel(parent: Node, name: string, width: number, height: number, color: Color): Node {
        const node = new Node(name);
        node.layer = parent.layer;
        parent.addChild(node);
        node.addComponent(UITransform).setContentSize(width, height);
        const graphic = node.addComponent(Graphics);
        const draw = () => {
            const size = node.getComponent(UITransform).contentSize;
            graphic.clear();
            graphic.fillColor = color;
            graphic.roundRect(-size.width / 2, -size.height / 2, size.width, size.height, 16);
            graphic.fill();
        };
        node.on(Node.EventType.SIZE_CHANGED, draw);
        draw();
        return node;
    }

    private createExitLabel(parent: Node, text: string, fontSize: number, width: number, height: number): Node {
        const node = new Node('Label');
        node.layer = parent.layer;
        parent.addChild(node);
        node.addComponent(UITransform).setContentSize(width, height);
        const label = node.addComponent(Label);
        label.string = text;
        label.fontSize = fontSize;
        label.lineHeight = fontSize + 8;
        label.color = new Color(40, 36, 55);
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        return node;
    }

    private createExitAction(parent: Node, name: string, text: string, width: number, height: number,
        color: Color, action: () => void): Node {
        const node = this.createExitPanel(parent, name, width, height, color);
        node.addComponent(Button);
        this.createExitLabel(node, text, 28, width, height).getComponent(Label).color = Color.WHITE;
        node.on(Button.EventType.CLICK, action);
        return node;
    }

    public setExitButtonVisible(visible: boolean) {
        if (visible) this.ensureExitUI();
        if (this.exitButton) this.exitButton.active = visible;
    }

    public showExitConfirmation(onContinue: () => void, onExit: () => void) {
        this.ensureExitUI();
        this.continueAction = onContinue;
        this.exitAction = onExit;
        this.exitConfirmation.setSiblingIndex(this.gameNode.children.length - 1);
        this.exitConfirmation.active = true;
    }

    public hideExitConfirmation() {
        if (this.exitConfirmation) this.exitConfirmation.active = false;
        this.continueAction = this.exitAction = null;
    }

    public setGamePaused(paused: boolean) {
        if (this.gamePaused === paused) return;
        this.gamePaused = paused;
        if (paused) {
            this.pausedAnimations = this.gameNode.getComponentsInChildren(AnimationComponent)
                .filter((animation) => animation.clips.some((clip) => clip && animation.getState(clip.name)?.isPlaying));
            this.pausedAnimations.forEach((animation) => animation.pause());
        } else {
            this.pausedAnimations.forEach((animation) => { if (isValid(animation)) animation.resume(); });
            this.pausedAnimations = [];
        }
        const visit = (node: Node) => {
            if (paused) Tween.pauseAllByTarget(node);
            else Tween.resumeAllByTarget(node);
            node.children.forEach(visit);
        };
        visit(this.gameNode);
    }

    public resetTransientUI() {
        this.faceRequest++;
        this.leftFaceSpriteBackToNormalTime = -1;
        this.currentShowScoreGroup.getComponent(AnimationComponent)?.stop();
    }

    update(deltaTime: number) {
        if (!this.gamePaused) this.updateFaceSprite(deltaTime);
    }

    public hideAllNodeOff() {
        this.hideExitConfirmation();
        this.setExitButtonVisible(false);
        this.selectGameTypeNode.active = false;
        this.gameNode.active = false;
    }

    public showSelectGameTypeNode() {
        this.selectGameTypeNode.active = true;
    }

    public showGameNode() {
        this.selectGameTypeNode.active = false;
        this.gameNode.active = true;
        this.setExitButtonVisible(true);
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

    public setupResult(currentPoint: number, perfect: boolean) {
        this.hideAllGroup();
        this.resultGroup.active = true;
        this.resultScoreText.string = new richTextMaker(currentPoint.toString(), "020202", 3, "000000").resultText;
        this.resultBackgroundSuccess.active = false;
        this.resultBackgroundFail.active = false;
        this.resultBackgroundPass.active = false;
        if (perfect) {
            this.resultBackgroundSuccess.active = true;
        }
        else {
            this.resultBackgroundFail.active = currentPoint <= 0;
            this.resultBackgroundPass.active = currentPoint > 0;
        }
    }

    private formatTimeTwoDigits(value: number): string {
        const num = Math.floor(Math.max(0, Math.min(99, value)));
        if (num < 10) {
            return '0' + num.toString();
        }
        return num.toString();
    }

    public setTimeProgressBar(value: number, currentTimeInSeconds: number, totalTimeInSeconds: number) {
        this.timeProgressBar.progress = value;
        const seconds = Math.floor(currentTimeInSeconds);
        const decimal = Math.floor((currentTimeInSeconds - seconds) * 100);
        const secondsStr = this.formatTimeTwoDigits(seconds);
        const decimalStr = this.formatTimeTwoDigits(decimal);
        this.currentTimeText.string = secondsStr + ':' + decimalStr;
        const leftSeconds = Math.floor(totalTimeInSeconds - currentTimeInSeconds);
        const leftDecimal = Math.floor((totalTimeInSeconds - currentTimeInSeconds - leftSeconds) * 100);
        const leftSecondsStr = this.formatTimeTwoDigits(leftSeconds);
        const leftDecimalStr = this.formatTimeTwoDigits(leftDecimal);
        this.leftTimeText.string = leftSecondsStr + ':' + leftDecimalStr;
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
        this.setLoadingProgress(0);
        this.setLoadingBlockInput(true);
    }

    public hideLoadingGroup() {
        this.loadingGroup.active = false;
        this.setLoadingBlockInput(false);
    }

    public setLoadingProgress(progress: number) {
        const p = Math.max(0, Math.min(1, progress));
        if (this.loadingProgressBar) {
            this.loadingProgressBar.progress = p;
        }
        if (this.loadingProgressText) {
            this.loadingProgressText.string = `${Math.floor(p * 100)}%`;
        }
    }

    private setLoadingBlockInput(enabled: boolean) {
        if (!this.loadingGroup) {
            return;
        }
        const blocker = this.loadingGroup.getComponent(BlockInputEvents);
        if (blocker) {
            blocker.enabled = enabled;
        }
    }

    public async setFaceSprite(dancerType: ECharacterType, characterSuitType: ECharacterSuitType, faceType: EFaceType) {
        const resourcePath = new getDancerFace().getFaceResourcePath(dancerType, characterSuitType, faceType);
        const request = ++this.faceRequest;
        const frame = await ResourceManager.I.loadResource<SpriteFrame>(resourcePath, SpriteFrame);
        if (request !== this.faceRequest || !isValid(this, true)) return false;
        this.faceSprite.spriteFrame = frame;
        return true;
    }

    public async setFaceSpriteAndBackToNormal(dancerType: ECharacterType, characterSuitType: ECharacterSuitType, faceType: EFaceType) {
        if (!await this.setFaceSprite(dancerType, characterSuitType, faceType)) return;
        this.faceDancerType = dancerType;
        this.faceCharacterSuitType = characterSuitType;
        this.leftFaceSpriteBackToNormalTime = 1;
    }

    private leftFaceSpriteBackToNormalTime: number = -1;
    private faceDancerType: ECharacterType = ECharacterType.DoArin;
    private faceCharacterSuitType: ECharacterSuitType = ECharacterSuitType.HYBE;
    private async updateFaceSprite(deltaTime: number) {
        if (this.leftFaceSpriteBackToNormalTime < 0) {
            return;
        }

        this.leftFaceSpriteBackToNormalTime -= deltaTime;
        if (this.leftFaceSpriteBackToNormalTime <= 0) {
            this.leftFaceSpriteBackToNormalTime = -1;
            await this.setFaceSprite(this.faceDancerType, this.faceCharacterSuitType, EFaceType.Normal);
        }
    }
}
