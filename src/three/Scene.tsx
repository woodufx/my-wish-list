import { useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Lighting } from './environment/Lighting';
import { GlbModel } from './objects/GlbModel';

/** Stops rendering while the tab is hidden, resumes when it returns. */
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

/** The single background Canvas. Lazily imported so three lands in its own chunk. */
export default function Scene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 7], fov: 42 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.toneMappingExposure = 1.4;
      }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <FrameloopController />
      <Lighting />
      {/* Real silver models from the design. Kept clear of the top-left hero. */}
      <GlbModel
        url="/models/heart-silver.glb"
        position={[4.2, 1.7, -0.5]}
        scale={3.4}
        color="#3a5aa0"
        roughness={0.28}
        driftDir={[0.6, 0.6]}
      />
      <GlbModel
        url="/models/tag-silver.glb"
        position={[-5.0, -1.6, -1]}
        scale={3}
        color="#3a5aa0"
        roughness={0.26}
        driftDir={[-0.7, 0.5]}
        phase={1.2}
      />
      <GlbModel
        url="/models/blob-silver.glb"
        position={[5.4, -1.4, -2.5]}
        scale={3.6}
        color="#22386a"
        roughness={0.4}
        driftDir={[0.7, -0.5]}
        phase={2.1}
      />
      <GlbModel
        url="/models/torus-silver.glb"
        position={[3.0, 2.9, -2]}
        scale={2.6}
        color="#20345f"
        roughness={0.38}
        driftDir={[0.5, 0.6]}
        phase={0.6}
      />
      <GlbModel
        url="/models/knot-silver.glb"
        position={[4.7, -2.9, -2]}
        scale={2.3}
        color="#33538f"
        roughness={0.3}
        driftDir={[0.6, -0.6]}
        phase={3.4}
      />
      <GlbModel
        url="/models/heart-silver.glb"
        position={[-5.4, -2.6, -3]}
        scale={2.2}
        color="#1d3060"
        roughness={0.44}
        driftDir={[-0.6, -0.5]}
        phase={4.2}
      />
    </Canvas>
  );
}
