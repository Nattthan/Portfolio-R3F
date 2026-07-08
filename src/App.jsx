import { Canvas } from "@react-three/fiber";
import { useState } from "react";
import ControlsOverlay from "./components/ControlsOverlay";
import LoadingScreen from "./components/LoadingScreen";
import UmamiAnalytics from "./components/UmamiAnalytics";
import Experience from "./Experience";

export default function App ()
{
    const [ selectedControl, setSelectedControl ] = useState( null );

    return <>
        <UmamiAnalytics />
        <Canvas
            dpr={ [ 1, 1.25 ] }
            shadows="percentage"
            gl={ {
                antialias: false,
                powerPreference: "high-performance",
                stencil: false
            } }
            camera={ {
                fov: 45,
                near: 0.1,
                far: 200,
                position: [ 0, 4, 12 ]
            } }
        >
            <Experience onSelectedControlChange={ setSelectedControl } />
        </Canvas>
        <ControlsOverlay selectedControl={ selectedControl } />
        <LoadingScreen />
    </>;
}
