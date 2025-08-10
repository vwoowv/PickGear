import { _decorator, Component, instantiate, Node, Prefab, SpriteFrame } from 'cc';
import { Character } from './Character';
import { CharacterDataDefinition } from './CharacterDataDefinition';
import { ResourceManager } from './ResourceManager';
import { RootUI } from './RootUI';
import { ECharacterSuitType, ECharacterType } from './GameDefine';
const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {
    private static _instance: GameManager = null;

    private characterDataDefinitions: { [key: string]: CharacterDataDefinition } = {
        "EmmaMoon": new CharacterDataDefinition("EmmaMoon", "textures/Character/EmmaMoon/spriteFrame"),
        "DoArin": new CharacterDataDefinition("DoArin", "textures/Character/DoArin/spriteFrame"),
        "SongUnbee": new CharacterDataDefinition("SongUnbee", "textures/Character/SongUnbee/spriteFrame"),
        "SooHana": new CharacterDataDefinition("SooHana", "textures/Character/SooHana/spriteFrame")
    };
    private characterNames: string[] = ["DoArin", "EmmaMoon", "SongUnbee", "SooHana"];

    private characters: { [key: string]: Character } = {};

    @property(RootUI)
    private rootUI: RootUI = null;

    @property(Node)
    public characterPos: Node = null;

    public currentSuitType: [ECharacterType, ECharacterSuitType][] = [];

    // Singleton 인스턴스에 접근하는 getter
    public static get I(): GameManager {
        if (GameManager._instance === null) {
            console.error('GameManager Singleton이 초기화되지 않았습니다!');
        }
        return GameManager._instance;
    }

    // 싱글톤 초기화
    onLoad() {
        if (GameManager._instance === null) {
            GameManager._instance = this;
            console.log('GameManager Singleton이 생성되었습니다.');
        } else {
            // 이미 인스턴스가 존재하면 현재 노드를 파괴
            this.node.destroy();
        }
    }

    // 인스턴스가 파괴될 때 참조 정리
    onDestroy() {
        if (GameManager._instance === this) {
            GameManager._instance = null;
            console.log('GameManager Singleton이 파괴되었습니다.');
        }
    }

    start() {
        // 게임 초기화 로직
        console.log('GameManager 시작!');
        this.initialize();
    }

    update(deltaTime: number) {
        // 게임 업데이트 로직
    }

    private async initialize() {
        await this.prepareData();
        this.startGame();
    }

    private async prepareData() {
        for (const characterName of this.characterNames) {
            const characterPath = "prefab/character/" + characterName;
            const character = await ResourceManager.I.loadResource<Prefab>(characterPath, Prefab);
            const characterNode = instantiate(character);
            this.characters[characterName] = characterNode.getComponent(Character);
        }
    }

    private async showCharacterPreview() {
        let count = this.characterNames.length;
        for (const characterName of this.characterNames) {
            const character = this.characters[characterName];
            character.node.setParent(this.characterPos);

            this.rootUI.setCountText(count);

            const suitType = await character.ShowRandomSuit();
            this.currentSuitType.push([character.characterType, suitType]);
            console.log(this.currentSuitType);
            character.node.setParent(null);
            count--;
        }
        this.rootUI.showCountText(false);
    }

    // 게임 매니저의 기능들
    public async startGame() {
        console.log('게임 시작!');
        this.currentSuitType = [];
        this.rootUI.showTimeProgressBar(false);
        await this.showCharacterPreview();
        await this.PickCharacterSuit();
    }

    public pauseGame() {
        console.log('게임 일시정지!');
    }

    public resumeGame() {
        console.log('게임 재개!');
    }

    private durationMS: number = 10000;
    private async PickCharacterSuit() {
        // 캐릭터를 순서대로 보여주면서 해당 캐릭터의 옷을 스크롤 시킨다
        this.rootUI.showTimeProgressBar(true);
        this.rootUI.setTimeProgressBar(1);

        let currentTimeMS = this.durationMS;
        let nextCharacterTimeMS = this.durationMS / this.characterNames.length;
        let currentCharacterIndex = 0;
        this.showCharacter(this.characterNames[currentCharacterIndex]);
        while (currentTimeMS > 0) {
            currentTimeMS -= 10;
            this.rootUI.setTimeProgressBar(currentTimeMS / this.durationMS);
            if (this.durationMS - currentTimeMS >= nextCharacterTimeMS) {
                currentCharacterIndex++;
                if (currentCharacterIndex >= this.characterNames.length) {
                    break;
                }
                nextCharacterTimeMS += this.durationMS / this.characterNames.length;
                this.showCharacter(this.characterNames[currentCharacterIndex]);
            }
            await delay(10);
        }

        console.log("Game Over");
    }

    private showCharacter(characterName: string) {
        this.characterPos.removeAllChildren();
        const character = this.characters[characterName];
        character.node.setParent(this.characterPos);
        character.takeOffSuit();
    }
}

function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

