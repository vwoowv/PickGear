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
    rootPlayGame = async () => this.rootTransition.playGame();

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

    playingToGameRound = async (level: number) => {
        if (level === 1) {
            this.playingToLevel1GameRound();
        }
        else if (level === 2) {
            this.playingToLevel2GameRound();
        }
        else if (level === 3) {
            this.playingToLevel3GameRound();
        }
        else if (level === 4) {
            this.playingToLevel4GameRound();
        }
        else if (level === 5) {
            this.playingToLevel5GameRound();
        }
    }
}
