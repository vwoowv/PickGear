import { _decorator, Component, isValid, Node, Sprite, tween, Tween, Vec3 } from 'cc';
import { gameManager } from './gameManager';
const { ccclass, property } = _decorator;

@ccclass('basket')
export class basket extends Component {
    @property(Sprite)
    private readonly basketSprite: Sprite = null;
    @property(Sprite)
    private readonly redBasketSprite: Sprite = null;

    private baseScale: Vec3 = new Vec3(1, 1, 1);
    private pulseTween: Tween<Node> | null = null;

    private flashTimeLeft: number = 0;

    public update(deltaTime: number): void {
        if (gameManager.I?.isPaused || this.flashTimeLeft <= 0) return;
        this.flashTimeLeft -= deltaTime;
        if (this.flashTimeLeft <= 0) this.restoreToNormal();
    }

    private readonly restoreToNormal = () => {
        if (!isValid(this.node, true)) {
            return;
        }
        this.stopPulse();
        this.node.setScale(this.baseScale);
        this.setNormal();
    };

    protected onLoad(): void {
        // 원래 스케일 저장(강조 연출 종료 시 원복 기준)
        this.baseScale = this.node.scale.clone();
    }

    public initialize() {
        this.flashTimeLeft = 0;
        this.stopPulse();
        this.node.setScale(this.baseScale);
        this.setNormal();
    }

    public flashRed(durationSeconds: number = 1) {
        if (!isValid(this.node, true)) {
            return;
        }
        this.setRed();
        this.startPulse();
        this.flashTimeLeft = Math.max(0, durationSeconds);
        if (this.flashTimeLeft === 0) this.restoreToNormal();
    }

    private startPulse() {
        this.stopPulse();
        this.node.setScale(this.baseScale);

        const upScale = new Vec3(this.baseScale.x * 1.08, this.baseScale.y * 1.08, this.baseScale.z);
        // 살짝 커졌다가 돌아오는 펄스를 반복해서 "잘못 받음"을 강조
        this.pulseTween = tween(this.node)
            .repeatForever(
                tween()
                    .to(0.08, { scale: upScale }, { easing: 'sineOut' })
                    .to(0.08, { scale: this.baseScale }, { easing: 'sineIn' })
            )
            .start();
    }

    private stopPulse() {
        if (this.pulseTween) {
            this.pulseTween.stop();
            this.pulseTween = null;
        }
    }

    private setNormal() {
        if (this.basketSprite) {
            this.basketSprite.node.active = true;
        }
        if (this.redBasketSprite) {
            this.redBasketSprite.node.active = false;
        }
    }

    private setRed() {
        if (this.basketSprite) {
            this.basketSprite.node.active = false;
        }
        if (this.redBasketSprite) {
            this.redBasketSprite.node.active = true;
        }
    }
}
