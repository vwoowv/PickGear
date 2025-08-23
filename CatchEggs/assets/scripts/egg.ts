import { _decorator, AudioSource, Component, Node, random, Sprite, SpriteFrame } from 'cc';
import { EggType } from './gameDefine';
import { ResourceManager } from './ResourceManager';
import { eggScore } from './eggScore';
import { Vec3 } from 'cc';
import { gameManagerExtensions } from './gameManagerExtensions';
const { ccclass, property } = _decorator;

@ccclass('egg')
export class egg extends Component {
    @property(Sprite)
    private eggImage: Sprite = null;
    private isRotating: boolean = false;
    private endLine: Node = null;
    private extensions: gameManagerExtensions = null;
    public currentType: EggType = EggType.DoArin;

    public async initialize(egg: EggType, endLine: Node, extensions: gameManagerExtensions) {
        this.eggImage.spriteFrame = await extensions.loadSprite(egg);
        this.isRotating = Math.random() < 0.5;
        this.endLine = endLine;
        this.currentType = egg;
        this.extensions = extensions;
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
            this.extensions.spawnEggScore(this.node.position.clone(), 0);
            this.node.destroy();
        }
    }
}