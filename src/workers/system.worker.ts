import { configsTreeToSystem } from "../main/utilities/loadPlanetConfig";
import loadSystemData from "../main/utilities/loadSystem";
import kspbodies from "../data/kspbodies.json"

const kspSystem = loadSystemData(kspbodies);

declare var self: DedicatedWorkerGlobalScope;
export {};

self.onmessage = (event: MessageEvent<TreeNode<SunConfig | OrbitingBodyConfig>>) => {
    console.log(event.data)
    const tree = event.data;
    const newSystem = configsTreeToSystem(tree, kspSystem);
    self.postMessage(newSystem); 
}