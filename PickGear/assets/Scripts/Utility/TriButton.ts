import { _decorator, Component, Node, input, Input, EventTouch, Vec3, PhysicsSystem2D, PolygonCollider2D, UITransform, Camera, Vec2 } from 'cc';

const { ccclass, property, requireComponent } = _decorator;

@ccclass('TriButton')
@requireComponent(PolygonCollider2D) // 이 컴포넌트가 필수로 필요함을 명시
export class TriButton extends Component {

    @property(Camera)
    uiCamera: Camera = null; // 2D UI용 카메라를 연결해주세요.

    private collider: PolygonCollider2D = null;
    private uiTransform: UITransform = null;

    onLoad() {
        this.collider = this.getComponent(PolygonCollider2D);
        this.uiTransform = this.getComponent(UITransform);
    }

    onEnable() {
        // 터치(마우스 클릭) 시작 이벤트를 등록합니다.
        input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
    }

    onDisable() {
        // 컴포넌트가 비활성화될 때 이벤트를 제거합니다. (메모리 누수 방지)
        input.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
    }

    private onTouchStart(event: EventTouch) {
        if (!this.uiCamera) {
            console.warn("UI Camera is not set!");
            return;
        }

        // 화면 터치 좌표를 가져옵니다.
        const touchLocation = event.getUILocation();

        // 월드 좌표로 변환합니다.
        const worldPoint = this.uiCamera.screenToWorld(new Vec3(touchLocation.x, touchLocation.y, 0));

        // 월드 좌표가 이 노드의 콜라이더 내에 있는지 확인합니다.
        if (PhysicsSystem2D.instance.testPoint(new Vec2(worldPoint.x, worldPoint.y))) {
            const hitColliders = PhysicsSystem2D.instance.testPoint(new Vec2(worldPoint.x, worldPoint.y));
            if (hitColliders.find(collider => collider.node.uuid === this.node.uuid)) {
                console.log("삼각형 버튼이 클릭되었습니다!");
                // 여기에 버튼 클릭 시 실행할 로직을 넣으세요.
                // 예: this.node.emit('triangle_clicked');
            }
        }
    }
}