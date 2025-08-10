import { _decorator, Component, Node, resources, Sprite, SpriteFrame } from 'cc';
import { ResourceManager } from './ResourceManager';
import { GameManager } from './GameManager';
import { CharacterDataDefinition } from './CharacterDataDefinition';
const { ccclass, property } = _decorator;

// 캐릭터 타입을 구분하는 enum을 생성합니다.
export enum ECharacterSuitType {
    HYBE = 0,
    YG = 1,
    JYP = 2,
    SM = 3
}

@ccclass('Character')
export class Character extends Component {
    @property(Sprite)
    private characterSprite: Sprite = null;
    @property(Sprite)
    private currentShit: Sprite = null;

    @property(SpriteFrame)
    public SuitList: SpriteFrame[] = [];

    public Initialize(characterData: CharacterDataDefinition) {
        this.prepareData();
    }

    update(deltaTime: number) {

    }

    public async prepareData() {
        // this.characterSprite.spriteFrame = await ResourceManager.I.loadResource(this.characterData.characterSpriteFramePath, SpriteFrame);
    }

    // 전체 돌면서 한번씩 보여주기
    public async showPreview() {
        this.currentShit.spriteFrame = this.SuitList[ECharacterSuitType.HYBE];
        await this.delay(1000);
        this.currentShit.spriteFrame = this.SuitList[ECharacterSuitType.YG];
        await this.delay(1000);
        this.currentShit.spriteFrame = this.SuitList[ECharacterSuitType.JYP];
        await this.delay(1000);
        this.currentShit.spriteFrame = this.SuitList[ECharacterSuitType.SM];
        await this.delay(1000);
    }

    public async ShowRandomSuit() {
        const randomSuit = this.SuitList[Math.floor(Math.random() * this.SuitList.length)];
        this.currentShit.spriteFrame = randomSuit;
        await this.delay(1000);
    }

    private async delay(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
