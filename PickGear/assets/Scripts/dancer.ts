import { _decorator, Component, Node, Sprite, SpriteFrame } from 'cc';
import { ECharacterSuitType, ECharacterType } from './GameDefine';
import { dancerSprite } from './dancerResource';
import { ResourceManager } from './ResourceManager';
import { getDancerSuit } from './getDancerSuit';
const { ccclass, property } = _decorator;

@ccclass('dancer')
export class dancer extends Component {
    @property(Sprite)
    private characterSprite: Sprite = null;
    @property(Sprite)
    private currentSuit: Sprite = null;
    private dancerType: ECharacterType;

    update(deltaTime: number) {

    }

    public async initialize(dancerType: ECharacterType) {
        this.dancerType = dancerType;
        const resourcePath = new dancerSprite(this.dancerType).resourcePath;
        this.characterSprite.spriteFrame = await ResourceManager.I.loadResource(resourcePath, SpriteFrame);
    }

    public async suitChange(suitType: ECharacterSuitType) {
        const resourcePath = new getDancerSuit(this.dancerType).getSuitResourcePath(suitType);
        this.currentSuit.spriteFrame = await ResourceManager.I.loadResource(resourcePath, SpriteFrame);
    }
}
