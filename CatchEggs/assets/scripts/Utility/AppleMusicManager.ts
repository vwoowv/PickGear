import { _decorator, sys } from 'cc';
const { ccclass } = _decorator;

@ccclass('AppleMusicManager')
export class AppleMusicManager {
    private readonly developerToken = "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ikw3M1haN1g0QzcifQ.eyJpYXQiOjE3Njc4ODc3NTIsImV4cCI6MTc4MzQzOTc1MiwiaXNzIjoiVk40M1JEODY2SiJ9.eFP5xgnVEMTiRpNg46cZPJJPiTdxsA4aGLTPL2fkR8fecalad6aX4aBp8dGijNG66ljR7aFZi5tlf08Yk6wFzw";

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

    async searchMusic(query: string) {
        const res = await fetch(`https://api.music.apple.com/v1/catalog/kr/search?term=${encodeURIComponent(query)}&types=songs`, {
            headers: {
                Authorization: `Bearer ${this.developerToken}`,
            }
        });

        return await res.json();
    }

    async playMyMusic() {
        await this.ensureMusicKitLoaded();
        // 2. 뮤직킷 설정
        await (globalThis as any).MusicKit.configure({
            developerToken: this.developerToken,
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
