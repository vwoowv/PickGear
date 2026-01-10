
export class Spotify {
    private static _instance: Spotify | null = null;

    public static get I(): Spotify {
        Spotify._instance ??= new Spotify();
        return Spotify._instance;
    }

    private readonly client_id: string = '254d6b7f190543e78da436cd3287a60e';
    private readonly client_secret: string = 'b7e0e2391c7b4c93b99d6959086dd60c';
    private readonly refresh_token: string = 'AQCsREHflrwilt4ccdU_RChHyYDVlpdQ49r6KkEDrciMc0iU-ZLhdG9wKOOn0e2F-s0yZSHTcYuba2Os4-BuoOgZgZzd5wVq76vqGu7p647szlYmoTrMcoaycyqHjba3bJI';
    private readonly tokenEndpoint: string = 'https://accounts.spotify.com/api/token';
    private readonly basic: string;

    private base64Encode(value: string): string {
        // Spotify client_id / client_secret는 ASCII라서 btoa로 충분합니다.
        const g = globalThis as any;
        if (typeof g.btoa === 'function') {
            return g.btoa(value);
        }
        // btoa가 없는 런타임(일부 네이티브) 대비: 최소 폴백
        throw new Error('Base64 encoder is not available in this runtime.');
    }

    private constructor() {
        this.basic = this.base64Encode(`${this.client_id}:${this.client_secret}`);
    }

    public async getAccessToken(): Promise<any> {
        const response = await fetch(this.tokenEndpoint, {
            method: 'POST',
            headers: {
                Authorization: `Basic ${this.basic}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: this.refresh_token,
            }),
            cache: 'no-store',
        });

        const json = await response.json().catch(() => ({}));
        if (!response.ok) {
            // 예: { error: 'invalid_grant', error_description: '...' }
            console.error('Spotify token endpoint failed', response.status, json);
            throw new Error(`Spotify getAccessToken failed: ${response.status} ${JSON.stringify(json)}`);
        }
        if (!json?.access_token) {
            console.error('Spotify token endpoint returned no access_token', json);
            throw new Error(`Spotify getAccessToken missing access_token: ${JSON.stringify(json)}`);
        }
        return json;
    };

    public async getMyMusic(): Promise<any> {
        // 1. 저장해둔 리프레시 토큰으로 새 액세스 토큰을 받아옴 (로그인 창 안 뜸)
        const { access_token } = await this.getAccessToken();

        // 2. 받은 토큰으로 Spotify API 호출
        const res = await fetch('https://api.spotify.com/v1/me/tracks', {
            headers: {
                Authorization: `Bearer ${access_token}`
            }
        });

        const data = await res.json();
        return data;
    }

    private readonly gamePlaylist = {
        name: "옷 맞추기 게임 음악",
        description: "Egg Bird 게임의 레벨별 배경 음악",
        tracks: [
            "spotify:track:4wgpMVdrWBELff42ZZgJl8", // Into you
            "spotify:track:7v3bpnW7d5ij0scB8ThIAa", // 마주치는 눈빛 (레벨1)
            "spotify:track:0u2dt20b1qyfce5j6PnTeZ", // Freeze the fire (레벨2)
            "spotify:track:0Ccpm5dnPQuR83s2JWPI9P", // Monster (레벨3)
        ]
    };

    // 플레이리스트 생성
    public async createGamePlaylist(): Promise<any> {
        const { access_token } = await this.getAccessToken();

        // 1. 현재 사용자 정보 가져오기
        const userRes = await fetch('https://api.spotify.com/v1/me', {
            headers: { Authorization: `Bearer ${access_token}` }
        });
        const user = await userRes.json();

        // 2. 플레이리스트 생성
        const playlistRes = await fetch(`https://api.spotify.com/v1/users/${user.id}/playlists`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${access_token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: this.gamePlaylist.name,
                description: this.gamePlaylist.description,
                public: false, // 비공개 플레이리스트
            })
        });
        const playlist = await playlistRes.json();

        // 3. 플레이리스트에 곡 추가
        await fetch(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${access_token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                uris: this.gamePlaylist.tracks
            })
        });

        return playlist;
    }

    // 특정 곡 재생하기
    public async playTrack(trackUri: string): Promise<any> {
        const { access_token } = await this.getAccessToken();
        if (!access_token || typeof access_token !== 'string') {
            throw new Error('Spotify: access_token is missing');
        }

        // 활성화된 디바이스 가져오기
        const devicesRes = await fetch('https://api.spotify.com/v1/me/player/devices', {
            headers: { Authorization: `Bearer ${access_token}` }
        });
        if (!devicesRes.ok) {
            const body = await devicesRes.json().catch(() => ({}));
            console.error('Spotify devices request failed', devicesRes.status, body);
            throw new Error(
                `Spotify /me/player/devices failed: ${devicesRes.status}. ` +
                `보통 토큰 스코프(user-read-playback-state) 부족 또는 토큰 무효/만료입니다.`
            );
        }
        const { devices } = await devicesRes.json();

        if (devices.length === 0) {
            console.error('재생 가능한 Spotify 디바이스가 없습니다. Spotify 앱을 실행해주세요.');
            return;
        }

        // 곡 재생
        await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${devices[0].id}`, {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${access_token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                uris: [trackUri]
            })
        });
    }

    // 레벨별 음악 재생 예시
    public async playLevelMusic(level: number): Promise<any> {
        const trackIndex = level; // 0: Into you, 1: 레벨1, 2: 레벨2, 3: 레벨3
        await this.playTrack(this.gamePlaylist.tracks[trackIndex]);
    }
}
