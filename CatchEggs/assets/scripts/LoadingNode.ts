import { _decorator, AudioClip, Component, director, JsonAsset, Prefab, ProgressBar, SpriteFrame } from 'cc';
import { ResourceManager } from './ResourceManager';
import { EggType } from './gameDefine';
import { gameProperty } from './gameProperty';
const { ccclass, property } = _decorator;

@ccclass('LoadingNode')
export class LoadingNode extends Component {
    @property({ tooltip: "프리로드(캐싱) 완료 후 로딩 노드를 자동으로 숨깁니다." })
    public autoHideOnComplete: boolean = true;

    @property({ tooltip: "캐릭터(게임/오프닝) 스프라이트까지 미리 캐싱합니다." })
    public preloadCharacterSprites: boolean = true;

    @property(ProgressBar)
    private readonly progressBar: ProgressBar = null;
    private _started: boolean = false;

    public start(): void {
        if (this._started) {
            return;
        }
        this._started = true;

        void this.run();
    }

    private async run(): Promise<void> {
        await this.preCacheResources();

        if (this.autoHideOnComplete) {
            this.node.active = false;
        }
    }

    private getResourceManager(): ResourceManager | null {
        const scene = director.getScene();
        return scene?.getComponentInChildren(ResourceManager) ?? null;
    }

    private getGameProperty(): gameProperty | null {
        const scene = director.getScene();
        return scene?.getComponentInChildren(gameProperty) ?? null;
    }

    private async safeLoad<T>(rm: ResourceManager, path: string, type: any): Promise<T | null> {
        try {
            return await rm.loadResource<T>(path, type);
        } catch (e) {
            // 특정 리소스가 누락돼도 로딩 전체가 멈추지 않도록 안전하게 무시
            console.warn(`[LoadingNode] 리소스 프리로드 실패: ${path}`, e);
            return null;
        }
    }

    private setProgress(done: number, total: number): void {
        if (this.progressBar == null) {
            return;
        }
        if (total <= 0) {
            this.progressBar.progress = 1;
            return;
        }
        const raw = done / total;
        const clamped = Math.max(0, Math.min(1, raw));
        this.progressBar.progress = clamped;
    }

    private getCorePreloadTasks(rm: ResourceManager): Promise<any>[] {
        const items: Array<[string, any]> = [
            // Prefab / Effect (게임 중 자주 사용)
            ["prefab/Egg", Prefab],
            ["prefab/EggScore", Prefab],
            ["effect/box/boxHit2D", Prefab],

            // Background (게임 모드별)
            ["textures/background/background/spriteFrame", SpriteFrame],
            ["textures/background/backgroundLake/spriteFrame", SpriteFrame],
            ["textures/background/backgroundCity/spriteFrame", SpriteFrame],

            // BGM
            ["sound/Sanrio1_Full_Version", AudioClip],
            ["sound/Sanrio2_Full_Version", AudioClip],
            ["sound/Sanrio3_Full_Version", AudioClip],
            ["sound/Penalty sound", AudioClip],
            ["sound/Sanrio FX1", AudioClip],
            ["sound/Sanrio FX2", AudioClip],

            // Midi JSON
            ["midi/version1", JsonAsset],
        ];

        return items.map(([path, type]) => this.safeLoad(rm, path, type));
    }

    private getCharacterSpritePreloadTasks(rm: ResourceManager): Promise<any>[] {
        const prop = this.getGameProperty();
        if (prop == null) {
            console.warn("[LoadingNode] gameProperty를 찾을 수 없어 캐릭터 스프라이트 프리로드를 건너뜁니다.");
            return [];
        }

        const imageNames = new Set<string>();
        for (let level = 1; level <= 3; level++) {
            for (let eggType = 0; eggType < EggType.TotalCount; eggType++) {
                const imageName = prop.getImage(level, eggType);
                if (imageName && imageName.trim().length > 0) {
                    imageNames.add(imageName.trim());
                }
            }
        }

        return Array.from(imageNames).reduce<Promise<any>[]>((acc, imageName) => {
            return acc.concat([
                this.safeLoad<SpriteFrame>(rm, `textures/character/Game/${imageName}/spriteFrame`, SpriteFrame),
                this.safeLoad<SpriteFrame>(rm, `textures/character/Opening/${imageName}/spriteFrame`, SpriteFrame),
            ]);
        }, []);
    }

    private async preCacheResources(): Promise<void> {
        const rm = this.getResourceManager();
        if (rm == null) {
            console.warn("[LoadingNode] ResourceManager를 찾을 수 없어 프리로드를 건너뜁니다.");
            return;
        }

        const tasks = [
            ...this.getCorePreloadTasks(rm),
            ...(this.preloadCharacterSprites ? this.getCharacterSpritePreloadTasks(rm) : []),
        ];

        const total = tasks.length;
        let done = 0;
        this.setProgress(done, total);

        const trackedTasks = tasks.map((task) =>
            task.then(
                (value) => {
                    done += 1;
                    this.setProgress(done, total);
                    return value;
                },
                (err) => {
                    done += 1;
                    this.setProgress(done, total);
                    throw err;
                }
            )
        );

        await Promise.all(trackedTasks);
    }
}


