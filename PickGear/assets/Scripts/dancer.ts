import { _decorator, Component, Node, Sprite, SpriteFrame } from 'cc';
import { ECharacterType } from './GameDefine';
import { dancerSprite } from './dancerResource';
import { ResourceManager } from './ResourceManager';
const { ccclass, property } = _decorator;

@ccclass('dancer')
export class dancer extends Component {
    @property(Sprite)
    private characterSprite: Sprite = null;
    @property(Sprite)
    private currentShit: Sprite = null;

    public async initialize(dancerType: ECharacterType) {
        const resourcePath = new dancerSprite(dancerType).resourcePath;
        this.characterSprite.spriteFrame = await ResourceManager.I.loadResource(resourcePath, SpriteFrame);
    }

    update(deltaTime: number) {

    }
}
