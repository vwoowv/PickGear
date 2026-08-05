# PickGear 에이전트 지침

## 프로젝트 기준

- 이 디렉터리는 Cocos Creator 프로젝트 `PickGear`의 루트다.
- `package.json`의 `creator.version`에 따라 Cocos Creator **3.8.6**을 사용한다.
- Creator 3.x 모듈 API만 사용하며 엔진 심볼은 `cc`에서 import한다. Creator 2.x의 `cc.Class`, `cc.loader`, 전역 `cc`를 추가하지 않는다.
- `tsconfig.json`은 생성된 `temp/tsconfig.cocos.json`을 확장하고 `strict: false`, `moduleResolution: node`를 설정한다. `temp` 설정은 직접 고치지 않는다.

## 실행과 검증

- `package-lock.json`은 있지만 `package.json`에 npm 스크립트나 의존성이 없다. 근거 없이 `npm install`, `npm test`, `npm run build` 등을 필수 명령으로 지정하지 않는다.
- CI와 자동 테스트 명령도 없다. Cocos Editor 검증을 자동 테스트로 표현하지 않는다.
- Cocos Creator 3.8.6에서 프로젝트를 열고 import 완료 후 Console의 TypeScript·직렬화·누락 에셋 오류를 확인한다.
- 컴포넌트나 직렬화 필드 변경 후 `assets/scene/main.scene`에서 참조가 유지되는지 확인한다.
- 상태 전환이나 게임 진행 변경은 게임 종류 선택, 준비, 의상 표시, 라운드, 결과 흐름 중 영향받는 구간을 Preview한다.
- 리소스 프리로드 변경은 진행률, 중복 요청, 일부 실패 처리와 화면 전환을 함께 확인한다.

## 주요 구조

- `assets/scene/main.scene` — 기본 게임 씬.
- `assets/Scripts/` — 런타임 TypeScript. 대문자 `Scripts` 경로를 그대로 유지한다.
- `assets/Scripts/GameDefine.ts` — 캐릭터·의상·진행 순서·표정 enum.
- `assets/Scripts/GameMode/` — 게임 모드 상태, 전환, 노드 패키지와 새 게임 시작 로직.
- `assets/Scripts/StateMachine/stateMachine.ts` — async/sync 상태 머신 공용 구현.
- `assets/Scripts/gamePlaying.ts` — 실제 게임 라운드 흐름과 외부 음악 연동이 모이는 큰 컴포넌트.
- `assets/Scripts/RootUI.ts` — 씬 UI 참조와 표시 상태를 관리하는 직렬화 컴포넌트.
- `assets/Scripts/ResourceManager.ts` — 리소스 캐시, in-flight 중복 제거, 동시성 제한 프리로드.
- `assets/Scripts/Character/` — 댄서와 의상 컴포넌트·리소스 선택.
- `assets/Scripts/Utility/` — 경로 선택, 지연, RichText, 음악 관련 유틸리티.
- `assets/resources/` — `resources` API로 로드하는 프리팹, 스프라이트, 오디오.
- `library/`, `temp/`, `build/`, `local/`, `profiles/` — 생성 또는 로컬 상태. 원본처럼 수정하지 않는다.

## TypeScript와 아키텍처 규칙

- 기존 `_decorator`, `@ccclass`, `@property`, `Component` 패턴과 import 경로의 대소문자를 따른다.
- 기존 소스는 이름 스타일이 혼합되어 있다. `RootUI`, `ResourceManager`, `gamePlaying`, `dancer` 등을 일괄 이름 변경하지 않는다. 직렬화된 씬/프리팹 참조가 우선이다.
- `@ccclass` 식별자, 컴포넌트 클래스, `@property` 필드 또는 enum 순서를 변경하기 전에 저장된 씬/프리팹과 런타임 매핑의 마이그레이션을 확인한다.
- 게임 진행 변경은 `GameMode/`의 전환과 `EPlayingSequence`를 우선 확장한다. 여러 컴포넌트에서 노드 활성 상태를 임의로 중복 제어하지 않는다.
- 상태 머신 콜백은 동기/비동기 계약을 보존한다. async transition 실패를 숨기지 말고 현재 상태가 잘못 진행되지 않는지 확인한다.
- UI 참조와 표시 전환은 `RootUI`의 기존 책임을 따른다. 새 `@property`는 Editor에서 연결하고 null 참조가 없는지 씬에서 검증한다.
- 공용 런타임 에셋은 `ResourceManager.I`를 통해 로드하고 캐시·in-flight 중복 제거를 우회하는 별도 로더를 만들지 않는다.
- `preloadGameAssets`의 동시성 기본값, 진행률 0–1 계약, `continueOnError` 의미를 유지한다. 새 에셋 종류를 추가하면 중복 제거 키와 오류 처리도 함께 확장한다.
- `resources` 경로는 `assets/resources/` 기준이고 확장자를 제외한다. 프리팹 경로를 바꾸면 호출부와 관련 `.meta` 참조를 모두 확인한다.
- `update` 루프에서는 배열 splice 시 인덱스 누락과 매 프레임 할당을 주의한다. 에셋 로드와 네트워크 인증을 per-frame 경로에 넣지 않는다.

## PickGearTutorial과의 관계

- `PickGearTutorial/`은 별도 Creator 3.8.7 프로젝트다. 비슷한 파일이 많아도 자동 동기화 대상으로 간주하지 않는다.
- 두 프로젝트의 `package.json` UUID가 같으므로 프로젝트 설정이나 `.meta`를 기계적으로 상호 복사하지 않는다.
- 공통 로직을 양쪽에 반영하라는 요청이 있으면 먼저 파일 diff를 확인하고, `ResourceManager`, `RootUI`, 프리로드·게임 진행의 프로젝트별 차이를 보존한다.

## 에셋과 직렬화

- `assets/` 아래 에셋과 디렉터리는 대응하는 `.meta`와 함께 추가·이동·복사·이름 변경·삭제하고 UUID를 보존한다.
- 씬, 프리팹, material, animation, importer 설정은 Cocos Assets 패널에서 조작하는 것을 우선한다.
- `.scene`, `.prefab`, `.meta` 직접 편집은 먼저 이유와 범위를 확인하고, 작은 diff, UUID 관계, Editor 재import, `main.scene` Preview로 검증한다.
- `.meta`를 삭제하거나 재생성해 import·merge 문제를 해결하지 않는다.

## 변경 경계

- 항상: Cocos Creator 3.8.6, 대문자 `assets/Scripts/`, 기존 상태 머신과 리소스 관리자 계약, 에셋/`.meta` 쌍을 유지한다.
- 먼저 확인: Creator 업그레이드, 새 패키지, 렌더링·물리·빌드 설정, 상태 흐름 재설계, 리소스 번들/경로 재구성, 직렬화 이름 변경, PickGearTutorial 동시 변경, 음악 인증 변경.
- 절대 금지: 생성 폴더 수정, Creator API 세대 혼용, UUID 메타데이터 폐기, 비밀값·서명 자료·로컬 Editor 경로 커밋.
- 상위 `README.md`나 기존 음악 연동 코드의 토큰·키 형태 값을 새 코드, 문서, 테스트, 로그에 복사하지 않는다. 인증 값은 안전한 서버 또는 환경에서 주입하고 노출 의심 값은 보고한다.

