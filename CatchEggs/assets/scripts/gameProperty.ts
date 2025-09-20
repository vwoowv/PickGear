import { _decorator, Component, CCFloat } from 'cc';
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

    @property({ type: CCFloat, group: "Level 1 - Fall Speed" })
    public level1FallDownSpeedRate_Normal: number = 1.2;
    @property({ type: CCFloat, group: "Level 1 - Fall Speed" })
    public level1FallDownSpeedRate_High: number = 1.4;
    
    @property({ type: CCFloat, group: "Level 1 - Spawn Time" })
    public level1SpawnTime_Normal: number = 1;
    @property({ type: CCFloat, group: "Level 1 - Spawn Time" })
    public level1SpawnTime_Middle: number = 0.5;
    @property({ type: CCFloat, group: "Level 1 - Spawn Time" })
    public level1SpawnTime_High: number = 0.7;

    @property({ type: CCFloat, group: "Level 2 - Fall Speed" })
    public level2FallDownSpeedRate_Normal: number = 1.3;
    @property({ type: CCFloat, group: "Level 2 - Fall Speed" })
    public level2FallDownSpeedRate_High: number = 1.5;
    
    @property({ type: CCFloat, group: "Level 2 - Spawn Time" })
    public level2SpawnTime_Normal: number = 0.9;
    @property({ type: CCFloat, group: "Level 2 - Spawn Time" })
    public level2SpawnTime_Middle: number = 0.55;
    @property({ type: CCFloat, group: "Level 2 - Spawn Time" })
    public level2SpawnTime_High: number = 0.4;

    @property({ type: CCFloat, group: "Level 3 - Fall Speed" })
    public level3FallDownSpeedRate_Normal: number = 1.4;
    @property({ type: CCFloat, group: "Level 3 - Fall Speed" })
    public level3FallDownSpeedRate_High: number = 1.6;
    
    @property({ type: CCFloat, group: "Level 3 - Spawn Time" })
    public level3SpawnTime_Normal: number = 0.8;
    @property({ type: CCFloat, group: "Level 3 - Spawn Time" })
    public level3SpawnTime_Middle: number = 0.5;
    @property({ type: CCFloat, group: "Level 3 - Spawn Time" })
    public level3SpawnTime_High: number = 0.3;
}