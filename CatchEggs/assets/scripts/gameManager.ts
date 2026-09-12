import { _decorator, AudioClip, AudioSource, game, AnimationComponent, BlockInputEvents, Button, Color, Graphics, UITransform, Widget, Tween, Component, instantiate, isValid, Label, Node, ParticleSystem, Prefab, ProgressBar, RichText, Sprite, Vec3 } from 'cc';
import { LoadingNode } from './LoadingNode';
import { DEV } from 'cc/env';
import { ResourceManager } from './ResourceManager';
import { egg } from './egg';
import { EggType, EGameState, EGameMode } from './gameDefine';
import { dragArea } from './dragArea';
import { gameModeData } from './gameModeData';
import { gameManagerExtensions } from './gameManagerExtensions';
import { playStartingNode } from './playStartingNode';
import { richTextMaker } from './richTextMaker';
import { gameProperty } from './gameProperty';
import { midiJsonData } from './midi/midiJsonData';
import { openingEgg } from './openingEgg';
import { sortOpeningPositiveScores } from './openingCharacterOrder';
import { ResultNode } from './ResultNode';
import { basket } from './basket';
const { ccclass, property } = _decorator;

export interface GameControlState {
    status: 'title' | 'playing' | 'paused' | 'ended' | 'exited';
    score: number;
    level: number;
    gameType: number;
    sequence: string;
    elapsedSeconds: number;
    sessionId: number;
    busy: boolean;
}

@ccclass('gameManager')
export class gameManager extends Component {
    private static _instance: gameManager = null;

    // Singleton 인스턴스에 접근하는 getter
    public static get I(): gameManager {
        if (gameManager._instance === null) {
            console.error('gameManager Singleton이 초기화되지 않았습니다!');
        }
        return gameManager._instance;
    }

    onLoad() {
        if (gameManager._instance === null) {
            gameManager._instance = this;
        }
        else {
            this.node.destroy();
            return;
        }

        this.playSound.node.on(AudioSource.EventType.STARTED, this.onMusicStarted, this);
        if (typeof window !== 'undefined') {
            this.debugUIVisible = new URLSearchParams(window.location.search).get('debugGameUI') === '1';
            window.addEventListener('message', this.onParentMessage);
        }
    }

    onDestroy(): void {
        this.playSound?.node.off(AudioSource.EventType.STARTED, this.onMusicStarted, this);
        if (this.audioUnlockSource) {
            this.audioUnlockSource.node.off(AudioSource.EventType.STARTED, this.onBrowserAudioStarted, this);
        }
        this.sessionVersion++;
        this.resumeWaiters.splice(0).forEach(resolve => resolve());
        this.exitUICleanup.splice(0).forEach(cleanup => cleanup());
        if (typeof window !== 'undefined') {
            window.removeEventListener('message', this.onParentMessage);
        }
        if (gameManager._instance === this) {
            gameManager._instance = null;
        }
    }

    private controlsReady: boolean = false;
    private exited: boolean = false;
    private debugUIVisible: boolean = false;
    private parentOrigin: string = null;
    private controlBusy: boolean = false;
    private presentationVersion: number = 0;
    private commandRequests = new Map<string, { command: string; result: Promise<Record<string, unknown>> }>();
    private completedRequests: string[] = [];

    private readonly onParentMessage = (event: MessageEvent): void => {
        if (event.source !== window.parent || !event.data || typeof event.data !== 'object') return;
        const { type, requestId } = event.data;
        const commands = ['PAUSE_GAME', 'RESUME_GAME', 'RESTART_GAME', 'GO_TO_TITLE', 'EXIT_GAME',
            'GET_GAME_STATE', 'SET_DEBUG_UI'];
        if (commands.indexOf(type) < 0) return;
        if (this.parentOrigin !== null && event.origin !== this.parentOrigin) return;
        if (requestId !== undefined && (typeof requestId !== 'string' || requestId.length > 128)) return;
        this.parentOrigin = event.origin;

        const previous = requestId ? this.commandRequests.get(requestId) : null;
        if (previous && previous.command !== type) {
            this.notifyHost({ type: 'GAME_COMMAND_RESULT', command: type, requestId, ok: false, error: 'REQUEST_ID_REUSED' });
            return;
        }
        const result = previous?.result ?? this.executeParentCommand(type, event.data);
        if (requestId && !previous) {
            // 실행 중 요청은 보존하여 재전송으로 게임이 두 번 초기화되지 않게 한다.
            this.commandRequests.set(requestId, { command: type, result });
            void result.then(() => {
                this.completedRequests.push(requestId);
                if (this.completedRequests.length > 100) this.commandRequests.delete(this.completedRequests.shift());
            });
        }
        void result.then((response) => this.notifyHost({
            type: 'GAME_COMMAND_RESULT', command: type, requestId, ...response,
        }));
    };

    private async executeParentCommand(type: string, data: { enabled?: unknown }): Promise<Record<string, unknown>> {
        try {
            switch (type) {
                case 'PAUSE_GAME': this.pauseGame(); break;
                case 'RESUME_GAME': this.resumeGame(); break;
                case 'RESTART_GAME': await this.restartGame(); break;
                case 'GO_TO_TITLE': await this.returnToTitle(); break;
                case 'EXIT_GAME': this.exitGame(); break;
                case 'GET_GAME_STATE': break;
                case 'SET_DEBUG_UI':
                    if (typeof data.enabled !== 'boolean') throw new Error('INVALID_ARGUMENT');
                    this.setDebugUIVisible(data.enabled);
                    break;
            }
            return { ok: true, state: this.getGameState() };
        } catch (error) {
            const reason = error instanceof Error ? error.message : '';
            const expected = ['BUSY', 'INVALID_STATE', 'INVALID_ARGUMENT'].indexOf(reason) >= 0;
            if (!expected) console.error('Parent game command failed', error);
            return { ok: false, error: expected ? reason : 'COMMAND_FAILED', state: this.getGameState() };
        }
    }

    private notifyHost(message: Record<string, unknown>) {
        if (typeof window !== 'undefined' && window.parent !== window) {
            window.parent.postMessage({
                protocol: 'pickgear', version: 1, state: this.getGameState(), ...message,
            }, !this.parentOrigin || this.parentOrigin === 'null' ? '*' : this.parentOrigin);
        }
    }

    public getGameState(): GameControlState {
        const active = this.gameState === EGameState.Prepare || this.gameState === EGameState.PlayStarting || this.gameState === EGameState.Playing;
        const sequences = ['Exited', 'Exited', 'Prepare', 'ShowSuit', 'GameRound', 'EndGame'];
        return {
            status: this.exited ? 'exited' : this.paused ? 'paused' : this.gameState === EGameState.GameOver ? 'ended' : active ? 'playing' : 'title',
            score: this.currentScore,
            level: this.gameMode?.getCurrentLevelFromVersion() ?? 0,
            gameType: this.gameMode?.currentGameMode ?? 0,
            sequence: sequences[this.gameState],
            elapsedSeconds: this.gameState === EGameState.PlayStarting ? (this.playStartingNode.getComponent(playStartingNode)?.elapsedSeconds ?? 0) :
                this.gameState === EGameState.Playing || this.gameState === EGameState.GameOver ? Math.max(0, this.gameMode.getCurrentGameDuration() - this.timeLeft) : 0,
            sessionId: this.sessionVersion,
            busy: this.controlBusy,
        };
    }

    public getGameControlState(): GameControlState { return this.getGameState(); }

    public setDebugUIVisible(visible: boolean): void {
        this.debugUIVisible = visible;
        if (visible) this.ensureExitUI();
        if (this.exitButton) this.exitButton.active = visible && this.gameState === EGameState.Playing;
        this.retryNode.getComponentsInChildren(Button).forEach(button => button.node.active = visible);
        if (!visible && this.exitConfirmation) this.exitConfirmation.active = false;
    }

    @property(gameModeData)
    public gameMode: gameModeData = null;
    @property(Label)
    private currentTimeText: Label = null;
    @property(Label)
    private leftTimeText: Label = null;
    @property(ProgressBar)
    private timeProgressBar: ProgressBar = null;
    @property(Node)
    public eggParent: Node = null;
    @property(Node)
    public eggScoreParent: Node = null;
    @property(Node)
    public eggSpawnPoint_Left: Node = null;
    @property(Node)
    public eggSpawnPoint_Right: Node = null;
    @property(Node)
    public eggEndLine: Node = null;
    @property(Node)
    public selectGameModeNode: Node = null;
    @property(Node)
    public playStartingNode: Node = null;
    @property(Node)
    public playingNode: Node = null;
    @property(Node)
    public prepareNode: Node = null;
    @property(Node)
    private dragAreaNode: dragArea = null;
    @property(Node)
    public retryNode: Node = null;
    @property(Node)
    public retryNodeHeartNormal: Node = null;
    @property(RichText)
    private currentScoreText: RichText = null;
    @property(RichText)
    private currentLevelText: RichText = null;
    @property(RichText)
    private scoreText: RichText = null;
    @property(RichText)
    private coinText: RichText = null;
    @property(Node)
    private basket: Node = null;
    @property(AudioSource)
    public playSound: AudioSource = null;
    @property(AudioClip)
    public eggCatchSound: AudioClip[] = [];
    @property(AudioClip)
    public penaltySound: AudioClip = null;
    @property(AudioClip)
    public missSound: AudioClip = null;
    @property(Sprite)
    private background: Sprite = null;
    @property(Node)
    private OpeningNerdsGroup: Node = null;
    @property(openingEgg)
    private openingEggNormalList: openingEgg[] = [];
    @property(openingEgg)
    private openingEggNegativeList: openingEgg[] = [];
    @property(Node)
    private loadingNode: Node = null;
    private gameState: EGameState = EGameState.None;
    private timeLeft: number = 0;
    private currentScore: number = 0;
    private extensions: gameManagerExtensions = null;
    public perfect: boolean = false;

    private exitButton: Node = null;
    private exitConfirmation: Node = null;
    private exitUICleanup: Array<() => void> = [];
    private paused: boolean = false;
    private pausedAnimations: AnimationComponent[] = [];
    private pausedParticles: Array<{ particle: ParticleSystem, speed: number }> = [];
    private resumeWaiters: Array<() => void> = [];
    private sessionVersion: number = 0;
    private resumeAudio: boolean = false;

    private readonly onMusicStarted = (): void => {
        if (DEV) console.info(`[gameManager] BGM started: ${this.playSound.clip?.name}, time=${this.playSound.currentTime}`);
    };

    private audioUnlockSource: AudioSource = null;
    private browserAudioUnlocked: boolean = false;

    private async prepareBrowserAudio(audioClip: AudioClip): Promise<void> {
        if (typeof document === 'undefined' || !game.canvas || this.browserAudioUnlocked || this.audioUnlockSource) return;
        // 첫 시작 입력 전에 엔진의 오디오 활성화 리스너를 준비한다.
        // 입력 콜백에서 처음 play()를 요청하면 다음 입력까지 대기할 수 있다.
        const node = new Node('BrowserAudioUnlock');
        this.node.addChild(node);
        this.audioUnlockSource = node.addComponent(AudioSource);
        this.audioUnlockSource.volume = 0;
        this.audioUnlockSource.playOnAwake = false;
        this.audioUnlockSource.clip = audioClip;
        this.audioUnlockSource.node.on(AudioSource.EventType.STARTED, this.onBrowserAudioStarted, this);
        await this.audioUnlockSource.getSampleRate();
        if (!isValid(this, true)) return;
        // 재생 완료는 사용자 입력을 기다릴 수 있으므로 await하지 않는다.
        // BGM과 분리하여 대기 중인 활성화 요청이 정지/재시작에 취소되지 않게 한다.
        this.audioUnlockSource.play();
    }

    private readonly onBrowserAudioStarted = (): void => {
        this.browserAudioUnlocked = true;
        if (DEV) console.info('[gameManager] Browser audio unlocked');
        this.audioUnlockSource.stop();
    };

    public get isPaused(): boolean { return this.paused; }
    public get sessionId(): number { return this.sessionVersion; }
    public isSessionCurrent(id: number): boolean {
        return isValid(this, true) && id === this.sessionVersion && !this.exited &&
            (this.gameState === EGameState.Playing || this.gameState === EGameState.Prepare || this.gameState === EGameState.PlayStarting);
    }

    public async waitUntilRunning(id: number): Promise<boolean> {
        while (this.isSessionCurrent(id) && this.paused) {
            await new Promise<void>(resolve => this.resumeWaiters.push(resolve));
        }
        return this.isSessionCurrent(id);
    }

    private setPaused(paused: boolean): void {
        this.paused = paused;
        if (paused) {
            this.pausedAnimations = [this.prepareNode, this.playStartingNode, this.playingNode].reduce((all, node) => all.concat(node.getComponentsInChildren(AnimationComponent)), [] as AnimationComponent[])
                .filter(animation => animation.clips.some(clip => clip && animation.getState(clip.name)?.isPlaying));
            this.pausedAnimations.forEach(animation => animation.pause());
            this.pausedParticles = this.playingNode.getComponentsInChildren(ParticleSystem)
                .map(particle => ({ particle, speed: particle.simulationSpeed }));
            this.pausedParticles.forEach(({ particle }) => particle.simulationSpeed = 0);
        } else {
            this.pausedAnimations.forEach(animation => { if (isValid(animation, true)) animation.resume(); });
            this.pausedParticles.forEach(({ particle, speed }) => {
                if (isValid(particle, true)) particle.simulationSpeed = speed;
            });
            this.pausedAnimations = [];
            this.pausedParticles = [];
            this.resumeWaiters.splice(0).forEach(resolve => resolve());
        }
        const visit = (node: Node): void => {
            if (paused) Tween.pauseAllByTarget(node);
            else Tween.resumeAllByTarget(node);
            node.children.forEach(visit);
        };
        [this.prepareNode, this.playStartingNode, this.playingNode].forEach(visit);
    }

    private requireControl(allowed: boolean): void {
        if (this.controlBusy) throw new Error('BUSY');
        if (!allowed) throw new Error('INVALID_STATE');
    }

    public pauseGame(): GameControlState {
        this.requireControl(this.isSessionCurrent(this.sessionId));
        if (!this.paused) {
            this.resumeAudio = !!this.playSound.clip;
            this.playSound.pause();
            this.setPaused(true);
            this.notifyHost({ type: 'GAME_PAUSED' });
        }
        return this.getGameState();
    }

    public resumeGame(): GameControlState {
        this.requireControl(this.isSessionCurrent(this.sessionId));
        if (this.paused) {
            if (this.exitConfirmation) this.exitConfirmation.active = false;
            this.setPaused(false);
            if (this.resumeAudio && this.gameState !== EGameState.Prepare) this.playSound.play();
            this.resumeAudio = false;
            this.notifyHost({ type: 'GAME_RESUMED' });
        }
        return this.getGameState();
    }

    public async restartGame(): Promise<GameControlState> {
        this.requireControl(this.paused || this.gameState === EGameState.GameOver);
        this.controlBusy = true;
        try {
            this.resetCurrentRun();
            // 준비 중 로드를 취소한 경우에도 같은 모드를 다시 준비한다.
            await this.completeSelectGameMode();
            await this.startPlayStarting();
        } catch (error) {
            this.resetCurrentRun();
            this.selectGameMode();
            throw error;
        } finally { this.controlBusy = false; }
        this.notifyHost({ type: 'GAME_RESTARTED' });
        return this.getGameState();
    }

    public async returnToTitle(): Promise<GameControlState> {
        this.requireControl(true);
        this.controlBusy = true;
        try {
            this.resetCurrentRun();
            this.selectGameMode();
        } finally { this.controlBusy = false; }
        this.notifyHost({ type: 'GAME_TITLE' });
        return this.getGameState();
    }

    public exitGame(): GameControlState {
        this.requireControl(true);
        this.resetCurrentRun();
        this.exited = true;
        this.gameState = EGameState.None;
        this.selectGameModeNode.active = false;
        this.playStartingNode.active = false;
        this.playingNode.active = false;
        this.prepareNode.active = false;
        this.retryNode.active = false;
        this.loadingNode.active = false;
        this.notifyHost({ type: 'GAME_EXITED' });
        return this.getGameState();
    }

    public onTouchExitButton(): void {
        if (!this.debugUIVisible || !this.pauseGame()) return;
        this.ensureExitUI();
        this.exitConfirmation.setSiblingIndex(this.playingNode.children.length - 1);
        this.exitConfirmation.active = true;
    }

    private continueGame(): void { this.resumeGame(); }

    private confirmExit(): void { void this.returnToTitle().catch(error => console.error('Return to title failed', error)); }

    private resetCurrentRun(): void {
        // 이전 비동기 스폰을 먼저 무효화한 뒤 일시정지 대기 작업을 해제한다.
        this.sessionVersion++;
        this.presentationVersion++;
        if (this.exitConfirmation) this.exitConfirmation.active = false;
        if (this.exitButton) this.exitButton.active = false;
        if (this.paused) this.setPaused(false);
        this.playSound.stop();
        this.resumeAudio = false;
        for (const parent of [this.eggParent, this.eggScoreParent]) {
            parent.children.slice().forEach(child => child.destroy());
            parent.removeAllChildren();
        }
        this.playingNode.getComponentsInChildren(ParticleSystem).forEach(particle => particle.stop());
        this.playingNode.getComponentsInChildren(AnimationComponent).forEach(animation => animation.stop());
        this.currentScore = this.currentComboScore = this.timeLeft = 0;
        this.perfect = false;
        this.isSpawningEgg = false;
        this.leftTimeToSpawnEgg = 1;
        this.extensions?.resetSpawnState();
        this.basket.getComponent(basket).initialize();
        this.timeProgressBar.progress = 1;
    }

    private ensureExitUI(): void {
        if (this.exitButton) return;
        this.exitButton = this.createExitAction(this.playingNode, 'ExitButton', '나가기', 132, 58,
            new Color(40, 36, 55, 235), () => this.onTouchExitButton());
        const placement = this.exitButton.addComponent(Widget);
        placement.isAlignTop = true;
        placement.isAlignRight = true;
        // 점수 그룹(top 57, height 50) 아래에 12px 간격을 둔다.
        placement.top = 119;
        placement.right = 20;
        placement.alignMode = Widget.AlignMode.ALWAYS;

        this.exitConfirmation = this.createExitPanel(this.playingNode, 'ExitConfirmation', 720, 1280,
            new Color(15, 12, 25, 190));
        const stretch = this.exitConfirmation.addComponent(Widget);
        stretch.isAlignTop = stretch.isAlignBottom = true;
        stretch.isAlignLeft = stretch.isAlignRight = true;
        stretch.top = stretch.bottom = stretch.left = stretch.right = 0;
        stretch.alignMode = Widget.AlignMode.ALWAYS;
        this.exitConfirmation.addComponent(BlockInputEvents);
        const card = this.createExitPanel(this.exitConfirmation, 'ExitCard', 600, 350, new Color(255, 251, 247));
        this.createExitLabel(card, '게임을 나갈까요?', 38, 560, 60).setPosition(0, 95);
        this.createExitLabel(card, '진행 중인 점수는 사라집니다.', 26, 560, 50).setPosition(0, 25);
        this.createExitAction(card, 'ContinueButton', '계속하기', 240, 76,
            new Color(67, 53, 102), () => this.continueGame()).setPosition(-132, -90);
        this.createExitAction(card, 'ConfirmExitButton', '나가기', 240, 76,
            new Color(161, 54, 75), () => this.confirmExit()).setPosition(132, -90);
        this.exitConfirmation.active = false;
        this.exitButton.active = false;
    }

    private createExitPanel(parent: Node, name: string, width: number, height: number, color: Color): Node {
        const node = new Node(name);
        node.layer = parent.layer;
        parent.addChild(node);
        node.addComponent(UITransform).setContentSize(width, height);
        const graphic = node.addComponent(Graphics);
        const draw = () => {
            const size = node.getComponent(UITransform).contentSize;
            graphic.clear();
            graphic.fillColor = color;
            graphic.roundRect(-size.width / 2, -size.height / 2, size.width, size.height, 16);
            graphic.fill();
        };
        node.on(Node.EventType.SIZE_CHANGED, draw);
        this.exitUICleanup.push(() => node.off(Node.EventType.SIZE_CHANGED, draw));
        draw();
        return node;
    }

    private createExitLabel(parent: Node, text: string, fontSize: number, width: number, height: number): Node {
        const node = new Node('Label');
        node.layer = parent.layer;
        parent.addChild(node);
        node.addComponent(UITransform).setContentSize(width, height);
        const label = node.addComponent(Label);
        label.string = text;
        label.fontSize = fontSize;
        label.lineHeight = fontSize + 8;
        label.color = new Color(40, 36, 55);
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        return node;
    }

    private createExitAction(parent: Node, name: string, text: string, width: number, height: number,
        color: Color, action: () => void): Node {
        const node = this.createExitPanel(parent, name, width, height, color);
        node.addComponent(Button);
        this.createExitLabel(node, text, 28, width, height).getComponent(Label).color = Color.WHITE;
        node.on(Button.EventType.CLICK, action);
        this.exitUICleanup.push(() => node.off(Button.EventType.CLICK, action));
        return node;
    }

    public markNotPerfect(reason: string) {
        // 한 번이라도 실패 조건이 발생하면 false로 고정
        if (this.perfect) {
            console.log(`[perfect] broken: ${reason}`);
        }
        this.perfect = false;
    }
    async start() {
        this.loadingNode.active = true;

        this.extensions = this.node.addComponent(gameManagerExtensions);
        await this.extensions.initialize(this);
        if (this.gameState === EGameState.None && !this.exited) this.selectGameMode();
        this.setDebugUIVisible(this.debugUIVisible);
        this.controlsReady = true;

        const midiData: midiJsonData = new midiJsonData();
        await midiData.loadMidiJsonData();
        await this.loadingNode.getComponent(LoadingNode).whenReady();
        this.notifyHost({ type: 'GAME_READY' });
    }

    update(deltaTime: number) {
        if (this.paused) return;
        if (this.gameState == EGameState.Prepare) {
            this.updatePrepare(deltaTime);
        }
        else if (this.gameState == EGameState.PlayStarting) {
            this.updatePlayStarting(deltaTime);
        }
        else if (this.gameState == EGameState.Playing) {
            // async 함수의 예외가 unhandledrejection으로 튀면 "멈춘 것처럼" 보일 수 있어 여기서 흡수/로그
            this.updatePlaying(deltaTime).catch((err) => {
                console.error("[gameManager] updatePlaying error:", err);
            });
        }
        else if (this.gameState == EGameState.GameOver) {
            this.updateGameOver(deltaTime);
        }
    }

    private selectGameMode() {
        this.exited = false;
        this.gameState = EGameState.SelectGameMode;
        this.selectGameModeNode.active = true;
        this.playStartingNode.active = false;
        this.playingNode.active = false;
        this.prepareNode.active = false;
        this.retryNode.active = false;
    }

    public async completeSelectGameMode(): Promise<void> {
        const version = ++this.presentationVersion;
        this.exited = false;
        this.gameState = EGameState.Prepare;
        const soundName = this.gameMode.getCurrentGameBgName();
        try {
            const [background, audioClip] = await Promise.all([
                this.gameMode.getCurrentBackground(),
                ResourceManager.I.loadAudioClip(soundName),
            ]);
            if (version !== this.presentationVersion) return;
            this.background.spriteFrame = background;
            this.playSound.stop();
            this.playSound.clip = audioClip;
            // clip 할당 후 내부 플레이어도 비동기로 준비된다.
            // 공개 API의 완료를 기다려 시작 버튼 클릭 시 바로 재생할 수 있게 한다.
            await Promise.all([
                this.playSound.getSampleRate(),
                this.prepareBrowserAudio(audioClip),
            ]);
            if (version !== this.presentationVersion) return;
            await this.prepareGame();
        } catch (error) {
            console.error(`[gameManager] 모드 준비 실패 (${soundName}):`, error);
            if (version === this.presentationVersion) this.selectGameMode();
            if (this.controlBusy) throw error;
        }
    }

    private async prepareGame() {
        this.gameState = EGameState.Prepare;
        this.selectGameModeNode.active = false;
        this.playStartingNode.active = false;
        this.playingNode.active = false;
        this.prepareNode.active = true;
        this.retryNode.active = false;
        this.basket.getComponent(basket).initialize();
        this.perfect = true;
        this.currentScore = 0;
        this.currentComboScore = 0;
        this.scoreText.string = new richTextMaker(this.currentScore.toString(), "#020202", 3, "").resultText;
        this.coinText.string = new richTextMaker("00", "#020202", 3, "").resultText;
        this.currentScoreText.string = new richTextMaker(this.currentScore.toString(), "#020202", 3, "").resultText;
        this.currentLevelText.string = new richTextMaker("LV." + this.gameMode.getCurrentLevelFromVersion().toString(), "#020202", 3, "").resultText;
        await this.setOpeningCharacter();
    }

    private async setOpeningCharacter() {
        const version = this.presentationVersion;
        const level = this.gameMode.getCurrentLevelFromVersion();
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

        // 레벨별 고정 배치 규칙 적용 (playStartingNode 와 동일)
        sortOpeningPositiveScores(level, positiveScores);

        // openingEggNormalList에 세팅
        let normalIndex = 0;
        for (const item of positiveScores) {
            if (normalIndex < this.openingEggNormalList.length && this.openingEggNormalList[normalIndex] != null) {
                await this.openingEggNormalList[normalIndex].initialize(item.image, item.score, () => version === this.presentationVersion);
                if (version !== this.presentationVersion) return;
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
                await this.openingEggNegativeList[negativeIndex].initialize(item.image, item.score, () => version === this.presentationVersion);
                if (version !== this.presentationVersion) return;
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

    private updatePrepare(deltaTime: number) {
        if (this.gameState != EGameState.Prepare) {
            return;
        }
    }

    private updatePlayStarting(deltaTime: number) {
        if (this.gameState != EGameState.PlayStarting) {
            return;
        }
    }

    public async startPlayStarting(): Promise<void> {
        if (this.paused || this.gameState !== EGameState.Prepare) return;
        const version = this.presentationVersion;
        // 모드 준비/다시하기에서 이미 정지했다. 여기서 stop을 넣으면
        // 엔진의 비동기 큐가 play를 입력 콜백 밖으로 미룰 수 있다.
        this.playSound.play();
        this.gameState = EGameState.PlayStarting;
        this.playStartingNode.active = true;
        const initialization = this.playStartingNode.getComponent(playStartingNode).initialize(this).catch(error => {
            if (version !== this.presentationVersion) return;
            console.error('[gameManager] 시작 연출 준비 실패:', error);
            this.playSound.stop();
            this.selectGameMode();
            if (this.controlBusy) throw error;
        });
        this.playingNode.active = false;
        this.prepareNode.active = false;
        this.retryNode.active = false;
        await initialization;
    }

    public startNewGame(): void {
        if (this.paused || this.gameState !== EGameState.PlayStarting) {
            return;
        }

        this.sessionVersion++;
        this.gameState = EGameState.Playing;
        this.ensureExitUI();
        this.exitButton.active = this.debugUIVisible;
        this.exitButton.setSiblingIndex(this.playingNode.children.length - 1);
        this.playStartingNode.active = false;
        this.playingNode.active = true;
        this.prepareNode.active = false;
        this.perfect = true;
        this.timeLeft = this.gameMode.getCurrentGameDuration();
        this.retryNode.active = false;
        this.currentScore = 0;
        this.scoreText.string = new richTextMaker(this.currentScore.toString(), "#020202", 3, "").resultText;
        this.coinText.string = new richTextMaker("00", "#020202", 3, "").resultText;
        this.currentScoreText.string = new richTextMaker(this.currentScore.toString(), "#020202", 3, "").resultText;
        this.currentLevelText.string = new richTextMaker("LV." + this.gameMode.getCurrentLevelFromVersion().toString(), "#020202", 3, "").resultText;

        this.notifyHost({ type: 'GAME_START' });
    }

    private isSpawningEgg: boolean = false;
    private leftTimeToSpawnEgg: number = 1;
    private async updatePlaying(deltaTime: number) {
        if (this.gameState != EGameState.Playing) {
            return;
        }

        const session = this.sessionId;
        const totalDuration = this.gameMode.getCurrentGameDuration();
        this.leftTimeToSpawnEgg -= deltaTime;
        // 끝나기 1초전까지 스폰시킨다
        if (this.leftTimeToSpawnEgg <= 0 && this.timeLeft - 2 > 0 && this.isSpawningEgg == false) {
            this.isSpawningEgg = true;
            try {
                const spawnTime = await this.extensions.spawnRandomEgg(this.timeLeft, totalDuration, this.gameMode.currentGameMode);
                if (!await this.waitUntilRunning(session)) return;
                this.leftTimeToSpawnEgg = spawnTime;
            }
            finally {
                if (this.isSessionCurrent(session)) this.isSpawningEgg = false;
            }
        }
        this.timeLeft -= deltaTime;
        this.timeProgressBar.progress = this.timeLeft / totalDuration;
        if (this.timeLeft <= 0) {
            this.timeLeft = 0;
            this.gameOver();
            return;
        }
        this.checkEggsInBasket();
        const formatTime = (time: number): string => {
            const integer = Math.floor(Math.max(0, time));
            const decimal = (time - integer).toFixed(2).substring(1);
            const integerStr = integer.toString();
            const paddedInteger = integerStr.length < 2 ? '0' + integerStr : integerStr;
            return paddedInteger + decimal;
        };
        this.currentTimeText.string = formatTime(totalDuration - this.timeLeft);
        this.leftTimeText.string = formatTime(this.timeLeft);
    }

    private gameOver(): void {
        if (this.gameState === EGameState.GameOver) {
            return;
        }

        this.sessionVersion++;
        this.gameState = EGameState.GameOver;
        if (this.exitButton) this.exitButton.active = false;
        this.eggParent.children.forEach(child => {
            child.destroy();
        });
        this.eggParent.removeAllChildren();
        this.playStartingNode.active = false;
        this.playingNode.active = false;
        this.prepareNode.active = false;
        this.retryNode.active = true;
        this.setDebugUIVisible(this.debugUIVisible);
        this.retryNode.getComponent(ResultNode).initialize(this);
        this.scoreText.string = new richTextMaker(this.currentScore.toString(), "#020202", 3, "").resultText;
        this.coinText.string = new richTextMaker("00", "#020202", 3, "").resultText;
        this.gameMode.resultGame();

        this.notifyHost({ type: 'GAME_OVER', score: this.currentScore });
    }

    private updateGameOver(deltaTime: number) {
        if (this.gameState != EGameState.GameOver) {
            return;
        }
    }

    public onHomeButtonClick(): void {
        void this.returnToTitle().catch(error => console.error('Return to title failed', error));
    }

    public onRetryButtonClick(): void {
        void this.restartGame().catch(error => console.error('Restart failed', error));
    }

    private currentComboScore: number = 0;
    private checkEggsInBasket() {
        // 안전 가드: 씬 세팅/파괴 타이밍 이슈로 null/invalid가 될 수 있음
        if (!isValid(this.eggParent, true) || !isValid(this.basket, true)) {
            return;
        }

        const eggInBasket: Node[] = [];
        for (const eggNode of this.eggParent.children) {
            if (!isValid(eggNode, true) || !eggNode.activeInHierarchy) {
                continue;
            }
            // 서로 다른 부모를 가질 수 있으니 월드 좌표 기준으로 계산
            const distance: number = Vec3.distance(eggNode.worldPosition, this.basket.worldPosition);
            if (distance < 100) {
                console.log("egg in basket : " + eggNode.name);
                this.processEggCatch(eggNode);
                eggInBasket.push(eggNode);
                break;
            }
        }

        if (eggInBasket.length > 0) {
            for (const eggNode of eggInBasket) {
                eggNode.removeFromParent();
                eggNode.destroy();
            }
        }
    }

    private processEggCatch(eggNode: Node) {
        const level = this.gameMode.getCurrentLevelFromVersion();
        const currentEggScore = eggNode.getComponent(egg).getCurrentScore(level);
        // 잘못 받은(패널티) 경우 바구니를 빨갛게 1초 표시
        if (currentEggScore < 0 && isValid(this.basket, true)) {
            this.markNotPerfect("caught_negative_egg");
            const basketComp = this.basket.getComponent(basket);
            if (basketComp) {
                basketComp.flashRed(1);
            }
        }
        if (currentEggScore > 0) {
            this.currentComboScore += currentEggScore;
        }
        else {
            this.currentComboScore = currentEggScore;
        }
        this.currentScore += this.currentComboScore;
        if (this.currentScore < 0) {
            this.currentScore = 0;
        }
        this.currentScoreText.string = new richTextMaker(this.currentScore.toString(), "#020202", 3, "").resultText;
        const eggComponent = eggNode.getComponent(egg);
        eggComponent.onEggCatch(this.currentComboScore);
        if (this.currentComboScore < 0) {
            this.currentComboScore = 0;
        }
    }

    public resetComboScore() {
        this.currentComboScore = 0;
    }

    public onDragAreaTouchMove(x: number, y: number) {
        if (this.paused || this.gameState !== EGameState.Playing) return;
        y = -410;
        // if (y > 0) {
        //     y = -170;
        // }
        // else if (y < -2) {
        //     y = -2;
        // }
        if (x > 300) {
            x = 300;
        }
        else if (x < -300) {
            x = -300;
        }
        if (isValid(this.basket, true)) {
            this.basket.setPosition(x, y, 0);
        }
    }
}
