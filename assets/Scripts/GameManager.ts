import { _decorator, Component, instantiate, Node, Prefab, SpriteFrame, Vec3 } from 'cc';
import { Character } from './Character';
import { CharacterDataDefinition } from './CharacterDataDefinition';
import { ResourceManager } from './ResourceManager';
import { RootUI } from './RootUI';
import { ECharacterSuitType, ECharacterType } from './GameDefine';
import { RollingSuit } from './RollingSuit';
const { ccclass, property } = _decorator;

export enum EGameState {
    None,
    Pick_Suit,
    Switch_ShowResult,
    ShowResult,
    End_Game,
}

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
    @property(Node)
    public rollingSuitPos: Node = null;
    @property(Node)
    public characterRollingPosStart: Node = null;
    @property(Node)
    public characterRollingPosEnd: Node = null;
    @property(Node)
    public resultPos: Node[] = [];

    // public currentSuitType: [ECharacterType, ECharacterSuitType][] = [];
    public currentSuitType = new Map<ECharacterType, ECharacterSuitType>();
    public currentGameState: EGameState = EGameState.None;
    private pickedSuitList: ECharacterSuitType[] = [];

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
        if (this.currentGameState === EGameState.Pick_Suit) {
            this.updatePickSuit(deltaTime);
        }
        else if (this.currentGameState === EGameState.Switch_ShowResult) {
            this.showGameResult();
        }

        // 시간이 끝나도 계속 이동
        this.rollingSuitList.forEach(suit => {
            suit.roll(deltaTime);
        });
    }

    private updatePickSuit(deltaTime: number) {
        this.updatePickCharacter(deltaTime);
        this.checkAndAddrollSuit(deltaTime);
        this.updatePickSuitTime(deltaTime);
    }

    private updatePickSuitTime(deltaTime: number) {
        this.currentTime -= deltaTime;
        if (this.currentTime > 0) {
            return;
        }
        this.currentGameState = EGameState.Switch_ShowResult;
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
            this.currentSuitType.set(character.characterType, suitType);
            console.log(this.currentSuitType);
            character.node.setParent(null);
            count--;
        }
        this.rootUI.showCountText(false);
    }

    // 게임 매니저의 기능들
    public async startGame() {
        console.log('게임 시작!');
        this.currentSuitType.clear();
        this.pickedSuitList = [
            ECharacterSuitType.NONE,
            ECharacterSuitType.NONE,
            ECharacterSuitType.NONE,
            ECharacterSuitType.NONE
        ];
        this.rootUI.showResultCountText(false);
        this.rootUI.showTimeProgressBar(false);
        await this.showCharacterPreview();
        await this.PickCharacterSuit();
    }

    private duration: number = 10;
    private currentTime: number = 0;
    private currentCharacterIndex: number = 0;
    private nextCharacterTime: number = 0;
    private async PickCharacterSuit() {
        // 캐릭터를 순서대로 보여주면서 해당 캐릭터의 옷을 스크롤 시킨다
        this.rootUI.showTimeProgressBar(true);
        this.rootUI.setTimeProgressBar(1);

        this.currentTime = this.duration;
        this.nextCharacterTime = this.duration / this.characterNames.length;
        this.currentCharacterIndex = 0;
        this.showCharacter(this.characterNames[this.currentCharacterIndex]);
        this.currentGameState = EGameState.Pick_Suit;
        this.rollingSuitPos.removeAllChildren();
    }

    private updatePickCharacter(deltaTime: number) {
        this.rootUI.setTimeProgressBar(this.currentTime / this.duration);
        if (this.duration - this.currentTime >= this.nextCharacterTime) {
            this.currentCharacterIndex++;
            console.log("currentCharacterIndex : " + this.currentCharacterIndex + ", nextCharacterTime : " + this.nextCharacterTime);
            if (this.currentCharacterIndex >= this.characterNames.length) {
                return false;
            }
            this.nextCharacterTime += this.duration / this.characterNames.length;
            this.showCharacter(this.characterNames[this.currentCharacterIndex]);
        }
        return true;
    }

    private nextRollingSuitTime: number = 0;
    private rollingSuitList: RollingSuit[] = [];
    private async checkAndAddrollSuit(deltaTime: number) {
        this.nextRollingSuitTime -= deltaTime;
        if (this.duration < 1) {
            return;
        }

        if (this.nextRollingSuitTime <= 0) {
            console.log("rollSuit");
            this.nextRollingSuitTime = 0.5;       // 0.5초 마다 하나씩 새로운 옷을 보여준다
            const newRollingSuit = await ResourceManager.I.loadResource<Prefab>("prefab/suit/RollingSuit", Prefab);
            const rollingNode = instantiate(newRollingSuit);
            rollingNode.setParent(this.rollingSuitPos);
            rollingNode.setPosition(this.characterRollingPosStart.position);
            const rollingSuit = rollingNode.getComponent(RollingSuit);
            this.rollingSuitList.push(rollingSuit);
            let characterName = this.characterNames[this.currentCharacterIndex];
            const character = this.characters[characterName];
            const [suitSprite, suitType] = character.getRandomSuit();
            rollingSuit.Initialize(suitSprite, suitType);
        }
    }

    private showCharacter(characterName: string) {
        this.characterPos.removeAllChildren();
        const character = this.characters[characterName];
        character.node.setParent(this.characterPos);
        character.takeOffSuit();
    }

    public async touchSuit() {
        if (this.currentGameState !== EGameState.Pick_Suit) {
            return;
        }
        console.log('touchSuit');
        // 터치했을 때 가장 근접한 옷을 찾는다. x 좌표가 0에 가장 가까운 옷
        let closedDistance = 100000;
        let closedSuit: RollingSuit = null;
        this.rollingSuitList.forEach(suit => {
            let distance = Math.abs(suit.node.position.x);
            if (distance < closedDistance) {
                closedDistance = distance;
                closedSuit = suit;
            }
        });
        if (closedSuit === null || closedDistance > 30) {
            return;
        }

        this.pickedSuitList[this.currentCharacterIndex] = closedSuit.suitType;

        console.log(closedSuit.suitType);
        if (this.currentSuitType[this.currentCharacterIndex].indexOf(closedSuit.suitType) !== -1) {
            console.log("pickSuit");
            this.showPickSuit(closedSuit);
        }
    }

    private async showPickSuit(pickedSuit: RollingSuit) {
        pickedSuit.node.scale = new Vec3(1.1, 1.1, 1.1);
        await delay(500);
        pickedSuit.node.scale = new Vec3(1, 1, 1);
    }

    private async showGameResult() {
        this.currentGameState = EGameState.ShowResult;
        this.rootUI.showTimeProgressBar(false);
        this.characterPos.removeAllChildren();
        this.rollingSuitPos.removeAllChildren();
        let pickCount = 0;
        for (let i = 0; i < this.characterNames.length; i++) {
            const character = this.characters[this.characterNames[i]];
            character.node.setParent(this.resultPos[i]);
            const characterSuitType = this.currentSuitType.get(character.characterType);
            character.showSuit(characterSuitType);
            if (this.pickedSuitList[i] === characterSuitType) {
                pickCount++;
            }
        }
        this.rootUI.showResultCountText(true);
        this.rootUI.setResultCountText(pickCount);
    }
}

function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
