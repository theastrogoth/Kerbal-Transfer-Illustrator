import { useThree } from "@react-three/fiber";
import { useCubeTexture } from "@react-three/drei";

function SkyBox() {
  const { scene } = useThree();
  const texture = useCubeTexture([
    "https://raw.githubusercontent.com/theastrogoth/Kerbal-Transfer-Illustrator/main/public/assets/skybox/PositiveX.png", 
    "https://raw.githubusercontent.com/theastrogoth/Kerbal-Transfer-Illustrator/main/public/assets/skybox/NegativeX.png",
    "https://raw.githubusercontent.com/theastrogoth/Kerbal-Transfer-Illustrator/main/public/assets/skybox/PositiveY.png",
    "https://raw.githubusercontent.com/theastrogoth/Kerbal-Transfer-Illustrator/main/public/assets/skybox/NegativeY.png",
    "https://raw.githubusercontent.com/theastrogoth/Kerbal-Transfer-Illustrator/main/public/assets/skybox/PositiveZ.png",
    "https://raw.githubusercontent.com/theastrogoth/Kerbal-Transfer-Illustrator/main/public/assets/skybox/NegativeZ.png",
  ], { path: ""})
  scene.background = texture;
  return null;
}

export default SkyBox;