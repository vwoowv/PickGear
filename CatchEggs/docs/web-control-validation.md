# 웹 제어 검증 기록

2026-09-12, Cocos Creator 3.8.6 / Chrome / main.scene Preview.

PickGear의 `docs/web-control.md`, `tests/web-control.cjs`, `tests/web-control.html`과 구현을 대조했다. CatchEggs의 테스트 호스트도 같은 부모 iframe 버튼·메시지 기록 방식을 사용한다.

## 실제 Editor / iframe 검증

CatchEggs Editor에서 scripts 폴더를 Reimport Asset하고 컴파일 완료를 확인했다. 기존 콘솔 기록을 지운 뒤 새 컴파일·직렬화·누락 에셋 오류가 없었다. main.scene Preview를 부모 테스트 페이지에 로드했다.

- GAME_READY와 GET_GAME_STATE의 GAME_COMMAND_RESULT: 공통 protocol=pickgear, version=1 및 state 필드 확인.
- 준비 화면: PAUSE_GAME → paused/Prepare, RESUME_GAME 성공.
- 레벨 2 플레이: score=5, elapsedSeconds=4.132600000023942에서 정지. 이후 조회에서 동일한 값 유지. 재개 후 score=6, elapsedSeconds=8.915200000047832로 진행.
- 정지 후 다시하기: 같은 gameType=1, level=2, score=0, ShowSuit로 시작. GAME_RESTARTED와 성공 응답 확인, 이후 GAME_START 확인.
- 정지 후 타이틀: GAME_TITLE, title, score=0 및 선택 화면 복귀.
- 준비 중 정지 후 나가기: GAME_EXITED, exited, score=0. 이후 타이틀 복귀 및 새 게임 실행 가능.
- 정상 종료: 레벨 1의 44초 게임 완료, GAME_OVER.state.score=6과 최상위 score=6 일치. ended/EndGame 확인.
- 결과 화면 RETRY/HOME 기본 숨김. SET_DEBUG_UI enabled=true에서 복원, false에서 다시 숨김. 플레이 나가기 버튼도 같은 설정으로 복원되며 동전 아래 표시.
- 정상 종료 후 외부 다시하기 성공. 시작 연출 중 일시정지 시 elapsedSeconds=3.6328999999761593이 후속 조회에서도 동일. 재개 후 플레이 진입.
- 플레이 중 정지 후 나가기: GAME_EXITED, exited, score=0 확인. 중도 종료가 추가 GAME_OVER를 보내지 않음.
- 브라우저 오류 로그 0건. 기존 랜덤 스폰의 간격 재시도 초과 경고 2건은 있었으며 게임 진행·종료에는 영향이 없었다.
- 시작 버튼 클릭 후 BGM STARTED 로그 확인. 일시정지 후 재개도 정지 시점에서 재생. 별도 게임 화면 클릭 없이 시작했으며, 사용자 입력 이전 자동 재생을 보장하는 검증은 아니다.

## 자동 검사

`node tests/web-control.cjs <설치된 TypeScript 모듈 경로>` 통과:

- pause/resume 중복 호출, 시간 정지 및 내부 팝업 미표시
- 각 상태의 타이틀/나가기 및 이전 세션 취소
- 준비·시작 연출 정지와 조기 게임 시작 방지
- 진행 중/완료 요청 재전송, REQUEST_ID_REUSED, BUSY
- 부모 출처 검사, 상태 조회, 디버그 UI, 인자 검증, 최근 100건 캐시

변경된 게임 코드와 의존 코드의 범위 한정 타입 검사도 통과했다. 임시 설정에서 기존 전역 MidiJson 선언을 포함하고 isolatedModules=false, skipLibCheck=true를 사용했다. 프로젝트 설정은 변경하지 않았다. 전체 기본 tsc는 기존 MIDI 전역 선언, displayFBX 확장, 엔진 선언 오류가 있어 통과로 간주하지 않는다. `git diff --check` 통과.

재현 절차와 호스트 실행 방법: [웹 연동 문서](web-control.md).

## 첫 시작 음악 후속 수정

2026-09-12: 사용자 재현 보고 후 오디오 활성화 순서를 수정했다. 모드 준비에서 별도 무음 AudioSource.play()를 미리 요청해 엔진 입력 리스너가 시작 버튼 클릭 전에 준비되도록 했다. 시작 직전 stop()을 제거해 엔진 작업 큐가 재생을 지연시키지 않도록 했다.

Creator에서 gameManager를 재import하고 컴파일 완료 확인. 새 Chrome 직접 Preview에서 레벨 1 선택 → 시작 버튼 1회 후 BGM STARTED(time=0.0062), 새 부모 iframe 페이지에서 레벨 2 선택 → 시작 버튼 1회 후 BGM STARTED(time=0.0047)를 확인했다. 추가 게임 화면 입력은 하지 않았다. 이는 엔진의 재생 시작 로그 검증이며 실제 스피커 출력을 청취한 검증은 아니다. 기존 탭 reload에서는 로그 수집이 갱신되지 않아 독립된 새 iframe 탭으로 검증했다.

첫 입력 전 무음 준비 및 stop 뒤로 play가 지연되지 않는 회귀 검사를 추가했고 기존 메시지 회귀 검사와 함께 통과했다. 범위 한정 타입 검사와 diff 공백 검사도 통과.
