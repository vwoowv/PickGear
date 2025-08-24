import { _decorator, Component, Node } from 'cc';
import { gameInstance } from './gameInstance';
import { EGameRound } from './GameDefine';
const { ccclass, property } = _decorator;

@ccclass('gamePlaying')
export class gamePlaying extends Component {
    @property(gameInstance)
    private game: gameInstance = null;
    private gameRound: EGameRound = EGameRound.Preview;
    private currentLevel: number = 1;

    update(deltaTime: number) {

    }

    // 게임 시작. 이 안에서 게임 라운드를 관리한다
    public startNewGame(game: gameInstance) {
        this.game = game;
        this.gameRound = EGameRound.Preview;
        this.currentLevel = 1;
    }
}
