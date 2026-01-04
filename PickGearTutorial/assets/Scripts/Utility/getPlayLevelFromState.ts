import { EGameModeState } from "../GameMode/gameModeStateEvent";

export class getPlayLevelFromState {
    public currentLevel: number;
    public constructor(currentMode: EGameModeState) {
        this.currentLevel = 0;
        switch (currentMode) {
            case EGameModeState.Level1ShowSuit:
            case EGameModeState.Level1GameRound:
                this.currentLevel = 1;
                break;
            case EGameModeState.Level2ShowSuit:
            case EGameModeState.Level2GameRound:
                this.currentLevel = 2;
                break;
            case EGameModeState.Level3ShowSuit:
            case EGameModeState.Level3GameRound:
                this.currentLevel = 3;
                break;
            case EGameModeState.Level4ShowSuit:
            case EGameModeState.Level4GameRound:
                this.currentLevel = 4;
                break;
            case EGameModeState.Level5ShowSuit:
            case EGameModeState.Level5GameRound:
                this.currentLevel = 5;
                break;
        }
    }
}
