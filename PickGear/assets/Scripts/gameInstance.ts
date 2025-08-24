import { _decorator, Component, Node } from 'cc';
import { ECharacterType } from './GameDefine';
import { dancerSprite } from './dancerResource';
import { ResourceManager } from './ResourceManager';
import { dancer } from './dancer';
const { ccclass, property } = _decorator;

@ccclass('gameInstance')
export class gameInstance extends Component {
    @property(Node)
    private dancerPos: Node = null;
    @property(Node)
    private dancerResultPos: Node[] = [];

    start() {

    }

    update(deltaTime: number) {

    }

    public async onStartButtonClick() {
        // 캐릭터의 기본적인 구성을 먼저 맞춰놓는다
        console.log("onStartButtonClick");
        const newDancer1 = await ResourceManager.I.spawnPrefab<dancer>("prefab/character/Dancer", this.dancerResultPos[0]);
        newDancer1.initialize(ECharacterType.DoArin);

        const newDancer2 = await ResourceManager.I.spawnPrefab<dancer>("prefab/character/Dancer", this.dancerResultPos[1]);
        newDancer2.initialize(ECharacterType.EmmaMoon);

        const newDancer3 = await ResourceManager.I.spawnPrefab<dancer>("prefab/character/Dancer", this.dancerResultPos[2]);
        newDancer3.initialize(ECharacterType.SongUnbee);

        const newDancer4 = await ResourceManager.I.spawnPrefab<dancer>("prefab/character/Dancer", this.dancerResultPos[3]);
        newDancer4.initialize(ECharacterType.SooHana);
    }
}
