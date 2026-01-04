import { _decorator } from 'cc';
const { ccclass } = _decorator;

/**
 * Apple MusicKit JS SDK를 연동하여 음악 재생을 관리하는 싱글톤 클래스
 * 라이브러리 동적 로딩, 설정(Configure), 및 재생(Play) 기능을 담당합
 */
@ccclass('AppleMusicManager')
export class AppleMusicManager {
    /** 싱글톤 인스턴스 저장 변수 */
    private static _instance: AppleMusicManager = null;
    /** 초기화된 MusicKit 인스턴스 참조 */
    private musicKit: any = null;

    /**
     * Apple Developer Token (JWT)
     * Apple Music API 접근 권한을 가진 서명된 토큰
     */
    private readonly developerToken = "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IlJRVDNXSzdVQkYifQ.eyJpYXQiOjE3NjY5OTY1ODAsImV4cCI6MTc4MjU0ODU4MCwiaXNzIjoiVk40M1JEODY2SiJ9.f3UJpEUTmNYP50f-0Gs5ROPKp8F6th4rHqa01TMHpocfp8i3ZxXGAkwFD9BbRVLc58WnjrcvycR22kA0dj0Ztw";

    /**
     * 싱글톤 인스턴스를 반환
     */
    public static get I(): AppleMusicManager {
        if (!this._instance) {
            this._instance = new AppleMusicManager();
        }
        return this._instance;
    }

    /**
     * MusicKit 라이브러리를 초기화
     * 1. window 객체에 MusicKit이 없으면 CDN에서 스크립트를 동적으로 로드
     * 2. 개발자 토큰과 앱 정보를 사용하여 MusicKit을 설정(Configure)
     */
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

    /**
     * 특정 노래 ID(songId)를 큐에 담고 재생
     * 라이브러리가 초기화되지 않은 경우 자동으로 initialize()를 호출
     * @param songId Apple Music 카탈로그의 노래 ID
     */
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

    /**
     * 현재 재생 중인 음악을 정지
     */
    public stop() {
        if (this.musicKit) {
            this.musicKit.stop();
        }
    }
}