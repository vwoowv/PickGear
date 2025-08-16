import { _decorator, Component, instantiate, Node, Prefab } from 'cc';
import { ResourceManager } from './ResourceManager';
import { egg } from './egg';
import { EggType } from './gameDefine';
const { ccclass, property } = _decorator;

@ccclass('gameManager')
export class gameManager extends Component {
    @property(Node)
    private eggParent: Node = null;
    async start() {
        const eggPrefab = await ResourceManager.I.loadResource<Prefab>("prefab/Egg", Prefab);
        const eggNode = instantiate(eggPrefab);
        const newEgg = eggNode.getComponent(egg);
        newEgg.initialize(EggType.EmmaMoon);
        this.eggParent.addChild(eggNode);
    }

    update(deltaTime: number) {
        
    }
}

