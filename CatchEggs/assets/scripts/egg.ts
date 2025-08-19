import { _decorator, AudioSource, Component, Node, random, Sprite, SpriteFrame } from 'cc';
import { EggType } from './gameDefine';
import { ResourceManager } from './ResourceManager';
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
        if (this.endLine === null)
        {
            return;
        }
        if (this.node.position.y < this.endLine.position.y) {
            this.node.destroy();
        }
    }
}

export class eggResource {
    public static async loadSprite(egg: EggType): Promise<SpriteFrame> {
        return ResourceManager.I.loadResource(`textures/character/${EggType[egg]}/spriteFrame`, SpriteFrame);
   }
}