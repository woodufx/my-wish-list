import { useMemo, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Box3, Color, Group, Mesh, MeshStandardMaterial, Vector3 } from 'three';
import { stageSync } from '@/shared/lib/stage-sync';
import { METAL } from './material';

interface GlbModelProps {
  url: string;
  position: [number, number, number];
  scale?: number;
  color?: string;
  roughness?: number;
  spin?: number;
  parallax?: number;
  /** Direction the object drifts as the orbit→panels flight progresses. */
  driftDir?: [number, number];
  phase?: number;
}

const DEFAULT_DRIFT: [number, number] = [1, 0];

/**
 * Loads a GLB and gives it the orb-stage look: high metalness + strong
 * environment reflections turn a blue tint into polished tinted silver. Drifts
 * with pointer parallax and disperses on the scroll flight (via stageSync).
 */
export function GlbModel({
  url,
  position,
  scale = 1,
  color = '#1a2c52',
  roughness = 0.34,
  spin = 0.15,
  parallax = 1,
  driftDir = DEFAULT_DRIFT,
  phase = 0,
}: GlbModelProps) {
  const { scene } = useGLTF(url);
  const groupRef = useRef<Group>(null);
  const spinRef = useRef(Math.random() * 6);

  const { object, unit } = useMemo(() => {
    const clone = scene.clone(true);
    const box = new Box3().setFromObject(clone);
    const size = box.getSize(new Vector3());
    const center = box.getCenter(new Vector3());
    clone.position.sub(center);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    clone.traverse((child) => {
      if (child instanceof Mesh) {
        child.material = new MeshStandardMaterial({
          color: new Color(color),
          metalness: METAL.metalness,
          roughness,
          envMapIntensity: METAL.envMapIntensity,
        });
      }
    });
    return { object: clone, unit: 1 / maxDim };
  }, [scene, color, roughness]);

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) {
      return;
    }
    spinRef.current += spin * delta;
    const t = state.clock.elapsedTime;
    const flight = stageSync.flight;

    // continuous vertical drift that wraps, so objects keep populating the whole
    // scroll (orbit and the list stage) instead of vanishing.
    const span = 16;
    const raw = position[1] - stageSync.scroll * 0.0011 + span / 2;
    const driftY = (((raw % span) + span) % span) - span / 2;

    group.position.x = position[0] + stageSync.px * parallax * 1.4 + driftDir[0] * flight * 2.4;
    group.position.y =
      driftY +
      Math.sin(t * 0.4 + phase) * 0.2 -
      stageSync.py * parallax * 1.2 +
      driftDir[1] * flight * 2;
    group.rotation.x = spinRef.current * 0.16 + stageSync.py * 0.24;
    group.rotation.y = spinRef.current + stageSync.px * 0.3;
  });

  return (
    <group ref={groupRef} position={position} scale={unit * scale}>
      <primitive object={object} />
    </group>
  );
}

useGLTF.preload('/models/heart-silver.glb');
useGLTF.preload('/models/tag-silver.glb');
useGLTF.preload('/models/blob-silver.glb');
useGLTF.preload('/models/torus-silver.glb');
useGLTF.preload('/models/knot-silver.glb');
