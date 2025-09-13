import { _decorator, AudioClip, Component, error, instantiate, Node, Prefab, resources } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ResourceManager')
export class ResourceManager extends Component {
    private static _instance: ResourceManager = null;
    private resourceCache: Map<string, any> = new Map();

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

        return new Promise((resolve, reject) => {
            resources.load(path, type, (err, asset) => {
                if (err) {
                    error(`리소스 로드 실패: ${path}`, err);
                    reject(err);
                    return;
                }
                this.resourceCache.set(path, asset);
                resolve(asset as T);
            });
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

    // public async cachingResource(path: string) {
}
