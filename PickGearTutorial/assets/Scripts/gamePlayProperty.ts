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

    // === 스코어 세팅 ===
    @property({ type: CCInteger, group: { name: 'Score Settings', id: 'score_settings' } })
    public level1Score: number = 1;
    @property({ type: CCInteger, group: { name: 'Score Settings', id: 'score_settings' } })
    public level1Score_Wrong: number = -1;
    @property({ type: CCInteger, group: { name: 'Score Settings', id: 'score_settings' } })
    public level2Score: number = 1;
    @property({ type: CCInteger, group: { name: 'Score Settings', id: 'score_settings' } })
    public level2Score_Wrong: number = -1;
    @property({ type: CCInteger, group: { name: 'Score Settings', id: 'score_settings' } })
    public level3Score: number = 1;
    @property({ type: CCInteger, group: { name: 'Score Settings', id: 'score_settings' } })
    public level3Score_Wrong: number = -1;
    @property({ type: CCInteger, group: { name: 'Score Settings', id: 'score_settings' } })
    public level4Score: number = 1;
    @property({ type: CCInteger, group: { name: 'Score Settings', id: 'score_settings' } })
    public level4Score_Wrong: number = -1;
    @property({ type: CCInteger, group: { name: 'Score Settings', id: 'score_settings' } })
    public level5Score: number = 1;
    @property({ type: CCInteger, group: { name: 'Score Settings', id: 'score_settings' } })
    public level5Score_Wrong: number = -1;

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

    public getScore(level: number, isWrong: boolean): number {
        switch (level) {
            case 1:
                return isWrong ? this.level1Score_Wrong : this.level1Score;
            case 2:
                return isWrong ? this.level2Score_Wrong : this.level2Score;
            case 3:
                return isWrong ? this.level3Score_Wrong : this.level3Score;
            case 4:
                return isWrong ? this.level4Score_Wrong : this.level4Score;
            case 5:
                return isWrong ? this.level5Score_Wrong : this.level5Score;
        }
        return this.level1Score_Wrong;
    }
}
