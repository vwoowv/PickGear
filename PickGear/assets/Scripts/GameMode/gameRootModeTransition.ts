import { gameInstance } from "../gameInstance";
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
    private presentationVersion = 0;
    public cancelPresentation() { this.presentationVersion++; }

    constructor() {
        super(EGameRootModeState.Begin, []);
        this.addTransitions([
            t(EGameRootModeState.Begin, EGameRootModeEvent.SelectType, EGameRootModeState.SelectType, this.onSelectType),
            t(EGameRootModeState.SelectType, EGameRootModeEvent.SelectType, EGameRootModeState.SelectType, this.onSelectType),
            t(EGameRootModeState.SelectType, EGameRootModeEvent.PlayGame, EGameRootModeState.PlayGame, this.onPlayGame),
            t(EGameRootModeState.PlayGame, EGameRootModeEvent.SelectType, EGameRootModeState.SelectType, this.onSelectType),
            t(EGameRootModeState.PlayGame, EGameRootModeEvent.PlayGame, EGameRootModeState.PlayGame, this.onPlayGame),
        ]);
    }

    selectType = async () => this.dispatch(EGameRootModeEvent.SelectType);
    playGame = async () => this.dispatch(EGameRootModeEvent.PlayGame);

    private async onSelectType() {
        console.log('onSelectType');
        const presentation = ++this.presentationVersion;
        RootUI.I.hideAllNodeOff();
        RootUI.I.hideAllGroup();
        // 선택 화면을 먼저 보여주고, 그 위에서 로딩 진행
        RootUI.I.showSelectGameTypeNode();
        RootUI.I.showLoadingGroup();
        RootUI.I.setLoadingProgress(0);

        try {
            const assetLists: IAssetLists = {
                prefabs: [],
                audioClips: ['sound/Kiss and cry_Game'],
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
                (progress) => { if (presentation === this.presentationVersion) RootUI.I.setLoadingProgress(progress); },
                { concurrency: 6, continueOnError: false }
            );
            if (presentation === this.presentationVersion) await gameInstance.I.prepareGameAudio();
        } finally {
            if (presentation === this.presentationVersion) {
                RootUI.I.setLoadingProgress(1);
                await new Promise<void>((resolve) => setTimeout(resolve, 0));
                if (presentation === this.presentationVersion) RootUI.I.hideLoadingGroup();
            }
        }

        if (presentation !== this.presentationVersion) return;
        RootUI.I.showSelectGameTypeNode();
        gameInstance.I.playing.notifyGameReady();
    }

    private async onPlayGame() {
        console.log('onPlayGame');
        this.presentationVersion++;
        const sessionId = gameInstance.I.playing.sessionId;
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
                const frame = await ResourceManager.I.loadResource<SpriteFrame>(gameBackgroundPath, SpriteFrame);
                if (gameInstance.I.playing.isSessionCurrent(sessionId)) backgroundSprite.spriteFrame = frame;
            }
        } finally {
            if (gameInstance.I.playing.isSessionCurrent(sessionId)) {
                RootUI.I.setLoadingProgress(1);
                await new Promise<void>((resolve) => setTimeout(resolve, 0));
                if (gameInstance.I.playing.isSessionCurrent(sessionId)) RootUI.I.hideLoadingGroup();
            }
        }
        if (!gameInstance.I.playing.isSessionCurrent(sessionId)) return;
        RootUI.I.showGameNode();
        await new playNewGame().initialize();
    }
}