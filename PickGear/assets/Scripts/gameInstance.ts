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
            console.log('GameManager Singleton이 생성되었습니다.');
        } else {
            // 이미 인스턴스가 존재하면 현재 노드를 파괴
            this.node.destroy();
        }
    }

    // 인스턴스가 파괴될 때 참조 정리
    onDestroy() {
        if (gameInstance._instance === this) {
            gameInstance._instance = null;
            console.log('gameInstance Singleton이 파괴되었습니다.');
        }
    }

    start() {
        gameModeManager.I.initialize(this.uiNode, this.node);
        gameModeManager.I.rootSelectGameType();
    }

    public startGame(gameType: ECharacterSuitType) {
        this.playing.setGameType(gameType);
        gameModeManager.I.rootPlayGame();
    }

    public async playAudioClip(soundName: string, volume: number = 1) {
        const audioCLip = await ResourceManager.I.loadAudioClip(soundName);
        this.audioSource.playOneShot(audioCLip, volume);
    }
}
