import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh } from 'three';

interface DropletProps {
  position: [number, number, number];
  scale?: number;
  color?: string;
}

/** A droplet: a sphere stretched vertically, with the same clearcoat glass look. */
export function Droplet({ position, scale = 1, color = '#12244d' }: DropletProps) {
  const ref = useRef<Mesh>(null);
  const baseY = position[1];

  useFrame((state) => {
    const mesh = ref.current;
    if (mesh) {
      mesh.rotation.y += 0.004;
      mesh.position.y = baseY + Math.sin(state.clock.elapsedTime * 0.4 + 1.5) * 0.14;
    }
  });

  return (
    <mesh ref={ref} position={position} scale={[scale * 0.7, scale, scale * 0.7]}>
      <sphereGeometry args={[1, 48, 48]} />
      <meshPhysicalMaterial
        color={color}
        roughness={0.14}
        metalness={0.12}
        clearcoat={1}
        clearcoatRoughness={0.2}
      />
    </mesh>
  );
}
