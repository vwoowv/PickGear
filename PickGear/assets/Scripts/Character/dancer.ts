import { _decorator, Component, Sprite, SpriteFrame } from 'cc';
import { ECharacterSuitType, ECharacterType } from '../GameDefine';
import { dancerSprite, nameTagSprite } from './dancerResource';
import { ResourceManager } from '../ResourceManager';
import { getDancerSuitSpriteFrame } from '../Utility/getDancerSuitSpriteFrame';
const { ccclass, property } = _decorator;

@ccclass('dancer')
export class dancer extends Component {
    @property(Sprite)
    private characterSprite: Sprite = null;
    @property(Sprite)
    private currentSuit: Sprite = null;
    @property(Sprite)
    private nameTag: Sprite = null;
    public dancerType: ECharacterType;

    public async initialize(dancerType: ECharacterType) {
        this.dancerType = dancerType;
        const resourcePath = new dancerSprite(this.dancerType).resourcePath;
        this.characterSprite.spriteFrame = await ResourceManager.I.loadResource(resourcePath, SpriteFrame);
        this.nameTag.spriteFrame = await ResourceManager.I.loadResource(new nameTagSprite(this.dancerType).resourcePath, SpriteFrame);
    }

    public showNameTag(isShow: boolean) {
        this.nameTag.node.active = isShow;
    }

    public async suitChange(suitType: ECharacterSuitType) {
        this.currentSuit.spriteFrame = await new getDancerSuitSpriteFrame().getAsync(this.dancerType, suitType, true);
    }

    public takeOffSuit() {
        this.currentSuit.spriteFrame = null;
    }
}
