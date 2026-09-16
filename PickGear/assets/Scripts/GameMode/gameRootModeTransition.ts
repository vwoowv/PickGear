import { gameInstance } from "../gameInstance";
import { RootUI } from "../RootUI";
import { StateMachine, t } from "../StateMachine/stateMachine";
import { EGameRootModeEvent, EGameRootModeState } from "./gameModeStateEvent";
import { playNewGame } from "./playNewGame";
import { IAssetLists, ResourceManager } from "../ResourceManager";
import { gameInstanceUtility } from "./gameInstanceUtility";
import { getGameBackground } from "../Utility/getGameBackground";
import { SpriteFrame } from "cc";
import { ECharacterType, ECharacterSuitType, EFaceType } from "../GameDefine";
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
            // 첫 클릭 음악 재생에 필요한 공통 오디오만 기다린다.
            // 게임용 이미지는 종류를 선택한 뒤 해당 종류만 준비한다.
            await ResourceManager.I.preloadGameAssets(
                { audioClips: ['sound/Kiss and cry_Game'] },
                (progress) => { if (presentation === this.presentationVersion) RootUI.I.setLoadingProgress(progress); },
                { concurrency: 6, continueOnError: false }
            );
            if (presentation !== this.presentationVersion) return;
            await gameInstance.I.prepareGameAudio();
        } finally {
            if (presentation === this.presentationVersion) {
                await new Promise<void>((resolve) => setTimeout(resolve, 0));
                if (presentation === this.presentationVersion) RootUI.I.hideLoadingGroup();
            }
        }

        if (presentation !== this.presentationVersion) return;
        RootUI.I.showSelectGameTypeNode();
        gameInstance.I.playing.notifyGameReady();
    }

    private getGameAssetLists(suitType: ECharacterSuitType): IAssetLists {
        const spriteFrames = [
            new getGameBackground(suitType).getBackgroundResourcePath(),
            ...dancerSprite.getAllResourcePath(),
        ];
        for (let i = 0; i < ECharacterType.TotalCount; i++) {
            const characterType = i as ECharacterType;
            const suit = new getDancerSuit(characterType);
            spriteFrames.push(
                new nameTagSprite(characterType).resourcePath,
                suit.getSuitResourcePath(suitType, false),
                // YG의 정답 의상은 이동하는 의상과 별도 에셋이다.
                // 나머지 종류의 동일 경로는 ResourceManager가 중복 제거한다.
                suit.getSuitResourcePath(suitType, true),
            );
            for (const faceType of [EFaceType.Normal, EFaceType.Success, EFaceType.Fail]) {
                spriteFrames.push(new getDancerFace().getFaceResourcePath(characterType, suitType, faceType));
            }
        }
        return {
            prefabs: ['prefab/character/Dancer', 'prefab/suit/RollingSuit'],
            audioClips: ['sound/Kiss and cry_Game_Yes', 'sound/Kiss and cry_Game_No'],
            spriteFrames,
        };
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
            // 선택한 게임에서 사용할 에셋만 준비한다. 재시작 시에는 캐시를 재사용한다.
            const currentSuitType = gameInstanceUtility.getCurrentSuitType();
            await ResourceManager.I.preloadGameAssets(
                this.getGameAssetLists(currentSuitType),
                (progress) => {
                    if (gameInstance.I.playing.isSessionCurrent(sessionId)) RootUI.I.setLoadingProgress(progress);
                },
                { concurrency: 6, continueOnError: false }
            );
            if (!gameInstance.I.playing.isSessionCurrent(sessionId)) return;

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
                await new Promise<void>((resolve) => setTimeout(resolve, 0));
                if (gameInstance.I.playing.isSessionCurrent(sessionId)) RootUI.I.hideLoadingGroup();
            }
        }
        if (!gameInstance.I.playing.isSessionCurrent(sessionId)) return;
        RootUI.I.showGameNode();
        await new playNewGame().initialize();
    }
}
