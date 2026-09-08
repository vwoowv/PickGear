import {
    _decorator,
    AudioClip,
    AudioSource,
    Camera,
    Canvas,
    Color,
    Component,
    EventKeyboard,
    Font,
    Graphics,
    input,
    Input,
    JsonAsset,
    KeyCode,
    Label,
    Layers,
    Node,
    ResolutionPolicy,
    resources,
    Sprite,
    SpriteFrame,
    tween,
    UIOpacity,
    UITransform,
    Vec3,
    view,
} from 'cc';
import {
    AudioAnalysisChart,
    BeatEvent,
    buildAudioEvents,
    buildGuideCues,
    GuideCue,
} from './RhythmChart';

const { ccclass } = _decorator;

enum GameState {
    Loading,
    Ready,
    Playing,
    Result,
}

enum EventState {
    Pending,
    Hit,
    Missed,
    Avoided,
}

interface RuntimeEvent {
    beat: BeatEvent;
    state: EventState;
    node: Node | null;
}

interface LoadedAssets {
    background: SpriteFrame;
    basket: SpriteFrame;
    dangerBasket: SpriteFrame;
    perfectEnding: SpriteFrame;
    scoreBackground: SpriteFrame;
    retry: SpriteFrame;
    characters: SpriteFrame[];
    dangerCharacter: SpriteFrame;
    music: AudioClip;
    hit: AudioClip;
    miss: AudioClip;
    danger: AudioClip;
    guideTick: AudioClip;
    guideReady: AudioClip;
    font: Font;
    chart: AudioAnalysisChart;
}

@ccclass('BeatBasketGame')
export class BeatBasketGame extends Component {
    private readonly designWidth = 720;
    private readonly designHeight = 1280;
    private readonly leadTime = 1.2;
    private readonly perfectWindow = 0.1;
    private readonly goodWindow = 0.22;
    private readonly spawnY = 420;
    private readonly hitY = -350;
    private readonly laneX = [-220, -110, 0, 110, 220];

    private state = GameState.Loading;
    private loaded: LoadedAssets | null = null;
    private runtimeEvents: RuntimeEvent[] = [];
    private guideCues: GuideCue[] = [];
    private nextSpawnIndex = 0;
    private nextGuideCueIndex = 0;
    private completedEvents = 0;

    private musicSource: AudioSource = null;
    private effectSource: AudioSource = null;
    private guideSource: AudioSource = null;
    private gameLayer: Node = null;
    private effectLayer: Node = null;
    private overlayLayer: Node = null;
    private basketNode: Node = null;
    private basketSprite: Sprite = null;
    private scoreLabel: Label = null;
    private comboLabel: Label = null;
    private judgementLabel: Label = null;
    private progressLabel: Label = null;

    private score = 0;
    private combo = 0;
    private maxCombo = 0;
    private perfectCount = 0;
    private goodCount = 0;
    private missCount = 0;
    private strayTapCount = 0;
    private lastStrayTapTime = Number.NEGATIVE_INFINITY;

    protected onLoad(): void {
        view.setDesignResolutionSize(this.designWidth, this.designHeight, ResolutionPolicy.FIXED_HEIGHT);
        view.resizeWithBrowserSize(true);

        this.setupCanvas();
        this.musicSource = this.node.addComponent(AudioSource);
        this.effectSource = this.node.addComponent(AudioSource);
        this.guideSource = this.node.addComponent(AudioSource);
        this.buildStaticUi();

        input.on(Input.EventType.TOUCH_END, this.onTap, this);
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    }

    protected async start(): Promise<void> {
        try {
            this.loaded = await this.loadAssets();
            this.applyLoadedAssets();
            this.showReadyOverlay();
            this.state = GameState.Ready;
        } catch (error) {
            console.error('[BeatBasketGame] Failed to load prototype assets.', error);
            this.showFatalError();
        }
    }

    protected update(): void {
        if (this.state !== GameState.Playing || !this.loaded) {
            return;
        }

        const songTime = this.musicSource.currentTime;
        this.playDueGuideCues(songTime);
        this.spawnDueEvents(songTime);
        this.updateActiveEvents(songTime);
        this.updateProgress(songTime);

        if (this.completedEvents >= this.runtimeEvents.length) {
            this.finishGame();
        }
    }

    protected onDestroy(): void {
        input.off(Input.EventType.TOUCH_END, this.onTap, this);
        input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    }

    private setupCanvas(): void {
        this.node.layer = Layers.Enum.UI_2D;
        this.node.setPosition(this.designWidth * 0.5, this.designHeight * 0.5, 0);
        this.getComponent(UITransform)?.setContentSize(this.designWidth, this.designHeight);

        const canvas = this.getComponent(Canvas);
        const camera = this.node.getComponentInChildren(Camera);
        if (camera) {
            camera.orthoHeight = this.designHeight * 0.5;
            camera.node.setPosition(0, 0, 1000);
            canvas.cameraComponent = camera;
        }
    }

    private buildStaticUi(): void {
        const backgroundNode = this.createSpriteNode('Background', this.node, this.designWidth, this.designHeight);
        backgroundNode.setSiblingIndex(0);

        const shade = this.createGraphicsNode('Shade', this.node);
        const shadeGraphics = shade.getComponent(Graphics);
        shadeGraphics.fillColor = new Color(12, 20, 27, 55);
        shadeGraphics.rect(-this.designWidth * 0.5, -this.designHeight * 0.5, this.designWidth, this.designHeight);
        shadeGraphics.fill();

        this.gameLayer = this.createNode('GameLayer', this.node);
        this.effectLayer = this.createNode('EffectLayer', this.node);
        this.overlayLayer = this.createNode('OverlayLayer', this.node);

        const topPanel = this.createGraphicsNode('TopPanel', this.node);
        const topGraphics = topPanel.getComponent(Graphics);
        topGraphics.fillColor = new Color(22, 31, 42, 210);
        topGraphics.roundRect(-330, 455, 660, 150, 30);
        topGraphics.fill();

        this.createLabelNode('Title', this.node, 'GROOVE BASKET', 44, new Vec3(0, 560), new Color(255, 237, 133));
        this.scoreLabel = this.createLabelNode('Score', this.node, 'SCORE 000000', 34, new Vec3(-180, 500), Color.WHITE).getComponent(Label);
        this.comboLabel = this.createLabelNode('Combo', this.node, 'COMBO 0', 30, new Vec3(190, 500), new Color(137, 239, 255)).getComponent(Label);
        this.progressLabel = this.createLabelNode('Progress', this.node, '00.00', 23, new Vec3(0, 458), new Color(220, 228, 235)).getComponent(Label);

        const hitLine = this.createGraphicsNode('HitLine', this.node);
        const hitGraphics = hitLine.getComponent(Graphics);
        hitGraphics.lineWidth = 7;
        hitGraphics.strokeColor = new Color(255, 235, 117, 230);
        hitGraphics.moveTo(-290, this.hitY);
        hitGraphics.lineTo(290, this.hitY);
        hitGraphics.stroke();

        this.basketNode = this.createSpriteNode('Basket', this.node, 360, 172);
        this.basketNode.setPosition(0, -470);
        this.basketSprite = this.basketNode.getComponent(Sprite);

        this.judgementLabel = this.createLabelNode(
            'Judgement',
            this.node,
            '',
            64,
            new Vec3(0, -180),
            Color.WHITE,
        ).getComponent(Label);
        this.judgementLabel.node.active = false;

        this.showLoadingOverlay();
    }

    private async loadAssets(): Promise<LoadedAssets> {
        const [
            background,
            basket,
            dangerBasket,
            perfectEnding,
            scoreBackground,
            retry,
            dangerCharacter,
            music,
            hit,
            miss,
            danger,
            guideTick,
            guideReady,
            font,
            chartAsset,
            ...characters
        ] = await Promise.all([
            this.loadSprite('images/background/spriteFrame'),
            this.loadSprite('images/basket/spriteFrame'),
            this.loadSprite('images/red_basket/spriteFrame'),
            this.loadSprite('images/ui/perfect_ending/spriteFrame'),
            this.loadSprite('images/ui/score_background/spriteFrame'),
            this.loadSprite('images/ui/retry/spriteFrame'),
            this.loadSprite('images/characters/danger/spriteFrame'),
            this.loadAudio('audio/music_stage1'),
            this.loadAudio('audio/hit'),
            this.loadAudio('audio/miss'),
            this.loadAudio('audio/danger'),
            this.loadAudio('guide_audio/guide_tick'),
            this.loadAudio('guide_audio/guide_ready'),
            this.loadFont('fonts/LilitaOne-Regular'),
            this.loadJson('audio_chart_stage1'),
            this.loadSprite('images/characters/doarin/spriteFrame'),
            this.loadSprite('images/characters/emma/spriteFrame'),
            this.loadSprite('images/characters/happy/spriteFrame'),
            this.loadSprite('images/characters/howsam/spriteFrame'),
            this.loadSprite('images/characters/soohana/spriteFrame'),
        ]);

        return {
            background: background as SpriteFrame,
            basket: basket as SpriteFrame,
            dangerBasket: dangerBasket as SpriteFrame,
            perfectEnding: perfectEnding as SpriteFrame,
            scoreBackground: scoreBackground as SpriteFrame,
            retry: retry as SpriteFrame,
            characters: characters as SpriteFrame[],
            dangerCharacter: dangerCharacter as SpriteFrame,
            music: music as AudioClip,
            hit: hit as AudioClip,
            miss: miss as AudioClip,
            danger: danger as AudioClip,
            guideTick: guideTick as AudioClip,
            guideReady: guideReady as AudioClip,
            font: font as Font,
            chart: chartAsset.json as unknown as AudioAnalysisChart,
        };
    }

    private applyLoadedAssets(): void {
        if (!this.loaded) {
            return;
        }

        this.node.getChildByName('Background').getComponent(Sprite).spriteFrame = this.loaded.background;
        this.basketSprite.spriteFrame = this.loaded.basket;
        this.musicSource.clip = this.loaded.music;
        this.musicSource.loop = false;
        this.musicSource.volume = 0.82;

        for (const label of this.node.getComponentsInChildren(Label)) {
            label.font = this.loaded.font;
        }
    }

    private startGame(): void {
        if (!this.loaded) {
            return;
        }

        this.clearLayer(this.gameLayer);
        this.clearLayer(this.effectLayer);
        this.clearLayer(this.overlayLayer);

        const beatEvents = buildAudioEvents(this.loaded.chart);
        this.runtimeEvents = beatEvents.map((beat) => ({
            beat,
            state: EventState.Pending,
            node: null,
        }));
        this.guideCues = buildGuideCues(this.loaded.chart, beatEvents);
        this.nextSpawnIndex = 0;
        this.nextGuideCueIndex = 0;
        this.completedEvents = 0;
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.perfectCount = 0;
        this.goodCount = 0;
        this.missCount = 0;
        this.strayTapCount = 0;
        this.lastStrayTapTime = Number.NEGATIVE_INFINITY;
        this.updateHud();
        this.basketNode.setPosition(0, -470);
        this.basketSprite.spriteFrame = this.loaded.basket;

        this.state = GameState.Playing;
        this.musicSource.stop();
        this.musicSource.currentTime = 0;
        this.musicSource.play();
        this.showJudgement('LISTEN, THEN TAP!', new Color(255, 237, 133));
    }

    private playDueGuideCues(songTime: number): void {
        while (this.nextGuideCueIndex < this.guideCues.length) {
            const cue = this.guideCues[this.nextGuideCueIndex];
            if (cue.time > songTime) {
                break;
            }

            if (songTime - cue.time <= 0.12) {
                this.guideSource.playOneShot(
                    cue.accent ? this.loaded.guideReady : this.loaded.guideTick,
                    cue.accent ? 0.82 : 0.58,
                );
            }
            this.nextGuideCueIndex++;
        }
    }

    private spawnDueEvents(songTime: number): void {
        while (this.nextSpawnIndex < this.runtimeEvents.length) {
            const runtimeEvent = this.runtimeEvents[this.nextSpawnIndex];
            if (runtimeEvent.beat.hitTime - songTime > this.leadTime) {
                break;
            }
            runtimeEvent.node = this.createFallingCharacter(runtimeEvent.beat);
            this.nextSpawnIndex++;
        }
    }

    private updateActiveEvents(songTime: number): void {
        for (const runtimeEvent of this.runtimeEvents) {
            if (runtimeEvent.state !== EventState.Pending || !runtimeEvent.node) {
                continue;
            }

            const timeToHit = runtimeEvent.beat.hitTime - songTime;
            const progress = this.clamp01(1 - timeToHit / this.leadTime);
            const eased = progress * progress * (3 - 2 * progress);
            const x = this.laneX[runtimeEvent.beat.id % this.laneX.length];
            const y = this.spawnY + (this.hitY - this.spawnY) * eased;
            runtimeEvent.node.setPosition(x, y);
            runtimeEvent.node.setScale(0.58 + progress * 0.32, 0.58 + progress * 0.32, 1);

            if (timeToHit < -this.goodWindow) {
                if (runtimeEvent.beat.isDanger) {
                    this.resolveAvoid(runtimeEvent);
                } else {
                    this.resolveMiss(runtimeEvent, 'MISS');
                }
            }
        }
    }

    private handleGameplayTap(): void {
        const songTime = this.musicSource.currentTime;
        let nearest: RuntimeEvent | null = null;
        let nearestDistance = Number.POSITIVE_INFINITY;

        for (const runtimeEvent of this.runtimeEvents) {
            if (runtimeEvent.state !== EventState.Pending || !runtimeEvent.node) {
                continue;
            }
            const distance = Math.abs(runtimeEvent.beat.hitTime - songTime);
            if (distance < nearestDistance) {
                nearest = runtimeEvent;
                nearestDistance = distance;
            }
        }

        if (!nearest || nearestDistance > this.goodWindow) {
            if (songTime - this.lastStrayTapTime > 0.25) {
                this.lastStrayTapTime = songTime;
                this.strayTapCount++;
                this.combo = 0;
                this.effectSource.playOneShot(this.loaded.miss, 0.35);
                this.showJudgement('WAIT!', new Color(205, 216, 225));
                this.updateHud();
            }
            return;
        }

        if (nearest.beat.isDanger) {
            this.resolveMiss(nearest, 'DON\'T TAP!');
            this.effectSource.playOneShot(this.loaded.danger, 0.55);
            return;
        }

        if (nearestDistance <= this.perfectWindow) {
            this.resolveHit(nearest, true);
        } else {
            this.resolveHit(nearest, false);
        }
    }

    private resolveHit(runtimeEvent: RuntimeEvent, perfect: boolean): void {
        runtimeEvent.state = EventState.Hit;
        this.completedEvents++;
        this.combo++;
        this.maxCombo = Math.max(this.maxCombo, this.combo);

        if (perfect) {
            this.perfectCount++;
            this.score += 100 + Math.min(100, this.combo * 2);
            this.showJudgement('PERFECT!', new Color(255, 238, 92));
        } else {
            this.goodCount++;
            this.score += 60 + Math.min(60, this.combo);
            this.showJudgement('GOOD', new Color(126, 242, 255));
        }

        this.effectSource.playOneShot(this.loaded.hit, 0.65);
        this.animateBasket(runtimeEvent.beat, false);
        this.spawnHitEffect(runtimeEvent.node.position, perfect ? new Color(255, 235, 78) : new Color(96, 230, 255));
        this.disposeEventNode(runtimeEvent);
        this.updateHud();
    }

    private resolveMiss(runtimeEvent: RuntimeEvent, message: string): void {
        runtimeEvent.state = EventState.Missed;
        this.completedEvents++;
        this.combo = 0;
        this.missCount++;
        this.effectSource.playOneShot(this.loaded.miss, 0.55);
        this.showJudgement(message, new Color(255, 103, 103));
        this.animateBasket(runtimeEvent.beat, true);
        this.disposeEventNode(runtimeEvent);
        this.updateHud();
    }

    private resolveAvoid(runtimeEvent: RuntimeEvent): void {
        runtimeEvent.state = EventState.Avoided;
        this.completedEvents++;
        this.score += 50;
        this.showJudgement('NICE AVOID!', new Color(172, 255, 142));
        this.spawnHitEffect(runtimeEvent.node.position, new Color(161, 255, 132));
        this.disposeEventNode(runtimeEvent);
        this.updateHud();
    }

    private finishGame(): void {
        if (this.state !== GameState.Playing) {
            return;
        }

        this.state = GameState.Result;
        this.musicSource.stop();
        this.clearLayer(this.gameLayer);
        this.basketSprite.spriteFrame = this.loaded.basket;
        this.showResultOverlay();
    }

    private createFallingCharacter(beat: BeatEvent): Node {
        const node = this.createSpriteNode(`Beat_${beat.id}`, this.gameLayer, 142, 158);
        const sprite = node.getComponent(Sprite);
        sprite.spriteFrame = beat.isDanger
            ? this.loaded.dangerCharacter
            : this.loaded.characters[beat.characterIndex % this.loaded.characters.length];
        node.setPosition(this.laneX[beat.id % this.laneX.length], this.spawnY);

        if (beat.isDanger) {
            const warning = this.createLabelNode('Warning', node, 'NO!', 36, new Vec3(0, 100), new Color(255, 75, 75));
            warning.getComponent(Label).font = this.loaded.font;
            tween(warning)
                .repeatForever(tween().to(0.25, { scale: new Vec3(1.2, 1.2, 1) }).to(0.25, { scale: Vec3.ONE }))
                .start();
        }
        return node;
    }

    private animateBasket(beat: BeatEvent, danger: boolean): void {
        const targetX = this.laneX[beat.id % this.laneX.length];
        this.basketSprite.spriteFrame = danger ? this.loaded.dangerBasket : this.loaded.basket;
        tween(this.basketNode)
            .stop()
            .to(0.06, { position: new Vec3(targetX, -450), scale: new Vec3(1.08, 0.9, 1) })
            .to(0.12, { position: new Vec3(targetX, -470), scale: Vec3.ONE })
            .delay(0.12)
            .call(() => {
                this.basketSprite.spriteFrame = this.loaded.basket;
            })
            .start();
    }

    private spawnHitEffect(position: Vec3, color: Color): void {
        const effect = this.createGraphicsNode('HitEffect', this.effectLayer);
        effect.setPosition(position);
        const graphics = effect.getComponent(Graphics);
        graphics.lineWidth = 10;
        graphics.strokeColor = color;
        graphics.circle(0, 0, 58);
        graphics.stroke();
        const opacity = effect.addComponent(UIOpacity);
        opacity.opacity = 255;
        effect.setScale(0.35, 0.35, 1);

        tween(effect)
            .to(0.28, { scale: new Vec3(1.8, 1.8, 1) })
            .call(() => effect.destroy())
            .start();
        tween(opacity).to(0.28, { opacity: 0 }).start();
    }

    private showLoadingOverlay(): void {
        this.clearLayer(this.overlayLayer);
        this.createOverlayShade();
        this.createLabelNode('Loading', this.overlayLayer, 'LOADING...', 56, new Vec3(0, 40), new Color(255, 237, 133));
    }

    private showReadyOverlay(): void {
        this.clearLayer(this.overlayLayer);
        this.createOverlayShade();
        this.createLabelNode('ReadyTitle', this.overlayLayer, 'GROOVE BASKET', 72, new Vec3(0, 250), new Color(255, 237, 133));
        this.createLabelNode(
            'ReadyBody',
            this.overlayLayer,
            'LISTEN: TA TA TA TICK\nTAP ON THE NEXT BEAT\nAVOID THE RED FACE',
            34,
            new Vec3(0, 80),
            Color.WHITE,
            600,
            180,
        );
        this.createLabelNode('ReadyTap', this.overlayLayer, 'TAP TO START', 48, new Vec3(0, -180), new Color(127, 240, 255));

        const tapLabel = this.overlayLayer.getChildByName('ReadyTap');
        tween(tapLabel)
            .repeatForever(tween().to(0.5, { scale: new Vec3(1.08, 1.08, 1) }).to(0.5, { scale: Vec3.ONE }))
            .start();
    }

    private showResultOverlay(): void {
        this.clearLayer(this.overlayLayer);
        this.overlayLayer.setSiblingIndex(this.node.children.length - 1);
        this.createOverlayShade();

        const judgedCount = this.perfectCount + this.goodCount + this.missCount;
        const accuracy = judgedCount > 0
            ? (this.perfectCount + this.goodCount * 0.6) / judgedCount
            : 0;
        const rank = this.missCount === 0 && this.strayTapCount === 0
            ? 'S'
            : accuracy >= 0.88
                ? 'A'
                : accuracy >= 0.7
                    ? 'B'
                    : 'C';

        const panel = this.createSpriteNode('ResultPanel', this.overlayLayer, 600, 760);
        panel.setPosition(0, 20);
        panel.getComponent(Sprite).spriteFrame = this.loaded.scoreBackground;
        panel.getComponent(Sprite).color = new Color(255, 255, 255, 245);

        this.createLabelNode('ResultTitle', this.overlayLayer, 'RESULT', 68, new Vec3(0, 310), new Color(25, 35, 45));
        this.createLabelNode('Rank', this.overlayLayer, rank, 150, new Vec3(0, 175), new Color(255, 192, 57));
        this.createLabelNode('ResultScore', this.overlayLayer, `SCORE  ${this.formatScore(this.score)}`, 46, new Vec3(0, 40), new Color(25, 35, 45));
        this.createLabelNode('PerfectCount', this.overlayLayer, `PERFECT  ${this.perfectCount}`, 34, new Vec3(0, -40), new Color(25, 35, 45));
        this.createLabelNode('GoodCount', this.overlayLayer, `GOOD       ${this.goodCount}`, 34, new Vec3(0, -90), new Color(25, 35, 45));
        this.createLabelNode('MissCount', this.overlayLayer, `MISS       ${this.missCount + this.strayTapCount}`, 34, new Vec3(0, -140), new Color(25, 35, 45));
        this.createLabelNode('MaxCombo', this.overlayLayer, `MAX COMBO  ${this.maxCombo}`, 34, new Vec3(0, -205), new Color(25, 35, 45));

        const retry = this.createSpriteNode('Retry', this.overlayLayer, 140, 140);
        retry.setPosition(0, -375);
        retry.getComponent(Sprite).spriteFrame = this.loaded.retry;
        this.createLabelNode('RetryText', this.overlayLayer, 'TAP ANYWHERE TO RETRY', 30, new Vec3(0, -500), Color.WHITE);

        if (rank === 'S') {
            const perfect = this.createSpriteNode('PerfectEnding', this.overlayLayer, 250, 190);
            perfect.setPosition(210, 360);
            perfect.getComponent(Sprite).spriteFrame = this.loaded.perfectEnding;
            perfect.setRotationFromEuler(0, 0, -8);
        }
    }

    private showFatalError(): void {
        this.clearLayer(this.overlayLayer);
        this.createOverlayShade();
        this.createLabelNode('Error', this.overlayLayer, 'ASSET LOAD FAILED\nCHECK THE CREATOR CONSOLE', 42, Vec3.ZERO, new Color(255, 112, 112), 620, 160);
    }

    private showJudgement(message: string, color: Color): void {
        this.judgementLabel.node.active = true;
        this.judgementLabel.string = message;
        this.judgementLabel.color = color;
        this.judgementLabel.node.setScale(0.65, 0.65, 1);
        const opacity = this.judgementLabel.getComponent(UIOpacity) ?? this.judgementLabel.node.addComponent(UIOpacity);
        opacity.opacity = 255;

        tween(this.judgementLabel.node)
            .stop()
            .to(0.08, { scale: new Vec3(1.12, 1.12, 1) })
            .to(0.12, { scale: Vec3.ONE })
            .delay(0.3)
            .call(() => {
                this.judgementLabel.node.active = false;
            })
            .start();
    }

    private updateHud(): void {
        this.scoreLabel.string = `SCORE ${this.formatScore(this.score)}`;
        this.comboLabel.string = `COMBO ${this.combo}`;
    }

    private updateProgress(songTime: number): void {
        this.progressLabel.string = this.formatSongTime(songTime);
    }

    private onTap(): void {
        if (this.state === GameState.Ready || this.state === GameState.Result) {
            this.startGame();
            return;
        }
        if (this.state === GameState.Playing) {
            this.handleGameplayTap();
        }
    }

    private onKeyDown(event: EventKeyboard): void {
        if (event.keyCode === KeyCode.SPACE || event.keyCode === KeyCode.ENTER) {
            this.onTap();
        }
    }

    private createNode(name: string, parent: Node): Node {
        const node = new Node(name);
        node.layer = Layers.Enum.UI_2D;
        parent.addChild(node);
        return node;
    }

    private createSpriteNode(name: string, parent: Node, width: number, height: number): Node {
        const node = this.createNode(name, parent);
        node.addComponent(UITransform).setContentSize(width, height);
        const sprite = node.addComponent(Sprite);
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        return node;
    }

    private createGraphicsNode(name: string, parent: Node): Node {
        const node = this.createNode(name, parent);
        node.addComponent(UITransform).setContentSize(this.designWidth, this.designHeight);
        node.addComponent(Graphics);
        return node;
    }

    private createLabelNode(
        name: string,
        parent: Node,
        text: string,
        fontSize: number,
        position: Vec3,
        color: Color,
        width = 680,
        height = 90,
    ): Node {
        const node = this.createNode(name, parent);
        node.setPosition(position);
        node.addComponent(UITransform).setContentSize(width, height);
        const label = node.addComponent(Label);
        label.string = text;
        label.fontSize = fontSize;
        label.lineHeight = Math.round(fontSize * 1.15);
        label.color = color;
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        label.overflow = Label.Overflow.SHRINK;
        if (this.loaded?.font) {
            label.font = this.loaded.font;
        }
        return node;
    }

    private createOverlayShade(): void {
        const shade = this.createGraphicsNode('OverlayShade', this.overlayLayer);
        const graphics = shade.getComponent(Graphics);
        graphics.fillColor = new Color(5, 10, 16, 225);
        graphics.rect(-this.designWidth * 0.5, -this.designHeight * 0.5, this.designWidth, this.designHeight);
        graphics.fill();
    }

    private disposeEventNode(runtimeEvent: RuntimeEvent): void {
        if (runtimeEvent.node?.isValid) {
            runtimeEvent.node.destroy();
        }
        runtimeEvent.node = null;
    }

    private clearLayer(layer: Node): void {
        if (!layer) {
            return;
        }
        for (const child of [...layer.children]) {
            child.destroy();
        }
    }

    private clamp01(value: number): number {
        return Math.max(0, Math.min(1, value));
    }

    private formatScore(value: number): string {
        return (`000000${Math.max(0, Math.floor(value))}`).slice(-6);
    }

    private formatSongTime(value: number): string {
        const safeValue = Math.max(0, value);
        const seconds = Math.floor(safeValue);
        const hundredths = Math.floor((safeValue - seconds) * 100);
        const secondText = (`00${seconds}`).slice(-2);
        const fractionText = (`00${hundredths}`).slice(-2);
        return `${secondText}.${fractionText}`;
    }

    private loadSprite(path: string): Promise<SpriteFrame> {
        return new Promise((resolve, reject) => {
            resources.load(path, SpriteFrame, (error, asset) => error ? reject(error) : resolve(asset));
        });
    }

    private loadAudio(path: string): Promise<AudioClip> {
        return new Promise((resolve, reject) => {
            resources.load(path, AudioClip, (error, asset) => error ? reject(error) : resolve(asset));
        });
    }

    private loadFont(path: string): Promise<Font> {
        return new Promise((resolve, reject) => {
            resources.load(path, Font, (error, asset) => error ? reject(error) : resolve(asset));
        });
    }

    private loadJson(path: string): Promise<JsonAsset> {
        return new Promise((resolve, reject) => {
            resources.load(path, JsonAsset, (error, asset) => error ? reject(error) : resolve(asset));
        });
    }
}
