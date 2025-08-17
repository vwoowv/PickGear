import { _decorator, Component, Node, ParticleSystem } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('particleAutoDestroy')
export class particleAutoDestroy extends Component {
    private particles: ParticleSystem[] = [];
    onLoad() {
        this.particles = this.node.getComponentsInChildren(ParticleSystem);
    }
    start() {
    }

    update(deltaTime: number) {
        for (const particle of this.particles) {
            if (particle.isStopped == false) {
                return;
            }
            this.node.destroy();
        }
    }
}
