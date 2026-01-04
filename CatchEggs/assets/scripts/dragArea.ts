import { _decorator, Component, EventTouch, Node, UITransform, Vec3 } from 'cc';
import { gameManager } from './gameManager';
const { ccclass, property } = _decorator;

@ccclass('dragArea')
export class dragArea extends Component {
    @property(gameManager)
    private gameManagerInstance: gameManager = null;

    onLoad() {
        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
    }

    onDestroy() {
        this.node.off(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.off(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.off(Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
    }

    private onTouchStart(event: EventTouch) {
        console.log("onTouchStart");
    }

    private onTouchMove(event: EventTouch) {
        const uiTransform = this.node.getComponent(UITransform);
        const location = event.getUILocation();
        const localPos = uiTransform.convertToNodeSpaceAR(new Vec3(location.x, location.y, 0));
        this.gameManagerInstance.onDragAreaTouchMove(localPos.x, localPos.y);
    }

    private onTouchEnd(event: EventTouch) {
        console.log("onTouchEnd");
    }

    private onTouchCancel(event: EventTouch) {
        console.log("onTouchCancel");
    }
}
