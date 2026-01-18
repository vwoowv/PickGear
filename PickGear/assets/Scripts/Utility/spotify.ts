export class Spotify {
    private static _instance: Spotify | null = null;

    public static get I(): Spotify {
        Spotify._instance ??= new Spotify();
        return Spotify._instance;
    }

    private authClientId: string = '';
    private authRedirectUri: string = '';
    private authScopes: string[] = [
        'streaming',
        'user-read-email',
        'user-read-private',
        'user-read-playback-state',
        'user-modify-playback-state',
    ];

    private readonly tokenEndpoint = 'https://accounts.spotify.com/api/token';
    private readonly tokenStorageKey = 'pickgear_spotify_token';
    private readonly verifierStorageKey = 'pickgear_spotify_pkce_verifier';
    private readonly forceAttemptKey = 'pickgear_spotify_force_attempted';

    private webPlayer: { addListener: (...args: any[]) => void; connect: () => Promise<boolean> } | null = null;
    private webDeviceId: string | null = null;
    private previewAudio: HTMLAudioElement | null = null;
    private webPlayerError: string | null = null;

    private constructor() {}

    public setAuthConfig(clientId: string, redirectUri: string, scopes?: string[]) {
        this.authClientId = clientId;
        this.authRedirectUri = redirectUri.trim();
        if (scopes?.length) {
            this.authScopes = scopes;
        }
    }

    private base64UrlEncode(bytes: Uint8Array): string {
        let b64 = '';
        for (const byte of bytes) {
            b64 += String.fromCodePoint(byte);
        }
        const g = globalThis as any;
        if (typeof g?.btoa !== 'function') {
            throw new TypeError('Base64 encoder is not available in this runtime.');
        }
        const raw = g.btoa(b64);
        return raw.replaceAll('+', '-').replaceAll('/', '_').replaceAll(/=+$/g, '');
    }

    private async sha256Base64Url(input: string): Promise<string> {
        const data = new TextEncoder().encode(input);
        const digest = await globalThis.crypto.subtle.digest('SHA-256', data);
        return this.base64UrlEncode(new Uint8Array(digest));
    }

    private randomString(len: number): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
        const bytes = new Uint8Array(len);
        globalThis.crypto.getRandomValues(bytes);
        let s = '';
        for (const b of bytes) s += chars[b % chars.length];
        return s;
    }

    private loadToken(): { access_token: string; refresh_token?: string; expires_at_ms: number } | null {
        try {
            const raw = globalThis.localStorage.getItem(this.tokenStorageKey);
            if (!raw) return null;
            return JSON.parse(raw);
        } catch {
            return null;
        }
    }

    private saveToken(token: { access_token: string; refresh_token?: string; expires_at_ms: number }) {
        globalThis.localStorage.setItem(this.tokenStorageKey, JSON.stringify(token));
    }

    private isTokenValid(token: { access_token: string; expires_at_ms: number } | null): boolean {
        if (!token?.access_token || !token.expires_at_ms) return false;
        return token.expires_at_ms - Date.now() > 30_000;
    }

    private ensureAuthConfig() {
        if (!this.authClientId || !this.authRedirectUri) {
            throw new Error('Spotify: clientId/redirectUri 설정이 필요합니다.');
        }
        const g = globalThis as any;
        if (g?.location?.origin && g?.location?.pathname) {
            const current = g.location.origin + g.location.pathname;
            if (current !== this.authRedirectUri) {
                console.warn('[Spotify] redirectUri 불일치', {
                    configured: this.authRedirectUri,
                    current,
                });
            }
        }
    }

    private async exchangeCodeForToken(code: string, verifier: string) {
        const body = new URLSearchParams({
            client_id: this.authClientId,
            grant_type: 'authorization_code',
            code,
            redirect_uri: this.authRedirectUri,
            code_verifier: verifier,
        });
        const res = await fetch(this.tokenEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body,
        });
        if (!res.ok) {
            throw new Error(`Spotify PKCE token 교환 실패: ${await res.text()}`);
        }
        const json = await res.json();
        const token = {
            access_token: json.access_token,
            refresh_token: json.refresh_token,
            expires_at_ms: Date.now() + (json.expires_in * 1000),
        };
        this.saveToken(token);
        return token;
    }

    private async refreshAccessToken(refreshToken: string) {
        const body = new URLSearchParams({
            client_id: this.authClientId,
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
        });
        const res = await fetch(this.tokenEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body,
        });
        if (!res.ok) {
            throw new Error(`Spotify refresh token 실패: ${await res.text()}`);
        }
        const json = await res.json();
        const prev = this.loadToken() || { refresh_token: undefined };
        const token = {
            access_token: json.access_token,
            refresh_token: json.refresh_token || prev.refresh_token,
            expires_at_ms: Date.now() + (json.expires_in * 1000),
        };
        this.saveToken(token);
        return token;
    }

    private clearStoredToken() {
        try {
            globalThis.localStorage.removeItem(this.tokenStorageKey);
        } catch {
            // ignore
        }
    }

    private async ensureAccessToken(forceReauth = false): Promise<string> {
        this.ensureAuthConfig();

        const params = new URLSearchParams(globalThis.location.search);
        const code = params.get('code');
        if (code) {
            const verifier = globalThis.sessionStorage.getItem(this.verifierStorageKey);
            if (!verifier) {
                const url = new URL(globalThis.location.href);
                url.searchParams.delete('code');
                url.searchParams.delete('state');
                globalThis.history.replaceState({}, globalThis.document.title, url.toString());
                return await this.ensureAccessToken(true);
            }
            const token = await this.exchangeCodeForToken(code, verifier);
            const url = new URL(globalThis.location.href);
            url.searchParams.delete('code');
            url.searchParams.delete('state');
            globalThis.history.replaceState({}, globalThis.document.title, url.toString());
            try {
                globalThis.sessionStorage.removeItem(this.forceAttemptKey);
            } catch {
                // ignore
            }
            return token.access_token;
        }

        if (forceReauth) {
            this.clearStoredToken();
        }

        const stored = this.loadToken();
        if (this.isTokenValid(stored) && stored) return stored.access_token;

        if (stored?.refresh_token) {
            const token = await this.refreshAccessToken(stored.refresh_token);
            return token.access_token;
        }

        const verifier = this.randomString(64);
        globalThis.sessionStorage.setItem(this.verifierStorageKey, verifier);
        const challenge = await this.sha256Base64Url(verifier);

        const state = this.randomString(16);
        const authUrl = new URL('https://accounts.spotify.com/authorize');
        authUrl.searchParams.set('client_id', this.authClientId);
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('redirect_uri', this.authRedirectUri);
        authUrl.searchParams.set('code_challenge_method', 'S256');
        authUrl.searchParams.set('code_challenge', challenge);
        authUrl.searchParams.set('state', state);
        authUrl.searchParams.set('scope', this.authScopes.join(' '));
        if (forceReauth) {
            authUrl.searchParams.set('show_dialog', 'true');
        }
        globalThis.location.assign(authUrl.toString());
        return await new Promise<string>(() => {});
    }

    private extractTrackId(trackUri: string): string {
        if (trackUri.startsWith('spotify:track:')) {
            return trackUri.split(':')[2] || trackUri;
        }
        const regex = /open\.spotify\.com\/track\/([A-Za-z0-9]+)/;
        const match = regex.exec(trackUri);
        return match?.[1] || trackUri;
    }

    private async fetchTrackPreviewUrl(accessToken: string, trackUri: string): Promise<string | null> {
        const trackId = this.extractTrackId(trackUri);
        const res = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (!res.ok) {
            console.warn('[Spotify] preview_url 조회 실패:', res.status, trackId);
            return null;
        }
        const json = await res.json().catch(() => ({}));
        if (!json?.preview_url) {
            console.warn('[Spotify] preview_url 없음:', trackId, trackUri);
        }
        return json?.preview_url || null;
    }

    private async playPreviewUrl(previewUrl: string): Promise<void> {
        const g = globalThis as any;
        if (!g?.document) {
            throw new Error('Spotify preview 재생은 Web에서만 가능합니다.');
        }
        if (this.previewAudio) {
            try {
                this.previewAudio.pause();
            } catch {
                // ignore
            }
        }
        this.previewAudio = new Audio(previewUrl);
        await this.previewAudio.play();
    }

    private async loadSpotifyWebPlaybackSdk(): Promise<void> {
        const g = globalThis as any;
        if (g.Spotify?.Player) return;
        if (this.webPlayerError === 'sdk_script_error' || this.webPlayerError === 'sdk_not_ready') {
            throw new Error('Spotify Web Playback SDK가 이전에 실패했습니다.');
        }

        await new Promise<void>((resolve, reject) => {
            const doc = g.document as Document | undefined;
            if (!doc) {
                reject(new Error('Spotify Web Playback SDK를 로드할 document가 없습니다.'));
                return;
            }

            fetch('https://sdk.scdn.co/spotify-player.js', { method: 'GET', mode: 'cors' })
                .then((res) => {
                    if (!res.ok) {
                        this.webPlayerError = 'sdk_fetch_failed';
                        console.warn('[Spotify] SDK fetch failed:', res.status);
                    }
                })
                .catch((e) => {
                    this.webPlayerError = 'sdk_fetch_failed';
                    console.warn('[Spotify] SDK fetch blocked:', e);
                });

            const existing = doc.querySelector('script[src="https://sdk.scdn.co/spotify-player.js"]');
            if (existing) {
                if (g.Spotify?.Player) {
                    resolve();
                    return;
                }
                existing.addEventListener?.('load', () => resolve(), { once: true } as any);
                existing.addEventListener?.('error', () => reject(new Error('Spotify Web Playback SDK 로드 실패')), { once: true } as any);
                return;
            }

            const script = doc.createElement('script');
            script.src = 'https://sdk.scdn.co/spotify-player.js';
            script.async = true;
            script.crossOrigin = 'anonymous';
            const onWindowError = (event: ErrorEvent) => {
                const isSdkError = event?.filename?.includes('spotify-player.js')
                    || (event?.message === 'Script error.' && !event?.filename);
                if (isSdkError) {
                    this.webPlayerError = 'sdk_script_error';
                    globalThis.removeEventListener('error', onWindowError);
                    event.preventDefault?.();
                    reject(new Error('Spotify Web Playback SDK 스크립트 오류(상세 미확인)'));
                }
            };
            globalThis.addEventListener('error', onWindowError);
            script.onload = () => {
                globalThis.removeEventListener('error', onWindowError);
                if (!g.Spotify?.Player) {
                    this.webPlayerError = 'sdk_not_ready';
                    reject(new Error('Spotify Web Playback SDK 로드 후 Player가 없습니다.'));
                    return;
                }
                resolve();
            };
            script.onerror = () => {
                globalThis.removeEventListener('error', onWindowError);
                reject(new Error('Spotify Web Playback SDK 로드 실패'));
            };
            doc.head.appendChild(script);
        });
    }

    private async withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
        return await Promise.race([
            promise,
            new Promise<T>((_resolve, reject) => {
                setTimeout(() => reject(new Error(label)), ms);
            }),
        ]);
    }

    private async ensureWebPlaybackDevice(accessToken: string): Promise<string | null> {
        const g = globalThis as any;
        if (!g.document) return null;

        try {
            await this.loadSpotifyWebPlaybackSdk();
        } catch (e) {
            this.webPlayerError = (e as Error)?.message || 'sdk_load_error';
            console.warn('[Spotify] SDK load failed:', this.webPlayerError);
            return null;
        }

        if (!g.Spotify?.Player) {
            throw new Error('Spotify Web Playback SDK가 준비되지 않았습니다.');
        }

        if (!this.webPlayer) {
            this.webPlayer = new g.Spotify.Player({
                name: 'PickGear Web Player',
                getOAuthToken: (cb: (t: string) => void) => cb(accessToken),
                volume: 0.8,
            });

            this.webPlayer.addListener('ready', ({ device_id }: { device_id: string }) => {
                this.webDeviceId = device_id;
            });
            this.webPlayer.addListener('not_ready', ({ device_id }: { device_id: string }) => {
                if (this.webDeviceId === device_id) this.webDeviceId = null;
            });
            this.webPlayer.addListener('initialization_error', ({ message }: { message: string }) => {
                this.webPlayerError = message || 'initialization_error';
                console.warn('[Spotify] Web Playback init error:', this.webPlayerError);
            });
            this.webPlayer.addListener('authentication_error', ({ message }: { message: string }) => {
                this.webPlayerError = message || 'authentication_error';
                console.warn('[Spotify] Web Playback auth error:', this.webPlayerError);
            });
            this.webPlayer.addListener('account_error', ({ message }: { message: string }) => {
                this.webPlayerError = message || 'account_error';
                console.warn('[Spotify] Web Playback account error:', this.webPlayerError);
            });
            this.webPlayer.addListener('playback_error', ({ message }: { message: string }) => {
                this.webPlayerError = message || 'playback_error';
                console.warn('[Spotify] Web Playback playback error:', this.webPlayerError);
            });

            try {
                const connected = await this.withTimeout(
                    this.webPlayer.connect(),
                    10_000,
                    'Spotify Web Player 연결 타임아웃'
                );
                if (!connected) {
                    throw new Error('Spotify Web Player 연결 실패');
                }
            } catch (e) {
                this.webPlayerError = (e as Error)?.message || 'connect_error';
                console.warn('[Spotify] Web Playback connect error:', this.webPlayerError);
                return null;
            }
        }

        const start = Date.now();
        while (!this.webDeviceId && !this.webPlayerError && (Date.now() - start) < 10_000) {
            await new Promise((r) => setTimeout(r, 50));
        }
        if (!this.webDeviceId || this.webPlayerError) {
            if (!this.webPlayerError) {
                this.webPlayerError = 'device_id_timeout';
                console.warn('[Spotify] Web Playback deviceId timeout');
            }
            return null;
        }

        await fetch('https://api.spotify.com/v1/me/player', {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ device_ids: [this.webDeviceId], play: false }),
        });

        return this.webDeviceId;
    }

    private async getUserProduct(accessToken: string): Promise<string | null> {
        const res = await fetch('https://api.spotify.com/v1/me', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (!res.ok) return null;
        const json = await res.json().catch(() => ({}));
        return json?.product || null;
    }

    private async handleNonPremium(accessToken: string, trackUri: string): Promise<boolean> {
        try {
            const forced = globalThis.sessionStorage.getItem(this.forceAttemptKey);
            if (!forced) {
                globalThis.sessionStorage.setItem(this.forceAttemptKey, '1');
                await this.ensureAccessToken(true);
                return true;
            }
        } catch {
            // ignore
        }
        const previewUrl = await this.fetchTrackPreviewUrl(accessToken, trackUri);
        if (previewUrl) {
            await this.playPreviewUrl(previewUrl);
            return true;
        }
        throw new Error('Spotify Premium 계정이 아니어서 전체 재생이 불가합니다.');
    }

    public async getAccessToken(): Promise<any> {
        const access_token = await this.ensureAccessToken();
        return { access_token };
    }

    private readonly gamePlaylist = {
        name: '옷 맞추기 게임 음악',
        description: 'Egg Bird 게임의 레벨별 배경 음악',
        tracks: [
            'spotify:track:4wgpMVdrWBELff42ZZgJl8', // Into you
            'spotify:track:7v3bpnW7d5ij0scB8ThIAa', // 마주치는 눈빛 (레벨1)
            'spotify:track:0u2dt20b1qyfce5j6PnTeZ', // Freeze the fire (레벨2)
            'spotify:track:0Ccpm5dnPQuR83s2JWPI9P', // Monster (레벨3)
        ]
    };

    public async playTrack(trackUri: string): Promise<any> {
        const { access_token } = await this.getAccessToken();
        if (!access_token || typeof access_token !== 'string') {
            throw new Error('Spotify: access_token is missing');
        }

        const product = await this.getUserProduct(access_token);
        if (product && product !== 'premium') {
            await this.handleNonPremium(access_token, trackUri);
            return;
        }

        let deviceId = await this.ensureWebPlaybackDevice(access_token);
        if (!deviceId && this.webPlayerError?.startsWith('sdk_')) {
            const previewUrl = await this.fetchTrackPreviewUrl(access_token, trackUri);
            if (previewUrl) {
                await this.playPreviewUrl(previewUrl);
                return;
            }
        }

        if (!deviceId) {
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
            if (!devices?.length) {
                const previewUrl = await this.fetchTrackPreviewUrl(access_token, trackUri);
                if (previewUrl) {
                    await this.playPreviewUrl(previewUrl);
                    return;
                }
                throw new Error('재생 가능한 Spotify 디바이스가 없습니다. Spotify 앱 또는 Web Playback SDK 권한이 필요합니다.');
            }
            deviceId = devices[0].id;
        }

        await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
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

    public async playLevelMusic(level: number): Promise<any> {
        const trackIndex = level;
        await this.playTrack(this.gamePlaylist.tracks[trackIndex]);
    }
}
