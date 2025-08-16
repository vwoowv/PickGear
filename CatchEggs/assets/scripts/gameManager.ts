import { _decorator, Component, instantiate, Node, Prefab, Vec3 } from 'cc';
import { ResourceManager } from './ResourceManager';
import { egg } from './egg';
import { EggType, GameState } from './gameDefine';
const { ccclass, property } = _decorator;

@ccclass('gameManager')
export class gameManager extends Component {
    @property(Node)
    private eggParent: Node = null;
    @property(Node)
    private eggSpawnPoint_Left: Node = null;
    @property(Node)
    private eggSpawnPoint_Right: Node = null;
    private gameState: GameState = GameState.None;
    async start() {
        this.startNewGame();
    }

    update(deltaTime: number) {
        if (this.gameState == GameState.None) {
            return;
        }
        else if (this.gameState == GameState.Playing) {
            this.updatePlaying(deltaTime);
        }
    }

    private startNewGame() {
        this.gameState = GameState.Playing;
    }

    private leftTimeToSpawnEgg: number = 0;
    private async updatePlaying(deltaTime: number) {
        if (this.gameState != GameState.Playing) {
            return;
        }
        this.leftTimeToSpawnEgg -= deltaTime;
        if (this.leftTimeToSpawnEgg <= 0) {
            this.spawnRandomEgg();
            this.leftTimeToSpawnEgg = 1;
        }
    }

    private async spawnRandomEgg() {
        const eggPrefab = await ResourceManager.I.loadResource<Prefab>("prefab/Egg", Prefab);
        const eggNode = instantiate(eggPrefab);
        const newEgg = eggNode.getComponent(egg);
        const randomEgg = Math.floor(Math.random() * EggType.TotalCount);
        newEgg.initialize(randomEgg);
        this.eggParent.addChild(eggNode);
        const xPosition = Math.random() * (this.eggSpawnPoint_Right.position.x - this.eggSpawnPoint_Left.position.x) + this.eggSpawnPoint_Left.position.x;
        const eggPosition = new Vec3(xPosition, this.eggSpawnPoint_Right.position.y, this.eggSpawnPoint_Right.position.z);
        eggNode.setPosition(eggPosition);
    }
}
