import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh } from 'three';

interface SphereProps {
  position: [number, number, number];
  scale?: number;
  color?: string;
}

/** A glossy clearcoat sphere from a primitive, slowly turning. */
export function Sphere({ position, scale = 1, color = '#16274a' }: SphereProps) {
  const ref = useRef<Mesh>(null);

  useFrame((_, delta) => {
    const mesh = ref.current;
    if (mesh) {
      mesh.rotation.y += delta * 0.1;
      mesh.rotation.x += delta * 0.04;
    }
  });

  return (
    <mesh ref={ref} position={position} scale={scale}>
      <sphereGeometry args={[1, 64, 64]} />
      <meshPhysicalMaterial
        color={color}
        roughness={0.15}
        metalness={0.1}
        clearcoat={1}
        clearcoatRoughness={0.18}
      />
    </mesh>
  );
}
