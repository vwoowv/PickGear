import { _decorator, AnimationComponent, Component, Font, Node, RichText } from 'cc';
import { gameManager } from './gameManager';
import { ResourceManager } from './ResourceManager';
import { richTextMaker } from './richTextMaker';
import { EGameMode } from './gameDefine';
const { ccclass, property } = _decorator;

@ccclass('playStartingNode')
export class playStartingNode extends Component {
    @property(Node)
    private eggParent: Node = null;
    @property(AnimationComponent)
    private animation: AnimationComponent = null;
    @property(RichText)
    private letsGoText: RichText = null;
    @property(RichText)
    private saveYourEggBirdsText: RichText = null;
    @property(Font)
    private version1Font: Font = null;
    @property(Font)
    private version2Font: Font = null;
    @property(Font)
    private version3Font: Font = null;
    private eggs: Node[] = [];
    private sinElapsedTime: number = 0;
    private elapsedTime: number = 0;
    private gameManager: gameManager = null;
    start() {
        this.eggs = this.eggParent.children;
    }

    public async initialize(gameManager: gameManager) {
        this.sinElapsedTime = 0;
        this.elapsedTime = 0;
        this.gameManager = gameManager;
        const soundName = this.gameManager.gameMode.getCurrentGameBgName();
        const audioClip = await ResourceManager.I.loadAudioClip(soundName);
        this.gameManager.playSound.playOneShot(audioClip);
        this.animation.play();

        // 게임모드에 따라서 텍스트 속성 변경
        if (this.gameManager.gameMode.currentGameMode == EGameMode.Version3) {
            this.letsGoText.fontFamily = "Ownglyph_PDH";
            this.saveYourEggBirdsText.fontFamily = "Ownglyph_PDH";
            this.letsGoText.string = new richTextMaker("Lets Go!", "#020202", 3, "FFFFFF").resultText;
            this.saveYourEggBirdsText.string = new richTextMaker("Save Your Egg Birds!!!", "#020202", 3, "FFFFFF").resultText;
        }
        else {
            // this.letsGoText.font = this.version1Font;
            // this.saveYourEggBirdsText.font = this.version1Font;
            this.letsGoText.string = new richTextMaker("Lets Go!", "", 3, "020202").resultText;
            this.saveYourEggBirdsText.string = new richTextMaker("Save Your Egg Birds!!!", "", 3, "020202").resultText;
        }
    }

    update(deltaTime: number) {
        this.sinElapsedTime += deltaTime * 100.0;
        this.eggs.forEach(egg => {
            egg.angle = Math.sin(this.sinElapsedTime * 0.05) * 10;
        });

        this.elapsedTime += deltaTime;
        if (this.elapsedTime >= 4.0) {
            this.gameManager.startNewGame();
        }
    }
}
