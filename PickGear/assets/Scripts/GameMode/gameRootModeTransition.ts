import { gameInstance } from "../gameInstance";
import { RootUI } from "../RootUI";
import { StateMachine, t } from "../StateMachine/stateMachine";
import { EGameRootModeEvent, EGameRootModeState } from "./gameModeStateEvent";
import { gameNodePackage } from "./gameNodePackage";
import { getGameBackground } from "../getGameBackground";
import { ResourceManager } from "../ResourceManager";
import { SpriteFrame } from "cc";
import { Sprite } from "cc";

export class gameRootModeTransition extends StateMachine<EGameRootModeState, EGameRootModeEvent> {
    constructor(nodePackage: gameNodePackage) {
        super(EGameRootModeState.Begin, []);
        this.addTransitions([
            t(EGameRootModeState.Begin, EGameRootModeEvent.SelectType, EGameRootModeState.SelectType, this.onSelectType),
            t(EGameRootModeState.SelectType, EGameRootModeEvent.PlayGame, EGameRootModeState.PlayGame, this.onPlayGame),
        ]);
        this.nodePackage = nodePackage;
    }

    private nodePackage: gameNodePackage = null;
    private get gameInstance(): gameInstance {
        return this.nodePackage.gameInstanceNode.getComponent(gameInstance);
    }

    private get ui(): RootUI {
        return this.nodePackage.uiNode.getComponent(RootUI);
    }

    selectType = async () => this.dispatch(EGameRootModeEvent.SelectType);
    playGame = async () => this.dispatch(EGameRootModeEvent.PlayGame);

    private allNodeOff() {
        this.gameInstance.nodeCollection.selectGameTypeNode.active = false;
        this.gameInstance.nodeCollection.gameNode.active = false;
    }

    private async onSelectType() {
        console.log('onSelectType');
        this.allNodeOff();
        this.gameInstance.nodeCollection.selectGameTypeNode.active = true;
    }

    private async onPlayGame() {
        console.log('onPlayGame');
        this.allNodeOff();
        this.gameInstance.nodeCollection.gameNode.active = true;

        const gameBackgroundPath = new getGameBackground(this.gameInstance.gameType).getBackgroundResourcePath();
        console.log(`gameBackgroundPath: ${gameBackgroundPath}, gameType: ${this.gameInstance.gameType}`);
        this.gameInstance.gameBackground.getComponent(Sprite).spriteFrame = await ResourceManager.I.loadResource(gameBackgroundPath, SpriteFrame);
    }
}