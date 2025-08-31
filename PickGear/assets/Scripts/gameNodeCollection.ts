import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('gameNodeCollection')
export class gameNodeCollection extends Component {
    @property(Node)
    public selectGameTypeNode: Node = null;
    @property(Node)
    public gameNode: Node = null;

    public allNodeOff() {
        this.selectGameTypeNode.active = false;
        this.gameNode.active = false;
    }
}
