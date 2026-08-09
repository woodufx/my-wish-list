import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh } from 'three';
import { METAL } from './material';

interface KnotProps {
  position: [number, number, number];
  scale?: number;
  color?: string;
}

/** A chrome torus-knot (stand-in for knot-silver.glb). */
export function Knot({ position, scale = 1, color = '#18294f' }: KnotProps) {
  const ref = useRef<Mesh>(null);
  const baseY = position[1];

  useFrame((state) => {
    const mesh = ref.current;
    if (mesh) {
      mesh.rotation.y += 0.005;
      mesh.rotation.z += 0.002;
      mesh.position.y = baseY + Math.sin(state.clock.elapsedTime * 0.5 + 2.1) * 0.15;
    }
  });

  return (
    <mesh ref={ref} position={position} scale={scale}>
      <torusKnotGeometry args={[0.6, 0.2, 160, 32]} />
      <meshStandardMaterial
        color={color}
        roughness={0.28}
        metalness={METAL.metalness}
        envMapIntensity={METAL.envMapIntensity}
      />
    </mesh>
  );
}
