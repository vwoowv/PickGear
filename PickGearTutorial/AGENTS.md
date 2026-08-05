# PickGearTutorial 에이전트 지침

## 프로젝트 기준

- 이 디렉터리는 Cocos Creator 프로젝트 `PickGearTutorial`의 루트다.
- `package.json`의 `creator.version`에 따라 Cocos Creator **3.8.7**을 사용한다. 인접한 `PickGear`의 3.8.6으로 임의 하향하지 않는다.
- Creator 3.x 모듈 API만 사용하고 엔진 심볼은 `cc`에서 import한다. Creator 2.x의 `cc.Class`, `cc.loader`, 전역 `cc`를 섞지 않는다.
- `tsconfig.json`은 생성된 `temp/tsconfig.cocos.json`을 확장하고 `strict: false`, `moduleResolution: node`를 사용한다. 생성 설정을 직접 편집하지 않는다.

## 실행과 검증

- `package-lock.json`은 있지만 npm 스크립트·의존성·CI·자동 테스트가 없다. 존재하지 않는 설치, lint, test, build 명령을 만들지 않는다.
- Cocos Creator 3.8.7로 열어 import가 끝난 뒤 Console의 TypeScript·직렬화·누락 에셋 오류를 확인한다.
- 컴포넌트나 `@property` 변경 후 `assets/scene/main.scene`에서 연결 상태를 확인한다.
- 게임 진행 변경은 선택, 준비, 의상 표시, 라운드, 결과 중 영향받는 흐름을 Preview한다.
- 튜토리얼 안내나 프리로드 변경은 최초 진입부터 관련 단계 완료까지 확인하고, 진행률이 0–1 범위를 지키는지 검증한다.
- 플랫폼·빌드 설정을 바꾼 경우에만 관련 타깃을 다시 빌드하며, `build/`를 원본처럼 수정하지 않는다.

## 주요 구조

- `assets/scene/main.scene` — 기본 튜토리얼 씬.
- `assets/Scripts/` — 런타임 TypeScript. 대문자 `Scripts` 경로를 유지한다.
- `assets/Scripts/GameDefine.ts` — 캐릭터·의상·진행 순서·표정 enum.
- `assets/Scripts/GameMode/` — 모드 상태와 전환, 노드 패키지, 시작 로직.
- `assets/Scripts/StateMachine/stateMachine.ts` — async/sync 상태 머신 공용 구현.
- `assets/Scripts/gamePlaying.ts` — 튜토리얼 게임 라운드 흐름.
- `assets/Scripts/RootUI.ts` — 씬 UI 참조와 화면 상태.
- `assets/Scripts/ResourceManager.ts` — 캐시 기반 순차 리소스 프리로드.
- `assets/Scripts/Utility/preLoadGameAsset.ts` — 이 변형에만 있는 프리로드 유틸리티.
- `assets/Scripts/Character/` — 댄서·의상 컴포넌트와 리소스 선택.
- `assets/resources/` — `resources` API로 읽는 프리팹, 스프라이트, 오디오.
- `library/`, `temp/`, `build/`, `local/`, `profiles/` — 생성 또는 로컬 상태. 공유 소스처럼 편집하지 않는다.

## TypeScript와 아키텍처 규칙

- 기존 `_decorator`, `@ccclass`, `@property`, `Component` 패턴을 유지하고 import 경로의 대소문자를 정확히 맞춘다.
- `RootUI`, `ResourceManager`, `gamePlaying`, `dancer`처럼 혼합된 기존 이름을 스타일 정리 목적으로 바꾸지 않는다. 씬과 프리팹의 직렬화 참조를 보존한다.
- `@ccclass` 식별자, 컴포넌트 클래스명, `@property` 필드명/타입 또는 enum 순서를 변경하기 전에 마이그레이션과 Editor 검증 범위를 정한다.
- 게임 진행은 `GameMode/`와 `EPlayingSequence`의 기존 전환을 통해 확장한다. 전환 콜백의 동기/비동기 계약과 오류 전파를 유지한다.
- UI 변경은 `RootUI`의 기존 표시 책임을 따른다. 새 직렬화 참조는 Editor에서 연결하고 null 여부를 검증한다.
- 공용 런타임 에셋은 `ResourceManager.I`와 기존 프리로드 유틸리티를 사용한다. PickGear의 동시성·in-flight 구현을 요청 없이 그대로 이식하지 않는다.
- 이 프로젝트의 `preloadGameAssets`는 그룹별 순차 로드와 진행률 콜백을 사용한다. 로딩 순서가 튜토리얼 단계의 선행 조건인지 확인한 뒤 변경한다.
- `resources` 경로는 `assets/resources/` 기준이며 확장자를 제외한다. 경로 변경 시 호출부와 실제 에셋을 함께 갱신한다.
- 이벤트를 등록하면 대응 수명주기에서 해제하고, `update`에 에셋 로드·네트워크 요청·불필요한 매 프레임 할당을 넣지 않는다.

## PickGear와의 관계

- `PickGear/`는 Creator 3.8.6의 별도 게임 프로젝트다. 유사한 소스가 많아도 이 프로젝트를 단순 복제본으로 취급하지 않는다.
- 두 프로젝트의 `package.json` UUID가 같으므로 `package.json`, 프로젝트 설정, `.meta`를 상호 덮어쓰지 않는다.
- 공통 수정 요청에서는 먼저 파일 diff를 확인한다. 특히 `ResourceManager`의 로딩 전략, `RootUI`, `gamePlaying`, `Utility/preLoadGameAsset.ts`의 차이를 보존한다.
- 한 프로젝트의 버그 수정이 다른 쪽에도 필요해 보여도 사용자 요청 범위를 넘겨 자동 반영하지 않는다.

## 에셋과 직렬화

- `assets/` 아래 에셋과 디렉터리는 대응하는 `.meta`와 함께 추가·이동·복사·이름 변경·삭제하고 UUID를 보존한다.
- 씬, 프리팹, material, animation, importer 설정은 Cocos Assets 패널에서 다루는 것을 우선한다.
- `.scene`, `.prefab`, `.meta` 직접 편집은 사전 합의 후 작은 diff, UUID 관계, Editor 재import, `main.scene` Preview로 검증한다.
- `.meta` 삭제·재생성으로 import 또는 merge 문제를 우회하지 않는다.

## 변경 경계

- 항상: Cocos Creator 3.8.7, 대문자 `assets/Scripts/`, 튜토리얼 고유 프리로드/진행 흐름, 에셋/`.meta` 쌍을 유지한다.
- 먼저 확인: Creator 버전 변경, 새 패키지, 렌더링·물리·빌드 설정, 상태 흐름 재설계, 리소스 경로 변경, 직렬화 이름 변경, PickGear 동시 수정.
- 절대 금지: 생성 폴더를 원본처럼 수정, Creator API 세대 혼용, UUID 메타데이터 폐기, 토큰·키·서명 자료 또는 로컬 Editor 절대 경로 커밋.
- 상위 `README.md`나 기존 음악 연동 예시의 인증정보 형태 값을 코드·문서·테스트·로그에 복사하지 않는다. 인증은 안전한 서버 또는 환경 설정에서 주입하고 노출 의심 값은 보고한다.
