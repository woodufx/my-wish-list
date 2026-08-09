import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshDistortMaterial } from '@react-three/drei';
import type { Mesh } from 'three';

interface LiquidBlobProps {
  position: [number, number, number];
  scale?: number;
  color?: string;
  distort?: number;
  speed?: number;
}

/**
 * A fluid form: a high-detail sphere warped by MeshDistortMaterial. Never uses
 * MeshTransmissionMaterial — too expensive for a background object.
 */
export function LiquidBlob({
  position,
  scale = 1,
  color = '#1a2c52',
  distort = 0.35,
  speed = 1.3,
}: LiquidBlobProps) {
  const ref = useRef<Mesh>(null);
  const baseY = position[1];

  useFrame((state) => {
    const mesh = ref.current;
    if (mesh) {
      mesh.rotation.y += 0.0016;
      mesh.position.y = baseY + Math.sin(state.clock.elapsedTime * 0.5) * 0.18;
    }
  });

  return (
    <mesh ref={ref} position={position} scale={scale}>
      <icosahedronGeometry args={[1, 16]} />
      <MeshDistortMaterial
        color={color}
        roughness={0.16}
        metalness={0.2}
        clearcoat={0.8}
        clearcoatRoughness={0.25}
        distort={distort}
        speed={speed}
      />
    </mesh>
  );
}
