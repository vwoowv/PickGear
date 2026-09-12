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
    public async initialize(egg: EggType, endLine: Node, currentTime: number, totalDuration: number, gameMode: EGameMode, extensions: gameManagerExtensions, level: number): Promise<void> {
        const session = extensions.gameManager.sessionId;
        const frame = await extensions.loadSprite(egg, level);
        if (!await extensions.gameManager.waitUntilRunning(session)) return;
        this.eggImage.spriteFrame = frame;
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
        if (!this.extensions || this.extensions.gameManager.isPaused) return;
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

    public onEggCatch(currentScore: number) {
        if (currentScore < 0) {
            this.extensions.playSound.playOneShot(this.extensions.penaltySound);
        }
        else if (this.currentType == EggType.Happy) {
            this.extensions.playSound.playOneShot(this.extensions.eggCatchSound[1]);
        }
        else {
            this.extensions.playSound.playOneShot(this.extensions.eggCatchSound[0]);
        }
        this.extensions.showEggEffect(this.node.position.clone()).catch(error => {
            console.error("[egg] effect/box/boxHit2D load failed:", error);
        });
        this.extensions.spawnEggScore(this.node.position.clone(), currentScore).catch(error => {
            console.error("[egg] prefab/EggScore load failed:", error);
        });
    }

    private fallDown(deltaTime: number) {
        this.node.setPosition(this.node.position.x, this.node.position.y - this.fallDownSpeed * deltaTime, this.node.position.z);
        if (this.endLine === null) {
            return;
        }
        if (this.node.position.y < this.endLine.position.y) {
            this.extensions.spawnEggScore(this.node.position.clone(), 0).catch(error => {
                console.error("[egg] prefab/EggScore load failed:", error);
            });
            this.node.parent.removeChild(this.node);
            this.node.destroy();
            // 0보다 클 경우에만 콤보가 리셋된다
            const level = this.extensions.gameManager.gameMode.getCurrentLevelFromVersion();
            if (this.getCurrentScore(level) > 0) {
                // 잡아야 할(양수 점수) 달걀을 놓치면 perfect 실패
                this.extensions.gameManager.markNotPerfect("missed_positive_egg");
                this.extensions.resetComboScore();
                this.extensions.playSound.playOneShot(this.extensions.missSound);
            }
        }
    }

    public getCurrentScore(level: number) {
        const prop = gameProperty.I;
        const levelScores = this.getLevelScores(prop);

        return levelScores[this.currentType]?.[level] ?? 0;
    }

    private getLevelScores(prop: gameProperty): Record<EggType, Record<number, number>> {
        return {
            [EggType.DoArin]: {
                1: prop.level1DoArin_Score,
                2: prop.level2DoArin_Score,
                3: prop.level3DoArin_Score,
            },
            [EggType.EmmaMoon]: {
                1: prop.level1EmmaMoon_Score,
                2: prop.level2EmmaMoon_Score,
                3: prop.level3EmmaMoon_Score,
            },
            [EggType.Happy]: {
                1: prop.level1Happy_Score,
                2: prop.level2Happy_Score,
                3: prop.level3Happy_Score,
            },
            [EggType.Howsam]: {
                1: prop.level1Howsam_Score,
                2: prop.level2Howsam_Score,
                3: prop.level3Howsam_Score,
            },
            [EggType.Hoyang]: {
                1: prop.level1Hoyang_Score,
                2: prop.level2Hoyang_Score,
                3: prop.level3Hoyang_Score,
            },
            [EggType.SongUnbee]: {
                1: prop.level1SongUnbee_Score,
                2: prop.level2SongUnbee_Score,
                3: prop.level3SongUnbee_Score,
            },
            [EggType.SooHana]: {
                1: prop.level1SooHana_Score,
                2: prop.level2SooHana_Score,
                3: prop.level3SooHana_Score,
            },
            [EggType.TotalCount]: {
                1: 0,
                2: 0,
                3: 0,
            },
        };
    }
}