// 각 레벨당 인물 할당
// 1 : 도아린
// 2 : 수하나
// 3 : 송은비
// 4 : 엠마문
// 5 : 전부다

export enum ECharacterType {
    DoArin = 0,
    SooHana,
    SongUnbee,
    EmmaMoon,
    TotalCount = 4,
}

// 캐릭터 타입을 구분하는 enum을 생성합니다.
export enum ECharacterSuitType {
    YG = 0,
    JYP = 1,
    SM = 2,
    HYBE = 3,
}

export enum EPlayingSequence {
    Prepare,
    ShowSuit,
    GameRound,
    Result,
    EndGame,
}
