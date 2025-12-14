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

    public async initialize(gameManager: gameManager) {
        const level = gameManager.gameMode.getCurrentLevelFromVersion();
        const prop = gameProperty.I;

        // 현재 레벨에서 하나라도 0보다 작은 점수를 가진 캐릭터가 있는지 확인
        let hasNegativeScore = false;
        for (let i = 0; i < EggType.TotalCount; i++) {
            if (prop.getScore(level, i) < 0) {
                hasNegativeScore = true;
                break;
            }
        }

        this.OpeningNerdsGroup.active = hasNegativeScore;

        // 스코어가 0보다 큰 캐릭터들을 정리
        const positiveScores: { eggType: EggType; score: number; image: string }[] = [];
        // 스코어가 0보다 작은 캐릭터들을 정리
        const negativeScores: { eggType: EggType; score: number; image: string }[] = [];

        for (let i = 0; i < EggType.TotalCount; i++) {
            const score = prop.getScore(level, i);
            const image = prop.getImage(level, i);
            if (score > 0) {
                positiveScores.push({ eggType: i, score, image });
            } else if (score < 0) {
                negativeScores.push({ eggType: i, score, image });
            }
        }

        // gameManager/playStartingNode와 동일한 배치 규칙 적용
        sortOpeningPositiveScores(level, positiveScores);

        // openingEggNormalList에 세팅
        let normalIndex = 0;
        for (const item of positiveScores) {
            if (normalIndex < this.openingEggNormalList.length && this.openingEggNormalList[normalIndex] != null) {
                await this.openingEggNormalList[normalIndex].initialize(item.image, item.score);
                this.openingEggNormalList[normalIndex].node.active = true;
                normalIndex++;
            }
        }
        // 나머지는 안 보이게 처리
        for (let i = normalIndex; i < this.openingEggNormalList.length; i++) {
            if (this.openingEggNormalList[i] != null) {
                this.openingEggNormalList[i].node.active = false;
            }
        }

        // openingEggNegativeList에 세팅
        let negativeIndex = 0;
        for (const item of negativeScores) {
            if (negativeIndex < this.openingEggNegativeList.length && this.openingEggNegativeList[negativeIndex] != null) {
                await this.openingEggNegativeList[negativeIndex].initialize(item.image, item.score);
                this.openingEggNegativeList[negativeIndex].node.active = true;
                negativeIndex++;
            }
        }
        // 나머지는 안 보이게 처리
        for (let i = negativeIndex; i < this.openingEggNegativeList.length; i++) {
            if (this.openingEggNegativeList[i] != null) {
                this.openingEggNegativeList[i].node.active = false;
            }
        }
    }
}
