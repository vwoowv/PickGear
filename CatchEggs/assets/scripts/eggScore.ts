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
        let scoreString = score.toString();
        if (score > 0) {
            scoreString = "+" + scoreString;
        }
        // score < 0인 경우는 이미 "-"가 포함되어 있음
        const color = score > 0 ? "#020202" : "#FF0000";
        this.scoreText.string = new richTextMaker(scoreString, color, 3, "").resultText;
        this.scoreAnimation.play(null);
        this.scoreAnimation.on(AnimationComponent.EventType.FINISHED, this.onScoreAnimationFinished, this);
    }

    private onScoreAnimationFinished() {
        this.node.destroy();
    }
}