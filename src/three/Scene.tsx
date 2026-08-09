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
        // ACES Filmic is R3F's default; match orb-stage's exposure (a touch calmer).
        gl.toneMappingExposure = 1.4;
      }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <FrameloopController />
      <Lighting />
      {/* Kept clear of the top-left hero zone. */}
      <LiquidBlob position={[5.0, 2.6, -3]} scale={1.15} distort={0.42} speed={1.2} />
      <Torus position={[5.8, -0.6, -3.5]} scale={1.05} />
      <Knot position={[4.4, -2.9, -2.5]} scale={0.9} />
      <Sphere position={[-5.0, -2.8, -3.5]} scale={1.0} color="#16305f" />
      <Droplet position={[-1.2, 3.6, -4]} scale={0.8} />
    </Canvas>
  );
}
