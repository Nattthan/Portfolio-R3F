import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { Canvas } from '@react-three/fiber';
import Experience from './Experience';
import LoadingScreen from './components/LoadingScreen';

createRoot( document.getElementById( 'root' ) ).render(
  <StrictMode>
    <>
      <Canvas
        shadows="percentage"
        camera={ {
          fov: 45,
          near: 0.1,
          far: 200,
          position: [ 0, 4, 12 ]
        } }
      >
        <Experience />
      </Canvas>
      <LoadingScreen />
    </>
  </StrictMode>,
);
