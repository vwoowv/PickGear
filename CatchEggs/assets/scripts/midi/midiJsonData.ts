import { JsonAsset } from "cc";
import { ResourceManager } from "../ResourceManager";

export class midiJsonData {
    public midiJsonData: MidiJson = null;

    public async loadMidiJsonData() {
        const jsonData = await ResourceManager.I.loadResource<JsonAsset>("midi/version1", JsonAsset);
        this.midiJsonData = jsonData.json as MidiJson;
    }
}
