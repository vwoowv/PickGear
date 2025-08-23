import { _decorator, Component, instantiate, Prefab, Vec3 } from 'cc';
import { gameManager } from './gameManager';
import { ResourceManager } from './ResourceManager';
import { egg } from './egg';
import { EggType } from './gameDefine';
const { ccclass, property } = _decorator;

@ccclass('gameManagerExtensions')
export class gameManagerExtensions extends Component {
    private gameManager: gameManager = null;

    public async initialize(gameManager: gameManager) {
        this.gameManager = gameManager;
    }

    public async showEggEffect(eggPosition: Vec3) {
        const hitEffect = await ResourceManager.I.loadResource<Prefab>("effect/box/boxHit2D", Prefab);
        const hitEffectNode = instantiate(hitEffect);
        const hitEffectPosition = new Vec3(eggPosition.x, eggPosition.y - 100, eggPosition.z);
        hitEffectNode.setPosition(hitEffectPosition);
        hitEffectNode.setScale(100, 100, 100);
        this.gameManager.playingNode.addChild(hitEffectNode);
    }

    public async spawnRandomEgg() {
        const newEgg = await ResourceManager.I.spawnPrefab<egg>("prefab/Egg", this.gameManager.eggParent);
        const randomEgg = Math.floor(Math.random() * EggType.TotalCount);
        newEgg.initialize(randomEgg, this.gameManager.eggEndLine);
        const xPosition = Math.random() * (this.gameManager.eggSpawnPoint_Right.position.x - this.gameManager.eggSpawnPoint_Left.position.x) + this.gameManager.eggSpawnPoint_Left.position.x;
        const eggPosition = new Vec3(xPosition, this.gameManager.eggSpawnPoint_Right.position.y, this.gameManager.eggSpawnPoint_Right.position.z);
        newEgg.node.setPosition(eggPosition);
    }
}