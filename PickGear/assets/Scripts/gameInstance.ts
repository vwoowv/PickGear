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

    start() {

    }

    update(deltaTime: number) {

    }

    public async onStartButtonClick() {
        // 캐릭터의 기본적인 구성을 먼저 맞춰놓는다
        console.log("onStartButtonClick");
        const newDancer = await ResourceManager.I.spawnPrefab<dancer>("prefab/character/Dancer", this.dancerPos);
        newDancer.initialize(ECharacterType.EmmaMoon);
    }
}
