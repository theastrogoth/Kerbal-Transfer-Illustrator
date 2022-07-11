import { useThree } from "@react-three/fiber";
import { useCubeTexture } from "@react-three/drei";

function SkyBox() {
  const { scene } = useThree();
  const texture = useCubeTexture([
    "https://raw.githubusercontent.com/theastrogoth/Kerbal-Transfer-Illustrator/assets/skybox/PositiveX.png", 
    "https://raw.githubusercontent.com/theastrogoth/Kerbal-Transfer-Illustrator/assets/skybox/NegativeX.png",
    "https://raw.githubusercontent.com/theastrogoth/Kerbal-Transfer-Illustrator/assets/skybox/PositiveY.png",
    "https://raw.githubusercontent.com/theastrogoth/Kerbal-Transfer-Illustrator/assets/skybox/NegativeY.png",
    "https://raw.githubusercontent.com/theastrogoth/Kerbal-Transfer-Illustrator/assets/skybox/PositiveZ.png",
    "https://raw.githubusercontent.com/theastrogoth/Kerbal-Transfer-Illustrator/assets/skybox/NegativeZ.png",
  ], { path: ""})
  scene.background = texture;
  return null;
}

export default SkyBox;