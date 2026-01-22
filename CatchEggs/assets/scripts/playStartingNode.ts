import { _decorator, AnimationComponent, Component, Node } from 'cc';
import { gameManager } from './gameManager';
import { ResourceManager } from './ResourceManager';
import { openingEgg } from './openingEgg';
import { EggType } from './gameDefine';
import { gameProperty } from './gameProperty';
import { sortOpeningPositiveScores } from './openingCharacterOrder';
import { AppleMusicManager } from './Utility/AppleMusicManager';
import { Spotify } from './Utility/spotify';
const { ccclass, property } = _decorator;

@ccclass('playStartingNode')
export class playStartingNode extends Component {
    @property(Node)
    private readonly eggParent: Node = null;
    @property(AnimationComponent)
    private readonly animation: AnimationComponent = null;
    @property(Node)
    private readonly OpeningNerdsGroup: Node = null;
    @property(openingEgg)
    private readonly openingEggNormalList: openingEgg[] = [];
    @property(openingEgg)
    private readonly openingEggNegativeList: openingEgg[] = [];

    private sinElapsedTime: number = 0;
    private elapsedTime: number = 0;
    private gameManager: gameManager = null;

    public async initialize(gameManager: gameManager) {
        this.sinElapsedTime = 0;
        this.elapsedTime = 0;
        this.gameManager = gameManager;

        await this.setOpeningCharacter();

        const authStatus = await this.checkParentAuth();
        if (authStatus.isLoggedIn && (authStatus.provider === 'apple' || authStatus.provider === 'spotify')) {
            console.log(`User logged in via ${authStatus.provider}. Playing streaming music.`);
            await this.playMusicByProvider(authStatus.provider);
        } else {
            console.log('User not logged in with Music Provider. Requesting Login Modal.');
            console.log('Sending REQUEST_LOGIN message to parent (or self in editor)...');
            const w = globalThis.window;
            w?.parent?.postMessage({ type: 'REQUEST_LOGIN' }, w.location.origin);
            await this.playLocalBgm();
        }
        this.animation.play();
    }

    // --- 부모 창(Next.js)과 통신하기 위한 메서드 ---
    private checkParentAuth(): Promise<{ isLoggedIn: boolean; provider: string | null }> {
        const w = globalThis.window;
        if (!w) {
            return Promise.resolve({ isLoggedIn: false, provider: null });
        }
        return new Promise((resolve) => {
            // 타임아웃 설정 (1초 내 응답 없으면 테스트 모드 진입)
            const timeout = setTimeout(() => {
                w.removeEventListener('message', listener);
                this.resolveMockAuth(w, resolve);
            }, 1000);

            const listener = (event: MessageEvent) => {
                // 부모로부터 인증 상태 응답을 받았을 때
                if (event.data?.type === 'AUTH_STATUS_RESPONSE') {
                    clearTimeout(timeout);
                    w.removeEventListener('message', listener);
                    resolve(event.data.payload);
                }
            };

            w.addEventListener('message', listener);
            w.parent?.postMessage({ type: 'CHECK_AUTH' }, w.location.origin);
        });
    }

    private resolveMockAuth(
        w: Window,
        resolve: (value: { isLoggedIn: boolean; provider: string | null }) => void
    ): void {
        // (수정된 코드) 사용자에게 어떤 상태로 시작할지 물어봄
        if (w.confirm) {
            const isMockLogin = w.confirm(
                "[테스트 모드] 부모 창의 응답이 없습니다.\n\n" +
                "▶ [확인]: Apple Music 로그인 테스트 (팝업)\n" +
                "▶ [취소]: Spotify 로그인 테스트 (페이지 이동)"
            );

            if (isMockLogin) {
                console.log("테스트 모드: Apple 로그인 시도");
                resolve({ isLoggedIn: true, provider: 'apple' });
            } else {
                console.log("테스트 모드: Spotify 로그인 시도");
                resolve({ isLoggedIn: true, provider: 'spotify' });
            }
        } else {
            // confirm 불가 환경이면 기본값 false
            resolve({ isLoggedIn: false, provider: null });
        }
    }

    private async playLocalBgm(): Promise<void> {
        const soundName = this.gameManager.gameMode.getCurrentGameBgName();
        const audioClip = await ResourceManager.I.loadAudioClip(soundName);
        this.gameManager.playSound.playOneShot(audioClip);
    }

    // --- 음악 제공자에 따른 재생 로직 ---
    private async playMusicByProvider(provider: string) {
        try {
            if (provider === 'apple') {
                const appleMusic = new AppleMusicManager();
                // AppleMusicManager 내부에서 music.authorize()가 호출되어 팝업이 뜹니다.
                await appleMusic.playMyMusic();
            } else if (provider === 'spotify') {
                // Spotify 로직
                console.log('Spotify Playback Requested');

                // (기존 코드) 로그인창 띄우고 로컬 BGM 폴백
                // const w = globalThis.window;
                // w?.open('https://accounts.spotify.com/login', 'SpotifyLogin', 'width=500,height=600');
                // await this.playLocalBgm();

                const level = this.gameManager.gameMode.getCurrentLevelFromVersion();
                const trackIndex = Math.max(0, Math.min(3, level - 1));
                await Spotify.I.playLevelMusic(trackIndex);
            } else {
                throw new Error('Unknown provider');
            }
        } catch (e) {
            console.warn(`${provider} Music play failed, fallback to local audio`, e);
            await this.playLocalBgm();
        }
    }

    private async setOpeningCharacter() {
        const level = this.gameManager.gameMode.getCurrentLevelFromVersion();
        const prop = gameProperty.I;
        
        // 현재 레벨에서 하나라도 0보다 작은 점수를 가진 캐릭터가 있는지 확인
        let hasNegativeScore = false;
        for (let i = 0; i < EggType.TotalCount; i++) {
            if (prop.getScore(level, i) < 0) {
                hasNegativeScore = true;
                break;
            }
        }
        
        this.OpeningNerdsGroup.active = hasNegativeScore;
        
        // 스코어가 0보다 큰 캐릭터들을 정리
        const positiveScores: { eggType: EggType, score: number, image: string }[] = [];
        // 스코어가 0보다 작은 캐릭터들을 정리
        const negativeScores: { eggType: EggType, score: number, image: string }[] = [];
        
        for (let i = 0; i < EggType.TotalCount; i++) {
            const score = prop.getScore(level, i);
            const image = prop.getImage(level, i);
            if (score > 0) {
                positiveScores.push({ eggType: i, score, image });
            } else if (score < 0) {
                negativeScores.push({ eggType: i, score, image });
            }
        }

        // gameManager.ts 와 동일한 배치 규칙 적용
        sortOpeningPositiveScores(level, positiveScores);
        
        // openingEggNormalList에 세팅
        let normalIndex = 0;
        for (const item of positiveScores) {
            if (normalIndex < this.openingEggNormalList.length && this.openingEggNormalList[normalIndex] != null) {
                await this.openingEggNormalList[normalIndex].initialize(item.image, item.score);
                this.openingEggNormalList[normalIndex].node.active = true;
                normalIndex++;
            }
        }
        // 나머지는 안 보이게 처리
        for (let i = normalIndex; i < this.openingEggNormalList.length; i++) {
            if (this.openingEggNormalList[i] != null) {
                this.openingEggNormalList[i].node.active = false;
            }
        }
        
        // openingEggNegativeList에 세팅
        let negativeIndex = 0;
        for (const item of negativeScores) {
            if (negativeIndex < this.openingEggNegativeList.length && this.openingEggNegativeList[negativeIndex] != null) {
                await this.openingEggNegativeList[negativeIndex].initialize(item.image, item.score);
                this.openingEggNegativeList[negativeIndex].node.active = true;
                negativeIndex++;
            }
        }
        // 나머지는 안 보이게 처리
        for (let i = negativeIndex; i < this.openingEggNegativeList.length; i++) {
            if (this.openingEggNegativeList[i] != null) {
                this.openingEggNegativeList[i].node.active = false;
            }
        }
    }

    update(deltaTime: number) {
        this.sinElapsedTime += deltaTime * 100;
        
        // 활성화된 openingEggNormalList에 애니메이션 적용
        this.openingEggNormalList.forEach(egg => {
            if (egg?.node.active) {
                egg.node.angle = Math.sin(this.sinElapsedTime * 0.05) * 10;
            }
        });
        
        // 활성화된 openingEggNegativeList에 애니메이션 적용
        this.openingEggNegativeList.forEach(egg => {
            if (egg?.node.active) {
                egg.node.angle = Math.sin(this.sinElapsedTime * 0.05) * 10;
            }
        });

        this.elapsedTime += deltaTime;
        if (this.elapsedTime >= 4) {
            this.gameManager.startNewGame();
        }
    }
}
