# CatchEggs 웹 연동 (PickGear 공통 v1)

게임 내부 나가기 버튼·확인 팝업과 결과 화면의 RETRY/HOME 버튼은 기본으로 숨깁니다. 게임 플레이 화면과 게임 종류 선택 화면은 유지합니다. 웹에서 일시정지 메뉴와 최고 기록을 표시하세요. 최고 기록은 게임에서 저장하거나 계산하지 않으며, 현재 점수는 일시정지 응답에 포함합니다.

## 명령: 부모 웹 → 게임 iframe

객체를 `iframe.contentWindow.postMessage(message, gameOrigin)`으로 보내세요. JSON 문자열은 지원하지 않습니다. `requestId`는 요청마다 다른 128자 이하 문자열을 권장합니다.

| type | 동작 | 허용 상태 |
| --- | --- | --- |
| `PAUSE_GAME` | 시간·이동·입력·음악 정지, 게임 내부 팝업은 표시하지 않음 | 진행 중 또는 이미 일시정지 |
| `RESUME_GAME` | 멈춘 위치에서 계속하기 | 일시정지 또는 이미 진행 중 |
| `RESTART_GAME` | 같은 레벨로 점수 초기화 후 시작 연출부터 다시 시작 | 일시정지 또는 정상 종료 |
| `GO_TO_TITLE` | 게임 정리 후 게임 종류 선택 화면으로 복귀 | 모든 상태 |
| `EXIT_GAME` | 게임 정리 및 화면 숨김. 웹이 iframe 제거/페이지 이동 처리 | 모든 상태 |
| `GET_GAME_STATE` | 현재 상태 조회 | 모든 상태 |
| `SET_DEBUG_UI` | `{ enabled: true }`로 기존 내부 버튼 활성화, `false`로 숨김 | 모든 상태 |

다시하기·타이틀 이동 처리 중에는 다른 변경 명령이 `BUSY`로 실패합니다. 완료 응답 후 다음 명령을 보내세요. 상태 조회는 가능합니다. 같은 `requestId`와 명령의 재전송은 진행 중 요청 또는 최근 완료 100건의 응답을 재사용합니다. 재전송 시 본문도 동일하게 유지하세요. 다른 명령에서 같은 ID를 사용하면 `REQUEST_ID_REUSED`입니다.

## 응답 및 알림: 게임 → 부모 웹

모든 메시지는 `protocol: 'pickgear'`, `version: 1`, `state`를 포함합니다.

- `GAME_READY`: 첫 선택 화면의 로딩 완료. 웹 수신기를 iframe 로드 전에 등록하세요. 놓친 경우 `GET_GAME_STATE`로 조회할 수 있습니다.
- `GAME_COMMAND_RESULT`: `{ command, requestId, ok, state, error? }`. 성공 완료 또는 실패 응답입니다. `error`는 `BUSY`, `INVALID_STATE`, `INVALID_ARGUMENT`, `REQUEST_ID_REUSED`, `COMMAND_FAILED` 중 하나입니다.
- `GAME_PAUSED`, `GAME_RESUMED`, `GAME_RESTARTED`, `GAME_TITLE`, `GAME_EXITED`: 해당 동작이 실제로 반영된 시점의 알림입니다. 이미 멈춤/재개 상태라면 명령 응답만 보냅니다.
- 기존 `GAME_START`, `GAME_OVER`도 유지합니다. `GAME_OVER`는 기존의 최상위 `score`도 포함합니다. 중도 종료에는 `GAME_OVER`를 보내지 않습니다.

`state` 예시:

```json
{
  "status": "paused",
  "score": 596,
  "level": 2,
  "gameType": 0,
  "sequence": "GameRound",
  "elapsedSeconds": 4.2,
  "sessionId": 1,
  "busy": false
}
```

`status`: `title`, `playing`, `paused`, `ended`, `exited`.
`sequence`: `Prepare`(게임 설명), `ShowSuit`(시작 연출), `GameRound`(플레이), `EndGame`(결과), `Exited`(타이틀/나간 상태).
`elapsedSeconds`는 현재 진행 단계의 경과 시간입니다. `gameType`은 레벨 ONE=0, TWO=1, THREE=2이며 `level`은 1~3입니다. 프로토콜 이름은 두 게임 공통으로 `pickgear`를 사용합니다. `GAME_PAUSED.state.score`로 일시정지 창 점수를 표시하세요. `GAME_EXITED`의 점수는 정리 후 0입니다. 중도 종료 전 점수가 필요하면 일시정지 응답을 보관하세요.

## 연결 예시

```js
const frame = document.querySelector('#game-frame');
const gameOrigin = new URL(frame.src).origin;
let nextRequest = 0;

function command(type, extra = {}) {
  const requestId = `pickgear-${++nextRequest}`;
  frame.contentWindow.postMessage({ type, requestId, ...extra }, gameOrigin);
  return requestId;
}

window.addEventListener('message', (event) => {
  if (event.source !== frame.contentWindow || event.origin !== gameOrigin) return;
  const message = event.data;
  if (message?.protocol !== 'pickgear' || message.version !== 1) return;
  if (message.type === 'GAME_READY') command('GET_GAME_STATE');
  if (message.type === 'GAME_PAUSED') {
    // 웹의 일시정지 메뉴 표시: message.state.score, 웹에서 보관한 최고 기록
  }
  if (message.type === 'GAME_COMMAND_RESULT') {
    // requestId로 요청 매칭. ok=false이면 error 처리, 중복 응답은 무시
  }
  if (message.type === 'GAME_EXITED') {
    // 웹에서 iframe 제거 또는 게임 목록으로 이동
  }
});

// 웹 버튼에 연결
// command('PAUSE_GAME');
// command('RESUME_GAME');
// command('RESTART_GAME');
// command('GO_TO_TITLE');
// command('EXIT_GAME');
```

실제 부모 창(`window.parent`)에서 온 알려진 명령만 받으며, 첫 유효 명령의 origin에 연결을 고정합니다. 다른 출처의 메시지와 알 수 없는 명령은 무시합니다. 최초 알림은 부모 origin을 아직 모르므로 `*`로 전송하고, 이후에는 연결된 origin으로만 응답합니다. 일반 HTTPS iframe과 정확한 `targetOrigin` 사용을 권장합니다. origin이 `null`인 sandbox는 응답에 `*`가 필요하므로 가급적 사용하지 마세요.

게임 종류 선택은 기존 게임 화면에서 합니다. 해당 첫 클릭으로 브라우저 오디오를 활성화하며, 웹은 필요하면 iframe에 `allow="autoplay"`를 설정합니다. 브라우저의 사용자 입력 없는 자동 재생 제한을 메시지로 우회하지는 않습니다.

## 직접 호출 및 테스트

게임 런타임의 `gameManager.I`에는 다음 public 메서드가 있습니다. 전역 `window` 객체에 별도 API를 노출하지 않으므로 외부 웹은 postMessage를 사용하세요.

`pauseGame()`, `resumeGame()`, `restartGame()`, `returnToTitle()`, `exitGame()`, `getGameState()`.

직접 호출 시 잘못된 상태는 예외 또는 Promise reject로 전달됩니다. 웹 메시지는 이를 `GAME_COMMAND_RESULT` 실패 응답으로 바꿉니다.

- Cocos Creator 3.8.6의 main.scene Preview를 켭니다.
- 프로젝트 루트에서 `python3 -m http.server 8767 --bind 127.0.0.1 --directory tests` 실행 후 `http://127.0.0.1:8767/web-control.html`을 엽니다.
- 게임 URL을 Preview 주소로 지정합니다. 게임 선택 → 일시정지 → 계속하기/다시하기/타이틀로/나가기를 확인합니다.
- 테스트 페이지 체크박스 또는 `SET_DEBUG_UI`로 기존 내부 UI를 다시 표시할 수 있습니다. 이 설정은 새로고침 시 기본 숨김으로 돌아갑니다.
- 로직 회귀 검사: `node tests/web-control.cjs <설치된-typescript-모듈-경로>`. 엔진 부분을 대체한 상태/메시지 검사이며 Editor Preview 검증을 대신하지 않습니다.
