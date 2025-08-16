import { _decorator, Component, Node, Sprite, SpriteFrame } from 'cc';
import { EggType } from './gameDefine';
import { ResourceManager } from './ResourceManager';
const { ccclass, property } = _decorator;

@ccclass('egg')
export class egg extends Component {
    @property(Sprite)
    private eggImage: Sprite = null;

    public async initialize(egg: EggType) {
        this.eggImage.spriteFrame = await eggResource.loadSprite(egg);
    }

    update(deltaTime: number) {

    }
}

export class eggResource {
    public static async loadSprite(egg: EggType): Promise<SpriteFrame> {
        return ResourceManager.I.loadResource(`textures/character/${EggType[egg]}/spriteFrame`, SpriteFrame);
   }
}