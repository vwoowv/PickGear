import { _decorator, Component, EventTouch, Node, UITransform } from 'cc';
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
        let location = event.getLocation();
        const transform = this.node.getComponent(UITransform);
        const size = transform.contentSize;
        const position = this.node.position;
        const x = location.x - position.x - size.width / 2;
        const y = location.y - position.y - size.height / 2;
        this.gameManagerInstance.onDragAreaTouchMove(x, y);
    }
    
    private onTouchEnd(event: EventTouch) {
        console.log("onTouchEnd");
    }

    private onTouchCancel(event: EventTouch) {
        console.log("onTouchCancel");
    }
}

