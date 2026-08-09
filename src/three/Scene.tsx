import { useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Lighting } from './environment/Lighting';
import { Sphere } from './objects/Sphere';
import { LiquidBlob } from './objects/LiquidBlob';
import { Droplet } from './objects/Droplet';
import { Torus } from './objects/Torus';
import { Knot } from './objects/Knot';

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
        // ACES Filmic is R3F's default; match orb-stage's brighter exposure.
        gl.toneMappingExposure = 1.6;
      }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <FrameloopController />
      <Lighting />
      <LiquidBlob position={[-3.6, 1.6, -1]} scale={1.35} distort={0.42} speed={1.2} />
      <Torus position={[3.8, 1.2, -2]} scale={1.25} />
      <Knot position={[3.2, -1.8, -1.5]} scale={1.0} />
      <Sphere position={[-3.0, -2.0, -2.5]} scale={1.1} color="#16305f" />
      <Droplet position={[0.6, 2.6, -3]} scale={0.9} />
    </Canvas>
  );
}
