import { useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Lighting } from './environment/Lighting';
import { Sphere } from './objects/Sphere';
import { LiquidBlob } from './objects/LiquidBlob';
import { Droplet } from './objects/Droplet';

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
      camera={{ position: [0, 0, 6], fov: 45 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <FrameloopController />
      <Lighting />
      <Sphere position={[-3.2, 1.5, -2]} scale={1.15} />
      <LiquidBlob position={[3.4, -0.6, -1]} scale={1.5} distort={0.4} speed={1.2} />
      <LiquidBlob
        position={[-2.6, -2.3, -3]}
        scale={1.05}
        color="#16305f"
        distort={0.3}
        speed={1.6}
      />
      <Droplet position={[2.5, 2.1, -2]} scale={0.9} />
    </Canvas>
  );
}
