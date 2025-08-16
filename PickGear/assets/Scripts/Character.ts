import { _decorator, Component, Enum, Node, resources, Sprite, SpriteFrame } from 'cc';
import { ResourceManager } from './ResourceManager';
import { GameManager } from './GameManager';
import { CharacterDataDefinition } from './CharacterDataDefinition';
import { ECharacterSuitType, ECharacterType } from './GameDefine';
const { ccclass, property } = _decorator;

@ccclass('Character')
export class Character extends Component {
    @property(Sprite)
    private characterSprite: Sprite = null;
    @property(Sprite)
    private currentShit: Sprite = null;

    @property(SpriteFrame)
    public SuitList: SpriteFrame[] = [];

    @property({ type: Enum(ECharacterType) })
    public characterType: ECharacterType = ECharacterType.DoArin;

    public Initialize(characterData: CharacterDataDefinition) {
        this.prepareData();
    }

    update(deltaTime: number) {

    }

    public async prepareData() {
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

    public async ShowRandomSuit(): Promise<ECharacterSuitType> {
        const randomSuitType = Math.floor(Math.random() * this.SuitList.length);
        const randomSuit = this.SuitList[randomSuitType];
        this.currentShit.spriteFrame = randomSuit;
        await this.delay(1000);
        return randomSuitType;
    }

    public showSuit(suitType: ECharacterSuitType) {
        this.currentShit.spriteFrame = this.SuitList[suitType];
    }

    public takeOffSuit() {
        this.currentShit.spriteFrame = null;
    }

    private exposedSuitTypeList: ECharacterSuitType[] = [];
    // 겹치지 않게 랜덤으로 지급해야 한다
    public getRandomSuit(): [SpriteFrame, ECharacterSuitType] {
        if (this.exposedSuitTypeList.length === this.SuitList.length) {
            this.exposedSuitTypeList = [];
        }
        const randomSuitType = Math.floor(Math.random() * this.SuitList.length);
        if (this.exposedSuitTypeList.indexOf(randomSuitType) !== -1) {
            return this.getRandomSuit();
        }
        this.exposedSuitTypeList.push(randomSuitType);
        return [this.SuitList[randomSuitType], randomSuitType];
    }

    private async delay(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
