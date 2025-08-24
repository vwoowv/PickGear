import { _decorator, Component, Node, Sprite, UITransform } from 'cc';
const { ccclass, property, requireComponent } = _decorator;

@ccclass('aspectRatioFitter')
@requireComponent(Sprite)
export class aspectRatioFitter extends Component {

    private sprite: Sprite = null;
    private uiTransform: UITransform = null;
    private originalRatio: number = 1;

    onLoad() {
        this.sprite = this.getComponent(Sprite);
        this.uiTransform = this.getComponent(UITransform);

        if (this.sprite.spriteFrame) {
            const originalSize = this.sprite.spriteFrame.getOriginalSize();
            this.originalRatio = originalSize.width / originalSize.height;
        }

        this.node.on(Node.EventType.SIZE_CHANGED, this.onSizeChanged, this);
    }

    onEnable() {
        this.updateSize();
    }

    onSizeChanged() {
        this.updateSize();
    }

    updateSize() {
        if (this.uiTransform && this.originalRatio > 0) {
            const newHeight = this.uiTransform.width / this.originalRatio;
            this.uiTransform.height = newHeight;
        }
    }
}