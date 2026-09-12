import { gameInstance } from "../gameInstance";
import { gameModeManager } from "./gameModeManager";
import { delaySeconds } from "../Utility/delay";

export class playNewGame {
    async initialize() {
        const sessionId = gameInstance.I.playing.sessionId;
        await new delaySeconds().delay(0.5);
        if (await gameInstance.I.playing.waitUntilRunning(sessionId)) {
            await gameModeManager.I.playingToPrepare();
        }
    }
}
