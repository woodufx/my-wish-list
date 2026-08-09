import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh } from 'three';
import { METAL } from './material';

interface TorusProps {
  position: [number, number, number];
  scale?: number;
  color?: string;
}

/** A chrome torus (stand-in for torus-silver.glb). */
export function Torus({ position, scale = 1, color = '#1b2f58' }: TorusProps) {
  const ref = useRef<Mesh>(null);
  const baseY = position[1];

  useFrame((state) => {
    const mesh = ref.current;
    if (mesh) {
      mesh.rotation.x += 0.003;
      mesh.rotation.y += 0.004;
      mesh.position.y = baseY + Math.sin(state.clock.elapsedTime * 0.45 + 0.8) * 0.16;
    }
  });

  return (
    <mesh ref={ref} position={position} scale={scale} rotation={[0.6, 0.2, 0]}>
      <torusGeometry args={[0.7, 0.28, 48, 96]} />
      <meshStandardMaterial
        color={color}
        roughness={0.26}
        metalness={METAL.metalness}
        envMapIntensity={METAL.envMapIntensity}
      />
    </mesh>
  );
}
