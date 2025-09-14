import { gameInstance } from "../gameInstance";
import { RootUI } from "../RootUI";
import { StateMachine, t } from "../StateMachine/stateMachine";
import { EGameRootModeEvent, EGameRootModeState } from "./gameModeStateEvent";
import { playNewGame } from "./playNewGame";
import { getDancerSuit } from "../Character/getDancerSuit";
import { ResourceManager } from "../ResourceManager";
import { ECharacterSuitType, ECharacterType } from "../GameDefine";
import { dancerSprite } from "../Character/dancerResource";
import { SpriteFrame } from "cc";

export class gameRootModeTransition extends StateMachine<EGameRootModeState, EGameRootModeEvent> {
    constructor() {
        super(EGameRootModeState.Begin, []);
        this.addTransitions([
            t(EGameRootModeState.Begin, EGameRootModeEvent.SelectType, EGameRootModeState.SelectType, this.onSelectType),
            t(EGameRootModeState.SelectType, EGameRootModeEvent.PlayGame, EGameRootModeState.PlayGame, this.onPlayGame),
            t(EGameRootModeState.PlayGame, EGameRootModeEvent.SelectType, EGameRootModeState.SelectType, this.onSelectType),
        ]);
    }

    selectType = async () => this.dispatch(EGameRootModeEvent.SelectType);
    playGame = async () => this.dispatch(EGameRootModeEvent.PlayGame);

    private async onSelectType() {
        console.log('onSelectType');
        const game = gameInstance.I;
        game.nodeCollection.allNodeOff();
        RootUI.I.hideAllGroup();
        // 여기서 리소스 로딩을 해야 한다
        RootUI.I.showLoadingGroup();
        // const dancerSuitResourcePathList = new getDancerSuit(ECharacterType.DoArin).getSuitResourcePathList(ECharacterSuitType.JYP);
        // dancerSuitResourcePathList.concat(new getDancerSuit(ECharacterType.DoArin).getSuitResourcePathList(ECharacterSuitType.SM));
        // dancerSuitResourcePathList.concat(new getDancerSuit(ECharacterType.DoArin).getSuitResourcePathList(ECharacterSuitType.YG));
        // dancerSuitResourcePathList.concat(new getDancerSuit(ECharacterType.DoArin).getSuitResourcePathList(ECharacterSuitType.HYBE));
        // await ResourceManager.I.loadResourceAndCache(dancerSuitResourcePathList, SpriteFrame);
        // const dancerResourcePathList = dancerSprite.getAllResourcePath();
        // await ResourceManager.I.loadResourceAndCache(dancerResourcePathList, SpriteFrame);
        RootUI.I.hideLoadingGroup();
        game.nodeCollection.selectGameTypeNode.active = true;
    }

    private async onPlayGame() {
        console.log('onPlayGame');
        await new playNewGame().initialize();
    }
}