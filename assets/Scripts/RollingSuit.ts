import { _decorator, Component, Node, Sprite, SpriteFrame } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('RollingSuit')
export class RollingSuit extends Component {
    @property(Sprite)
    private suitSprite: Sprite = null;

    public Initialize(suitSprite: SpriteFrame) {
        this.suitSprite.spriteFrame = suitSprite;
    }

    public roll(deltaTime: number) {
        this.node.setPosition(this.node.position.x - deltaTime, this.node.position.y, this.node.position.z);
    }
}
