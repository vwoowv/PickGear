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
        const newEggScore = await ResourceManager.I.spawnPrefab<eggScore>("prefab/EggScore", this._gameManager.eggScoreParent);
        newEggScore.node.setPosition(position);
        newEggScore.setScore(score);
        return newEggScore;
    }

    public async showEggEffect(eggPosition: Vec3) {
        const hitEffect = await ResourceManager.I.loadResource<Prefab>("effect/box/boxHit2D", Prefab);
        const hitEffectNode = instantiate(hitEffect);
        const hitEffectPosition = new Vec3(eggPosition.x, eggPosition.y - 100, eggPosition.z);
        hitEffectNode.setPosition(hitEffectPosition);
        hitEffectNode.setScale(100, 100, 100);
        this._gameManager.playingNode.addChild(hitEffectNode);
    }

    private prevRandomX: number = -1;
    public async spawnRandomEgg(currentTime: number, totalDuration: number, gameMode: EGameMode): Promise<number> {
        const newEgg = await ResourceManager.I.spawnPrefab<egg>("prefab/Egg", this.eggParent);
        const randomEgg = Math.floor(Math.random() * EggType.TotalCount);
        const level = this._gameManager.gameMode.getCurrentLevelFromVersion();
        newEgg.initialize(randomEgg, this.eggEndLine, currentTime, totalDuration, gameMode, this, level);
        let xPosition = Math.random() * (this.eggSpawnPoint_Right.position.x - this.eggSpawnPoint_Left.position.x) + this.eggSpawnPoint_Left.position.x;
        if (this.prevRandomX == -1) {
            this.prevRandomX = xPosition;
        }
        else {
            let xLength = Math.abs(this.prevRandomX - xPosition);
            while (xLength < 300) {
                xPosition = Math.random() * (this.eggSpawnPoint_Right.position.x - this.eggSpawnPoint_Left.position.x) + this.eggSpawnPoint_Left.position.x;
                xLength = Math.abs(this.prevRandomX - xPosition);
            }
            this.prevRandomX = xPosition;
        }
        const eggPosition = new Vec3(xPosition, this.eggSpawnPoint_Right.position.y, this.eggSpawnPoint_Right.position.z);
        newEgg.node.setPosition(eggPosition);
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