// Run with NODE_PATH pointing to Cocos Creator's bundled node_modules (typescript).
// These tests cover asynchronous loading/state transitions; Preview still validates rendering/audio.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function deferred() {
    let resolve, reject;
    const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
    return { promise, resolve, reject };
}

function setup() {
    class Stub {}
    class Component {
        getComponent(type) { return this.node.getComponent(type); }
        addComponent(type) { return this.node.addComponent(type); }
    }
    const resources = [], warnings = [], errors = [], messages = [];
    const resourceManager = {
        loadResource: async (name) => { resources.push(name); return { name }; },
        loadAudioClip: (name) => { resources.push(name); return audio.promise; },
    };
    const ResourceManager = { I: resourceManager };
    const property = { getImage: (level, egg) => `level${level}-egg${egg}` };
    const gameProperty = {};
    const cc = new Proxy({
        Component,
        _decorator: { ccclass: () => (value) => value, property: () => () => {} },
        director: { getScene: () => ({ getComponentInChildren: (type) => type === ResourceManager ? resourceManager : property }) },
        isValid: () => true,
    }, { get: (target, key) => target[key] ?? Stub });
    const modules = {
        cc, 'cc/env': { DEV: true }, './ResourceManager': { ResourceManager }, './gameProperty': { gameProperty },
        './gameManagerExtensions': { gameManagerExtensions: class { async initialize() {} resetSpawnState() {} } },
    };
    function load(file) {
        const source = fs.readFileSync(path.join(__dirname, '../assets/scripts', file + '.ts'), 'utf8');
        const { outputText } = ts.transpileModule(source, { compilerOptions: {
            target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, experimentalDecorators: true,
        } });
        const exports = {};
        const requireMock = (id) => modules[id] ?? new Proxy({}, { get: () => Stub });
        new Function('exports', 'require', 'console', outputText)(exports, requireMock, {
            warn: (...args) => warnings.push(args), error: (...args) => errors.push(args), info() {}, log() {},
        });
        modules['./' + file] = exports;
        return exports;
    }
    const { EGameState } = load('gameDefine');
    const { LoadingNode } = load('LoadingNode');
    const { gameManager } = load('gameManager');
    function node() {
        const components = new Map();
        return { active: false, children: [], getComponentsInChildren: () => [],
            getComponent: (type) => components.get(type),
            addComponent: (type) => { const result = new type(); components.set(type, result); return result; },
            removeAllChildren() {},
        };
    }
    const loading = new LoadingNode();
    loading.node = node();
    loading.progressBar = { progress: 0 };
    const audio = deferred();
    const player = deferred();
    const manager = new gameManager();
    manager.node = node();
    manager.loadingNode = { getComponent: () => loading };
    for (const field of ['selectGameModeNode', 'playStartingNode', 'playingNode', 'prepareNode', 'retryNode', 'eggParent', 'eggScoreParent']) manager[field] = node();
    manager.basket = { getComponent: () => ({ initialize() {} }) };
    manager.timeProgressBar = { progress: 1 };
    manager.background = { spriteFrame: null };
    manager.playSound = { stop() {}, getSampleRate: () => player.promise, play() { throw new Error('Started before preparation finished'); } };
    manager.gameMode = {
        getCurrentGameBgName: () => 'sound/Sanrio2_Full_Version',
        getCurrentLevelFromVersion: () => 2,
        getCurrentBackground: () => { resources.push('backgroundLake'); return Promise.resolve('lake'); },
    };
    manager.notifyHost = (message) => messages.push(message);
    // Rendering-specific preparation is exercised in Creator Preview.
    manager.prepareGame = async () => { manager.prepareNode.active = true; };
    return { loading, manager, audio, player, resources, warnings, errors, messages, EGameState, resourceManager };
}

const flush = () => new Promise(resolve => setImmediate(resolve));

test('startup reaches title and GAME_READY without loading gameplay assets', async () => {
    const h = setup();
    await h.manager.start();
    assert.equal(h.manager.gameState, h.EGameState.SelectGameMode);
    assert.equal(h.manager.selectGameModeNode.active, true);
    assert.equal(h.loading.node.active, false);
    assert.deepEqual(h.resources, []);
    assert.deepEqual(h.messages, [{ type: 'GAME_READY' }]);
});

test('selected mode waits for its BGM and player before allowing start', async () => {
    const h = setup();
    await h.manager.start();
    const pending = h.manager.completeSelectGameMode();
    await flush();
    assert.equal(h.loading.node.active, true);
    assert.equal(h.manager.prepareNode.active, false);
    assert.equal(h.manager.preparingMode, true);
    await h.manager.startPlayStarting(); // must not call play()
    assert.deepEqual(h.resources.filter(x => x.startsWith('sound/')), ['sound/Sanrio2_Full_Version']);
    assert.ok(h.resources.filter(x => x.startsWith('textures/character/')).every(x => x.includes('level2-')));
    h.audio.resolve('song2');
    await flush();
    assert.equal(h.loading.node.active, true);
    h.player.resolve(48000);
    await pending;
    assert.equal(h.manager.playSound.clip, 'song2');
    assert.equal(h.manager.background.spriteFrame, 'lake');
    assert.equal(h.manager.prepareNode.active, true);
    assert.equal(h.manager.preparingMode, false);
    assert.equal(h.loading.node.active, false);
});

test('required BGM failure returns to title and a later selection can succeed', async () => {
    const h = setup();
    await h.manager.start();
    const pending = h.manager.completeSelectGameMode();
    h.audio.reject(new Error('audio unavailable'));
    await pending;
    assert.equal(h.manager.gameState, h.EGameState.SelectGameMode);
    assert.equal(h.loading.node.active, false);
    assert.equal(h.manager.preparingMode, false);
    assert.equal(h.errors.length, 1);
    h.resourceManager.loadAudioClip = async () => 'retry-song';
    h.player.resolve(48000);
    await h.manager.completeSelectGameMode();
    assert.equal(h.manager.playSound.clip, 'retry-song');
    assert.equal(h.manager.prepareNode.active, true);
});

test('returning to title while loading prevents late requests from restoring preparation', async () => {
    const h = setup();
    await h.manager.start();
    const pending = h.manager.completeSelectGameMode();
    await h.manager.returnToTitle();
    const progress = h.loading.progressBar.progress;
    h.audio.resolve('old-song');
    await pending;
    assert.equal(h.manager.gameState, h.EGameState.SelectGameMode);
    assert.equal(h.manager.prepareNode.active, false);
    assert.equal(h.loading.node.active, false);
    assert.equal(h.loading.progressBar.progress, progress);
    assert.equal(h.manager.playSound.clip, undefined);
});

test('an older mode completing cannot hide a newer loading screen', async () => {
    const h = setup();
    await h.manager.start();
    const older = h.manager.completeSelectGameMode();
    const newAudio = deferred();
    h.resourceManager.loadAudioClip = () => newAudio.promise;
    const newer = h.manager.completeSelectGameMode();
    h.audio.resolve('old-song');
    await older;
    assert.equal(h.loading.node.active, true);
    assert.equal(h.manager.preparingMode, true);
    newAudio.resolve('new-song');
    h.player.resolve(48000);
    await newer;
    assert.equal(h.manager.playSound.clip, 'new-song');
    assert.equal(h.loading.node.active, false);
});

test('optional preload failure is logged and does not block the selected mode', async () => {
    const h = setup();
    await h.manager.start();
    const load = h.resourceManager.loadResource;
    h.resourceManager.loadResource = async (name) => {
        if (name === 'effect/box/boxHit2D') throw new Error('optional effect unavailable');
        return load(name);
    };
    const pending = h.manager.completeSelectGameMode();
    h.audio.resolve('song');
    h.player.resolve(48000);
    await pending;
    assert.equal(h.warnings.length, 1);
    assert.match(h.warnings[0][0], /effect\/box\/boxHit2D/);
    assert.equal(h.manager.prepareNode.active, true);
    assert.equal(h.loading.progressBar.progress, 1);
});
