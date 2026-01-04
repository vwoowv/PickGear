import { _decorator } from 'cc';
const { ccclass } = _decorator;

@ccclass('AppleMusicManager')
export class AppleMusicManager {
    private static _instance: AppleMusicManager = null;
    private musicKit: any = null;

    private readonly developerToken = "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IlJRVDNXSzdVQkYifQ.eyJpYXQiOjE3NjY5OTY1ODAsImV4cCI6MTc4MjU0ODU4MCwiaXNzIjoiVk40M1JEODY2SiJ9.f3UJpEUTmNYP50f-0Gs5ROPKp8F6th4rHqa01TMHpocfp8i3ZxXGAkwFD9BbRVLc58WnjrcvycR22kA0dj0Ztw";

    public static get I(): AppleMusicManager {
        if (!this._instance) {
            this._instance = new AppleMusicManager();
        }
        return this._instance;
    }

    public async initialize() {
        // MusicKit JS 라이브러리가 로드되지 않았을 경우 (에디터 프리뷰 등) 동적으로 로드
        if (typeof (window as any).MusicKit === 'undefined') {
            console.log("MusicKit 라이브러리 로딩 중...");
            await new Promise<void>((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://js-cdn.music.apple.com/musickit/v3/musickit.js';
                script.onload = () => resolve();
                script.onerror = () => reject(new Error("MusicKit 로드 실패"));
                document.head.appendChild(script);
            });
        }

        try {
            // 이미 설정되어 있다면 패스
            if (this.musicKit) return;

            await (window as any).MusicKit.configure({
                developerToken: this.developerToken,
                app: {
                    name: 'PickGear',
                    build: '1.0.0',
                },
            });
            this.musicKit = (window as any).MusicKit.getInstance();
            console.log("Apple Music 설정 완료");
        } catch (err) {
            console.error("Apple Music 초기화 실패:", err);
        }
    }

    public async playSong(songId: string) {
        // 초기화가 안 되어 있으면 수행
        if (!this.musicKit) await this.initialize();

        try {
            await this.musicKit.setQueue({
                song: songId
            });
            await this.musicKit.play();
        } catch (error) {
            console.error("Apple Music 재생 실패:", error);
        }
    }

    public stop() {
        if (this.musicKit) {
            this.musicKit.stop();
        }
    }
}