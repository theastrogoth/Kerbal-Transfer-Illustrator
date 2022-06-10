import { configsTreeToSystem } from "../main/utilities/loadPlanetConfig";
import loadSystemData from "../main/utilities/loadSystem";
import kspbodies from "../data/kspbodies.json"

const kspSystem = loadSystemData(kspbodies);

declare var self: DedicatedWorkerGlobalScope;
export {};

self.onmessage = (event: MessageEvent<{tree: TreeNode<SunConfig | OrbitingBodyConfig>, scale: number}>) => {
    const {tree, scale} = event.data;
    const newSystem = configsTreeToSystem(tree, kspSystem, scale);
    self.postMessage(newSystem); 
}