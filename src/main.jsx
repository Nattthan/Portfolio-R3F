import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { Canvas } from '@react-three/fiber';
import Experience from './Experience';
import { Leva } from 'leva';

createRoot( document.getElementById( 'root' ) ).render(
  <StrictMode>
    <Canvas
      shadows
      camera={ {
        fov: 45,
        near: 0.1,
        far: 200,
        position: [ 0, 2.5, 6 ]
      } }
    >
      <Experience />
    </Canvas>
  </StrictMode>,
);
