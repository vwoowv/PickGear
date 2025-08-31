export enum EGameRootModeState {
    Begin = 0,
    SelectType,
    PlayGame,
}

export enum EGameRootModeEvent {
    SelectType = 0,
    PlayGame = 1,
}

// Level1 Show suit -> Level1 Game Round -> Level2 Show Suit -> Level2 Game Round -> Level3 Show Suit -> Level3 Game Round
// -> Level4 Show Suit -> Level4 Game Round -> Level5 Show all Suit -> Level5 Game Round -> Level5 Result -> End Game
export enum EGameModeState {
    None = 0,
    Prepare,
    Level1ShowSuit,
    Level1GameRound,
    Level2ShowSuit,
    Level2GameRound,
    Level3ShowSuit,
    Level3GameRound,
    Level4ShowSuit,
    Level4GameRound,
    Level5ShowSuit,
    Level5GameRound,
    Level5Result,
    EndGame,
}

export enum EGameModeEvent {
    ToPrepare = 0,
    ToLevel1ShowSuit,
    ToLevel1GameRound,
    ToLevel2ShowSuit,
    ToLevel2GameRound,
    ToLevel3ShowSuit,
    ToLevel3GameRound,
    ToLevel4ShowSuit,
    ToLevel4GameRound,
    ToLevel5ShowSuit,
    ToLevel5GameRound,
    ToLevel5Result,
    ToEndGame,
}
