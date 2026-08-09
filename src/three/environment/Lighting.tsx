import { Environment, Lightformer } from '@react-three/drei';

/**
 * Studio lighting via an Environment with a few Lightformers:
 * a cold panel from above, a white highlight on the side, a warm amber pickup
 * from below — the palette the glass objects reflect.
 */
export function Lighting() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <Environment resolution={256}>
        {/* cold panel, top */}
        <Lightformer
          intensity={2.4}
          color="#cfe0ff"
          position={[0, 5, -2]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[10, 4, 1]}
        />
        {/* white highlight, side */}
        <Lightformer
          intensity={3}
          color="#ffffff"
          position={[5, 0, 1]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={[4, 8, 1]}
        />
        {/* warm amber pickup, bottom */}
        <Lightformer
          intensity={1.6}
          color="#ff9c46"
          position={[0, -5, 1]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[10, 4, 1]}
        />
      </Environment>
    </>
  );
}
