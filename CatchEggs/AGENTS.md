# CatchEggs 에이전트 지침

## 프로젝트 기준

- 이 디렉터리는 Cocos Creator 프로젝트 `CatchEggs`의 루트다.
- `package.json`의 `creator.version`에 따라 Cocos Creator **3.8.6**을 사용한다.
- 엔진 API는 Creator 3.x 방식으로만 작성하고 `cc` 모듈에서 import한다. `cc.Class`, `cc.loader`, 전역 `cc` 등 2.x API를 섞지 않는다.
- `tsconfig.json`은 `temp/tsconfig.cocos.json`을 확장하며 `strict: false`다. 이 설정을 근거로 새 코드의 타입을 생략하지 말고, 주변 코드처럼 public API와 async 반환값을 명시한다.

## 실행과 검증

- 이 프로젝트에는 npm 스크립트, lockfile, CI, 자동 테스트 명령이 없다. 존재하지 않는 `npm run` 명령이나 Cocos 실행 경로를 만들지 않는다.
- 변경 검증은 Cocos Creator 3.8.6에서 프로젝트를 열고 에셋 import가 끝난 뒤 수행한다.
- TypeScript 또는 컴포넌트 변경 후 Console의 컴파일·직렬화·누락 에셋 오류를 확인한다.
- `assets/scenes/main.scene`을 열어 변경한 컴포넌트와 `@property` 참조가 유지되는지 확인한다.
- 가장 작은 영향 범위를 Preview로 실행한다. 게임 상태나 리소스 변경은 모드 선택부터 결과 화면까지 관련 흐름도 확인한다.
- 플랫폼 또는 빌드 설정을 변경했을 때만 관련 타깃을 다시 빌드한다. `build/` 결과만 보고 소스 변경을 검증하지 않는다.

## 주요 구조

- `assets/scenes/main.scene` — 기본 게임 씬.
- `assets/scripts/` — 게임 컴포넌트와 상태·UI 로직. 이 프로젝트는 디렉터리 이름을 소문자 `scripts`로 유지한다.
- `assets/scripts/gameDefine.ts` — `EggType`, `EGameState`, `EGameMode` 정의.
- `assets/scripts/gameManager.ts` — 게임 진행을 조정하는 중심 컴포넌트.
- `assets/scripts/gameModeData.ts` — 모드별 레벨, 배경, 시간, BGM 매핑.
- `assets/scripts/ResourceManager.ts` — `resources` 기반 로드와 캐시, 프리팹 생성.
- `assets/scripts/LoadingNode.ts` — 시작 시 자주 쓰는 프리팹·이미지·오디오 프리로드와 진행률 처리.
- `assets/resources/` — 런타임 경로로 로드되는 프리팹, 효과, 텍스처, 사운드, JSON.
- `extensions/displayFBX/` — Creator 3.0.0을 표기한 기존 Editor 확장. 현재 프로젝트 버전에 맞춘다는 이유만으로 갱신하지 않는다.
- `library/`, `temp/`, `build/`, `local/`, `profiles/` — 생성 또는 로컬 상태. 공유 소스처럼 수정하거나 규칙의 근거로 사용하지 않는다.

## TypeScript와 컴포넌트 규칙

- 기존 방식대로 `_decorator`에서 `ccclass`, `property`를 가져오고, 직렬화할 클래스는 `Component`를 상속한다.
- 기존 클래스 이름의 대소문자를 보존한다. `gameManager`, `gameModeData`, `gameProperty`, `openingEgg` 같은 이름은 일반적인 PascalCase로 임의 교정하지 않는다. 씬이 직렬화된 클래스 이름을 참조할 수 있다.
- `@ccclass` 식별자, 컴포넌트 클래스명, `@property` 필드명 또는 타입을 바꾸기 전에는 마이그레이션 범위와 씬/프리팹 검증 방법을 먼저 합의한다.
- 엔진 객체가 필요한 초기화는 주변 코드처럼 `onLoad`, `start` 등 수명주기에서 수행한다. 이벤트 구독을 추가하면 대응하는 수명주기에서 반드시 해제한다.
- `ResourceManager.I`, `gameProperty.I`처럼 기존 싱글턴 접근 방식을 사용한다. 별도 전역 관리자나 두 번째 캐시 계층을 만들기 전에 기존 수명주기와 소유권을 확인한다.
- `resources.load` 경로는 `assets/resources/` 기준이며 확장자를 쓰지 않는다. 경로 문자열을 바꾸면 실제 에셋과 호출부, 프리로드 목록을 함께 확인한다.
- 반복적으로 쓰이는 시작 리소스만 `LoadingNode`의 프리로드 목록에 추가한다. 누락 허용 여부와 진행률의 완료 조건을 유지한다.
- async 로드 실패를 삼키지 않는다. 의도적으로 계속 진행하는 경로는 기존 `safeLoad`처럼 경로와 오류를 남기고 UI가 중단되지 않는지 검증한다.
- `update`에서 새 컬렉션·Promise·에셋 로드를 매 프레임 생성하지 않는다. per-frame 작업은 짧게 유지한다.

## 에셋과 직렬화

- `assets/` 아래 파일이나 디렉터리를 추가·이동·복사·이름 변경·삭제할 때 대응하는 `.meta`를 함께 처리하고 UUID를 보존한다.
- 씬, 프리팹, material, animation, importer 설정의 이동과 이름 변경은 Cocos Assets 패널을 우선 사용한다.
- `.scene`, `.prefab`, `.meta`를 텍스트로 직접 수정하려면 먼저 이유를 설명하고, 작은 diff와 UUID 관계 보존, Editor 재import, 관련 씬 Preview까지 확인한다.
- `.meta` 충돌을 해결하기 위해 파일을 삭제하거나 재생성하지 않는다. 어떤 UUID와 참조를 보존해야 하는지 먼저 확인한다.
- PickGear 계열의 다른 하위 프로젝트에서 에셋을 가져올 때 `.meta`를 무조건 복사하지 않는다. 같은 논리 에셋인지 새 에셋인지에 따라 UUID 정책을 결정한다.

## 변경 경계

- 항상: Creator 3.8.6과 주변 코드 스타일을 유지하고, 에셋/`.meta` 쌍을 보존하며, 수행하지 못한 Editor 검증을 명시한다.
- 먼저 확인: Creator 업그레이드, 확장 변경, 새 패키지 추가, 렌더링·물리·빌드 설정 변경, 리소스 경로 재구성, 직렬화 이름 변경, 음악 API 인증 흐름 변경.
- 절대 금지: 생성 폴더를 원본처럼 수정, Creator 2.x API 혼용, UUID 메타데이터 폐기, 토큰·키·서명 자료 또는 로컬 Editor 절대 경로 커밋.
- 상위 `README.md`와 음악 연동 코드에 있는 인증정보 형태의 예시를 복사·재사용·로그 출력하지 않는다. 인증 값은 안전한 서버 또는 환경 설정에서 주입하고, 노출이 의심되면 변경을 멈추고 보고한다.

