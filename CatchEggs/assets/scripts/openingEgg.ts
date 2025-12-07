import { _decorator, Component, Label, RichText, Sprite, SpriteFrame } from 'cc';
import { ResourceManager } from './ResourceManager';
import { richTextMaker } from './richTextMaker';
const { ccclass, property } = _decorator;

@ccclass('openingEgg')
export class openingEgg extends Component {
    @property(Sprite)
    private eggImage: Sprite = null;
    @property(RichText)
    private eggScoreText: RichText = null;

    public async initialize(eggTextureName: string, eggScore: number) {
        this.eggImage.spriteFrame = await ResourceManager.I.loadResource(`textures/character/Opening/${eggTextureName}/spriteFrame`, SpriteFrame);
        
        // 스코어가 +1인 경우는 안 보이게 처리
        if (eggScore === 1) {
            this.eggScoreText.string = "";
            return;
        }
        
        let scoreString = eggScore.toString();
        if (eggScore > 0) {
            scoreString = "+" + scoreString;
        }
        // score < 0인 경우는 이미 "-"가 포함되어 있음
        const color = eggScore > 0 ? "#FFFFFF" : "#FF0000";
        this.eggScoreText.string = new richTextMaker(scoreString, "#000000", 3, color).resultText;
    }
}
