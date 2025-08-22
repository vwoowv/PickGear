import { _decorator, AudioSource, Component, Node, random, Sprite, SpriteFrame } from 'cc';
import { EggType } from './gameDefine';
import { ResourceManager } from './ResourceManager';
import { eggScore } from './eggScore';
import { Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('egg')
export class egg extends Component {
    @property(Sprite)
    private eggImage: Sprite = null;
    private isRotating: boolean = false;
    private endLine: Node = null;
    public currentType: EggType = EggType.DoArin;

    public async initialize(egg: EggType, endLine: Node) {
        this.eggImage.spriteFrame = await eggResource.loadSprite(egg);
        this.isRotating = Math.random() < 0.5;
        this.endLine = endLine;
        this.currentType = egg;
    }

    update(deltaTime: number) {
        this.fallDown(deltaTime);
        if (this.isRotating) {
            this.node.angle += 180 * deltaTime;
        }
    }

    private fallDown(deltaTime: number) {
        this.node.setPosition(this.node.position.x, this.node.position.y - 500 * deltaTime, this.node.position.z);
        if (this.endLine === null) {
            return;
        }
        if (this.node.position.y < this.endLine.position.y) {
            eggResource.spawnEggScore(this.node.parent.parent, this.node.position.clone(), 0);
            this.node.destroy();
        }
    }
}

export class eggResource {
    public static async loadSprite(egg: EggType): Promise<SpriteFrame> {
        return ResourceManager.I.loadResource(`textures/character/${EggType[egg]}/spriteFrame`, SpriteFrame);
    }

    public static async spawnEggScore(parent: Node, position: Vec3, score: number): Promise<eggScore> {
        const newEggScore = await ResourceManager.I.spawnPrefab<eggScore>("prefab/EggScore", parent);
        newEggScore.node.setPosition(position);
        newEggScore.setScore(score);
        return newEggScore;
    }
}