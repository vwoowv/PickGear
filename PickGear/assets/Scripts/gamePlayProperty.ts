import { _decorator, CCInteger, Component } from "cc";
const { ccclass, property } = _decorator;

@ccclass('gamePlayProperty')
export class gamePlayProperty extends Component {
    // === 레벨별 속도 설정 ===
    @property({ type: CCInteger, group: { name: 'Level Settings', id: 'level_settings' } })
    public Level1Speed: number = 120;
    
    @property({ type: CCInteger, group: { name: 'Level Settings', id: 'level_settings' } })
    public Level2Speed: number = 240;
    
    @property({ type: CCInteger, group: { name: 'Level Settings', id: 'level_settings' } })
    public Level3Speed: number = 360;
    
    @property({ type: CCInteger, group: { name: 'Level Settings', id: 'level_settings' } })
    public Level4Speed: number = 480;
    
    @property({ type: CCInteger, group: { name: 'Level Settings', id: 'level_settings' } })
    public Level5Speed: number = 600;

    // === 거리 설정 ===
    @property({ type: CCInteger, group: { name: 'Distance Settings', id: 'distance_settings' } })
    public level1PickDistance: number = 150;
    @property({ type: CCInteger, group: { name: 'Distance Settings', id: 'distance_settings' } })
    public level2PickDistance: number = 150;
    @property({ type: CCInteger, group: { name: 'Distance Settings', id: 'distance_settings' } })
    public level3PickDistance: number = 150;
    @property({ type: CCInteger, group: { name: 'Distance Settings', id: 'distance_settings' } })
    public level4PickDistance: number = 150;
    @property({ type: CCInteger, group: { name: 'Distance Settings', id: 'distance_settings' } })
    public level5PickDistance: number = 150;

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

    // === 거리 관련 메서드 ===
    public getPickDistanceThreshold(level: number): number {
        switch (level) {
            case 1:
                return this.level1PickDistance;
            case 2:
                return this.level2PickDistance;
            case 3:
                return this.level3PickDistance;
            case 4:
                return this.level4PickDistance;
            case 5:
                return this.level5PickDistance;
        }
        return this.level1PickDistance;
    }
}
