import { _decorator, Component, Node } from 'cc';
import { gameNodeCollection } from './gameNodeCollection';
import { gamePlaying } from './gamePlaying';
import { EGameRootModeState } from './GameMode/gameModeStateEvent';
import { gameModeManager } from './GameMode/gameModeManager';
import { ECharacterSuitType } from './GameDefine';
const { ccclass, property } = _decorator;

@ccclass('gameInstance')
export class gameInstance extends Component {
    private static _instance: gameInstance = null;

    @property(gameNodeCollection)
    public nodeCollection: gameNodeCollection = null;
    @property(gamePlaying)
    public playing: gamePlaying = null;
    @property(Node)
    public gameBackground: Node = null;
    @property(Node)
    public uiNode: Node = null;
    public gameMode: EGameRootModeState = EGameRootModeState.SelectType;

    public static get I(): gameInstance {
        if (gameInstance._instance === null) {
            console.error('gameInstance Singleton이 초기화되지 않았습니다!');
        }
        return gameInstance._instance;
    }

    // 싱글톤 초기화
    onLoad() {
        if (gameInstance._instance === null) {
            gameInstance._instance = this;
            console.log('GameManager Singleton이 생성되었습니다.');
        } else {
            // 이미 인스턴스가 존재하면 현재 노드를 파괴
            this.node.destroy();
        }
    }

    // 인스턴스가 파괴될 때 참조 정리
    onDestroy() {
        if (gameInstance._instance === this) {
            gameInstance._instance = null;
            console.log('gameInstance Singleton이 파괴되었습니다.');
        }
    }

    start() {
        gameModeManager.I.initialize(this.uiNode, this.node);
        gameModeManager.I.rootSelectGameType();
    }

    update(deltaTime: number) {

    }

    public startGame(gameType: ECharacterSuitType) {
        this.playing.setGameType(gameType);
        gameModeManager.I.rootPlayGame();
    }

    public async onStartButtonClick() {
        // 캐릭터의 기본적인 구성을 먼저 맞춰놓는다
        console.log("onStartButtonClick");
        // const newDancer1 = await ResourceManager.I.spawnPrefab<dancer>("prefab/character/Dancer", this.dancerResultPos[0]);
        // newDancer1.initialize(ECharacterType.DoArin);

        // const newDancer2 = await ResourceManager.I.spawnPrefab<dancer>("prefab/character/Dancer", this.dancerResultPos[1]);
        // newDancer2.initialize(ECharacterType.EmmaMoon);

        // const newDancer3 = await ResourceManager.I.spawnPrefab<dancer>("prefab/character/Dancer", this.dancerResultPos[2]);
        // newDancer3.initialize(ECharacterType.SongUnbee);

        // const newDancer4 = await ResourceManager.I.spawnPrefab<dancer>("prefab/character/Dancer", this.dancerResultPos[3]);
        // newDancer4.initialize(ECharacterType.SooHana);

        // await new delaySeconds().delay(1);
        // newDancer1.suitChange(ECharacterSuitType.HYBE);
        // await new delaySeconds().delay(1);
        // newDancer2.suitChange(ECharacterSuitType.HYBE);
        // await new delaySeconds().delay(1);
        // newDancer3.suitChange(ECharacterSuitType.HYBE);
        // await new delaySeconds().delay(1);
        // newDancer4.suitChange(ECharacterSuitType.HYBE);

        // await new delaySeconds().delay(1);
        // newDancer1.suitChange(ECharacterSuitType.YG);
        // await new delaySeconds().delay(1);
        // newDancer2.suitChange(ECharacterSuitType.YG);
        // await new delaySeconds().delay(1);
        // newDancer3.suitChange(ECharacterSuitType.YG);
        // await new delaySeconds().delay(1);
        // newDancer4.suitChange(ECharacterSuitType.YG);

        // await new delaySeconds().delay(1);
        // newDancer1.suitChange(ECharacterSuitType.JYP);
        // await new delaySeconds().delay(1);
        // newDancer2.suitChange(ECharacterSuitType.JYP);
        // await new delaySeconds().delay(1);
        // newDancer3.suitChange(ECharacterSuitType.JYP);
        // await new delaySeconds().delay(1);
        // newDancer4.suitChange(ECharacterSuitType.JYP);

        // await new delaySeconds().delay(1);
        // newDancer1.suitChange(ECharacterSuitType.SM);
        // await new delaySeconds().delay(1);
        // newDancer2.suitChange(ECharacterSuitType.SM);
        // await new delaySeconds().delay(1);
        // newDancer3.suitChange(ECharacterSuitType.SM);
        // await new delaySeconds().delay(1);
        // newDancer4.suitChange(ECharacterSuitType.SM);
    }
}
