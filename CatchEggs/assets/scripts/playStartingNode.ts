import { _decorator, AnimationComponent, Component, Node } from 'cc';
import { gameManager } from './gameManager';
import { ResourceManager } from './ResourceManager';
const { ccclass, property } = _decorator;

@ccclass('playStartingNode')
export class playStartingNode extends Component {
    @property(Node)
    private eggParent: Node = null;
    @property(AnimationComponent)
    private animation: AnimationComponent = null;
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
