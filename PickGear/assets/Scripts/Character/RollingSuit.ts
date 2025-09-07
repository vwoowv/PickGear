import { _decorator, Component, Sprite, SpriteFrame } from 'cc';
import { ECharacterSuitType, ECharacterType } from '../GameDefine';
import { getDancerSuitSpriteFrame } from '../Utility/getDancerSuitSpriteFrame';
const { ccclass, property } = _decorator;

@ccclass('RollingSuit')
export class RollingSuit extends Component {
    @property(Sprite)
    private suitSprite: Sprite = null;
    public suitType: ECharacterSuitType = ECharacterSuitType.HYBE;

    public async Initialize(dancerType: ECharacterType, suitType: ECharacterSuitType) {
        this.suitType = suitType;
        this.suitSprite.spriteFrame = await new getDancerSuitSpriteFrame().getAsync(dancerType, suitType);
    }

    public roll(deltaTime: number) {
        this.node.setPosition(this.node.position.x - deltaTime * 700, this.node.position.y, this.node.position.z);
    }
}
