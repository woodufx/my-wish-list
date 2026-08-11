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
export default function FrontScene({ mobile = false }: { mobile?: boolean }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 7], fov: 42 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.toneMappingExposure = 1.45;
      }}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
    >
      <FrameloopController />
      <Lighting />
      {mobile ? (
        // Phone: small metal shapes parked in the left/right columns beside the
        // centred cards (mirrors the design's mobile orb-stage x-positions:
        // ~40px and ~350px in a 390 frame → world x ≈ ∓1.0). driftDir is [0,0]
        // so the orbit→list flight does NOT shove them off-screen — they simply
        // parallax vertically with scroll (speed) and pass by the cards.
        <>
          <GlbModel
            url="/models/heart-silver.glb"
            position={[-0.98, 0.6, 0.4]}
            scale={0.62}
            color="#3a5aa0"
            roughness={0.28}
            speed={1.1}
            parallax={0.7}
            driftDir={[0, 0]}
            burstDir={[-0.35, -1.6]}
            phase={0.4}
          />
          <GlbModel
            url="/models/tag-silver.glb"
            position={[1.0, 3.4, 0.3]}
            scale={0.55}
            color="#3a5aa0"
            roughness={0.26}
            speed={1.25}
            parallax={0.7}
            driftDir={[0, 0]}
            burstDir={[0.3, 1.7]}
            phase={1.6}
          />
          <GlbModel
            url="/models/heart-silver.glb"
            position={[0.94, -2.8, 0.5]}
            scale={0.5}
            color="#3a5aa0"
            roughness={0.3}
            speed={1.15}
            parallax={0.7}
            driftDir={[0, 0]}
            burstDir={[0.35, -1.5]}
            phase={3.1}
          />
        </>
      ) : (
        <>
          {/* Front plane: kept sparse so the right side isn't crowded — a pair on
              the orbit (left tag + right heart), then one object per side drifting
              in far apart. The rest of the objects live on the back plane. */}
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
            position={[-5.0, 6.5, -1.2]}
            scale={1.5}
            color="#33538f"
            roughness={0.3}
            speed={1.12}
            parallax={1.4}
            driftDir={[-0.6, -0.4]}
            phase={0.9}
          />
          <GlbModel
            url="/models/heart-silver.glb"
            position={[4.4, 11.5, -0.9]}
            scale={1.3}
            color="#3a5aa0"
            roughness={0.3}
            speed={1.18}
            parallax={1.4}
            driftDir={[0.4, -0.4]}
            phase={3.1}
          />
        </>
      )}
    </Canvas>
  );
}
