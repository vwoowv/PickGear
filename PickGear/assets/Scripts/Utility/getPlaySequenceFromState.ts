import { EPlayingSequence } from "../GameDefine";
import { EGameModeState } from "../GameMode/gameModeStateEvent";

export class getPlaySequenceFromState {
    public gameSequence: EPlayingSequence;
    public constructor(currentMode: EGameModeState) {
        switch (currentMode) {
            case EGameModeState.Level1ShowSuit:
            case EGameModeState.Level2ShowSuit:
            case EGameModeState.Level3ShowSuit:
            case EGameModeState.Level4ShowSuit:
            case EGameModeState.Level5ShowSuit:
                this.gameSequence = EPlayingSequence.ShowSuit;
                break;
            case EGameModeState.Level1GameRound:
            case EGameModeState.Level2GameRound:
            case EGameModeState.Level3GameRound:
            case EGameModeState.Level4GameRound:
            case EGameModeState.Level5GameRound:
                this.gameSequence = EPlayingSequence.GameRound;
                break;
            case EGameModeState.Level5Result:
                this.gameSequence = EPlayingSequence.Result;
                break;
        }
    }
}
