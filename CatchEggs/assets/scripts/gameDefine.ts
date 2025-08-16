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

export enum GameState {
    None,
    Prepare,
    Playing,
    GameOver,
}