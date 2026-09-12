// Run with an existing TypeScript compiler: TYPESCRIPT_PATH=/path/to/typescript node tests/game-controls.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require(process.argv[2] || process.env.TYPESCRIPT_PATH || 'typescript');
const EGameState = { None: 0, SelectGameMode: 1, Prepare: 2, PlayStarting: 3, Playing: 4, GameOver: 5 };
const parent = { postMessage() {} };
const windowMock = { parent, location: { search: '' }, addEventListener() {}, removeEventListener() {} };
const decorator = () => () => {};
const cc = {
    _decorator: { ccclass: () => c => c, property: decorator },
    Component: class {}, isValid: value => !!value && !value.destroyed,
    Tween: { pauseAllByTarget() {}, resumeAllByTarget() {} },
    AudioSource: { EventType: { STARTED: 'started' } },
};
const compiled = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../assets/scripts/gameManager.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, experimentalDecorators: true },
}).outputText;
const exportsObject = {};
vm.runInNewContext(compiled, {
    exports: exportsObject, console, window: windowMock, document: {}, URLSearchParams,
    require: name => name === 'cc' ? cc : name === 'cc/env' ? { DEV: false } :
        name === './gameDefine' ? { EGameState } : new Proxy({}, { get: () => class {} }),
});
const Manager = exportsObject.gameManager;
function makeNode() {
    return { active: true, children: [], getComponentsInChildren: () => [],
        removeAllChildren() { this.children = []; }, destroy() { this.destroyed = true; },
        getComponent: () => ({ initialize() {} }) };
}
function fixture(state = EGameState.Playing) {
    const manager = new Manager();
    manager.controlsReady = true;
    manager.gameState = state;
    manager.gameMode = { getCurrentLevelFromVersion: () => 2, getCurrentGameDuration: () => 49 };
    for (const name of ['playingNode', 'selectGameModeNode', 'playStartingNode', 'prepareNode',
        'retryNode', 'loadingNode', 'eggParent', 'eggScoreParent', 'basket']) manager[name] = makeNode();
    const audio = { pauses: 0, plays: 0, stops: 0, clip: {}, playing: false,
        pause() { this.pauses++; }, play() { this.plays++; }, stop() { this.stops++; } };
    manager.playSound = audio;
    manager.timeProgressBar = { progress: 0.5 };
    manager.extensions = { resetSpawnState() {} };
    manager.timeLeft = 20;
    manager.currentScore = 596;
    manager.currentComboScore = 12;
    manager.sessionVersion = 5;
    const events = [];
    parent.postMessage = (message, origin) => events.push({ ...message, origin });
    let request = 0;
    function send(type, extra = {}, source = parent, origin = 'https://host.example') {
        manager.onParentMessage({ source, origin, data: { type, requestId: `test-${++request}`, ...extra } });
    }
    return { manager, audio, events, send };
}
const tick = () => new Promise(resolve => setImmediate(resolve));
const deferred = () => { let resolve; const promise = new Promise(r => resolve = r); return {promise, resolve}; };
(async () => {
    // Model a locked engine: priming must request playback before the start gesture.
    let armed = false;
    let unlock;
    cc.game = { canvas: {} };
    cc.Node = class {
        addComponent() {
            unlock = { node: { on() {}, off() {} }, volume: 1,
                getSampleRate: async () => 48000,
                play() { armed = true; }, stop() {} };
            return unlock;
        }
    };
    const first = fixture(EGameState.Prepare);
    first.manager.node = { addChild() {} };
    await first.manager.prepareBrowserAudio({});
    assert.equal(armed, true, 'engine unlock must be armed before the start click');
    assert.equal(unlock.volume, 0, 'priming must be silent');
    first.manager.playStartingNode.getComponent = () => ({ initialize: async () => {} });
    let inGesture = true;
    first.audio.play = () => { assert.equal(inGesture, true); assert.equal(armed, true); first.audio.plays++; };
    first.audio.stop = () => { throw new Error('stop would defer play through the engine queue'); };
    const starting = first.manager.startPlayStarting();
    inGesture = false;
    await starting;
    assert.equal(first.audio.plays, 1);
    assert.equal(first.manager.gameState, EGameState.PlayStarting);
    console.log('PASS silent unlock is armed before first start; BGM play is not queued behind stop');

    let f = fixture();
    f.send('PAUSE_GAME'); await tick();
    assert.equal(f.manager.isPaused, true);
    assert.equal(f.manager.exitConfirmation, null);
    assert.equal(f.events[0].protocol, 'pickgear');
    assert.equal(f.events[0].state.score, 596);
    assert.equal(f.events.at(-1).ok, true);
    f.send('PAUSE_GAME'); await tick();
    assert.equal(f.audio.pauses, 1);
    assert.equal(f.events.filter(e => e.type === 'GAME_PAUSED').length, 1);
    f.manager.update(10); assert.equal(f.manager.timeLeft, 20);
    const pending = f.manager.waitUntilRunning(5);
    f.send('RESUME_GAME'); await tick();
    assert.equal(await pending, true);
    f.send('RESUME_GAME'); await tick();
    assert.equal(f.audio.plays, 1);
    assert.equal(f.events.filter(e => e.type === 'GAME_RESUMED').length, 1);
    console.log('PASS external pause/resume is idempotent, freezes time, returns nested score without popup');

    for (const command of ['GO_TO_TITLE', 'EXIT_GAME']) {
        f = fixture(); f.send('PAUSE_GAME'); await tick();
        const waiting = f.manager.waitUntilRunning(5);
        f.send(command); await tick();
        assert.equal(await waiting, false);
        assert.equal(f.manager.currentScore, 0);
        assert.equal(f.manager.getGameState().status, command === 'GO_TO_TITLE' ? 'title' : 'exited');
        assert.equal(f.manager.selectGameModeNode.active, command === 'GO_TO_TITLE');
        assert.ok(!f.events.some(e => e.type === 'GAME_OVER'));
        assert.equal(f.events.at(-1).ok, true);
    }
    for (const state of Object.values(EGameState)) {
        f = fixture(state); f.send('EXIT_GAME'); await tick(); assert.equal(f.events.at(-1).ok, true);
        f.send('GO_TO_TITLE'); await tick(); assert.equal(f.manager.getGameState().status, 'title');
    }
    console.log('PASS title/exit work in every state and cancel pending session work');

    for (const state of [EGameState.Prepare, EGameState.PlayStarting]) {
        f = fixture(state); f.send('PAUSE_GAME'); await tick();
        assert.equal(f.manager.isPaused, true);
        f.manager.startNewGame(); assert.equal(f.manager.gameState, state);
        f.send('RESUME_GAME'); await tick(); assert.equal(f.manager.isPaused, false);
    }
    console.log('PASS preparation/countdown can pause, preventing premature game start');

    f = fixture(); f.send('PAUSE_GAME'); await tick();
    const oldEgg = makeNode(); f.manager.eggParent.children.push(oldEgg);
    const old = f.manager.waitUntilRunning(5);
    const load = deferred();
    f.manager.completeSelectGameMode = async function () { this.gameState = EGameState.Prepare; await load.promise; };
    f.manager.startPlayStarting = async function () { this.gameState = EGameState.PlayStarting; };
    const before = f.manager.sessionId;
    f.send('RESTART_GAME', {requestId:'restart-1'});
    f.send('RESTART_GAME', {requestId:'restart-1'});
    f.send('EXIT_GAME'); await tick();
    assert.equal(f.events.at(-1).error, 'BUSY');
    f.send('GET_GAME_STATE'); await tick(); assert.equal(f.events.at(-1).state.busy, true);
    load.resolve(); await tick();
    assert.equal(await old, false); assert.equal(oldEgg.destroyed, true);
    assert.equal(f.manager.sessionId, before+1);
    assert.equal(f.manager.currentScore, 0); assert.equal(f.manager.getGameState().level, 2);
    assert.equal(f.events.filter(e => e.type === 'GAME_RESTARTED').length, 1);
    f.send('RESTART_GAME', {requestId:'restart-1'}); await tick();
    assert.equal(f.events.at(-1).ok, true);
    f.send('EXIT_GAME', {requestId:'restart-1'}); await tick();
    assert.equal(f.events.at(-1).error, 'REQUEST_ID_REUSED');
    console.log('PASS in-flight/completed request replay, request ID reuse and BUSY semantics match PickGear');

    f = fixture();
    f.send('PAUSE_GAME', {}, {}); f.send('PAUSE_GAME', {requestId:{}});
    assert.equal(f.events.length, 0);
    f.send('GET_GAME_STATE'); await tick();
    assert.equal(f.events.at(-1).type, 'GAME_COMMAND_RESULT');
    assert.equal(f.events.at(-1).state.status, 'playing');
    f.send('PAUSE_GAME', {}, parent, 'https://other.example'); await tick();
    assert.equal(f.manager.isPaused, false);
    f.send('SET_DEBUG_UI', {enabled:'yes'}); await tick(); assert.equal(f.events.at(-1).error, 'INVALID_ARGUMENT');
    f.send('RESTART_GAME'); await tick(); assert.equal(f.events.at(-1).error, 'INVALID_STATE');
    f.manager.exitButton = makeNode(); f.manager.exitConfirmation = makeNode();
    f.send('SET_DEBUG_UI', {enabled:true}); await tick(); assert.equal(f.manager.exitButton.active, true);
    f.send('SET_DEBUG_UI', {enabled:false}); await tick(); assert.equal(f.manager.exitButton.active, false);
    for (let i=0; i<105; i++) { f.send('GET_GAME_STATE'); await tick(); }
    assert.equal(f.manager.commandRequests.size, 100);
    console.log('PASS parent origin checks, state query, debug UI, invalid arguments, bounded replay cache');
})().catch(error => { console.error(error); process.exitCode = 1; });
