import { _decorator, CCInteger, Component } from "cc";
import { ECharacterSuitType } from "./GameDefine";
const { ccclass, property } = _decorator;

@ccclass('gamePlayProperty')
export class gamePlayProperty extends Component {
    // === YG: Speed ===
    @property({ type: CCInteger, group: { name: 'YG', id: 'suit_tab', displayOrder: 1, style: 'tab' } })
    public ygLevel1Speed: number = 120;
    @property({ type: CCInteger, group: { name: 'YG', id: 'suit_tab', displayOrder: 1, style: 'tab' } })
    public ygLevel2Speed: number = 240;
    @property({ type: CCInteger, group: { name: 'YG', id: 'suit_tab', displayOrder: 1, style: 'tab' } })
    public ygLevel3Speed: number = 360;
    @property({ type: CCInteger, group: { name: 'YG', id: 'suit_tab', displayOrder: 1, style: 'tab' } })
    public ygLevel4Speed: number = 480;
    @property({ type: CCInteger, group: { name: 'YG', id: 'suit_tab', displayOrder: 1, style: 'tab' } })
    public ygLevel5Speed: number = 600;

    // === YG: Distance ===
    @property({ type: CCInteger, group: { name: 'YG', id: 'suit_tab', displayOrder: 1, style: 'tab' } })
    public ygLevel1PickDistance: number = 150;
    @property({ type: CCInteger, group: { name: 'YG', id: 'suit_tab', displayOrder: 1, style: 'tab' } })
    public ygLevel2PickDistance: number = 150;
    @property({ type: CCInteger, group: { name: 'YG', id: 'suit_tab', displayOrder: 1, style: 'tab' } })
    public ygLevel3PickDistance: number = 150;
    @property({ type: CCInteger, group: { name: 'YG', id: 'suit_tab', displayOrder: 1, style: 'tab' } })
    public ygLevel4PickDistance: number = 150;
    @property({ type: CCInteger, group: { name: 'YG', id: 'suit_tab', displayOrder: 1, style: 'tab' } })
    public ygLevel5PickDistance: number = 150;

    // === YG: Score ===
    @property({ type: CCInteger, group: { name: 'YG', id: 'suit_tab', displayOrder: 1, style: 'tab' } })
    public ygLevel1Score: number = 1;
    @property({ type: CCInteger, group: { name: 'YG', id: 'suit_tab', displayOrder: 1, style: 'tab' } })
    public ygLevel2Score: number = 1;
    @property({ type: CCInteger, group: { name: 'YG', id: 'suit_tab', displayOrder: 1, style: 'tab' } })
    public ygLevel3Score: number = 1;
    @property({ type: CCInteger, group: { name: 'YG', id: 'suit_tab', displayOrder: 1, style: 'tab' } })
    public ygLevel4Score: number = 1;
    @property({ type: CCInteger, group: { name: 'YG', id: 'suit_tab', displayOrder: 1, style: 'tab' } })
    public ygLevel5Score: number = 1;

    // === YG: Wrong Score ===
    @property({ type: CCInteger, group: { name: 'YG', id: 'suit_tab', displayOrder: 1, style: 'tab' } })
    public ygLevel1ScoreWrong: number = -1;
    @property({ type: CCInteger, group: { name: 'YG', id: 'suit_tab', displayOrder: 1, style: 'tab' } })
    public ygLevel2ScoreWrong: number = -1;
    @property({ type: CCInteger, group: { name: 'YG', id: 'suit_tab', displayOrder: 1, style: 'tab' } })
    public ygLevel3ScoreWrong: number = -1;
    @property({ type: CCInteger, group: { name: 'YG', id: 'suit_tab', displayOrder: 1, style: 'tab' } })
    public ygLevel4ScoreWrong: number = -1;
    @property({ type: CCInteger, group: { name: 'YG', id: 'suit_tab', displayOrder: 1, style: 'tab' } })
    public ygLevel5ScoreWrong: number = -1;

    // === JYP: Speed ===
    @property({ type: CCInteger, group: { name: 'JYP', id: 'suit_tab', displayOrder: 2, style: 'tab' } })
    public jypLevel1Speed: number = 120;
    @property({ type: CCInteger, group: { name: 'JYP', id: 'suit_tab', displayOrder: 2, style: 'tab' } })
    public jypLevel2Speed: number = 240;
    @property({ type: CCInteger, group: { name: 'JYP', id: 'suit_tab', displayOrder: 2, style: 'tab' } })
    public jypLevel3Speed: number = 360;
    @property({ type: CCInteger, group: { name: 'JYP', id: 'suit_tab', displayOrder: 2, style: 'tab' } })
    public jypLevel4Speed: number = 480;
    @property({ type: CCInteger, group: { name: 'JYP', id: 'suit_tab', displayOrder: 2, style: 'tab' } })
    public jypLevel5Speed: number = 600;

    // === JYP: Distance ===
    @property({ type: CCInteger, group: { name: 'JYP', id: 'suit_tab', displayOrder: 2, style: 'tab' } })
    public jypLevel1PickDistance: number = 150;
    @property({ type: CCInteger, group: { name: 'JYP', id: 'suit_tab', displayOrder: 2, style: 'tab' } })
    public jypLevel2PickDistance: number = 150;
    @property({ type: CCInteger, group: { name: 'JYP', id: 'suit_tab', displayOrder: 2, style: 'tab' } })
    public jypLevel3PickDistance: number = 150;
    @property({ type: CCInteger, group: { name: 'JYP', id: 'suit_tab', displayOrder: 2, style: 'tab' } })
    public jypLevel4PickDistance: number = 150;
    @property({ type: CCInteger, group: { name: 'JYP', id: 'suit_tab', displayOrder: 2, style: 'tab' } })
    public jypLevel5PickDistance: number = 150;

    // === JYP: Score ===
    @property({ type: CCInteger, group: { name: 'JYP', id: 'suit_tab', displayOrder: 2, style: 'tab' } })
    public jypLevel1Score: number = 1;
    @property({ type: CCInteger, group: { name: 'JYP', id: 'suit_tab', displayOrder: 2, style: 'tab' } })
    public jypLevel2Score: number = 1;
    @property({ type: CCInteger, group: { name: 'JYP', id: 'suit_tab', displayOrder: 2, style: 'tab' } })
    public jypLevel3Score: number = 1;
    @property({ type: CCInteger, group: { name: 'JYP', id: 'suit_tab', displayOrder: 2, style: 'tab' } })
    public jypLevel4Score: number = 1;
    @property({ type: CCInteger, group: { name: 'JYP', id: 'suit_tab', displayOrder: 2, style: 'tab' } })
    public jypLevel5Score: number = 1;

    // === JYP: Wrong Score ===
    @property({ type: CCInteger, group: { name: 'JYP', id: 'suit_tab', displayOrder: 2, style: 'tab' } })
    public jypLevel1ScoreWrong: number = -1;
    @property({ type: CCInteger, group: { name: 'JYP', id: 'suit_tab', displayOrder: 2, style: 'tab' } })
    public jypLevel2ScoreWrong: number = -1;
    @property({ type: CCInteger, group: { name: 'JYP', id: 'suit_tab', displayOrder: 2, style: 'tab' } })
    public jypLevel3ScoreWrong: number = -1;
    @property({ type: CCInteger, group: { name: 'JYP', id: 'suit_tab', displayOrder: 2, style: 'tab' } })
    public jypLevel4ScoreWrong: number = -1;
    @property({ type: CCInteger, group: { name: 'JYP', id: 'suit_tab', displayOrder: 2, style: 'tab' } })
    public jypLevel5ScoreWrong: number = -1;

    // === SM: Speed ===
    @property({ type: CCInteger, group: { name: 'SM', id: 'suit_tab', displayOrder: 3, style: 'tab' } })
    public smLevel1Speed: number = 120;
    @property({ type: CCInteger, group: { name: 'SM', id: 'suit_tab', displayOrder: 3, style: 'tab' } })
    public smLevel2Speed: number = 240;
    @property({ type: CCInteger, group: { name: 'SM', id: 'suit_tab', displayOrder: 3, style: 'tab' } })
    public smLevel3Speed: number = 360;
    @property({ type: CCInteger, group: { name: 'SM', id: 'suit_tab', displayOrder: 3, style: 'tab' } })
    public smLevel4Speed: number = 480;
    @property({ type: CCInteger, group: { name: 'SM', id: 'suit_tab', displayOrder: 3, style: 'tab' } })
    public smLevel5Speed: number = 600;

    // === SM: Distance ===
    @property({ type: CCInteger, group: { name: 'SM', id: 'suit_tab', displayOrder: 3, style: 'tab' } })
    public smLevel1PickDistance: number = 150;
    @property({ type: CCInteger, group: { name: 'SM', id: 'suit_tab', displayOrder: 3, style: 'tab' } })
    public smLevel2PickDistance: number = 150;
    @property({ type: CCInteger, group: { name: 'SM', id: 'suit_tab', displayOrder: 3, style: 'tab' } })
    public smLevel3PickDistance: number = 150;
    @property({ type: CCInteger, group: { name: 'SM', id: 'suit_tab', displayOrder: 3, style: 'tab' } })
    public smLevel4PickDistance: number = 150;
    @property({ type: CCInteger, group: { name: 'SM', id: 'suit_tab', displayOrder: 3, style: 'tab' } })
    public smLevel5PickDistance: number = 150;

    // === SM: Score ===
    @property({ type: CCInteger, group: { name: 'SM', id: 'suit_tab', displayOrder: 3, style: 'tab' } })
    public smLevel1Score: number = 1;
    @property({ type: CCInteger, group: { name: 'SM', id: 'suit_tab', displayOrder: 3, style: 'tab' } })
    public smLevel2Score: number = 1;
    @property({ type: CCInteger, group: { name: 'SM', id: 'suit_tab', displayOrder: 3, style: 'tab' } })
    public smLevel3Score: number = 1;
    @property({ type: CCInteger, group: { name: 'SM', id: 'suit_tab', displayOrder: 3, style: 'tab' } })
    public smLevel4Score: number = 1;
    @property({ type: CCInteger, group: { name: 'SM', id: 'suit_tab', displayOrder: 3, style: 'tab' } })
    public smLevel5Score: number = 1;

    // === SM: Wrong Score ===
    @property({ type: CCInteger, group: { name: 'SM', id: 'suit_tab', displayOrder: 3, style: 'tab' } })
    public smLevel1ScoreWrong: number = -1;
    @property({ type: CCInteger, group: { name: 'SM', id: 'suit_tab', displayOrder: 3, style: 'tab' } })
    public smLevel2ScoreWrong: number = -1;
    @property({ type: CCInteger, group: { name: 'SM', id: 'suit_tab', displayOrder: 3, style: 'tab' } })
    public smLevel3ScoreWrong: number = -1;
    @property({ type: CCInteger, group: { name: 'SM', id: 'suit_tab', displayOrder: 3, style: 'tab' } })
    public smLevel4ScoreWrong: number = -1;
    @property({ type: CCInteger, group: { name: 'SM', id: 'suit_tab', displayOrder: 3, style: 'tab' } })
    public smLevel5ScoreWrong: number = -1;

    // === HYBE: Speed ===
    @property({ type: CCInteger, group: { name: 'HYBE', id: 'suit_tab', displayOrder: 4, style: 'tab' } })
    public hybeLevel1Speed: number = 120;
    @property({ type: CCInteger, group: { name: 'HYBE', id: 'suit_tab', displayOrder: 4, style: 'tab' } })
    public hybeLevel2Speed: number = 240;
    @property({ type: CCInteger, group: { name: 'HYBE', id: 'suit_tab', displayOrder: 4, style: 'tab' } })
    public hybeLevel3Speed: number = 360;
    @property({ type: CCInteger, group: { name: 'HYBE', id: 'suit_tab', displayOrder: 4, style: 'tab' } })
    public hybeLevel4Speed: number = 480;
    @property({ type: CCInteger, group: { name: 'HYBE', id: 'suit_tab', displayOrder: 4, style: 'tab' } })
    public hybeLevel5Speed: number = 600;

    // === HYBE: Distance ===
    @property({ type: CCInteger, group: { name: 'HYBE', id: 'suit_tab', displayOrder: 4, style: 'tab' } })
    public hybeLevel1PickDistance: number = 150;
    @property({ type: CCInteger, group: { name: 'HYBE', id: 'suit_tab', displayOrder: 4, style: 'tab' } })
    public hybeLevel2PickDistance: number = 150;
    @property({ type: CCInteger, group: { name: 'HYBE', id: 'suit_tab', displayOrder: 4, style: 'tab' } })
    public hybeLevel3PickDistance: number = 150;
    @property({ type: CCInteger, group: { name: 'HYBE', id: 'suit_tab', displayOrder: 4, style: 'tab' } })
    public hybeLevel4PickDistance: number = 150;
    @property({ type: CCInteger, group: { name: 'HYBE', id: 'suit_tab', displayOrder: 4, style: 'tab' } })
    public hybeLevel5PickDistance: number = 150;

    // === HYBE: Score ===
    @property({ type: CCInteger, group: { name: 'HYBE', id: 'suit_tab', displayOrder: 4, style: 'tab' } })
    public hybeLevel1Score: number = 1;
    @property({ type: CCInteger, group: { name: 'HYBE', id: 'suit_tab', displayOrder: 4, style: 'tab' } })
    public hybeLevel2Score: number = 1;
    @property({ type: CCInteger, group: { name: 'HYBE', id: 'suit_tab', displayOrder: 4, style: 'tab' } })
    public hybeLevel3Score: number = 1;
    @property({ type: CCInteger, group: { name: 'HYBE', id: 'suit_tab', displayOrder: 4, style: 'tab' } })
    public hybeLevel4Score: number = 1;
    @property({ type: CCInteger, group: { name: 'HYBE', id: 'suit_tab', displayOrder: 4, style: 'tab' } })
    public hybeLevel5Score: number = 1;

    // === HYBE: Wrong Score ===
    @property({ type: CCInteger, group: { name: 'HYBE', id: 'suit_tab', displayOrder: 4, style: 'tab' } })
    public hybeLevel1ScoreWrong: number = -1;
    @property({ type: CCInteger, group: { name: 'HYBE', id: 'suit_tab', displayOrder: 4, style: 'tab' } })
    public hybeLevel2ScoreWrong: number = -1;
    @property({ type: CCInteger, group: { name: 'HYBE', id: 'suit_tab', displayOrder: 4, style: 'tab' } })
    public hybeLevel3ScoreWrong: number = -1;
    @property({ type: CCInteger, group: { name: 'HYBE', id: 'suit_tab', displayOrder: 4, style: 'tab' } })
    public hybeLevel4ScoreWrong: number = -1;
    @property({ type: CCInteger, group: { name: 'HYBE', id: 'suit_tab', displayOrder: 4, style: 'tab' } })
    public hybeLevel5ScoreWrong: number = -1;

    private getLevelIndex(level: number): number {
        const clampedLevel = Math.max(1, Math.min(level, 5));
        return clampedLevel - 1;
    }

    private getYGSpeeds(): number[] {
        return [this.ygLevel1Speed, this.ygLevel2Speed, this.ygLevel3Speed, this.ygLevel4Speed, this.ygLevel5Speed];
    }

    private getJYPSpeeds(): number[] {
        return [this.jypLevel1Speed, this.jypLevel2Speed, this.jypLevel3Speed, this.jypLevel4Speed, this.jypLevel5Speed];
    }

    private getSMSpeeds(): number[] {
        return [this.smLevel1Speed, this.smLevel2Speed, this.smLevel3Speed, this.smLevel4Speed, this.smLevel5Speed];
    }

    private getHybeSpeeds(): number[] {
        return [this.hybeLevel1Speed, this.hybeLevel2Speed, this.hybeLevel3Speed, this.hybeLevel4Speed, this.hybeLevel5Speed];
    }

    private getYGPickDistances(): number[] {
        return [this.ygLevel1PickDistance, this.ygLevel2PickDistance, this.ygLevel3PickDistance, this.ygLevel4PickDistance, this.ygLevel5PickDistance];
    }

    private getJYPPickDistances(): number[] {
        return [this.jypLevel1PickDistance, this.jypLevel2PickDistance, this.jypLevel3PickDistance, this.jypLevel4PickDistance, this.jypLevel5PickDistance];
    }

    private getSMPickDistances(): number[] {
        return [this.smLevel1PickDistance, this.smLevel2PickDistance, this.smLevel3PickDistance, this.smLevel4PickDistance, this.smLevel5PickDistance];
    }

    private getHybePickDistances(): number[] {
        return [this.hybeLevel1PickDistance, this.hybeLevel2PickDistance, this.hybeLevel3PickDistance, this.hybeLevel4PickDistance, this.hybeLevel5PickDistance];
    }

    private getYGScores(): number[] {
        return [this.ygLevel1Score, this.ygLevel2Score, this.ygLevel3Score, this.ygLevel4Score, this.ygLevel5Score];
    }

    private getJYPScores(): number[] {
        return [this.jypLevel1Score, this.jypLevel2Score, this.jypLevel3Score, this.jypLevel4Score, this.jypLevel5Score];
    }

    private getSMScores(): number[] {
        return [this.smLevel1Score, this.smLevel2Score, this.smLevel3Score, this.smLevel4Score, this.smLevel5Score];
    }

    private getHybeScores(): number[] {
        return [this.hybeLevel1Score, this.hybeLevel2Score, this.hybeLevel3Score, this.hybeLevel4Score, this.hybeLevel5Score];
    }

    private getYGWrongScores(): number[] {
        return [this.ygLevel1ScoreWrong, this.ygLevel2ScoreWrong, this.ygLevel3ScoreWrong, this.ygLevel4ScoreWrong, this.ygLevel5ScoreWrong];
    }

    private getJYPWrongScores(): number[] {
        return [this.jypLevel1ScoreWrong, this.jypLevel2ScoreWrong, this.jypLevel3ScoreWrong, this.jypLevel4ScoreWrong, this.jypLevel5ScoreWrong];
    }

    private getSMWrongScores(): number[] {
        return [this.smLevel1ScoreWrong, this.smLevel2ScoreWrong, this.smLevel3ScoreWrong, this.smLevel4ScoreWrong, this.smLevel5ScoreWrong];
    }

    private getHybeWrongScores(): number[] {
        return [this.hybeLevel1ScoreWrong, this.hybeLevel2ScoreWrong, this.hybeLevel3ScoreWrong, this.hybeLevel4ScoreWrong, this.hybeLevel5ScoreWrong];
    }

    private getSuitSpeeds(suitType: ECharacterSuitType): number[] {
        switch (suitType) {
            case ECharacterSuitType.JYP:
                return this.getJYPSpeeds();
            case ECharacterSuitType.SM:
                return this.getSMSpeeds();
            case ECharacterSuitType.HYBE:
                return this.getHybeSpeeds();
            case ECharacterSuitType.YG:
            default:
                return this.getYGSpeeds();
        }
    }

    private getSuitPickDistances(suitType: ECharacterSuitType): number[] {
        switch (suitType) {
            case ECharacterSuitType.JYP:
                return this.getJYPPickDistances();
            case ECharacterSuitType.SM:
                return this.getSMPickDistances();
            case ECharacterSuitType.HYBE:
                return this.getHybePickDistances();
            case ECharacterSuitType.YG:
            default:
                return this.getYGPickDistances();
        }
    }

    private getSuitScores(suitType: ECharacterSuitType): number[] {
        switch (suitType) {
            case ECharacterSuitType.JYP:
                return this.getJYPScores();
            case ECharacterSuitType.SM:
                return this.getSMScores();
            case ECharacterSuitType.HYBE:
                return this.getHybeScores();
            case ECharacterSuitType.YG:
            default:
                return this.getYGScores();
        }
    }

    private getSuitWrongScores(suitType: ECharacterSuitType): number[] {
        switch (suitType) {
            case ECharacterSuitType.JYP:
                return this.getJYPWrongScores();
            case ECharacterSuitType.SM:
                return this.getSMWrongScores();
            case ECharacterSuitType.HYBE:
                return this.getHybeWrongScores();
            case ECharacterSuitType.YG:
            default:
                return this.getYGWrongScores();
        }
    }

    public getSpeed(suitType: ECharacterSuitType, level: number): number {
        const speeds = this.getSuitSpeeds(suitType);
        const index = this.getLevelIndex(level);
        return speeds[index] ?? this.ygLevel1Speed;
    }

    // === 거리 관련 메서드 ===
    public getPickDistanceThreshold(suitType: ECharacterSuitType, level: number): number {
        const distances = this.getSuitPickDistances(suitType);
        const index = this.getLevelIndex(level);
        return distances[index] ?? this.ygLevel1PickDistance;
    }

    public getScore(suitType: ECharacterSuitType, level: number, isWrong: boolean): number {
        const index = this.getLevelIndex(level);
        const scores = isWrong ? this.getSuitWrongScores(suitType) : this.getSuitScores(suitType);
        const fallback = isWrong ? this.ygLevel1ScoreWrong : this.ygLevel1Score;
        return scores[index] ?? fallback;
    }
}
