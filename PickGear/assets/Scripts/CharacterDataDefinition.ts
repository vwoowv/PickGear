export class CharacterDataDefinition {
    public characterName: string;
    public characterSpriteFramePath: string;

    constructor(characterName: string, characterSpriteFramePath: string) {
        this.characterName = characterName;
        this.characterSpriteFramePath = characterSpriteFramePath;
    }
}