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

/**
 * The BACK depth plane: slower-drifting, dimmer, further-back models. Sits behind
 * all content (blurred by the host). Lazily imported so three lands in its own chunk.
 */
export default function Scene({ mobile = false }: { mobile?: boolean }) {
  if (mobile) {
    // Phone back plane: a single heart drifting behind the cards, offset to one
    // side of centre (blurred + dimmed by the host) so the middle isn't empty.
    // The orbit→list flight gives it a one-way upward bounce (it stays, no return).
    return (
      <Canvas
        camera={{ position: [0, 0, 7], fov: 42 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.toneMappingExposure = 1.4;
        }}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      >
        <FrameloopController />
        <Lighting />
        <GlbModel
          url="/models/heart-silver.glb"
          position={[0.55, 0.5, -1.8]}
          scale={2.1}
          color="#2b4a86"
          roughness={0.36}
          speed={0.54}
          driftDir={[0, -0.9]}
          phase={1.2}
        />
      </Canvas>
    );
  }

  return (
    <Canvas
      camera={{ position: [0, 0, 7], fov: 42 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.toneMappingExposure = 1.4;
      }}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
    >
      <FrameloopController />
      <Lighting />
      <GlbModel
        url="/models/blob-silver.glb"
        position={[5.4, -1.4, -3]}
        scale={3.2}
        color="#1a2c52"
        roughness={0.42}
        speed={0.46}
        driftDir={[0.7, -0.5]}
        phase={2.1}
      />
      <GlbModel
        url="/models/torus-silver.glb"
        position={[3.0, 2.9, -2.5]}
        scale={2.4}
        color="#18294f"
        roughness={0.4}
        speed={0.5}
        driftDir={[0.5, 0.6]}
        phase={0.6}
      />
      <GlbModel
        url="/models/knot-silver.glb"
        position={[4.7, -2.9, -2.5]}
        scale={2.1}
        color="#20345f"
        roughness={0.32}
        speed={0.4}
        driftDir={[0.6, -0.6]}
        phase={3.4}
      />
      <GlbModel
        url="/models/heart-silver.glb"
        position={[-5.4, -1.6, -3.5]}
        scale={2.0}
        color="#16274a"
        roughness={0.45}
        speed={0.44}
        driftDir={[-0.6, 0.4]}
        phase={4.2}
      />
    </Canvas>
  );
}
