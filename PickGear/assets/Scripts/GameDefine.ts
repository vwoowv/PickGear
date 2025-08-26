export enum ECharacterType {
    DoArin = 0,
    EmmaMoon = 1,
    SongUnbee = 2,
    SooHana = 3
}

// 캐릭터 타입을 구분하는 enum을 생성합니다.
export enum ECharacterSuitType {
    YG = 0,
    JYP = 1,
    SM = 2,
    HYBE = 3,
    NONE = 255
}

export enum EGameType {
    YG = 0,
    JYP = 1,
    SM = 2,
    HYBE = 3,
}

export enum EGameRound {
    Preview = 0,
    Game = 1,
}


// 게임이 시작되면 프리뷰 라운드 -> 게임 라운드 -> 프리뷰 라운드 -> 게임 라운드... 이런식으로 반복
// 프리뷰 라운드 : 맞출 댄서 복장을 보여준다
// 게임 라운드 : 해당 댄서의 옷이 스크롤 되면서 게임 진행