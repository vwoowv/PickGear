// Run from this project: node tests/web-control.cjs <path-to-typescript-module>
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require(process.argv[2]);
const root = path.join(__dirname, '../assets/Scripts');
class Node {
  constructor() { this.children = []; this.position = {x: 0, y: 0, z: 0}; this.active = true; }
  on(type, fn, target) { this.events ??= new Map(); this.events.set(type,{fn,target}); }
  off(type) { this.events?.delete(type); }
  emit(type, ...args) { const event=this.events?.get(type); event?.fn.apply(event.target,args); }
  addChild(n) { n.parent = this; this.children.push(n); }
  removeFromParent() { if (this.parent) this.parent.children = this.parent.children.filter(n => n !== this); this.parent = null; }
  destroy() { this.destroyed = true; this.removeFromParent(); }
  setPosition() {}
  addComponent(C) { const c = new C(); c.node = this; return c; }
}
class Component { constructor() { this.node = new Node(); } }
class AudioSource { static EventType = {ENDED:'ended',STARTED:'started'}; node = new Node(); playing = false; playCount = 0; play() { this.playing = true; this.playCount++; } pause() { this.playing = false; } stop() { this.playing = false; } }
const cc = new Proxy({Component,Node,AudioSource,Vec3:class {},isValid: x => !!x && !x.destroyed && !x.node?.destroyed,_decorator:{ccclass:()=>x=>x,property:()=>()=>{}}}, {get:(o,k)=>o[k] || class {}});
const ui = new Proxy({}, { get: (o,k) => o[k] || (()=>{}) });
const resources = {};
let startRoot = async()=>{}, selectCount = 0;
class RootTransition { cancelPresentation() {} async playGame() { await startRoot(); } async selectType() { selectCount++; } }
const cache = new Map();
function load(file) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file).exports;
  const m = {exports:{}}; cache.set(file,m);
  const localRequire = name => {
    if (name === 'cc') return cc;
    if (name.endsWith('/RootUI')) return {RootUI:{I:ui}};
    if (name.endsWith('/ResourceManager')) return {ResourceManager:{I:resources}};
    if (name.endsWith('/gameRootModeTransition')) return {gameRootModeTransition:RootTransition};
    return load(path.resolve(path.dirname(file), name + '.ts'));
  };
  const out = ts.transpileModule(fs.readFileSync(file,'utf8'), {compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS,experimentalDecorators:true}}).outputText;
  vm.runInThisContext('(function(require,module,exports){'+out+'\n})', {filename:file})(localRequire,m,m.exports);
  return m.exports;
}
const deferred = () => { let resolve; const promise = new Promise(r=>resolve=r); return {promise,resolve}; };
const tick = () => new Promise(r=>setTimeout(r,5));
(async()=>{
 const {gamePlaying} = load(path.join(root,'gamePlaying.ts'));
 const {gameInstance} = load(path.join(root,'gameInstance.ts'));
 const {gameModeManager} = load(path.join(root,'GameMode/gameModeManager.ts'));
 const {playingModeTransition} = load(path.join(root,'GameMode/playingModeTransition.ts'));
 const {EGameModeState} = load(path.join(root,'GameMode/gameModeStateEvent.ts'));
 const {EPlayingSequence} = load(path.join(root,'GameDefine.ts'));
 const sent = [];
 const parent = {postMessage: (message, origin) => sent.push({message,origin})};
 let connected = 0;
 global.window = {parent, addEventListener:()=>connected++, removeEventListener:()=>connected--};
 const instance = new gameInstance(); instance.audioSource = new AudioSource(); instance.onLoad();
 const player = new gamePlaying(); instance.playing = player;
 player.dancerPos = new Node(); player.rollingSuitPos = new Node(); player.dancerResultPos = [new Node(),new Node(),new Node(),new Node()];
 player.characterRollingPosStart = new Node();
 player.connectWebControl(); player.connectWebControl(); assert.equal(connected,1);
 player.disconnectWebControl(); assert.equal(connected,0);
 console.log('PASS message listener connects before gameplay and avoids duplicate registration');
 const manager = gameModeManager.I; manager.initialize(new Node(), new Node());
 player.beginSession(); const old = player.sessionId;
 player.currentSequence = EPlayingSequence.GameRound; player.currentTime = 4;
 player.onTouchExitButton(); const waiting = player.waitUntilRunning(old);
 player.update(10); player.onTouchPickSuitButton(); assert.equal(player.currentTime,4);
 player.onTouchContinueButton(); assert.equal(await waiting,true);
 console.log('PASS pause blocks timer/input; continue releases pending work');
 const delayed = deferred(); resources.spawnPrefab = () => delayed.promise;
 const spawn = player.newRandomRollingSuit(); player.endSession(); player.beginSession();
 const staleSuit = {node:new Node()}; delayed.resolve(staleSuit); await spawn;
 assert.equal(staleSuit.node.destroyed,true); assert.equal(player.rollingSuitList.length,0);
 assert.equal(player.isSessionCurrent(old),false);
 console.log('PASS late prefab completion is discarded after exit and restart');
 const staleMachine = new playingModeTransition(player.sessionId);
 let applied = 0; const original = player.applyTransition; player.applyTransition = () => {applied++;};
 const pendingTransition = staleMachine.prepare(); player.endSession(); player.beginSession(); await pendingTransition;
 assert.equal(applied,0);
 player.currentSequence = EPlayingSequence.GameRound; player.onTouchExitButton();
 const pausedTransition = player.onTransitionChanged(EGameModeState.Level2ShowSuit,player.sessionId);
 await tick(); assert.equal(applied,0); player.onTouchContinueButton(); await pausedTransition; assert.equal(applied,1);
 player.applyTransition = original;
 console.log('PASS old queued transitions cannot alter new session; paused transitions wait');
 const audioLoad = deferred(); resources.loadAudioClip = () => audioLoad.promise;
 const audio = instance.playAudioClip('test',1,true); instance.stopGameAudio(); audioLoad.resolve({}); await audio;
 assert.equal(instance.audioSource.playCount,0);
 resources.loadAudioClip = async()=>({}); await instance.playAudioClip('test',1,true);
 instance.pauseGameAudio(); assert.equal(instance.audioSource.playing,false); instance.resumeGameAudio(); assert.equal(instance.audioSource.playing,true);
 instance.stopGameAudio(); assert.equal(instance.audioSource.playing,false);
 console.log('PASS pending audio is cancelled; music pauses/resumes/stops');
 const rolling = {node:new Node()}, picked = {node:new Node()}, dancer = {node:new Node()};
 player.rollingSuitList.push(rolling); player.pickedSuitList.addPickedSuit(picked); player.allDancer = [dancer]; player.currentDancer = dancer;
 player.currentPoint = 100; player.endSession();
 for (const item of [rolling,picked,dancer]) assert.equal(item.node.destroyed,true);
 assert.equal(player.currentPoint,0); assert.equal(player.currentSequence,EPlayingSequence.Exited);
 console.log('PASS exit clears rolling/picked suits, partial dancer list, score and state');
 startRoot = async()=>{}; await manager.rootPlayGame();
 assert.equal(manager.playingTransition.getState(),EGameModeState.None);
 // Ending while root startup waits for resume must unblock startup before returning home.
 player.currentSequence = EPlayingSequence.GameRound; player.onTouchExitButton();
 manager.rootOperation = player.waitUntilRunning(player.sessionId).then(()=>{});
 await manager.exitGame(); assert.equal(player.isSessionActive,false); assert.equal(selectCount,1);
 manager.rootOperation = null;
 await manager.rootPlayGame(); assert.equal(manager.playingTransition.getState(),EGameModeState.None);
 console.log('PASS exit unblocks pending startup; next game starts from a fresh state machine');
 instance.stopGameAudio();
 const beforePrepare = instance.audioSource.playCount;
 await instance.prepareGameAudio();
 assert.equal(instance.audioSource.playCount,beforePrepare);
 instance.activateGameAudio();
 assert.equal(instance.audioSource.playCount,beforePrepare+1);
 assert.equal(instance.audioSource.volume,1);
 instance.stopGameAudio();
 await instance.playAudioClip('test',1,true);
 assert.equal(instance.audioSource.volume,1);
 assert.equal(instance.audioSource.playing,true);
 console.log('PASS audio preload is silent; first click starts audible music synchronously');
 const musicClip = {};
 resources.loadAudioClip = async()=>musicClip;
 instance.stopGameAudio(); await instance.prepareGameAudio();
 instance.activateGameAudio();
 const startedCount = instance.audioSource.playCount;
 await instance.playAudioClip('test',1,true);
 assert.equal(instance.audioSource.playCount,startedCount);
 instance.pauseGameAudio();
 await instance.playAudioClip('test',1,true);
 assert.equal(instance.audioSource.playCount,startedCount);
 assert.equal(instance.audioSource.playing,false);
 instance.resumeGameAudio(); assert.equal(instance.audioSource.playing,true);
 console.log('PASS prepare does not stop/restart music or bypass pause');
 const firstStart = instance.audioSource.playCount;
 const rootStart = manager.rootPlayGame();
 assert.equal(instance.audioSource.playCount,firstStart+1);
 assert.equal(instance.audioSource.playing,true);
 assert.equal(instance.audioSource.volume,1);
 await rootStart;
 console.log('PASS root startup resets the session before synchronously starting audible music');
 global.document = {};
 await instance.prepareGameAudio();
 const unlock = instance.audioUnlockSource;
 assert.equal(unlock.volume,0);
 assert.equal(unlock.playCount,1);
 assert.equal(instance.getAudioState().browserUnlocked,false);
 instance.stopGameAudio();
 assert.equal(unlock.playing,true); // 세션 초기화가 첫 클릭 대기를 취소하면 안 된다.
 unlock.node.emit(AudioSource.EventType.STARTED,unlock);
 assert.equal(instance.getAudioState().browserUnlocked,true);
 assert.equal(unlock.playing,false);
 await instance.prepareGameAudio();
 assert.equal(instance.audioUnlockSource,unlock);
 assert.equal(unlock.playCount,1);
 delete global.document;
 console.log('PASS browser unlock is armed before first click and survives session reset without audible output');
 sent.length = 0;
 player.beginSession(); player.currentSequence = EPlayingSequence.GameRound; player.currentPoint = 596;
 let popupCalls = 0; ui.showExitConfirmation = () => popupCalls++;
 const event = (type, requestId, extra={}) => ({source:parent,origin:'https://host.example',data:{type,requestId,...extra}});
 player.onParentMessage(event('PAUSE_GAME','pause-1')); await tick();
 assert.equal(player.getGameState().status,'paused'); assert.equal(popupCalls,0);
 assert.equal(sent.find(x=>x.message.type==='GAME_PAUSED').message.state.score,596);
 assert.equal(sent.at(-1).message.ok,true); assert.equal(sent.at(-1).message.requestId,'pause-1');
 player.onParentMessage({...event('RESUME_GAME','bad-source'),source:{}}); await tick();
 assert.equal(player.getGameState().status,'paused');
 player.onParentMessage({...event('RESUME_GAME','bad-origin'),origin:'https://other.example'}); await tick();
 assert.equal(player.getGameState().status,'paused');
 player.onParentMessage(event('RESUME_GAME','resume-1')); await tick();
 assert.equal(player.getGameState().status,'playing');
 player.onParentMessage(event('RESTART_GAME','invalid-restart')); await tick();
 assert.equal(sent.at(-1).message.error,'INVALID_STATE');
 console.log('PASS external pause returns score without popup; resume works; invalid sources/origins/states are rejected');
 player.pauseGame();
 const beforeRestart = player.sessionId;
 player.onParentMessage(event('RESTART_GAME','restart-1'));
 player.onParentMessage(event('RESTART_GAME','restart-1')); await tick();
 assert.equal(player.sessionId,beforeRestart+2); // cancel + new session
 assert.equal(player.currentPoint,0);
 assert.equal(sent.filter(x=>x.message.type==='GAME_RESTARTED').length,1);
 player.onParentMessage(event('EXIT_GAME','restart-1')); await tick();
 assert.equal(sent.at(-1).message.error,'REQUEST_ID_REUSED');
 console.log('PASS paused restart starts once when a request is retransmitted');
 player.currentSequence = EPlayingSequence.GameRound; player.pauseGame();
 player.onParentMessage(event('GO_TO_TITLE','title-1')); await tick();
 assert.equal(player.getGameState().status,'title');
 player.beginSession(); player.currentSequence = EPlayingSequence.GameRound; player.pauseGame();
 const beforeExitSelect = selectCount;
 player.onParentMessage(event('EXIT_GAME','exit-1')); await tick();
 assert.equal(player.getGameState().status,'exited'); assert.equal(selectCount,beforeExitSelect);
 assert.equal(sent.filter(x=>x.message.type==='GAME_EXITED').length,1);
 player.onParentMessage(event('GET_GAME_STATE','state-1')); await tick();
 assert.equal(sent.at(-1).message.state.status,'exited');
 player.onParentMessage(event('SET_DEBUG_UI','debug-invalid',{enabled:'yes'})); await tick();
 assert.equal(sent.at(-1).message.error,'INVALID_ARGUMENT');
 console.log('PASS title and exit are distinct; state query and invalid debug payload handling work');
 delete global.window;
})().catch(e=>{console.error(e);process.exitCode=1;});
