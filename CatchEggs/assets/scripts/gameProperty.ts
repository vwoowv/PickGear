import { _decorator, Component, CCFloat, CCInteger } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('gameProperty')
export class gameProperty extends Component {
    private static _instance: gameProperty = null;

    // Singleton 인스턴스에 접근하는 getter
    public static get I(): gameProperty {
        if (gameProperty._instance === null) {
            console.error('gameProperty Singleton이 초기화되지 않았습니다!');
        }
        return gameProperty._instance;
    }

    onLoad() {
        if (gameProperty._instance === null) {
            gameProperty._instance = this;
        }
        else {
            this.node.destroy();
        }
    }

    // FallDownSpeed
    @property({ type: CCFloat, group: "Level 1", displayName: "FallDownSpeed - Normal" })
    public level1FallDownSpeedRate_Normal: number = 1.2;
    @property({ type: CCFloat, group: "Level 1", displayName: "FallDownSpeed - High" })
    public level1FallDownSpeedRate_High: number = 1.4;
    // SpawnTime
    @property({ type: CCFloat, group: "Level 1", displayName: "SpawnTime - Normal" })
    public level1SpawnTime_Normal: number = 1;
    @property({ type: CCFloat, group: "Level 1", displayName: "SpawnTime - Middle" })
    public level1SpawnTime_Middle: number = 0.5;
    @property({ type: CCFloat, group: "Level 1", displayName: "SpawnTime - High" })
    public level1SpawnTime_High: number = 0.7;
    // Score
    @property({ type: CCInteger, group: "Level 1", displayName: "Score - DoArin" })
    public level1DoArin_Score: number = 1;
    @property({ type: CCInteger, group: "Level 1", displayName: "Score - EmmaMoon" })
    public level1EmmaMoon_Score: number = 1;
    @property({ type: CCInteger, group: "Level 1", displayName: "Score - Howsam" })
    public level1Howsam_Score: number = 1;
    @property({ type: CCInteger, group: "Level 1", displayName: "Score - SongUnbee" })
    public level1SongUnbee_Score: number = 1;
    @property({ type: CCInteger, group: "Level 1", displayName: "Score - SooHana" })
    public level1SooHana_Score: number = 1;
    @property({ type: CCInteger, group: "Level 1", displayName: "Score - Happy" })
    public level1Happy_Score: number = 1;
    @property({ type: CCInteger, group: "Level 1", displayName: "Score - Hoyang" })
    public level1Hoyang_Score: number = 1;
    // Image
    @property({ group: "Level 1", displayName: "Image - DoArin" })
    public level1DoArin_Image: string = "DoArin";
    @property({ group: "Level 1", displayName: "Image - EmmaMoon" })
    public level1EmmaMoon_Image: string = "EmmaMoon";
    @property({ group: "Level 1", displayName: "Image - Howsam" })
    public level1Howsam_Image: string = "Howsam";
    @property({ group: "Level 1", displayName: "Image - SongUnbee" })
    public level1SongUnbee_Image: string = "SongUnbee";
    @property({ group: "Level 1", displayName: "Image - SooHana" })
    public level1SooHana_Image: string = "SooHana";
    @property({ group: "Level 1", displayName: "Image - Happy" })
    public level1Happy_Image: string = "Happy";
    @property({ group: "Level 1", displayName: "Image - Hoyang" })
    public level1Hoyang_Image: string = "Hoyang";

    // FallDownSpeed
    @property({ type: CCFloat, group: "Level 2", displayName: "FallDownSpeed - Normal" })
    public level2FallDownSpeedRate_Normal: number = 1.3;
    @property({ type: CCFloat, group: "Level 2", displayName: "FallDownSpeed - High" })
    public level2FallDownSpeedRate_High: number = 1.5;
    // SpawnTime
    @property({ type: CCFloat, group: "Level 2", displayName: "SpawnTime - Normal" })
    public level2SpawnTime_Normal: number = 0.9;
    @property({ type: CCFloat, group: "Level 2", displayName: "SpawnTime - Middle" })
    public level2SpawnTime_Middle: number = 0.55;
    @property({ type: CCFloat, group: "Level 2", displayName: "SpawnTime - High" })
    public level2SpawnTime_High: number = 0.4;
    // Score
    @property({ type: CCInteger, group: "Level 2", displayName: "Score - DoArin" })
    public level2DoArin_Score: number = 1;
    @property({ type: CCInteger, group: "Level 2", displayName: "Score - EmmaMoon" })
    public level2EmmaMoon_Score: number = 1;
    @property({ type: CCInteger, group: "Level 2", displayName: "Score - Howsam" })
    public level2Howsam_Score: number = 1;
    @property({ type: CCInteger, group: "Level 2", displayName: "Score - SongUnbee" })
    public level2SongUnbee_Score: number = 1;
    @property({ type: CCInteger, group: "Level 2", displayName: "Score - SooHana" })
    public level2SooHana_Score: number = 1;
    @property({ type: CCInteger, group: "Level 2", displayName: "Score - Happy" })
    public level2Happy_Score: number = 1;
    @property({ type: CCInteger, group: "Level 2", displayName: "Score - Hoyang" })
    public level2Hoyang_Score: number = 1;
    // Image
    @property({ group: "Level 2", displayName: "Image - DoArin" })
    public level2DoArin_Image: string = "DoArin";
    @property({ group: "Level 2", displayName: "Image - EmmaMoon" })
    public level2EmmaMoon_Image: string = "EmmaMoon";
    @property({ group: "Level 2", displayName: "Image - Howsam" })
    public level2Howsam_Image: string = "Howsam";
    @property({ group: "Level 2", displayName: "Image - SongUnbee" })
    public level2SongUnbee_Image: string = "SongUnbee";
    @property({ group: "Level 2", displayName: "Image - SooHana" })
    public level2SooHana_Image: string = "SooHana";
    @property({ group: "Level 2", displayName: "Image - Happy" })
    public level2Happy_Image: string = "Happy";
    @property({ group: "Level 2", displayName: "Image - Hoyang" })
    public level2Hoyang_Image: string = "Hoyang";

    // FallDownSpeed
    @property({ type: CCFloat, group: "Level 3", displayName: "FallDownSpeed - Normal" })
    public level3FallDownSpeedRate_Normal: number = 1.4;
    @property({ type: CCFloat, group: "Level 3", displayName: "FallDownSpeed - High" })
    public level3FallDownSpeedRate_High: number = 1.6;
    // SpawnTime
    @property({ type: CCFloat, group: "Level 3", displayName: "SpawnTime - Normal" })
    public level3SpawnTime_Normal: number = 0.8;
    @property({ type: CCFloat, group: "Level 3", displayName: "SpawnTime - Middle" })
    public level3SpawnTime_Middle: number = 0.5;
    @property({ type: CCFloat, group: "Level 3", displayName: "SpawnTime - High" })
    public level3SpawnTime_High: number = 0.3;
    // Score
    @property({ type: CCInteger, group: "Level 3", displayName: "Score - DoArin" })
    public level3DoArin_Score: number = 1;
    @property({ type: CCInteger, group: "Level 3", displayName: "Score - EmmaMoon" })
    public level3EmmaMoon_Score: number = 1;
    @property({ type: CCInteger, group: "Level 3", displayName: "Score - Howsam" })
    public level3Howsam_Score: number = 1;
    @property({ type: CCInteger, group: "Level 3", displayName: "Score - SongUnbee" })
    public level3SongUnbee_Score: number = 1;
    @property({ type: CCInteger, group: "Level 3", displayName: "Score - SooHana" })
    public level3SooHana_Score: number = 1;
    @property({ type: CCInteger, group: "Level 3", displayName: "Score - Happy" })
    public level3Happy_Score: number = 1;
    @property({ type: CCInteger, group: "Level 3", displayName: "Score - Hoyang" })
    public level3Hoyang_Score: number = 1;
    // Image
    @property({ group: "Level 3", displayName: "Image - DoArin" })
    public level3DoArin_Image: string = "DoArin";
    @property({ group: "Level 3", displayName: "Image - EmmaMoon" })
    public level3EmmaMoon_Image: string = "EmmaMoon";
    @property({ group: "Level 3", displayName: "Image - Howsam" })
    public level3Howsam_Image: string = "Howsam";
    @property({ group: "Level 3", displayName: "Image - SongUnbee" })
    public level3SongUnbee_Image: string = "SongUnbee";
    @property({ group: "Level 3", displayName: "Image - SooHana" })
    public level3SooHana_Image: string = "SooHana";
    @property({ group: "Level 3", displayName: "Image - Happy" })
    public level3Happy_Image: string = "Happy";
    @property({ group: "Level 3", displayName: "Image - Hoyang" })
    public level3Hoyang_Image: string = "Hoyang";
}