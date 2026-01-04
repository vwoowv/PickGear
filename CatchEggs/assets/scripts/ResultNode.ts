import { _decorator, Component, Node } from 'cc';
import { openingEgg } from './openingEgg';
import { gameManager } from './gameManager';
import { EggType } from './gameDefine';
import { gameProperty } from './gameProperty';
import { sortOpeningPositiveScores } from './openingCharacterOrder';
const { ccclass, property } = _decorator;

@ccclass('ResultNode')
export class ResultNode extends Component {
    @property(Node)
    private readonly OpeningNerdsGroup: Node = null;
    @property(openingEgg)
    private readonly openingEggNormalList: openingEgg[] = [];
    @property(openingEgg)
    private readonly openingEggNegativeList: openingEgg[] = [];
    @property(Node)
    private readonly perfectNode: Node = null;
    @property(Node)
    private readonly notPerfectNode: Node = null;

    public async initialize(gameManager: gameManager) {
        const level = gameManager.gameMode.getCurrentLevelFromVersion();
        const prop = gameProperty.I;

        this.perfectNode.active = gameManager.perfect;
        this.notPerfectNode.active = !gameManager.perfect;

        this.OpeningNerdsGroup.active = this.hasNegativeScore(prop, level);

        const { positiveScores, negativeScores } = this.buildScoreLists(prop, level);

        // gameManager/playStartingNode와 동일한 배치 규칙 적용
        sortOpeningPositiveScores(level, positiveScores);

        await this.applyScoresToOpeningEggs(this.openingEggNormalList, positiveScores);
        await this.applyScoresToOpeningEggs(this.openingEggNegativeList, negativeScores);
    }

    private hasNegativeScore(prop: gameProperty, level: number): boolean {
        for (let i = 0; i < EggType.TotalCount; i++) {
            if (prop.getScore(level, i) < 0) {
                return true;
            }
        }
        return false;
    }

    private buildScoreLists(prop: gameProperty, level: number): {
        positiveScores: { eggType: EggType; score: number; image: string }[];
        negativeScores: { eggType: EggType; score: number; image: string }[];
    } {
        const positiveScores: { eggType: EggType; score: number; image: string }[] = [];
        const negativeScores: { eggType: EggType; score: number; image: string }[] = [];

        for (let i = 0; i < EggType.TotalCount; i++) {
            const score = prop.getScore(level, i);
            if (score === 0) {
                continue;
            }
            const image = prop.getImage(level, i);
            if (score > 0) {
                positiveScores.push({ eggType: i, score, image });
            } else {
                negativeScores.push({ eggType: i, score, image });
            }
        }

        return { positiveScores, negativeScores };
    }

    private async applyScoresToOpeningEggs(
        targetList: openingEgg[],
        scores: { eggType: EggType; score: number; image: string }[]
    ) {
        let index = 0;
        for (const item of scores) {
            if (index >= targetList.length) {
                break;
            }
            const slot = targetList[index];
            if (slot != null) {
                await slot.initialize(item.image, item.score);
                slot.node.active = true;
                index++;
            }
        }
        for (let i = index; i < targetList.length; i++) {
            if (targetList[i] != null) {
                targetList[i].node.active = false;
            }
        }
    }
}
