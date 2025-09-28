import { _decorator, CCInteger, Component } from "cc";
const { ccclass, property } = _decorator;

@ccclass('gamePlayProperty')
export class gamePlayProperty extends Component {
    @property(CCInteger)
    public Level1Speed: number = 120;
    @property(CCInteger)
    public Level2Speed: number = 240;
    @property(CCInteger)
    public Level3Speed: number = 360;
    @property(CCInteger)
    public Level4Speed: number = 480;
    @property(CCInteger)
    public Level5Speed: number = 600;

    public getSpeed(level: number): number {
        switch (level) {
            case 1:
                return this.Level1Speed;
            case 2:
                return this.Level2Speed;
            case 3:
                return this.Level3Speed;
            case 4:
                return this.Level4Speed;
            case 5:
                return this.Level5Speed;
            default:
                return this.Level1Speed;
        }
    }
}
