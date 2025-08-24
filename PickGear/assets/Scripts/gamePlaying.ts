import { _decorator, Component, Node } from 'cc';
import { gameInstance } from './gameInstance';
import { EGameRound } from './GameDefine';
import { RootUI } from './RootUI';
const { ccclass, property } = _decorator;

@ccclass('gamePlaying')
export class gamePlaying extends Component {
    @property(gameInstance)
    private game: gameInstance = null;
    @property(Node)
    private uiNode: Node = null;
    private ui: RootUI = null;
    private gameRound: EGameRound = EGameRound.Preview;
    private currentLevel: number = 1;

    update(deltaTime: number) {

    }

    // 게임 시작. 이 안에서 게임 라운드를 관리한다
    public startNewGame(game: gameInstance) {
        this.ui = this.uiNode.getComponent(RootUI);
        this.game = game;
        this.gameRound = EGameRound.Preview;
        this.currentLevel = 1;

        this.ui.showCountText(false);
        this.ui.showTimeProgressBar(false);
        this.ui.showResultCountText(false);
        this.ui.showLevelText(true);
        this.ui.setLevelText(this.currentLevel);
    }
}
