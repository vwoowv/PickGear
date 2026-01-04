import { RootUI } from "../RootUI";
import { StateMachine, t } from "../StateMachine/stateMachine";
import { EGameRootModeEvent, EGameRootModeState } from "./gameModeStateEvent";
import { playNewGame } from "./playNewGame";
import { IAssetLists, ResourceManager } from "../ResourceManager";
import { gameInstanceUtility } from "./gameInstanceUtility";
import { getGameBackground } from "../Utility/getGameBackground";
import { SpriteFrame } from "cc";
import { ECharacterType, ECharacterSuitType } from "../GameDefine";
import { getDancerSuit } from "../Character/getDancerSuit";
import { dancerSprite, nameTagSprite } from "../Character/dancerResource";
import { getDancerFace } from "../Character/getDancerFace";

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
        // 선택 화면을 먼저 보여주고, 그 위에서 로딩 진행
        RootUI.I.showSelectGameTypeNode();
        RootUI.I.showLoadingGroup();
        RootUI.I.setLoadingProgress(0);

        try {
            const assetLists: IAssetLists = {
                prefabs: [],
                audioClips: [],
                spriteFrames: [],
            };

            // 모든 수트 타입의 배경 및 캐릭터 수트 스프라이트를 프리로드
            for (const suitTypeKey of Object.keys(ECharacterSuitType)) {
                // enum의 역매핑 숫자 키 필터링
                const numericKey = Number(suitTypeKey);
                if (Number.isNaN(numericKey)) {
                    continue;
                }
                const suitType = numericKey as ECharacterSuitType;
                const gameBackgroundPath = new getGameBackground(suitType).getBackgroundResourcePath();
                if (gameBackgroundPath) {
                    assetLists.spriteFrames.push(gameBackgroundPath);
                }
                for (let i = 0; i < ECharacterType.TotalCount; i++) {
                    const characterType = i as ECharacterType;
                    const resourcePath = new getDancerSuit(characterType).getSuitResourcePath(suitType, false);
                    if (resourcePath) {
                        assetLists.spriteFrames.push(resourcePath);
                    }

                    // 캐릭터 페이스(표정) 리소스 프리로드
                    const faceNormal = new getDancerFace().getFaceResourcePath(characterType, suitType, 0);
                    const faceSuccess = new getDancerFace().getFaceResourcePath(characterType, suitType, 1);
                    const faceFail = new getDancerFace().getFaceResourcePath(characterType, suitType, 2);
                    assetLists.spriteFrames.push(faceNormal, faceSuccess, faceFail);
                }
            }

            // 기본 캐릭터 스프라이트 및 네임태그 프리로드
            assetLists.spriteFrames.push(...dancerSprite.getAllResourcePath());
            for (let i = 0; i < ECharacterType.TotalCount; i++) {
                const characterType = i as ECharacterType;
                assetLists.spriteFrames.push(new nameTagSprite(characterType).resourcePath);
            }

            await ResourceManager.I.preloadGameAssets(
                assetLists,
                (progress) => RootUI.I.setLoadingProgress(progress),
                { concurrency: 6, continueOnError: false }
            );
        } finally {
            RootUI.I.setLoadingProgress(1);
            await new Promise<void>((resolve) => setTimeout(resolve, 0));
            RootUI.I.hideLoadingGroup();
        }

        RootUI.I.showSelectGameTypeNode();
    }

    private async onPlayGame() {
        console.log('onPlayGame');
        RootUI.I.hideAllNodeOff();
        RootUI.I.hideAllGroup();
        RootUI.I.showLoadingGroup();
        RootUI.I.setLoadingProgress(0);

        try {
            // 선택된 수트 타입에 맞는 배경을 캐시에서 가져와 적용
            const currentSuitType = gameInstanceUtility.getCurrentSuitType();
            const backgroundSprite = gameInstanceUtility.getBackgroundSprite();
            backgroundSprite.spriteFrame = null;

            const gameBackgroundPath = new getGameBackground(currentSuitType).getBackgroundResourcePath();
            console.log(`gameBackgroundPath: ${gameBackgroundPath}, gameType: ${currentSuitType}`);

            if (gameBackgroundPath) {
                backgroundSprite.spriteFrame = await ResourceManager.I.loadResource(gameBackgroundPath, SpriteFrame);
            }
        } finally {
            // 마지막 프레임에 100%가 보이도록 보정
            RootUI.I.setLoadingProgress(1);
            // UI 렌더링이 한 프레임 반영될 시간을 줌 (같은 프레임에 비활성화하면 100%가 안 보일 수 있음)
            await new Promise<void>((resolve) => setTimeout(resolve, 0));
            RootUI.I.hideLoadingGroup();
        }
        RootUI.I.showGameNode();
        await new playNewGame().initialize();
    }
}