import { gameInstance } from "../gameInstance";
import { gameNodePackage } from "./gameNodePackage";
import { gameRootModeTransition } from "./gameRootModeTransition";
import { Node } from "cc";
import { playingModeTransition } from "./playingModeTransition";

export class gameModeManager {
    private static _instance: gameModeManager = null;
    public static get I(): gameModeManager {
        if (gameModeManager._instance === null) {
            gameModeManager._instance = new gameModeManager();
        }
        return gameModeManager._instance;
    }

    private constructor() {
        if (gameModeManager._instance) {
            throw new Error('gameModeManager는 싱글톤입니다. I 프로퍼티를 통해 접근하세요.');
        }
        gameModeManager._instance = this;
    }

    private rootTransition: gameRootModeTransition = null;
    private nodePackage: gameNodePackage = null;
    private playingTransition: playingModeTransition = null;

    public initialize(uiNode: Node, gameInstanceNode: Node) {
        this.nodePackage = new gameNodePackage();
        this.nodePackage.uiNode = uiNode;
        this.nodePackage.gameInstanceNode = gameInstanceNode;
        this.rootTransition = new gameRootModeTransition();
        this.playingTransition = new playingModeTransition();
    }

    rootSelectGameType = async () => this.rootTransition.selectType();
    private rootOperation: Promise<void> = null;
    public get isRootBusy(): boolean { return this.rootOperation !== null; }

    rootPlayGame = async () => {
        if (this.rootOperation) return;
        const sessionId = gameInstance.I.playing.beginSession();
        gameInstance.I.activateGameAudio();
        this.playingTransition = new playingModeTransition(sessionId);
        const operation = this.rootTransition.playGame();
        this.rootOperation = operation;
        try {
            await operation;
        } catch (error) {
            if (gameInstance.I.playing.isSessionCurrent(sessionId)) throw error;
            console.error('Cancelled game start failed', error);
        } finally {
            if (this.rootOperation === operation) this.rootOperation = null;
        }
    };

    public cancelGameSession() {
        this.rootTransition.cancelPresentation();
        gameInstance.I.playing.endSession();
        // 로딩 완료를 기다리지 않고 복귀한다. 이전 작업은 세션 검사로 무효화한다.
        this.rootOperation = null;
        this.playingTransition = new playingModeTransition();
    }

    public async exitGame() {
        this.cancelGameSession();
        await this.rootSelectGameType();
    }

    playingToPrepare = async () => this.playingTransition.prepare();
    playingToLevel1ShowSuit = async () => this.playingTransition.level1ShowSuit();
    playingToLevel1GameRound = async () => this.playingTransition.level1GameRound();
    playingToLevel2ShowSuit = async () => this.playingTransition.level2ShowSuit();
    playingToLevel2GameRound = async () => this.playingTransition.level2GameRound();
    playingToLevel3ShowSuit = async () => this.playingTransition.level3ShowSuit();
    playingToLevel3GameRound = async () => this.playingTransition.level3GameRound();
    playingToLevel4ShowSuit = async () => this.playingTransition.level4ShowSuit();
    playingToLevel4GameRound = async () => this.playingTransition.level4GameRound();
    playingToLevel5ShowSuit = async () => this.playingTransition.level5ShowSuit();
    playingToLevel5GameRound = async () => this.playingTransition.level5GameRound();
    playingToLevel5Result = async () => this.playingTransition.level5Result();
    playingToEndGame = async () => this.playingTransition.endGame();

    playingToShowSuit = async (level: number) => {
        if (level === 1) {
            return this.playingToLevel1ShowSuit();
        }
        else if (level === 2) {
            return this.playingToLevel2ShowSuit();
        }
        else if (level === 3) {
            return this.playingToLevel3ShowSuit();
        }
        else if (level === 4) {
            return this.playingToLevel4ShowSuit();
        }
        else if (level === 5) {
            return this.playingToLevel5ShowSuit();
        }
    }
    
    playingToGameRound = async (level: number) => {
        if (level === 1) {
            return this.playingToLevel1GameRound();
        }
        else if (level === 2) {
            return this.playingToLevel2GameRound();
        }
        else if (level === 3) {
            return this.playingToLevel3GameRound();
        }
        else if (level === 4) {
            return this.playingToLevel4GameRound();
        }
        else if (level === 5) {
            return this.playingToLevel5GameRound();
        }
    }
}
