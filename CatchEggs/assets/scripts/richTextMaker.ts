import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('richTextMaker')
export class richTextMaker {
    public resultText: string = "";
    public constructor(text: string, outlineColor: string, outlineSize: number) {
        this.resultText = `<outline color=${outlineColor} width=${outlineSize}>${text}</outline>`;
    }
}