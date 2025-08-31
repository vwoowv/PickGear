export class richTextMaker {
    public resultText: string = "";
    public constructor(text: string, outlineColor: string, outlineSize: number, textColor: string) {
        if (textColor != "") {
            if (outlineColor != "") {
                this.resultText = `<outline color=${outlineColor} width=${outlineSize}><color=${textColor}>${text}</color></outline>`;
            }
            else {
                this.resultText = `<color=${textColor}>${text}</color>`;
            }
        }
        else {
            if (outlineColor != "") {
                this.resultText = `<outline color=${outlineColor} width=${outlineSize}>${text}</outline>`;
            }
            else {
                this.resultText = `${text}`;
            }
        }
    }
}