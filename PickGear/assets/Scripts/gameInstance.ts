import { _decorator, AudioSource, Component, Node } from 'cc';
import { gameNodeCollection } from './gameNodeCollection';
import { gamePlaying } from './gamePlaying';
import { EGameRootModeState } from './GameMode/gameModeStateEvent';
import { gameModeManager } from './GameMode/gameModeManager';
import { ECharacterSuitType } from './GameDefine';
import { ResourceManager } from './ResourceManager';
const { ccclass, property } = _decorator;

@ccclass('gameInstance')
export class gameInstance extends Component {
    private static _instance: gameInstance = null;

    @property(gameNodeCollection)
    public nodeCollection: gameNodeCollection = null;
    @property(gamePlaying)
    public playing: gamePlaying = null;
    @property(Node)
    public gameBackground: Node = null;
    @property(Node)
    public uiNode: Node = null;
    @property(AudioSource)
    public audioSource: AudioSource = null;
    public gameMode: EGameRootModeState = EGameRootModeState.SelectType;

    public static get I(): gameInstance {
        if (gameInstance._instance === null) {
            console.error('gameInstance Singleton이 초기화되지 않았습니다!');
        }
        return gameInstance._instance;
    }

    // 싱글톤 초기화
    onLoad() {
        if (gameInstance._instance === null) {
            gameInstance._instance = this;
            this.audioSource.node.on(AudioSource.EventType.ENDED, this.onAudioEnded, this);
            console.log('GameManager Singleton이 생성되었습니다.');
        } else {
            // 이미 인스턴스가 존재하면 현재 노드를 파괴
            this.node.destroy();
        }
    }

    // 인스턴스가 파괴될 때 참조 정리
    onDestroy() {
        this.playing.disconnectWebControl();
        if (this.audioUnlockSource) {
            this.audioUnlockSource.node.off(AudioSource.EventType.STARTED, this.onAudioUnlocked, this);
            this.audioUnlockSource.stop();
        }
        this.audioGeneration++;
        this.audioSource.node.off(AudioSource.EventType.ENDED, this.onAudioEnded, this);
        if (gameInstance._instance === this) {
            gameInstance._instance = null;
            console.log('gameInstance Singleton이 파괴되었습니다.');
        }
    }

    start() {
        gameModeManager.I.initialize(this.uiNode, this.node);
        this.playing.connectWebControl();
        gameModeManager.I.rootSelectGameType();
    }

    public startGame(gameType: ECharacterSuitType) {
        if (gameModeManager.I.isRootBusy || this.playing.isSessionActive) return;
        this.playing.setGameType(gameType);
        void gameModeManager.I.rootPlayGame().catch(async (error) => {
            console.error('Failed to start game', error);
            await gameModeManager.I.exitGame();
        });
    }

    public async prepareGameAudio() {
        // 선택 화면에서 AudioSource의 디코딩까지 시작해 첫 클릭 전에 준비한다.
        const clip = await ResourceManager.I.loadAudioClip('sound/Kiss and cry_Game');
        this.audioSource.clip = clip;
        if (typeof document !== 'undefined' && !this.audioUnlockSource) {
            // 재생이 차단되면 Cocos가 첫 canvas touchend/mouseup에 AudioContext를
            // resume하도록 등록한다. 게임 선택 전에 등록해야 두 번째 클릭을 기다리지 않는다.
            const node = new Node('BrowserAudioUnlock');
            this.node.addChild(node);
            const source = node.addComponent(AudioSource);
            this.audioUnlockSource = source;
            source.volume = 0;
            source.clip = clip;
            source.node.on(AudioSource.EventType.STARTED, this.onAudioUnlocked, this);
            source.play();
        }
    }

    public activateGameAudio() {
        // 첫 클릭 안에서 실제 음악을 시작한다. 무음 재생 직후 stop하면
        // 브라우저에 따라 이후의 비동기 유음 재생이 다시 차단될 수 있다.
        if (!this.audioSource.clip) return;
        this.audioSource.volume = 1;
        this.activeAudio.add(this.audioSource);
        this.audioSource.play();
    }

    private audioUnlockSource: AudioSource = null;
    private audioUnlocked = false;
    private readonly onAudioUnlocked = () => {
        this.audioUnlocked = true;
        this.audioUnlockSource.stop();
    };

    public getAudioState() {
        return {
            requested: this.activeAudio.has(this.audioSource),
            playing: this.audioSource.playing,
            paused: this.audioPaused,
            currentTime: this.audioSource.currentTime,
            volume: this.audioSource.volume,
            browserUnlocked: this.audioUnlocked,
        };
    }

    private activeAudio = new Set<AudioSource>();
    private readonly onAudioEnded = (source: AudioSource) => this.activeAudio.delete(source);
    private audioGeneration = 0;
    private audioPaused = false;
    private effectSources: AudioSource[] = [];
    private pausedSources: AudioSource[] = [];

    public async playAudioClip(soundName: string, volume: number = 1, music: boolean = false) {
        const generation = this.audioGeneration;
        const clip = await ResourceManager.I.loadAudioClip(soundName);
        if (generation !== this.audioGeneration) return;
        // 선택 클릭에서 시작한 음악을 준비 단계에서 멈추거나 처음부터 재생하지 않는다.
        // 디코딩/일시정지 중에도 playing 대신 요청의 활성 상태를 확인한다.
        if (music && this.audioSource.clip === clip && this.activeAudio.has(this.audioSource)) return;
        let source = this.audioSource;
        if (!music) {
            // 짧은 효과음도 제어 가능한 AudioSource로 재생한다.
            if (this.audioPaused) return;
            source = this.effectSources.find((item) => !this.activeAudio.has(item));
            if (!source) {
                const effectNode = new Node('GameEffectAudio');
                this.node.addChild(effectNode);
                source = effectNode.addComponent(AudioSource);
                source.node.on(AudioSource.EventType.ENDED, this.onAudioEnded, this);
                this.effectSources.push(source);
            }
        }
        source.stop();
        source.clip = clip;
        source.volume = volume;
        this.activeAudio.add(source);
        if (this.audioPaused) this.pausedSources.push(source);
        else source.play();
    }

    public pauseGameAudio() {
        this.audioPaused = true;
        // clip 디코딩 중인 재생 요청도 pause를 예약해야 한다.
        this.pausedSources = Array.from(this.activeAudio);
        this.pausedSources.forEach((source) => source.pause());
    }

    public resumeGameAudio() {
        this.audioPaused = false;
        this.pausedSources.forEach((source) => { if (this.activeAudio.has(source)) source.play(); });
        this.pausedSources = [];
    }

    public stopGameAudio() {
        this.audioGeneration++;
        this.audioPaused = false;
        this.pausedSources = [];
        this.activeAudio.clear();
        this.audioSource.stop();
        this.effectSources.forEach((source) => source.stop());
    }
}
