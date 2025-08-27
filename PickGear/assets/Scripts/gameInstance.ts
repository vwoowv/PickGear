import { _decorator, Component, Node } from 'cc';
import { EGameType } from './GameDefine';
import { gameNodeCollection } from './gameNodeCollection';
import { gamePlaying } from './gamePlaying';
import { EGameRootModeState } from './GameMode/gameModeStateEvent';
import { gameModeManager } from './GameMode/gameModeManager';
const { ccclass, property } = _decorator;

@ccclass('gameInstance')
export class gameInstance extends Component {
    @property(gameNodeCollection)
    public nodeCollection: gameNodeCollection = null;
    @property(gamePlaying)
    public playing: gamePlaying = null;
    @property(Node)
    public gameBackground: Node = null;
    @property(Node)
    public uiNode: Node = null;

    @property(Node)
    private dancerPos: Node = null;
    @property(Node)
    private dancerResultPos: Node[] = [];
    public gameMode: EGameRootModeState = EGameRootModeState.SelectType;
    public gameType: EGameType = EGameType.YG;
    start() {
        gameModeManager.I.initialize(this.uiNode, this.node);
        gameModeManager.I.rootSelectGameType();
    }

    update(deltaTime: number) {

    }

    public startGame(gameType: EGameType) {
        this.gameType = gameType;
        gameModeManager.I.rootPlayGame();
        this.playing.startNewGame(this);
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
