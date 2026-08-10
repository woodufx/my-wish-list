import { useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Lighting } from './environment/Lighting';
import { GlbModel } from './objects/GlbModel';

function FrameloopController() {
  const setFrameloop = useThree((state) => state.setFrameloop);
  useEffect(() => {
    const sync = () => {
      setFrameloop(document.hidden ? 'never' : 'always');
    };
    sync();
    document.addEventListener('visibilitychange', sync);
    return () => {
      document.removeEventListener('visibilitychange', sync);
    };
  }, [setFrameloop]);
  return null;
}

/**
 * The FRONT depth plane: brighter, sharper models that drift FASTER than the back
 * plane (stronger scroll parallax) and pass OVER the cards. Loaded only on the
 * orbit-flight screen.
 */
export default function FrontScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 7], fov: 42 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.toneMappingExposure = 1.45;
      }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <FrameloopController />
      <Lighting />
      {/* Front plane: equal-ish hearts / blobs / tags, small and kept to the edges
          so they don't cover the card content. Only a pair is in view on the orbit
          scene; the rest drift in as you scroll (parallax). */}
      <GlbModel
        url="/models/tag-silver.glb"
        position={[-5.2, -1.4, -0.9]}
        scale={2.2}
        color="#3a5aa0"
        roughness={0.26}
        speed={1.0}
        parallax={1.4}
        driftDir={[-0.7, 0.5]}
        phase={1.2}
      />
      <GlbModel
        url="/models/heart-silver.glb"
        position={[4.5, 1.2, -0.8]}
        scale={1.45}
        color="#3a5aa0"
        roughness={0.28}
        speed={1.08}
        parallax={1.4}
        driftDir={[0.5, 0.5]}
        phase={0.4}
      />
      <GlbModel
        url="/models/blob-silver.glb"
        position={[-5.2, 5.4, -1.2]}
        scale={1.5}
        color="#33538f"
        roughness={0.3}
        speed={1.12}
        parallax={1.4}
        driftDir={[-0.6, -0.4]}
        phase={0.9}
      />
      <GlbModel
        url="/models/tag-silver.glb"
        position={[4.8, 4.8, -1.0]}
        scale={1.5}
        color="#33538f"
        roughness={0.3}
        speed={1.14}
        parallax={1.5}
        driftDir={[0.5, -0.4]}
        phase={2.5}
      />
      <GlbModel
        url="/models/heart-silver.glb"
        position={[4.3, 7.6, -0.9]}
        scale={1.3}
        color="#3a5aa0"
        roughness={0.3}
        speed={1.18}
        parallax={1.4}
        driftDir={[0.4, -0.4]}
        phase={3.1}
      />
      <GlbModel
        url="/models/blob-silver.glb"
        position={[5.2, 9.6, -1.1]}
        scale={1.5}
        color="#3a5aa0"
        roughness={0.3}
        speed={1.2}
        parallax={1.5}
        driftDir={[0.5, -0.5]}
        phase={4.0}
      />
    </Canvas>
  );
}
