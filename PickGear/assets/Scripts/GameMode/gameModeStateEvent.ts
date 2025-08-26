export enum EGameRootModeState {
    Begin = 0,
    SelectType,
    PlayGame,
}

export enum EGameRootModeEvent {
    SelectType = 0,
    PlayGame = 1,
}

export enum EGameModeState {
    ShowSelection = 0,
    SingleDancerSuitRolling,
}

export enum EGameModeEvent {
    ShowSelectionEnd = 0,
}
