import { _decorator, Component, Sprite, tween, Vec3, isValid } from 'cc';
import { ECharacterSuitType, ECharacterType } from '../GameDefine';
import { getDancerSuitSpriteFrame } from '../Utility/getDancerSuitSpriteFrame';
const { ccclass, property } = _decorator;

@ccclass('RollingSuit')
export class RollingSuit extends Component {
    @property(Sprite)
    private suitSprite: Sprite = null;
    public suitType: ECharacterSuitType = ECharacterSuitType.HYBE;
    public dancerType: ECharacterType = ECharacterType.DoArin;
    private moveSpeed: number = 0;
    public isScoreEnabled: boolean = true;

    public async Initialize(dancerType: ECharacterType, suitType: ECharacterSuitType, correctDancerType: ECharacterType, moveSpeed: number) {
        this.suitType = suitType;
        this.dancerType = dancerType;
        const frame = await new getDancerSuitSpriteFrame().getAsync(dancerType, suitType, false);
        if (!isValid(this, true)) return;
        this.suitSprite.spriteFrame = frame;
        this.moveSpeed = moveSpeed;
        this.isScoreEnabled = true;
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
