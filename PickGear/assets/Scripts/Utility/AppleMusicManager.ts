import { _decorator, sys } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('AppleMusicManager')
export class AppleMusicManager {
    private developerToken: string | null = null;
    private developerTokenEndpoint: string | null = null;

    constructor(opts?: { developerToken?: string; developerTokenEndpoint?: string }) {
        if (opts?.developerToken) this.developerToken = opts.developerToken;
        if (opts?.developerTokenEndpoint) this.developerTokenEndpoint = opts.developerTokenEndpoint;
        this.hydrateFromWeb();
    }

    private async ensureMusicKitLoaded(): Promise<void> {
        if (!sys.isBrowser) {
            throw new Error('AppleMusicManager: MusicKit JS는 Web에서만 사용할 수 있습니다.');
        }
        const g = globalThis as any;
        if (g.MusicKit) return;

        await new Promise<void>((resolve, reject) => {
            const doc = g.document as Document | undefined;
            if (!doc) {
                reject(new Error('AppleMusicManager: document를 찾을 수 없습니다.'));
                return;
            }

            // 이미 추가된 경우(load 대기)
            const existing =
                doc.querySelector('script[data-musickit="true"]') ||
                doc.querySelector('script[src*="js-cdn.music.apple.com/musickit"]');
            if (existing) {
                if (g.MusicKit) {
                    resolve();
                    return;
                }
                existing.addEventListener?.('load', () => resolve(), { once: true } as any);
                existing.addEventListener?.('error', () => reject(new Error('AppleMusicManager: MusicKit JS 로드 실패')), { once: true } as any);
                return;
            }

            const script = doc.createElement('script');
            script.src = 'https://js-cdn.music.apple.com/musickit/v3/musickit.js';
            script.async = true;
            script.defer = true;
            // dataset은 읽기 전용 getter이므로(dataset 자체를 재할당하면 에러),
            // 개별 data-* 키만 설정한다.
            try {
                script.dataset.musickit = 'true';
            } catch {
                // dataset 접근이 막힌 특이 케이스 대비(린트 무시)
                // eslint-disable-next-line unicorn/prefer-dom-node-dataset
                script.setAttribute('data-musickit', 'true');
            }
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('AppleMusicManager: MusicKit JS 로드 실패'));
            doc.head.appendChild(script);
        });
    }

    private hydrateFromWeb() {
        if (!sys.isBrowser) return;
        try {
            const url = new URL(globalThis.location.href);
            const tokenFromQuery = url.searchParams.get('appleToken');
            const endpointFromQuery = url.searchParams.get('appleTokenEndpoint');

            const tokenFromStorage = sys.localStorage.getItem('pickgear_apple_developer_token');
            const endpointFromStorage = sys.localStorage.getItem('pickgear_apple_token_endpoint');

            if (!this.developerToken && tokenFromQuery) this.developerToken = tokenFromQuery;
            if (!this.developerToken && tokenFromStorage) this.developerToken = tokenFromStorage;
            if (!this.developerTokenEndpoint && endpointFromQuery) this.developerTokenEndpoint = endpointFromQuery;
            if (!this.developerTokenEndpoint && endpointFromStorage) this.developerTokenEndpoint = endpointFromStorage;
        } catch {
            // ignore
        }
    }

    private async resolveDeveloperToken(): Promise<string> {
        if (this.developerToken) return this.developerToken;
        if (!this.developerTokenEndpoint) {
            throw new Error('AppleMusicManager: developerToken 또는 developerTokenEndpoint가 필요합니다.');
        }
        const res = await fetch(this.developerTokenEndpoint, { cache: 'no-store' });
        if (!res.ok) throw new Error(`AppleMusicManager: developerToken 요청 실패: ${await res.text()}`);
        const json = await res.json().catch(() => ({}));
        const token = json?.developerToken;
        if (!token) throw new Error('AppleMusicManager: developerToken 응답이 비어있습니다.');
        this.developerToken = token;
        return token;
    }

    async searchMusic(query: string) {
        const developerToken = await this.resolveDeveloperToken();
        const res = await fetch(`https://api.music.apple.com/v1/catalog/kr/search?term=${encodeURIComponent(query)}&types=songs`, {
            headers: {
                Authorization: `Bearer ${developerToken}`,
            }
        });

        return await res.json();
    }

    async playMyMusic() {
        await this.ensureMusicKitLoaded();
        const developerToken = await this.resolveDeveloperToken();
        // 2. 뮤직킷 설정
        await (globalThis as any).MusicKit.configure({
            developerToken,
            app: { name: 'MySite', build: '1.0' }
        });

        const music = (globalThis as any).MusicKit.getInstance();

        // 3. 로그인 체크 (로그인 안 되어 있으면 팝업 띄움)
        if (!music.isAuthorized) {
            await music.authorize(); // 최초 1회만 팝업 뜸, 그 뒤로는 자동 통과
        }

        // 4. 노래 재생 (노래 ID 넣기)
        await music.setQueue({ song: '1522636431' }); // 예: Into You
        await music.play();
    }

    // 게임 음악 트랙 ID 목록
    private readonly GAME_TRACKS = {
        intro: '1522636431',      // Into you
        level1: '1493354242',     // 마주치는 눈빛
        level2: '1522636440',     // Freeze the fire
        level3: '1522636433',     // Monster
    };

    // 레벨별 음악 재생
    async playLevelMusic(level: number): Promise<void> {
        await this.ensureMusicKitLoaded();
        const music = (globalThis as any).MusicKit.getInstance();
        const trackIds = [
            this.GAME_TRACKS.intro,
            this.GAME_TRACKS.level1,
            this.GAME_TRACKS.level2,
            this.GAME_TRACKS.level3,
        ];

        await music.setQueue({ song: trackIds[level] });
        await music.play();
    }
}
