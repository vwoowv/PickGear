// Run: node tests/startup-loading.cjs <path-to-typescript-module>
// Tests the real transition and ResourceManager with an asynchronous engine loader stub.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require(process.argv[2]);
const scripts = path.join(__dirname, '../assets/Scripts');
const assets = path.join(__dirname, '../assets/resources');
const deferred = () => {
    let resolve;
    const promise = new Promise(r => { resolve = r; });
    return { promise, resolve };
};
let requests = [], progress = [], loading = false, ready = 0, started = 0;
let sessionId = 1, suitType = 0, gate = null, failPath = null, prepareAudio;
let inFlight = 0, peak = 0;
const background = { spriteFrame: null };
class Component {}
class AudioClip {}
class Prefab {}
class SpriteFrame {}
const cc = {
    Component, AudioClip, Prefab, SpriteFrame,
    _decorator: { ccclass: () => value => value, property: () => () => {} },
    error: () => {},
    resources: { load(resourcePath, type, callback) {
        requests.push(resourcePath);
        peak = Math.max(peak, ++inFlight);
        const ext = type === Prefab ? '.prefab' : type === AudioClip ?
            (resourcePath.endsWith('_Game') ? '.mp3' : '.wav') : '.png';
        const file = path.join(assets, resourcePath.replace(/\/spriteFrame$/, '') + ext);
        assert.ok(fs.existsSync(file), `Missing asset: ${file}`);
        assert.ok(fs.existsSync(file + '.meta'), `Missing metadata: ${file}`);
        const blocked = gate?.promise ?? Promise.resolve();
        const failed = resourcePath === failPath;
        blocked.then(() => setImmediate(() => {
            inFlight--;
            callback(failed ? new Error('simulated load failure') : null, { resourcePath });
        }));
    } },
};
const ui = new Proxy({
    showLoadingGroup() { loading = true; progress = []; },
    hideLoadingGroup() { loading = false; },
    setLoadingProgress(p) { progress.push(p); },
}, { get: (object, key) => object[key] ?? (() => {}) });
const instance = {
    prepareGameAudio: () => prepareAudio(),
    playing: { get sessionId() { return sessionId; },
        isSessionCurrent: id => id === sessionId,
        notifyGameReady: () => ready++,
    },
};
const cache = new Map();
function load(file) {
    file = path.resolve(file);
    if (cache.has(file)) return cache.get(file).exports;
    const module = { exports: {} };
    cache.set(file, module);
    const localRequire = name => {
        if (name === 'cc') return cc;
        if (name.endsWith('/RootUI')) return { RootUI: { I: ui } };
        if (name.endsWith('/gameInstance')) return { gameInstance: { I: instance } };
        if (name.endsWith('/gameInstanceUtility')) return { gameInstanceUtility: {
            getCurrentSuitType: () => suitType, getBackgroundSprite: () => background,
        } };
        if (name.endsWith('/playNewGame')) return { playNewGame: class {
            async initialize() { started++; }
        } };
        return load(path.resolve(path.dirname(file), name + '.ts'));
    };
    const compiled = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {
        target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, experimentalDecorators: true,
    } }).outputText;
    vm.runInThisContext('(function(require,module,exports){' + compiled + '\n})',
        { filename: file })(localRequire, module, module.exports);
    return module.exports;
}
const { ResourceManager } = load(path.join(scripts, 'ResourceManager.ts'));
const { gameRootModeTransition } = load(path.join(scripts, 'GameMode/gameRootModeTransition.ts'));
function reset() {
    ResourceManager._instance = new ResourceManager();
    requests = []; progress = []; peak = 0; inFlight = 0;
    loading = false; ready = 0; started = 0; gate = null; failPath = null;
    background.spriteFrame = null;
    prepareAudio = () => ResourceManager.I.loadAudioClip('sound/Kiss and cry_Game');
    return new gameRootModeTransition();
}
function checkProgress() {
    assert.equal(progress[0], 0);
    assert.equal(progress.at(-1), 1);
    assert.ok(progress.every((p, i) => p >= 0 && p <= 1 && (!i || p >= progress[i - 1])));
}
(async () => {
    let transition = reset();
    const audioPrepared = deferred();
    const preparing = deferred();
    prepareAudio = async () => { preparing.resolve(); await audioPrepared.promise; };
    const selection = transition.selectType();
    await preparing.promise;
    assert.equal(loading, true);
    assert.equal(ready, 0);
    assert.deepEqual(requests, ['sound/Kiss and cry_Game']);
    audioPrepared.resolve(); await selection;
    assert.equal(loading, false); assert.equal(ready, 1); checkProgress();
    console.log('PASS selection waits only for common music and audio preparation');

    for (suitType = 0; suitType < 4; suitType++) {
        transition = reset(); await transition.selectType();
        requests = [];
        await transition.playGame();
        const name = ['YG', 'JYP', 'SM', 'HYBE'][suitType];
        assert.equal(started, 1); assert.equal(loading, false); checkProgress();
        assert.equal(requests.length, suitType === 0 ? 33 : 29);
        assert.equal(new Set(requests).size, requests.length);
        assert.ok(peak <= 6);
        assert.ok(background.spriteFrame.resourcePath.includes(name + ' Background'));
        assert.equal(requests.filter(p => p.includes('/Face/')).length, 12);
        for (const p of requests.filter(p => /\/(Suit|Face)\//.test(p))) {
            assert.ok(p.includes('/' + name + '/'), `Unselected game loaded: ${p}`);
        }
        assert.equal(requests.filter(p => p.includes('/Correct/')).length, suitType === 0 ? 4 : 0);
        const count = requests.length;
        await transition.selectType(); await transition.playGame();
        assert.equal(requests.length, count); checkProgress();
        console.log(`PASS ${name}: selected assets exist, first-use assets covered, concurrency <= 6, restart uses cache`);
    }

    suitType = 0; transition = reset(); await transition.selectType();
    gate = deferred();
    const pending = transition.playGame();
    await new Promise(r => setTimeout(r, 10));
    assert.equal(loading, true);
    sessionId++; transition.cancelPresentation();
    await transition.selectType();
    const currentProgress = [...progress];
    gate.resolve(); await pending;
    assert.equal(started, 0); assert.equal(background.spriteFrame, null);
    assert.equal(loading, false); assert.deepEqual(progress, currentProgress);
    console.log('PASS leaving during loading prevents stale progress, background assignment and game start');

    transition = reset(); await transition.selectType();
    failPath = 'prefab/character/Dancer';
    await assert.rejects(transition.playGame(), /simulated load failure/);
    assert.equal(started, 0); assert.equal(background.spriteFrame, null);
    while (inFlight) await new Promise(r => setImmediate(r));
    failPath = null;
    await transition.selectType(); await transition.playGame();
    assert.equal(started, 1); checkProgress();
    console.log('PASS required asset failure rejects startup; a later attempt retries successfully');

    transition = reset();
    failPath = 'sound/Kiss and cry_Game';
    await assert.rejects(transition.selectType(), /simulated load failure/);
    assert.equal(ready, 0);
    failPath = null; await transition.selectType(); assert.equal(ready, 1);
    console.log('PASS failed initial music load never announces GAME_READY and can be retried');
})().catch(error => { console.error(error); process.exitCode = 1; });
