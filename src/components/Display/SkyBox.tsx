import { useThree } from "@react-three/fiber";
import { useCubeTexture } from "@react-three/drei";
import negativeX from "../../assets/skybox/NegativeX.png";
import negativeY from "../../assets/skybox/NegativeY.png";
import negativeZ from "../../assets/skybox/NegativeZ.png";
import positiveX from "../../assets/skybox/PositiveX.png";
import positiveY from "../../assets/skybox/PositiveY.png";
import positiveZ from "../../assets/skybox/PositiveZ.png";

function SkyBox() {
  const { scene } = useThree();
  const texture = useCubeTexture([positiveX, negativeX, positiveY, negativeY, positiveZ, negativeZ], { path: ""})
  scene.background = texture;
  return null;
}

export default SkyBox;