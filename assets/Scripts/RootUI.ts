import { _decorator, Button, Component, Node, serializeTag } from 'cc';
import { GameManager } from './GameManager';
const { ccclass, property } = _decorator;

@ccclass('RootUI')
export class RootUI extends Component {
    @property(Button)
    private startButton: Button = null;

    start() {

    }

    update(deltaTime: number) {
        
    }

    public onStartButtonClick() {
        GameManager.I.startGame();
        this.startButton.node.active = false;
    }
}
