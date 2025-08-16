import { _decorator, Component, Node, Sprite } from 'cc';
import { EggType } from './gameDefine';
const { ccclass, property } = _decorator;

@ccclass('egg')
export class egg extends Component {
    @property(Sprite)
    private eggImage: Sprite = null;

    public initialize(egg: EggType) {

    }

    update(deltaTime: number) {

    }
}

