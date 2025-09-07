import { _decorator, Component, Sprite, SpriteFrame } from 'cc';
import { ECharacterSuitType, ECharacterType } from '../GameDefine';
import { dancerSprite } from './dancerResource';
import { ResourceManager } from '../ResourceManager';
import { getDancerSuit } from './getDancerSuit';
import { getDancerSuitSpriteFrame } from '../Utility/getDancerSuitSpriteFrame';
const { ccclass, property } = _decorator;

@ccclass('dancer')
export class dancer extends Component {
    @property(Sprite)
    private characterSprite: Sprite = null;
    @property(Sprite)
    private currentSuit: Sprite = null;
    public dancerType: ECharacterType;

    update(deltaTime: number) {

    }

    public async initialize(dancerType: ECharacterType) {
        this.dancerType = dancerType;
        const resourcePath = new dancerSprite(this.dancerType).resourcePath;
        this.characterSprite.spriteFrame = await ResourceManager.I.loadResource(resourcePath, SpriteFrame);
    }

    public async suitChange(suitType: ECharacterSuitType) {
        this.currentSuit.spriteFrame = await new getDancerSuitSpriteFrame().getAsync(this.dancerType, suitType);
    }

    public takeOffSuit() {
        this.currentSuit.spriteFrame = null;
    }
}
