import { _decorator, Component, instantiate, Node, Prefab, SpriteFrame, Vec3 } from 'cc';
import { gameManager } from './gameManager';
import { ResourceManager } from './ResourceManager';
import { egg } from './egg';
import { EggType } from './gameDefine';
import { eggScore } from './eggScore';
const { ccclass, property } = _decorator;

@ccclass('gameManagerExtensions')
export class gameManagerExtensions extends Component {
    private gameManager: gameManager = null;
    public get eggParent(): Node {
        return this.gameManager.eggParent;
    }
    public get eggEndLine(): Node {
        return this.gameManager.eggEndLine;
    }
    public get eggSpawnPoint_Right(): Node {
        return this.gameManager.eggSpawnPoint_Right;
    }
    public get eggSpawnPoint_Left(): Node {
        return this.gameManager.eggSpawnPoint_Left;
    }

    public async initialize(gameManager: gameManager) {
        this.gameManager = gameManager;
    }

    public async loadSprite(egg: EggType): Promise<SpriteFrame> {
        return ResourceManager.I.loadResource(`textures/character/${EggType[egg]}/spriteFrame`, SpriteFrame);
    }

    public async spawnEggScore(position: Vec3, score: number): Promise<eggScore> {
        const newEggScore = await ResourceManager.I.spawnPrefab<eggScore>("prefab/EggScore", this.gameManager.eggScoreParent);
        newEggScore.node.setPosition(position);
        newEggScore.setScore(score);
        return newEggScore;
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
        const newEgg = await ResourceManager.I.spawnPrefab<egg>("prefab/Egg", this.eggParent);
        const randomEgg = Math.floor(Math.random() * EggType.TotalCount);
        newEgg.initialize(randomEgg, this.eggEndLine, this);
        const xPosition = Math.random() * (this.eggSpawnPoint_Right.position.x - this.eggSpawnPoint_Left.position.x) + this.eggSpawnPoint_Left.position.x;
        const eggPosition = new Vec3(xPosition, this.eggSpawnPoint_Right.position.y, this.eggSpawnPoint_Right.position.z);
        newEgg.node.setPosition(eggPosition);
    }
}