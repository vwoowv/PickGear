import { RollingSuit } from "./Character/RollingSuit";

class PickedSuit {
    public suit: RollingSuit;
    public leftTime: number;

    constructor(suit: RollingSuit) {
        this.suit = suit;
        this.leftTime = 0.5;
    }
}

export class PickedSuitManager {
    private pickedSuitList: PickedSuit[] = [];

    public update(deltaTime: number) {
        for (let i = 0; i < this.pickedSuitList.length; i++) {
            this.pickedSuitList[i].leftTime -= deltaTime;
            if (this.pickedSuitList[i].leftTime <= 0) {
                this.pickedSuitList[i].suit.node.setParent(null);
                this.pickedSuitList[i].suit.node.destroy();
                this.pickedSuitList.splice(i, 1);
            }
        }
    }

    public addPickedSuit(suit: RollingSuit) {
        this.pickedSuitList.push(new PickedSuit(suit));
    }
}
