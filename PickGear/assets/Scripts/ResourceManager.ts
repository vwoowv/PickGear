import { _decorator, AudioClip, Component, error, instantiate, Node, Prefab, resources, SpriteFrame } from 'cc';
const { ccclass, property } = _decorator;

export interface IAssetLists {
    prefabs?: string[];
    audioClips?: string[];
    spriteFrames?: string[];
}

export interface IPreloadOptions {
    /**
     * 동시에 로드할 최대 개수 (너무 크면 프레임 드랍/스파이크 유발 가능)
     */
    concurrency?: number;
    /**
     * 일부 리소스 로드 실패 시에도 나머지를 계속 로드할지 여부
     */
    continueOnError?: boolean;
}

@ccclass('ResourceManager')
export class ResourceManager extends Component {
    private static _instance: ResourceManager = null;
    private resourceCache: Map<string, any> = new Map();
    private inFlightLoads: Map<string, Promise<any>> = new Map();

    // Singleton 인스턴스에 접근하는 getter
    public static get I(): ResourceManager {
        if (ResourceManager._instance === null) {
            console.error('ResourceManager Singleton이 초기화되지 않았습니다!');
        }
        return ResourceManager._instance;
    }

    // 싱글톤 초기화
    onLoad() {
        if (ResourceManager._instance === null) {
            ResourceManager._instance = this;
            console.log('ResourceManager Singleton이 생성되었습니다.');
        } else {
            // 이미 인스턴스가 존재하면 현재 노드를 파괴
            this.node.destroy();
        }
    }

    // 인스턴스가 파괴될 때 참조 정리
    onDestroy() {
        if (ResourceManager._instance === this) {
            ResourceManager._instance = null;
            console.log('ResourceManager Singleton이 파괴되었습니다.');
        }
    }

    public async loadResourceAndCache(pathList: string[], type: any) {
        for (const path of pathList) {
            if (this.resourceCache.has(path)) {
                continue;
            }
            await this.loadResource(path, type);
        }
    }

    public loadResource<T>(path: string, type: any): Promise<T> {
        if (this.resourceCache.has(path)) {
            return Promise.resolve(this.resourceCache.get(path) as T);
        }

        const inFlight = this.inFlightLoads.get(path);
        if (inFlight) {
            return inFlight as Promise<T>;
        }

        return new Promise((resolve, reject) => {
            const promise = new Promise<T>((innerResolve, innerReject) => {
                resources.load(path, type, (err, asset) => {
                    if (err) {
                        error(`리소스 로드 실패: ${path}`, err);
                        this.inFlightLoads.delete(path);
                        innerReject(err);
                        return;
                    }
                    this.resourceCache.set(path, asset);
                    this.inFlightLoads.delete(path);
                    innerResolve(asset as T);
                });
            });

            this.inFlightLoads.set(path, promise);
            promise.then(resolve).catch(reject);
        });
    }

    public loadAudioClip(path: string): Promise<AudioClip> {
        return this.loadResource<AudioClip>(path, AudioClip);
    }

    public async spawnPrefab<T extends Component>(path: string, parent: Node): Promise<T> {
        const prefab = await this.loadResource<Prefab>(path, Prefab);
        const newNode: Node = instantiate(prefab);
        parent.addChild(newNode);
        return newNode.getComponent(Component) as T;
    }

    public async preloadGameAssets(
        assetLists: IAssetLists,
        onProgress?: (progress: number) => void,
        options?: IPreloadOptions
    ) {
        const concurrency = Math.max(1, options?.concurrency ?? 6);
        const continueOnError = options?.continueOnError ?? false;

        // 1) 입력 정리 + 중복 제거 + null/빈 문자열 제거
        const toLoad: Array<{ path: string; type: any }> = [];
        const seen = new Set<string>();
        const pushUnique = (paths: string[] | undefined, type: any) => {
            if (!paths || paths.length === 0) return;
            for (const p of paths) {
                const path = (p ?? '').trim();
                if (!path) continue;
                if (this.resourceCache.has(path)) continue;
                const key = `${path}`; // 현재 캐시 키가 path 기반이므로 동일 기준으로 dedupe
                if (seen.has(key)) continue;
                seen.add(key);
                toLoad.push({ path, type });
            }
        };

        pushUnique(assetLists.prefabs, Prefab);
        pushUnique(assetLists.audioClips, AudioClip);
        pushUnique(assetLists.spriteFrames, SpriteFrame);

        const total = toLoad.length;
        if (total === 0) {
            onProgress?.(1);
            return;
        }

        // 2) 동시성 제한 로딩 + 진행률
        let completed = 0;
        const report = () => onProgress?.(completed / total);

        let firstError: unknown = null;
        let idx = 0;

        const worker = async () => {
            while (true) {
                const current = idx < total ? toLoad[idx++] : null;
                if (!current) return;
                try {
                    await this.loadResource(current.path, current.type);
                } catch (e) {
                    if (!continueOnError) throw e;
                    if (firstError === null) firstError = e;
                } finally {
                    completed++;
                    report();
                }
            }
        };

        const workerCount = Math.min(concurrency, total);
        const workers = Array.from({ length: workerCount }, () => worker());
        await Promise.all(workers);
        onProgress?.(1);

        // continueOnError 모드에서는 프리로드가 "완료"되더라도,
        // 내부적으로 일부 실패가 있었음을 로그로 남길 수 있게 해둔다.
        if (continueOnError && firstError) {
            error('preloadGameAssets: 일부 리소스 로드에 실패했지만 계속 진행했습니다.', firstError);
        }
    }
}
