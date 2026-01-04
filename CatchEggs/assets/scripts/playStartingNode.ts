import { _decorator, AnimationComponent, Component, Node } from 'cc';
import { gameManager } from './gameManager';
import { ResourceManager } from './ResourceManager';
import { openingEgg } from './openingEgg';
import { EggType } from './gameDefine';
import { gameProperty } from './gameProperty';
import { sortOpeningPositiveScores } from './openingCharacterOrder';
import { AppleMusicManager } from './AppleMusicManager';

const { ccclass, property } = _decorator;

/**
 * 게임 시작 전(Start) 오프닝 연출을 담당하는 컴포넌트입니다.
 * 등장 캐릭터(알) 배치, 배경음악 재생, 대기 애니메이션 후 게임 시작 트리거 역할을 합니다.
 */
@ccclass('playStartingNode')
export class playStartingNode extends Component {
    /** 알들이 배치될 부모 노드 */
    @property(Node) private readonly eggParent: Node = null;
    /** 오프닝 애니메이션 컴포넌트 */
    @property(AnimationComponent) private readonly animation: AnimationComponent = null;
    /** 부정적 점수(Nerds)를 가진 캐릭터들이 표시될 그룹 노드 */
    @property(Node) private readonly OpeningNerdsGroup: Node = null;
    /** 긍정적 점수(일반) 알 객체 리스트 (Cocos Creator 에디터 할당) */
    @property(openingEgg) private readonly openingEggNormalList: openingEgg[] = [];
    /** 부정적 점수 알 객체 리스트 (Cocos Creator 에디터 할당) */
    @property(openingEgg) private readonly openingEggNegativeList: openingEgg[] = [];

    /** 알 흔들림 애니메이션 계산을 위한 사인파 경과 시간 */
    private sinElapsedTime: number = 0;
    /** 오프닝 씬 경과 시간 (4초 후 게임 시작) */
    private elapsedTime: number = 0;
    /** 게임 매니저 참조 */
    private gameManager: gameManager = null;

    /** 음악 로드 등이 완료되어 연출을 재생할 준비가 되었는지 여부 */
    private isReadyToPlay: boolean = false;

    /**
     * 오프닝 노드를 초기화합니다.
     * 1. 캐릭터 데이터를 설정하고 배치합니다.
     * 2. Apple Music 배경음악 재생을 시도합니다.
     * 3. 음악 재생 성공/실패 여부와 관계없이 애니메이션을 재생하고 대기 상태로 진입합니다.
     * @param gameManager 게임 매니저 인스턴스
     */
    public async initialize(gameManager: gameManager) {
        this.sinElapsedTime = 0;
        this.elapsedTime = 0;
        this.gameManager = gameManager;
        this.isReadyToPlay = false;

        // 캐릭터 배치 설정
        await this.setOpeningCharacter();

        // 현재 레벨에 맞는 음악 정보 가져오기
        const appleMusicSongId = this.gameManager.gameMode.getCurrentGameBgName();
        const appleMusicKeyword = this.gameManager.gameMode.getCurrentSongKeyword();

        try {
            // 음악 재생 시도
            await AppleMusicManager.I.playSong(appleMusicSongId, appleMusicKeyword);
        } catch (error) {
            // 음악 재생 실패 시에도 게임 흐름은 계속 진행
        } finally {
            // 준비 완료 상태 설정 및 등장 애니메이션 실행
            this.isReadyToPlay = true;
            this.animation.play();
        }
    }

    /**
     * 현재 레벨 데이터(gameProperty)를 기반으로 등장할 알(캐릭터)들을 설정합니다.
     * 점수에 따라 긍정적(Normal) 그룹과 부정적(Negative) 그룹으로 분류하여 배치합니다.
     */
    private async setOpeningCharacter() {
        try {
            const level = this.gameManager.gameMode.getCurrentLevelFromVersion();
            const prop = gameProperty.I;

            // 부정적 점수가 있는지 확인하여 NerdsGroup 활성화 여부 결정
            let hasNegativeScore = false;
            for (let i = 0; i < EggType.TotalCount; i++) {
                if (prop.getScore(level, i) < 0) {
                    hasNegativeScore = true;
                    break;
                }
            }
            this.OpeningNerdsGroup.active = hasNegativeScore;

            // 점수에 따라 캐릭터 분류
            const positiveScores = [];
            const negativeScores = [];
            for (let i = 0; i < EggType.TotalCount; i++) {
                const score = prop.getScore(level, i);
                const image = prop.getImage(level, i);
                if (score > 0) positiveScores.push({ eggType: i, score, image });
                else if (score < 0) negativeScores.push({ eggType: i, score, image });
            }

            // 긍정적 캐릭터 정렬 (별도 로직)
            sortOpeningPositiveScores(level, positiveScores);

            /** 내부 함수: 리스트의 각 openingEgg 컴포넌트에 이미지와 점수 초기화 */
            const initEggs = async (list: openingEgg[], data: any[]) => {
                let idx = 0;
                for (const item of data) {
                    if (idx < list.length && list[idx]) {
                        await list[idx].initialize(item.image, item.score);
                        list[idx].node.active = true;
                        idx++;
                    }
                }
                // 데이터보다 노드가 많으면 남은 노드는 비활성화
                for (let i = idx; i < list.length; i++) {
                    if (list[i]) list[i].node.active = false;
                }
            };

            await initEggs(this.openingEggNormalList, positiveScores);
            await initEggs(this.openingEggNegativeList, negativeScores);
        } catch (e) {
            // 캐릭터 설정 중 에러 발생 시 처리
        }
    }

    /**
     * 매 프레임 호출되는 업데이트 함수입니다.
     * 1. 알들을 좌우로 흔드는(Wiggle) 애니메이션 처리
     * 2. 4초 대기 후 실제 게임(startNewGame)으로 전환
     * @param deltaTime 이전 프레임과의 시간 차
     */
    update(deltaTime: number) {
        if (!this.isReadyToPlay) return;

        // 알 흔들림 애니메이션 (Sin파 활용)
        this.sinElapsedTime += deltaTime * 100;
        this.openingEggNormalList.forEach(egg => {
            if (egg?.node.active) egg.node.angle = Math.sin(this.sinElapsedTime * 0.05) * 10;
        });
        this.openingEggNegativeList.forEach(egg => {
            if (egg?.node.active) egg.node.angle = Math.sin(this.sinElapsedTime * 0.05) * 10;
        });

        // 4초 경과 체크
        this.elapsedTime += deltaTime;
        if (this.elapsedTime >= 4) {
            this.gameManager.startNewGame();
        }
    }
}