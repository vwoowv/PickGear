import { gameModeManager } from "./gameModeManager";
import { delaySeconds } from "../Utility/delay";

export class playNewGame {
    async initialize() {
        await new delaySeconds().delay(0.5);
        await gameModeManager.I.playingToPrepare();
    }
}
