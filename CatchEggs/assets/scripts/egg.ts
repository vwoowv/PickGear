import { _decorator, AudioSource, Component, Node, random, Sprite, SpriteFrame } from 'cc';
import { EGameMode, EggType } from './gameDefine';
import { gameManagerExtensions } from './gameManagerExtensions';
import { gameProperty } from './gameProperty';
const { ccclass, property } = _decorator;

@ccclass('egg')
export class egg extends Component {
    @property(Sprite)
    private eggImage: Sprite = null;
    private endLine: Node = null;
    private extensions: gameManagerExtensions = null;
    public currentType: EggType = EggType.DoArin;
    private defaultFallDownSpeed: number = 500;
    private fallDownSpeed: number = this.defaultFallDownSpeed;

    public async initialize(egg: EggType, endLine: Node, currentTime: number, totalDuration: number, gameMode: EGameMode, extensions: gameManagerExtensions) {
        this.eggImage.spriteFrame = await extensions.loadSprite(egg);
        this.endLine = endLine;
        this.currentType = egg;
        this.extensions = extensions;

        this.setupFallDownSpeed(currentTime, totalDuration, gameMode);
    }

    private setupFallDownSpeed(currentTime: number, totalDuration: number, gameMode: EGameMode) {
        this.fallDownSpeed = this.defaultFallDownSpeed;
        const leftTimeRate = currentTime / totalDuration;
        if (gameMode == EGameMode.Version1) {
            this.fallDownSpeed = this.defaultFallDownSpeed * gameProperty.I.level1FallDownSpeedRate_Normal;
            if (leftTimeRate < 0.5) {
                this.fallDownSpeed = this.defaultFallDownSpeed * gameProperty.I.level1FallDownSpeedRate_High;
            }
        }
        else if (gameMode == EGameMode.Version2) {
            this.fallDownSpeed = this.defaultFallDownSpeed * gameProperty.I.level2FallDownSpeedRate_Normal;
            if (leftTimeRate < 0.5) {
                this.fallDownSpeed = this.defaultFallDownSpeed * gameProperty.I.level2FallDownSpeedRate_High;
            }
        }
        else if (gameMode == EGameMode.Version3) {
            this.fallDownSpeed = this.defaultFallDownSpeed * gameProperty.I.level3FallDownSpeedRate_Normal;
            if (leftTimeRate < 0.5) {
                this.fallDownSpeed = this.defaultFallDownSpeed * gameProperty.I.level3FallDownSpeedRate_High;
            }
        }
    }

    update(deltaTime: number) {
        this.fallDown(deltaTime);
        if (this.currentType == EggType.Happy) {
            this.node.angle += 180 * deltaTime;
        }
        else if (this.currentType == EggType.EmmaMoon) {
            const currentPosition = this.node.position.clone();
            const sinValue = Math.sin(currentPosition.y * 0.05) * 10;
            this.node.setPosition(
                sinValue,
                currentPosition.y,
                currentPosition.z
            );
        }
    }

    public onEggCatch() {
        if (this.currentType == EggType.Happy) {
            this.extensions.playSound.playOneShot(this.extensions.eggCatchSound[1]);
        }
        else {
            this.extensions.playSound.playOneShot(this.extensions.eggCatchSound[0]);
        }
        this.extensions.showEggEffect(this.node.position.clone());
        this.extensions.spawnEggScore(this.node.position.clone(), 1);
    }

    private fallDown(deltaTime: number) {
        this.node.setPosition(this.node.position.x, this.node.position.y - this.fallDownSpeed * deltaTime, this.node.position.z);
        if (this.endLine === null) {
            return;
        }
        if (this.node.position.y < this.endLine.position.y) {
            this.extensions.spawnEggScore(this.node.position.clone(), 0);
            this.node.destroy();
        }
    }
}