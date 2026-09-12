import { _decorator, Component, Sprite, SpriteFrame, isValid } from 'cc';
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
        const character = await ResourceManager.I.loadResource<SpriteFrame>(resourcePath, SpriteFrame);
        if (!isValid(this, true)) return;
        this.characterSprite.spriteFrame = character;
        const name = await ResourceManager.I.loadResource<SpriteFrame>(new nameTagSprite(this.dancerType).resourcePath, SpriteFrame);
        if (isValid(this, true)) this.nameTag.spriteFrame = name;
    }

    public showNameTag(isShow: boolean) {
        this.nameTag.node.active = isShow;
    }

    public async suitChange(suitType: ECharacterSuitType) {
        const frame = await new getDancerSuitSpriteFrame().getAsync(this.dancerType, suitType, true);
        if (isValid(this, true)) this.currentSuit.spriteFrame = frame;
    }

    public takeOffSuit() {
        this.currentSuit.spriteFrame = null;
    }
}
