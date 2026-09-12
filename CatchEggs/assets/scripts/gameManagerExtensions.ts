import { _decorator, AudioClip, AudioSource, Component, instantiate, Node, Prefab, SpriteFrame, Vec3 } from 'cc';
import { gameManager } from './gameManager';
import { ResourceManager } from './ResourceManager';
import { egg } from './egg';
import { EGameMode, EggType } from './gameDefine';
import { eggScore } from './eggScore';
import { gameProperty } from './gameProperty';
const { ccclass, property } = _decorator;

@ccclass('gameManagerExtensions')
export class gameManagerExtensions extends Component {
    private _gameManager: gameManager = null;
    public get gameManager(): gameManager {
        return this._gameManager;
    }
    public get eggParent(): Node {
        return this._gameManager.eggParent;
    }
    public get eggEndLine(): Node {
        return this._gameManager.eggEndLine;
    }
    public get eggSpawnPoint_Right(): Node {
        return this._gameManager.eggSpawnPoint_Right;
    }
    public get eggSpawnPoint_Left(): Node {
        return this._gameManager.eggSpawnPoint_Left;
    }

    public get playSound(): AudioSource {
        return this._gameManager.playSound;
    }

    public get eggCatchSound(): AudioClip[] {
        return this._gameManager.eggCatchSound;
    }

    public get penaltySound(): AudioClip {
        return this._gameManager.penaltySound;
    }

    public get missSound(): AudioClip {
        return this._gameManager.missSound;
    }

    public async initialize(gameManager: gameManager) {
        this._gameManager = gameManager;
    }

    public async loadSprite(egg: EggType, level: number): Promise<SpriteFrame> {
        const prop = gameProperty.I;
        const imageName = this.getImageName(egg, level, prop);
        return ResourceManager.I.loadResource(`textures/character/Game/${imageName}/spriteFrame`, SpriteFrame);
    }

    private getImageName(egg: EggType, level: number, prop: gameProperty): string {
        const imageMap = this.getImageMap(prop);
        return imageMap[egg]?.[level] ?? EggType[egg];
    }

    private getImageMap(prop: gameProperty): Record<EggType, Record<number, string>> {
        return {
            [EggType.DoArin]: {
                1: prop.level1DoArin_Image,
                2: prop.level2DoArin_Image,
                3: prop.level3DoArin_Image,
            },
            [EggType.EmmaMoon]: {
                1: prop.level1EmmaMoon_Image,
                2: prop.level2EmmaMoon_Image,
                3: prop.level3EmmaMoon_Image,
            },
            [EggType.Happy]: {
                1: prop.level1Happy_Image,
                2: prop.level2Happy_Image,
                3: prop.level3Happy_Image,
            },
            [EggType.Howsam]: {
                1: prop.level1Howsam_Image,
                2: prop.level2Howsam_Image,
                3: prop.level3Howsam_Image,
            },
            [EggType.Hoyang]: {
                1: prop.level1Hoyang_Image,
                2: prop.level2Hoyang_Image,
                3: prop.level3Hoyang_Image,
            },
            [EggType.SongUnbee]: {
                1: prop.level1SongUnbee_Image,
                2: prop.level2SongUnbee_Image,
                3: prop.level3SongUnbee_Image,
            },
            [EggType.SooHana]: {
                1: prop.level1SooHana_Image,
                2: prop.level2SooHana_Image,
                3: prop.level3SooHana_Image,
            },
            [EggType.TotalCount]: {
                1: "",
                2: "",
                3: "",
            },
        };
    }

    public async spawnEggScore(position: Vec3, score: number): Promise<eggScore> {
        const session = this.gameManager.sessionId;
        const prefab = await ResourceManager.I.loadResource<Prefab>("prefab/EggScore", Prefab);
        if (!await this.gameManager.waitUntilRunning(session)) return null;
        const node = instantiate(prefab);
        this.gameManager.eggScoreParent.addChild(node);
        const newEggScore = node.getComponent(eggScore);
        node.setPosition(position);
        newEggScore.setScore(score);
        return newEggScore;
    }

    public async showEggEffect(eggPosition: Vec3): Promise<void> {
        const session = this.gameManager.sessionId;
        const hitEffect = await ResourceManager.I.loadResource<Prefab>("effect/box/boxHit2D", Prefab);
        if (!await this.gameManager.waitUntilRunning(session)) return;
        const hitEffectNode = instantiate(hitEffect);
        hitEffectNode.setPosition(eggPosition.x, eggPosition.y - 100, eggPosition.z);
        hitEffectNode.setScale(100, 100, 100);
        this.gameManager.playingNode.addChild(hitEffectNode);
    }

    private prevRandomX: number = -1;
    public resetSpawnState() {
        this.prevRandomX = -1;
    }
    public async spawnRandomEgg(currentTime: number, totalDuration: number, gameMode: EGameMode): Promise<number> {
        const session = this.gameManager.sessionId;
        const prefab = await ResourceManager.I.loadResource<Prefab>("prefab/Egg", Prefab);
        if (!await this.gameManager.waitUntilRunning(session)) return 1;
        const node = instantiate(prefab);
        node.active = false;
        this.eggParent.addChild(node);
        const newEgg = node.getComponent(egg);
        const randomEgg = Math.floor(Math.random() * EggType.TotalCount);
        const level = this._gameManager.gameMode.getCurrentLevelFromVersion();
        try {
            await newEgg.initialize(randomEgg, this.eggEndLine, currentTime, totalDuration, gameMode, this, level);
        } catch (error) {
            node.destroy();
            throw error;
        }
        if (!await this.gameManager.waitUntilRunning(session)) return 1;
        const leftX = this.eggSpawnPoint_Left.position.x;
        const rightX = this.eggSpawnPoint_Right.position.x;
        const minX = Math.min(leftX, rightX);
        const maxX = Math.max(leftX, rightX);
        const rangeX = maxX - minX;

        // 스폰 범위가 잘못 세팅되면(0 또는 매우 작음) 무한 루프/프리즈를 방지
        let xPosition = rangeX <= 0 ? minX : (Math.random() * rangeX + minX);
        if (this.prevRandomX == -1) {
            this.prevRandomX = xPosition;
        }
        else {
            // 해상도/씬에 따라 스폰 범위가 300보다 좁을 수 있음 → 최소 간격을 범위에 맞게 완화하고, 시도 횟수를 제한
            const desiredMinGap = 300;
            const minGap = rangeX <= 0 ? 0 : Math.min(desiredMinGap, rangeX * 0.8);

            let xLength = Math.abs(this.prevRandomX - xPosition);
            let attempts = 0;
            const maxAttempts = 25;
            while (xLength < minGap && attempts < maxAttempts) {
                xPosition = Math.random() * rangeX + minX;
                xLength = Math.abs(this.prevRandomX - xPosition);
                attempts += 1;
            }
            if (attempts >= maxAttempts && minGap > 0) {
                // 개발 중 원인 파악용(프리즈 방지 우선)
                console.warn(`[spawnRandomEgg] x 재시도 초과: rangeX=${rangeX.toFixed(2)}, minGap=${minGap.toFixed(2)}. 현재 값으로 진행합니다.`);
            }
            this.prevRandomX = xPosition;
        }
        const eggPosition = new Vec3(xPosition, this.eggSpawnPoint_Right.position.y, this.eggSpawnPoint_Right.position.z);
        newEgg.node.setPosition(eggPosition);
        node.active = true;
        return this.getSpawnTime(currentTime, totalDuration, gameMode);
    }

    private getSpawnTime(currentTime: number, totalDuration: number, gameMode: EGameMode): number {
        const leftTimeRate = currentTime / totalDuration;
        if (gameMode == EGameMode.Version1) {
            if (leftTimeRate < 0.3) {
                return gameProperty.I.level1SpawnTime_High;
            }
            else if (leftTimeRate < 0.7) {
                return gameProperty.I.level1SpawnTime_Middle;
            }
            else {
                return gameProperty.I.level1SpawnTime_Normal;
            }
        }
        else if (gameMode == EGameMode.Version2) {
            if (leftTimeRate < 0.3) {
                return gameProperty.I.level2SpawnTime_High;
            }
            else if (leftTimeRate < 0.7) {
                return gameProperty.I.level2SpawnTime_Middle;
            }
            else {
                return gameProperty.I.level2SpawnTime_Normal;
            }
        }
        else if (gameMode == EGameMode.Version3) {
            if (leftTimeRate < 0.3) {
                return gameProperty.I.level3SpawnTime_High;
            }
            else if (leftTimeRate < 0.7) {
                return gameProperty.I.level3SpawnTime_Middle;
            }
            else {
                return gameProperty.I.level3SpawnTime_Normal;
            }
        }
        return 1;
    }

    public resetComboScore() {
        this._gameManager.resetComboScore();
    }
}