export class gameModeManager {
    private static _instance: gameModeManager = null;
    public static get I(): gameModeManager {
        if (gameModeManager._instance === null) {
            gameModeManager._instance = new gameModeManager();
        }
        return gameModeManager._instance;
    }

    private constructor() {
        if (gameModeManager._instance) {
            throw new Error('gameModeManager는 싱글톤입니다. I 프로퍼티를 통해 접근하세요.');
        }
        gameModeManager._instance = this;
    }
}