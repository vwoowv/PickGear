import { _decorator } from 'cc';
const { ccclass } = _decorator;

/**
 * Apple MusicKit JS를 사용하여 음악 재생을 관리하는 싱글톤 클래스입니다.
 * 외부 스크립트 로드, 초기화, 노래 검색 및 재생 기능을 담당합니다.
 */
@ccclass('AppleMusicManager')
export class AppleMusicManager {
    /** 싱글톤 인스턴스 저장 변수 */
    private static _instance: AppleMusicManager = null;

    /** Apple MusicKit 인스턴스 객체 */
    private musicKit: any = null;

    /** * Apple Developer Token (JWT)
     * 주의: 실제 배포 시에는 토큰 만료 및 보안을 위해 서버에서 받아오거나 관리가 필요할 수 있습니다.
     */
    private readonly developerToken = "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IlJRVDNXSzdVQkYifQ.eyJpYXQiOjE3NjY5MzAxMzksImV4cCI6MTc4MjQ4MjEzOSwiaXNzIjoiVk40M1JEODY2SiJ9.degtkczFygFs4H7xt67xy8brvff8T-tCix8yGBqj42-mkZKfMhqMKUIPOCxcnhdJ-6HO4KvJZt5dde_9ehhj5A";

    /**
     * 싱글톤 인스턴스를 반환합니다.
     * 인스턴스가 없으면 새로 생성합니다.
     */
    public static get I(): AppleMusicManager {
        if (!this._instance) {
            this._instance = new AppleMusicManager();
        }
        return this._instance;
    }

    /**
     * MusicKit을 초기화합니다.
     * 1. window 객체에 MusicKit이 없으면 CDN에서 스크립트를 동적으로 로드합니다.
     * 2. 개발자 토큰과 앱 정보를 사용하여 MusicKit을 설정(configure)합니다.
     */
    public async initialize() {
        if (this.musicKit) return;

        // MusicKit JS 라이브러리가 로드되지 않은 경우 동적 로드
        if (typeof (window as any).MusicKit === 'undefined') {
            console.log("MusicKit JS 다운로드 중...");
            await new Promise<void>((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://js-cdn.music.apple.com/musickit/v3/musickit.js';
                script.onload = () => resolve();
                script.onerror = () => reject(new Error("MusicKit 스크립트 로드 실패"));
                document.head.appendChild(script);
            });
        }

        try {
            // MusicKit 설정 및 인스턴스 생성
            await (window as any).MusicKit.configure({
                developerToken: this.developerToken,
                app: {
                    name: 'EggGame',
                    build: '1.0.0',
                },
                storefrontId: 'us', // 기본 스토어 국가 설정 (미국)
            });
            this.musicKit = (window as any).MusicKit.getInstance();
        } catch (err) {
            // 초기화 실패 시 에러 처리 (로그 등)
        }
    }

    /**
     * 특정 노래(songId)를 재생합니다.
     * 재생에 실패할 경우 대체 검색어(fallbackTerm)를 사용하여 검색 후 재생을 시도합니다.
     * * @param songId Apple Music의 노래 ID
     * @param fallbackTerm ID 재생 실패 시 검색할 대체 키워드 (가수명, 노래제목 등)
     * @returns 재생 성공 여부 (Promise<boolean>)
     */
    public async playSong(songId: string, fallbackTerm: string = ""): Promise<boolean> {
        if (!this.musicKit) await this.initialize();


        try {
            // 1차 시도: ID로 큐에 설정하고 재생
            await this.musicKit.setQueue({ song: songId });
            await this.musicKit.play();
        } catch (error) {
            // 실패 시 대체 검색어가 있다면 검색 재생 시도
            if (fallbackTerm && fallbackTerm.length > 0) {
                const searchSuccess = await this.searchAndPlay(fallbackTerm);
                if (!searchSuccess) return false;
            } else {
                return false;
            }
        }

        // 실제 재생 상태가 될 때까지 대기 후 결과 반환
        return await this.waitForPlayingState();
    }

    /**
     * 검색어를 사용하여 노래를 찾고, 첫 번째 결과를 재생합니다.
     * * @param term 검색할 키워드
     * @returns 검색 및 재생 성공 여부
     */
    private async searchAndPlay(term: string): Promise<boolean> {
        try {

            if (!this.musicKit.api) {
                return false;
            }

            let songs = [];

            // MusicKit API 버전에 따른 검색 로직 분기 처리
            if (typeof this.musicKit.api.search === 'function') {
                const results = await this.musicKit.api.search(term, { types: 'songs', limit: 1 });
                songs = results?.songs?.data;
            }
            else {
                // search 함수가 없는 경우 직접 API 쿼리 호출
                const storefront = this.musicKit.storefrontId || 'us';
                const encodedTerm = encodeURIComponent(term);
                const query = `v1/catalog/${storefront}/search?term=${encodedTerm}&types=songs&limit=1`;

                const results = await this.musicKit.api.music(query);
                songs = results?.results?.songs?.data;
            }

            // 검색 결과가 있으면 첫 번째 곡 재생
            if (songs && songs.length > 0) {
                const newId = songs[0].id;
                await this.musicKit.setQueue({ song: newId });
                await this.musicKit.play();
                return true;
            } else {
                return false;
            }
        } catch (e) {
            return false;
        }
    }

    /**
     * 플레이어가 실제로 '재생 중(isPlaying)' 상태가 될 때까지 대기합니다.
     * 네트워크 지연 등으로 인한 비동기 처리를 확실히 하기 위함입니다.
     * 최대 5초(100ms * 50회) 동안 확인합니다.
     * * @returns 재생 시작 성공 여부
     */
    private waitForPlayingState(): Promise<boolean> {
        return new Promise((resolve) => {
            let timeOutCount = 0;
            const checkInterval = setInterval(() => {
                // 재생 중 상태 확인
                if (this.musicKit.player && this.musicKit.player.isPlaying) {
                    clearInterval(checkInterval);
                    resolve(true);
                }

                timeOutCount++;
                // 타임아웃 체크 (약 5초)
                if (timeOutCount > 50) {
                    clearInterval(checkInterval);
                    resolve(false);
                }
            }, 100);
        });
    }

    /**
     * 현재 재생 중인 음악을 정지합니다.
     */
    public stop() {
        if (this.musicKit) {
            this.musicKit.stop();
        }
    }
}