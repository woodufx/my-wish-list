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
      <GlbModel
        url="/models/heart-silver.glb"
        position={[4.2, 1.6, -0.3]}
        scale={3.6}
        color="#3a5aa0"
        roughness={0.28}
        speed={1.1}
        parallax={1.4}
        driftDir={[0.6, 0.6]}
      />
      <GlbModel
        url="/models/tag-silver.glb"
        position={[-5.0, -1.4, -0.8]}
        scale={3.2}
        color="#3a5aa0"
        roughness={0.26}
        speed={1.0}
        parallax={1.4}
        driftDir={[-0.7, 0.5]}
        phase={1.2}
      />
      <GlbModel
        url="/models/blob-silver.glb"
        position={[5.0, -2.4, -1.2]}
        scale={2.8}
        color="#33538f"
        roughness={0.3}
        speed={1.18}
        parallax={1.5}
        driftDir={[0.6, -0.5]}
        phase={2.6}
      />
    </Canvas>
  );
}
