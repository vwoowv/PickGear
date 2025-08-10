import { _decorator, Component, Node, resources, Sprite, SpriteFrame } from 'cc';
import { ResourceManager } from './ResourceManager';
import { GameManager } from './GameManager';
import { CharacterDataDefinition } from './CharacterDataDefinition';
const { ccclass, property } = _decorator;

@ccclass('Character')
export class Character extends Component {
    @property(Sprite)
    private characterSprite: Sprite = null;

    public Initialize(characterData: CharacterDataDefinition) {
        this.prepareData();
    }

    update(deltaTime: number) {

    }

    public async prepareData() {
        // this.characterSprite.spriteFrame = await ResourceManager.I.loadResource(this.characterData.characterSpriteFramePath, SpriteFrame);
    }
}
