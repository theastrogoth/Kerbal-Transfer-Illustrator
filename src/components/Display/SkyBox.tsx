import { useThree } from "@react-three/fiber";
import { CubeTextureLoader } from "three";
import negativeX from "../../assets/skybox/NegativeX.png";
import negativeY from "../../assets/skybox/NegativeY.png";
import negativeZ from "../../assets/skybox/NegativeZ.png";
import positiveX from "../../assets/skybox/PositiveX.png";
import positiveY from "../../assets/skybox/PositiveY.png";
import positiveZ from "../../assets/skybox/PositiveZ.png";

const textureLoader = new CubeTextureLoader();
const texture = textureLoader.load([positiveX, negativeX, positiveY, negativeY, positiveZ, negativeZ]);

function SkyBox() {
  const { scene } = useThree();
  scene.background = texture;
  return null;
}

export default SkyBox;