import { _decorator, AudioClip, BlockInputEvents, Component, director, Prefab, ProgressBar, SpriteFrame } from 'cc';
import { ResourceManager } from './ResourceManager';
import { EggType } from './gameDefine';
import { gameProperty } from './gameProperty';
const { ccclass, property } = _decorator;

@ccclass('LoadingNode')
export class LoadingNode extends Component {
    @property({ tooltip: "초기 화면 준비 완료 후 로딩 노드를 자동으로 숨깁니다." })
    public autoHideOnComplete: boolean = true;

    @property({ tooltip: "모드 선택 후 해당 레벨의 캐릭터(게임/오프닝) 스프라이트를 캐싱합니다." })
    public preloadCharacterSprites: boolean = true;

    @property(ProgressBar)
    private readonly progressBar: ProgressBar = null;
    private preparationVersion: number = 0;
    private readyPromise: Promise<void> = null;

    public whenReady(): Promise<void> {
        if (!this.readyPromise) this.readyPromise = this.run();
        return this.readyPromise;
    }

    public start(): void {
        void this.whenReady();
    }

    private async run(): Promise<void> {
        // 모드 선택 UI의 에셋은 씬이 준비한다. 게임 리소스는 선택 이후에 로드한다.
        this.setProgress(1, 1);
        if (this.autoHideOnComplete) this.hide();
    }

    protected onDestroy(): void {
        this.preparationVersion++;
    }

    public hide(): void {
        this.preparationVersion++;
        this.node.active = false;
    }

    public async prepareMode(
        level: number,
        background: Promise<SpriteFrame>,
        audioClip: Promise<AudioClip>,
    ): Promise<[SpriteFrame, AudioClip]> {
        const version = ++this.preparationVersion;
        if (!this.getComponent(BlockInputEvents)) this.addComponent(BlockInputEvents);
        this.node.active = true;
        const rm = this.getResourceManager();
        const tasks: Promise<unknown>[] = [background, audioClip];
        if (rm != null) {
            tasks.push(...this.getCorePreloadTasks(rm));
            if (this.preloadCharacterSprites) tasks.push(...this.getCharacterSpritePreloadTasks(rm, level));
        } else {
            console.warn('[LoadingNode] ResourceManager를 찾을 수 없어 게임 리소스 프리로드를 건너뜁니다.');
        }

        let done = 0;
        this.setProgress(done, tasks.length);
        await Promise.all(tasks.map(async (task) => {
            try {
                await task;
            } finally {
                done++;
                // 타이틀 복귀 또는 다음 모드 준비 뒤에 끝난 요청은 UI를 바꾸지 않는다.
                if (version === this.preparationVersion) this.setProgress(done, tasks.length);
            }
        }));
        return Promise.all([background, audioClip]);
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

    private getCorePreloadTasks(rm: ResourceManager): Promise<unknown>[] {
        const items: Array<[string, any]> = [
            // Prefab / Effect (게임 중 자주 사용)
            ["prefab/Egg", Prefab],
            ["prefab/EggScore", Prefab],
            ["effect/box/boxHit2D", Prefab],
        ];

        return items.map(([path, type]) => this.safeLoad(rm, path, type));
    }

    private getCharacterSpritePreloadTasks(rm: ResourceManager, level: number): Promise<unknown>[] {
        const prop = this.getGameProperty();
        if (prop == null) {
            console.warn("[LoadingNode] gameProperty를 찾을 수 없어 캐릭터 스프라이트 프리로드를 건너뜁니다.");
            return [];
        }

        const imageNames = new Set<string>();
        for (let eggType = 0; eggType < EggType.TotalCount; eggType++) {
            const imageName = prop.getImage(level, eggType);
            if (imageName && imageName.trim().length > 0) {
                imageNames.add(imageName.trim());
            }
        }

        return Array.from(imageNames).reduce<Promise<unknown>[]>((acc, imageName) => {
            return acc.concat([
                this.safeLoad<SpriteFrame>(rm, `textures/character/Game/${imageName}/spriteFrame`, SpriteFrame),
                this.safeLoad<SpriteFrame>(rm, `textures/character/Opening/${imageName}/spriteFrame`, SpriteFrame),
            ]);
        }, []);
    }
}
