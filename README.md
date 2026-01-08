

## 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 변수들 추가

### Spotify API
```env
NEXT_PUBLIC_SPOTIFY_CLIENT_ID="254d6b7f190543e78da436cd3287a60e"
NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET="b7e0e2391c7b4c93b99d6959086dd60c"
SPOTIFY_REFRESH_TOKEN="AQCsREHflrwilt4ccdU_RChHyYDVlpdQ49r6KkEDrciMc0iU-ZLhdG9wKOOn0e2F-s0yZSHTcYuba2Os4-BuoOgZgZzd5wVq76vqGu7p647szlYmoTrMcoaycyqHjba3bJI"
```

---

## Spotify API 설정

### 01. Spotify 유틸리티 함수 생성

`app/utils/spotify.ts` 파일을 생성하세요:

```typescript
const client_id = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
const client_secret = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET;
const refresh_token = process.env.SPOTIFY_REFRESH_TOKEN;

const basic = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
const TOKEN_ENDPOINT = `https://accounts.spotify.com/api/token`;

export const getAccessToken = async () => {
    const response = await fetch(TOKEN_ENDPOINT, {
        method: 'POST',
        headers: {
            Authorization: `Basic ${basic}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refresh_token!,
        }),
        cache: 'no-store',
    });
    
    return response.json();
};
```

### 02. Spotify 사용 예시

```typescript
import { getAccessToken } from '@/app/utils/spotify';

async function getMyMusic() {
    // 1. 저장해둔 리프레시 토큰으로 새 액세스 토큰을 받아옴 (로그인 창 안 뜸)
    const { access_token } = await getAccessToken();
    
    // 2. 받은 토큰으로 Spotify API 호출
    const res = await fetch('https://api.spotify.com/v1/me/tracks', {
        headers: {
            Authorization: `Bearer ${access_token}`
        }
    });
    
    const data = await res.json();
    return data;
}
```

### 03. 플레이리스트 생성 및 곡 추가하기

```typescript
import { getAccessToken } from '@/app/utils/spotify';

// 게임 음악 플레이리스트 데이터
const GAME_PLAYLIST = {
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
async function createGamePlaylist() {
    const { access_token } = await getAccessToken();
    
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
            name: GAME_PLAYLIST.name,
            description: GAME_PLAYLIST.description,
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
            uris: GAME_PLAYLIST.tracks
        })
    });
    
    return playlist;
}

// 특정 곡 재생하기
async function playTrack(trackUri: string) {
    const { access_token } = await getAccessToken();
    
    // 활성화된 디바이스 가져오기
    const devicesRes = await fetch('https://api.spotify.com/v1/me/player/devices', {
        headers: { Authorization: `Bearer ${access_token}` }
    });
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
async function playLevelMusic(level: number) {
    const trackIndex = level; // 0: Into you, 1: 레벨1, 2: 레벨2, 3: 레벨3
    await playTrack(GAME_PLAYLIST.tracks[trackIndex]);
}
```

---

## Apple Music API 설정

### 방법 1: JWT 토큰 직접 사용 (간단한 방법)

게임 엔진(Cocos Creator 등)이나 클라이언트에서 직접 사용하는 경우:

```typescript
@ccclass('AppleMusicManager')
export class AppleMusicManager {
    private readonly developerToken = "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ikw3M1haN1g0QzcifQ.eyJpYXQiOjE3Njc4ODc3NTIsImV4cCI6MTc4MzQzOTc1MiwiaXNzIjoiVk40M1JEODY2SiJ9.eFP5xgnVEMTiRpNg46cZPJJPiTdxsA4aGLTPL2fkR8fecalad6aX4aBp8dGijNG66ljR7aFZi5tlf08Yk6wFzw";
    
    async searchMusic(query: string) {
        const res = await fetch(`https://api.music.apple.com/v1/catalog/kr/search?term=${encodeURIComponent(query)}&types=songs`, {
            headers: {
                Authorization: `Bearer ${this.developerToken}`,
            }
        });
        
        return await res.json();
    }
}
```


#### 1단계: HTML에 스크립트 추가

`layout.tsx`의 `<head>` 안에 이거 한 줄 넣으세요.

```html
<script src="https://js-cdn.music.apple.com/musickit/v3/musickit.js"></script>
```

#### 2단계: 초기화 및 재생 코드 (딱 한 번만 실행)

페이지 로딩될 때 실행되는 곳(`useEffect` 등)에 넣으세요.

```typescript
// AppleMusicManager.ts

// 1. '개발자 토큰' (6개월짜리)
const DEVELOPER_TOKEN = "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ikw3M1haN1g0QzcifQ.eyJpYXQiOjE3Njc4ODc3NTIsImV4cCI6MTc4MzQzOTc1MiwiaXNzIjoiVk40M1JEODY2SiJ9.eFP5xgnVEMTiRpNg46cZPJJPiTdxsA4aGLTPL2fkR8fecalad6aX4aBp8dGijNG66ljR7aFZi5tlf08Yk6wFzw"; 

export async function playMyMusic() {
    // 2. 뮤직킷 설정
    await window.MusicKit.configure({
        developerToken: DEVELOPER_TOKEN,
        app: { name: 'MySite', build: '1.0' }
    });

    const music = window.MusicKit.getInstance();

    // 3. 로그인 체크 (로그인 안 되어 있으면 팝업 띄움)
    if (!music.isAuthorized) {
        await music.authorize(); // 최초 1회만 팝업 뜸, 그 뒤로는 자동 통과
    }

    // 4. 노래 재생 (노래 ID 넣기)
    await music.setQueue({ song: '1522636431' }); // 예: Into You
    await music.play();
}
```

#### 3단계: 게임 레벨별 음악 재생

```typescript
// 게임 음악 트랙 ID 목록
const GAME_TRACKS = {
    intro: '1522636431',      // Into you
    level1: '1493354242',     // 마주치는 눈빛
    level2: '1522636440',     // Freeze the fire
    level3: '1522636433',     // Monster
};

// 레벨별 음악 재생
export async function playLevelMusic(level: number) {
    const music = window.MusicKit.getInstance();
    const trackIds = Object.values(GAME_TRACKS);
    
    await music.setQueue({ song: trackIds[level] });
    await music.play();
}
```


---

## 작동 원리

### Spotify 인증 방식

1. **리프레시 토큰**: 사용자 로그인 없이 새로운 액세스 토큰을 얻을 수 있는 장기 유효 토큰
2. **액세스 토큰**: API 요청을 인증하는 데 사용되는 단기 유효 토큰 (일반적으로 1시간 후 만료)
3. **토큰 교환**: `getAccessToken()` 함수가 리프레시 토큰을 새로운 액세스 토큰으로 자동 교환

### Apple Music 인증 방식

1. **개인 키**: Apple Developer에서 발급받은 ES256 알고리즘용 개인 키
2. **JWT 토큰**: 개인 키로 서명된 JSON Web Token (최대 180일 유효)
3. **MusicKit**: Apple Music API는 JWT 기반 인증을 사용하며, 서버에서 토큰을 생성

---

## 주요 사항

### Spotify 관련

- 리프레시 토큰을 사용하면 사용자에게 로그인 팝업을 표시하지 않고 새 액세스 토큰을 얻을 수 있습니다
- 액세스 토큰은 일정 시간이 지나면 만료되므로 API 호출 전에 항상 새 토큰을 요청하세요
- `cache: 'no-store'` 옵션은 항상 최신 토큰을 받을 수 있도록 보장합니다
- **플레이리스트 재생**: 사용자의 Spotify 앱이나 웹 플레이어가 활성화되어 있어야 재생 제어가 가능합니다
- **필수 권한**: `user-modify-playback-state`, `playlist-modify-private`, `user-read-playback-state` 스코프가 필요합니다

### Apple Music 관련
- 개인 키는 절대 클라이언트 측에 노출하지 마세요
- JWT 토큰은 최대 180일까지 유효하며, 필요에 따라 만료 기간을 조정할 수 있습니다
- **MusicKit JS 필요**: 웹에서 Apple Music을 재생하려면 MusicKit JS 라이브러리를 사용해야 합니다
- **사용자 인증**: Apple Music 구독이 필요하며, 사용자가 Apple ID로 로그인해야 합니다
- MusicKit JS CDN: `https://js-cdn.music.apple.com/musickit/v3/musickit.js`

---

