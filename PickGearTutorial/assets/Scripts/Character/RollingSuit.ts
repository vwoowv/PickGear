import { _decorator, Component, Sprite, SpriteAtlas, SpriteFrame, tween, Vec3 } from 'cc';
import { ECharacterSuitType, ECharacterType } from '../GameDefine';
import { getDancerSuitSpriteFrame } from '../Utility/getDancerSuitSpriteFrame';
import { ResourceManager } from '../ResourceManager';
const { ccclass, property } = _decorator;

@ccclass('RollingSuit')
export class RollingSuit extends Component {
    @property(Sprite)
    private suitSprite: Sprite = null;
    public suitType: ECharacterSuitType = ECharacterSuitType.HYBE;
    public dancerType: ECharacterType = ECharacterType.DoArin;
    private moveSpeed: number = 0;

    public async Initialize(dancerType: ECharacterType, suitType: ECharacterSuitType, moveSpeed: number) {
        this.suitType = suitType;
        this.dancerType = dancerType;
        this.suitSprite.spriteFrame = await new getDancerSuitSpriteFrame().getAsync(dancerType, suitType);
        this.moveSpeed = moveSpeed;
    }

    public prevPosition: Vec3 = new Vec3(0, 0, 0);
    public currentPosition: Vec3 = new Vec3(0, 0, 0);
    public roll(deltaTime: number, pickDistance: number, pickedCharacterType: ECharacterType): boolean {
        this.prevPosition = this.node.position.clone();
        this.node.setPosition(this.node.position.x - deltaTime * (600 + this.moveSpeed), this.node.position.y, this.node.position.z);
        this.currentPosition = this.node.position.clone();
        if (pickedCharacterType !== this.dancerType) {
            return true;
        }

        // 실패 조건
        if (Math.abs(this.currentPosition.x) > pickDistance && this.prevPosition.x < 0) {
            return false;
        }

        return true;
    }

    public pickSuit() {
        // 살짝 커지게
        const scale = this.node.scale;
        tween(this.node)
            .to(0.05, { scale: new Vec3(scale.x * 1.1, scale.y * 1.1, scale.z * 1.1) })
            .to(0.05, { scale: new Vec3(scale.x, scale.y, scale.z) })
            .start();
    }
}
