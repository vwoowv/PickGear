import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

export enum EggType {
    DoArin,
    EmmaMoon,
    Happy,
    Howsam,
    Hoyang,
    SongUnbee,
    SooHana,
    TotalCount,
}

export enum EGameState {
    None,
    SelectGameMode,
    Prepare,
    PlayStarting,
    Playing,
    GameOver,
}

export enum EGameMode {
    Version1,
    Version2,
    Version3,
}