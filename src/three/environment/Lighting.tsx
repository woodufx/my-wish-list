import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { PMREMGenerator } from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/**
 * Procedural studio reflections (RoomEnvironment via PMREM) — this is what makes
 * the high-metalness objects read as polished silver/chrome. Plus the cold key,
 * warm amber fill, and blue ambient from the original orb-stage.
 */
function RoomEnv() {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);

  useEffect(() => {
    const pmrem = new PMREMGenerator(gl);
    const envTarget = pmrem.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envTarget.texture;
    return () => {
      scene.environment = null;
      envTarget.texture.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);

  return null;
}

export function Lighting() {
  return (
    <>
      <RoomEnv />
      <directionalLight color="#dce9ff" intensity={2.6} position={[-1.2, 1.6, 1.4]} />
      <directionalLight color="#ffb268" intensity={1.5} position={[1.4, -0.8, 0.9]} />
      <ambientLight color="#2a4a8c" intensity={0.9} />
    </>
  );
}
