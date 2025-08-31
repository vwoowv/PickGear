import { StateMachine, t } from "../StateMachine/stateMachine";
import { EGameModeEvent, EGameModeState } from "./gameModeStateEvent";

export class playingModeTransition extends StateMachine<EGameModeState, EGameModeEvent> {
    constructor() {
        super(EGameModeState.None, []);
        this.addTransitions([
            t(EGameModeState.None, EGameModeEvent.ToPrepare, EGameModeState.Prepare, this.onPrepare),
            t(EGameModeState.Prepare, EGameModeEvent.ToLevel1ShowSuit, EGameModeState.Level1ShowSuit, this.onLevel1ShowSuit),
            t(EGameModeState.Level1ShowSuit, EGameModeEvent.ToLevel1GameRound, EGameModeState.Level1GameRound, this.onLevel1GameRound),
            t(EGameModeState.Level1GameRound, EGameModeEvent.ToLevel2ShowSuit, EGameModeState.Level2ShowSuit, this.onLevel2ShowSuit),
            t(EGameModeState.Level2ShowSuit, EGameModeEvent.ToLevel2GameRound, EGameModeState.Level2GameRound, this.onLevel2GameRound),
            t(EGameModeState.Level2GameRound, EGameModeEvent.ToLevel3ShowSuit, EGameModeState.Level3ShowSuit, this.onLevel3ShowSuit),
            t(EGameModeState.Level3ShowSuit, EGameModeEvent.ToLevel3GameRound, EGameModeState.Level3GameRound, this.onLevel3GameRound),
            t(EGameModeState.Level3GameRound, EGameModeEvent.ToLevel4ShowSuit, EGameModeState.Level4ShowSuit, this.onLevel4ShowSuit),
            t(EGameModeState.Level4ShowSuit, EGameModeEvent.ToLevel4GameRound, EGameModeState.Level4GameRound, this.onLevel4GameRound),
            t(EGameModeState.Level4GameRound, EGameModeEvent.ToLevel5ShowSuit, EGameModeState.Level5ShowSuit, this.onLevel5ShowSuit),
            t(EGameModeState.Level5ShowSuit, EGameModeEvent.ToLevel5GameRound, EGameModeState.Level5GameRound, this.onLevel5GameRound),
            t(EGameModeState.Level5GameRound, EGameModeEvent.ToLevel5Result, EGameModeState.Level5Result, this.onLevel5Result),
            t(EGameModeState.Level5Result, EGameModeEvent.ToEndGame, EGameModeState.EndGame, this.onEndGame),
            t(EGameModeState.EndGame, EGameModeEvent.ToPrepare, EGameModeState.Prepare, this.onPrepare),
        ]);
    }

    prepare = async () => this.dispatch(EGameModeEvent.ToPrepare);
    level1ShowSuit = async () => this.dispatch(EGameModeEvent.ToLevel1ShowSuit);
    level1GameRound = async () => this.dispatch(EGameModeEvent.ToLevel1GameRound);
    level2ShowSuit = async () => this.dispatch(EGameModeEvent.ToLevel2ShowSuit);
    level2GameRound = async () => this.dispatch(EGameModeEvent.ToLevel2GameRound);
    level3ShowSuit = async () => this.dispatch(EGameModeEvent.ToLevel3ShowSuit);
    level3GameRound = async () => this.dispatch(EGameModeEvent.ToLevel3GameRound);
    level4ShowSuit = async () => this.dispatch(EGameModeEvent.ToLevel4ShowSuit);
    level4GameRound = async () => this.dispatch(EGameModeEvent.ToLevel4GameRound);
    level5ShowSuit = async () => this.dispatch(EGameModeEvent.ToLevel5ShowSuit);
    level5GameRound = async () => this.dispatch(EGameModeEvent.ToLevel5GameRound);
    level5Result = async () => this.dispatch(EGameModeEvent.ToLevel5Result);
    endGame = async () => this.dispatch(EGameModeEvent.ToEndGame);

    private async onPrepare() {
        console.log('onPrepare');
    }

    private async onLevel1ShowSuit() {
        console.log('onLevel1ShowSuit');
    }

    private async onLevel1GameRound() {
        console.log('onLevel1GameRound');
    }

    private async onLevel2ShowSuit() {
        console.log('onLevel2ShowSuit');
    }

    private async onLevel2GameRound() {
        console.log('onLevel2GameRound');
    }

    private async onLevel3ShowSuit() {
        console.log('onLevel3ShowSuit');
    }

    private async onLevel3GameRound() {
        console.log('onLevel3GameRound');
    }

    private async onLevel4ShowSuit() {
        console.log('onLevel4ShowSuit');
    }

    private async onLevel4GameRound() {
        console.log('onLevel4GameRound');
    }

    private async onLevel5ShowSuit() {
        console.log('onLevel5ShowSuit');
    }

    private async onLevel5GameRound() {
        console.log('onLevel5GameRound');
    }

    private async onLevel5Result() {
        console.log('onLevel5Result');
    }

    private async onEndGame() {
        console.log('onEndGame');
    }
}