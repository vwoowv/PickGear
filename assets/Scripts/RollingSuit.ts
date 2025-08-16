import { _decorator, Component, Node, Sprite, SpriteFrame } from 'cc';
import { ECharacterSuitType } from './GameDefine';
const { ccclass, property } = _decorator;

@ccclass('RollingSuit')
export class RollingSuit extends Component {
    @property(Sprite)
    private suitSprite: Sprite = null;
    private suitType: ECharacterSuitType = ECharacterSuitType.HYBE;
    
    public Initialize(suitSprite: SpriteFrame, suitType: ECharacterSuitType) {
        this.suitSprite.spriteFrame = suitSprite;
        this.suitType = suitType;
    }

    public roll(deltaTime: number) {
        this.node.setPosition(this.node.position.x - deltaTime * 1000, this.node.position.y, this.node.position.z);
    }
}
