import { _decorator, AnimationComponent, Component, RichText } from 'cc';
import { richTextMaker } from './richTextMaker';
const { ccclass, property } = _decorator;

@ccclass('eggScore')
export class eggScore extends Component {
    @property(RichText)
    private scoreText: RichText = null;
    @property(AnimationComponent)
    private scoreAnimation: AnimationComponent = null;

    public setScore(score: number) {
        this.scoreText.string = new richTextMaker(score.toString(), "#020202", 3).resultText;
        this.scoreAnimation.play(null);
        this.scoreAnimation.on(AnimationComponent.EventType.FINISHED, this.onScoreAnimationFinished, this);
    }

    private onScoreAnimationFinished() {
        this.node.destroy();
    }
}