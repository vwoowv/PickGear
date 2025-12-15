import { RootUI } from "../RootUI";
import { StateMachine, t } from "../StateMachine/stateMachine";
import { EGameRootModeEvent, EGameRootModeState } from "./gameModeStateEvent";
import { playNewGame } from "./playNewGame";
import { IAssetLists, ResourceManager } from "../ResourceManager";
import { gameInstanceUtility } from "./gameInstanceUtility";
import { getGameBackground } from "../Utility/getGameBackground";
import { SpriteFrame } from "cc";
import { ECharacterType } from "../GameDefine";
import { getDancerSuit } from "../Character/getDancerSuit";

export class gameRootModeTransition extends StateMachine<EGameRootModeState, EGameRootModeEvent> {
    constructor() {
        super(EGameRootModeState.Begin, []);
        this.addTransitions([
            t(EGameRootModeState.Begin, EGameRootModeEvent.SelectType, EGameRootModeState.SelectType, this.onSelectType),
            t(EGameRootModeState.SelectType, EGameRootModeEvent.PlayGame, EGameRootModeState.PlayGame, this.onPlayGame),
            t(EGameRootModeState.PlayGame, EGameRootModeEvent.SelectType, EGameRootModeState.SelectType, this.onSelectType),
            t(EGameRootModeState.PlayGame, EGameRootModeEvent.PlayGame, EGameRootModeState.PlayGame, this.onPlayGame),
        ]);
    }

    selectType = async () => this.dispatch(EGameRootModeEvent.SelectType);
    playGame = async () => this.dispatch(EGameRootModeEvent.PlayGame);

    private async onSelectType() {
        console.log('onSelectType');
        RootUI.I.hideAllNodeOff();
        RootUI.I.hideAllGroup();
        // 여기서 리소스 로딩을 해야 한다
        RootUI.I.showLoadingGroup();
        RootUI.I.hideLoadingGroup();
        RootUI.I.showSelectGameTypeNode();
    }

    private async onPlayGame() {
        console.log('onPlayGame');
        RootUI.I.hideAllNodeOff();
        RootUI.I.hideAllGroup();
        RootUI.I.showLoadingGroup();
        RootUI.I.setLoadingProgress(0);

        try {
            // 게임 시작 전 리소스 프리로드는 여기서 수행 (로딩 화면이 있는 구간)
            const currentSuitType = gameInstanceUtility.getCurrentSuitType();
            const backgroundSprite = gameInstanceUtility.getBackgroundSprite();
            backgroundSprite.spriteFrame = null;

            const gameBackgroundPath = new getGameBackground(currentSuitType).getBackgroundResourcePath();
            console.log(`gameBackgroundPath: ${gameBackgroundPath}, gameType: ${currentSuitType}`);

            const assetLists: IAssetLists = {
                prefabs: [],
                audioClips: [],
                spriteFrames: [],
            };

            // 배경 + 캐릭터 수트 스프라이트 프리로드
            if (gameBackgroundPath) {
                assetLists.spriteFrames.push(gameBackgroundPath);
            }
            for (let i = 0; i < ECharacterType.TotalCount; i++) {
                const characterType = i as ECharacterType;
                const resourcePath = new getDancerSuit(characterType).getSuitResourcePath(currentSuitType, false);
                if (resourcePath) {
                    assetLists.spriteFrames.push(resourcePath);
                }
            }

            await ResourceManager.I.preloadGameAssets(
                assetLists,
                (progress) => RootUI.I.setLoadingProgress(progress),
                { concurrency: 6, continueOnError: false }
            );

            // 프리로드가 끝났으니 캐시에서 즉시 가져와 적용
            if (gameBackgroundPath) {
                backgroundSprite.spriteFrame = await ResourceManager.I.loadResource(gameBackgroundPath, SpriteFrame);
            }
        } finally {
            RootUI.I.hideLoadingGroup();
        }
        RootUI.I.showGameNode();
        await new playNewGame().initialize();
    }
}