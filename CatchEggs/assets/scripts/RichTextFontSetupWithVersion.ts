import { _decorator, Component, RichText } from "cc";
import { gameManager } from "./gameManager";
import { EGameMode } from "./gameDefine";
import { richTextMaker } from "./richTextMaker";
const { ccclass, property } = _decorator;

@ccclass('RichTextFontSetupWithVersion')
export class RichTextFontSetupWithVersion extends Component {
    private fontSize: number = 50;
    private originalString: string = "";
    protected onLoad(): void {
        this.fontSize = this.node.getComponent(RichText).fontSize;
        // RichText의 태그를 제거하고 텍스트만 추출
        const richTextString = this.node.getComponent(RichText).string;
        this.originalString = richTextString.replace(/<[^>]*>/g, "");
    }
    protected onEnable(): void {
        const text = this.node.getComponent(RichText);
        text.string = new richTextMaker(this.originalString, "#020202", 3, "FFFFFF").resultText;
    }
}