import { EggType } from './gameDefine';

export type OpeningCharacterItem = { eggType: EggType; score: number; image: string };

/**
 * 오프닝 캐릭터(양수 점수) 표시 순서를 레벨 규칙에 맞게 정렬한다.
 * - level 1: SongUnbee → EmmaMoon → Howsam → Happy → Hoyang → DoArin → (나머지는 뒤)
 * - level 2/3: SooHana → EmmaMoon → Howsam → DoArin → SongUnbee → (나머지는 뒤)
 *
 * NOTE: fixedOrder에 없는 타입은 뒤로 보내고, eggType 오름차순으로 고정 정렬한다.
 */
export function sortOpeningPositiveScores(level: number, positiveScores: OpeningCharacterItem[]): void {
    const fixedOrder =
        level === 1
            ? [
                  EggType.SooHana,
                  EggType.EmmaMoon,
                  EggType.Howsam,
                  EggType.Happy,
                  EggType.Hoyang,
                  EggType.DoArin,
                  EggType.SongUnbee,
              ]
            : level === 2 || level === 3
              ? [EggType.SooHana, EggType.EmmaMoon, EggType.Howsam, EggType.DoArin, EggType.SongUnbee]
              : null;

    if (!fixedOrder) return;

    const orderIndex = (t: EggType): number => {
        const idx = fixedOrder.indexOf(t);
        return idx >= 0 ? idx : 1000 + Number(t);
    };

    positiveScores.sort((a, b) => orderIndex(a.eggType) - orderIndex(b.eggType));
}


