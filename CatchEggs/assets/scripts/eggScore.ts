import { _decorator, AnimationComponent, Component, RichText } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('eggScore')
export class eggScore extends Component {
    @property(RichText)
    private scoreText: RichText = null;
    @property(AnimationComponent)
    private scoreAnimation: AnimationComponent = null;

    public setScore(score: number) {
        this.scoreText.string = score.toString();
        this.scoreAnimation.play(null);
    }
}

