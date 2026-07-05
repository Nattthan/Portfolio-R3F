import { KeyboardControls, OrbitControls } from "@react-three/drei";
import { Physics } from "@react-three/rapier";
import { button, useControls } from "leva";
import { Suspense, useEffect, useRef, useState } from "react";
import Floor from "./components/Floor";
import Crane from "./components/Crane";
import UnderConstructionWord from "./components/letters/UnderConstructionWord";
import CraneIntroSequence from "./components/intro/CraneIntroSequence";

const craneKeyboardMap = [
    { name: "left", keys: [ "ArrowRight" ] },
    { name: "right", keys: [ "ArrowLeft" ] },
    { name: "up", keys: [ "ArrowUp" ] },
    { name: "down", keys: [ "ArrowDown" ] },
    { name: "grab", keys: [ "KeyA", "a", "A" ] },
    { name: "release", keys: [ "KeyD", "d", "D" ] }
];

export default function Experience ()
{
    const [ isKeyboardControlEnabled, setIsKeyboardControlEnabled ] = useState( false );
    const [ isIntroSequenceEnabled, setIsIntroSequenceEnabled ] = useState( true );
    const craneIntroRef = useRef( {
        active: true,
        boomYaw: 0.12,
        hoistOffset: -0.3
    } );
    const hookRef = useRef();
    const introLetterRef = useRef();
    const introLetterCollisionRef = useRef( {
        isTouchingFloor: false,
        isTouchingHook: false
    } );
    const [ physicsPaused, setPhysicsPaused ] = useState(
        document.visibilityState === "hidden"
    );

    function stopIntroSequence ()
    {
        setIsIntroSequenceEnabled( false );

        if ( craneIntroRef.current )
            craneIntroRef.current.active = false;
    }

    function takeKeyboardControl ()
    {
        stopIntroSequence();
        setIsKeyboardControlEnabled( true );
    }

    function releaseKeyboardControl ()
    {
        stopIntroSequence();
        setIsKeyboardControlEnabled( false );
    }

    useControls( "crane keyboard", {
        takeControl: button( takeKeyboardControl ),
        releaseControl: button( releaseKeyboardControl )
    }, { collapsed: true } );

    useEffect( () =>
    {
        const updatePhysicsPaused = () =>
        {
            setPhysicsPaused( document.visibilityState === "hidden" );
        };

        document.addEventListener( "visibilitychange", updatePhysicsPaused );

        return () =>
        {
            document.removeEventListener( "visibilitychange", updatePhysicsPaused );
        };
    }, [] );

    return <>
        <color args={ [ "#3b352f" ] } attach="background" />

        <OrbitControls
            makeDefault
            enableDamping
            dampingFactor={ 0.05 }
            rotateSpeed={ 0.5 }
            zoomSpeed={ 0.8 }
            panSpeed={ 0.5 }
            minDistance={ 8 }
            maxDistance={ 12 }
            target={ [ 0, 0, 0 ] }
            minPolarAngle={ Math.PI / 3 }
            maxPolarAngle={ Math.PI / 2.1 }
            minAzimuthAngle={ -Math.PI / 4 }
            maxAzimuthAngle={ Math.PI / 4 }
        />

        <hemisphereLight args={ [ "#fff1d6", "#2b2521", 1.1 ] } />
        <directionalLight
            color={ "#ffd8a8" }
            intensity={ 4.2 }
            position={ [ -3.5, 5, 4 ] }
            castShadow
            shadow-mapSize={ [ 2048, 2048 ] }
            shadow-camera-near={ 0.5 }
            shadow-camera-far={ 14 }
            shadow-camera-left={ -5 }
            shadow-camera-right={ 5 }
            shadow-camera-top={ 5 }
            shadow-camera-bottom={ -5 }
            shadow-bias={ -0.0008 }
            shadow-normalBias={ 0.035 }
        />
        <pointLight
            color={ "#8fb7ff" }
            intensity={ 1.1 }
            distance={ 8 }
            position={ [ 3.5, 2.3, -2.8 ] }
        />

        <Suspense fallback={ null }>
            <KeyboardControls map={ craneKeyboardMap }>
                <Physics paused={ physicsPaused }>
                    <Crane
                        hookRef={ hookRef }
                        introRef={ craneIntroRef }
                        keyboardControlEnabled={ isKeyboardControlEnabled }
                    />
                    <UnderConstructionWord
                        activeLetterType="dynamic"
                        introLetterCollisionRef={ introLetterCollisionRef }
                        introLetterRef={ introLetterRef }
                    />
                    { !isKeyboardControlEnabled && isIntroSequenceEnabled &&
                        <CraneIntroSequence
                            craneIntroRef={ craneIntroRef }
                            hookRef={ hookRef }
                            introLetterCollisionRef={ introLetterCollisionRef }
                            letterRef={ introLetterRef }
                        /> }
                    <Floor />
                </Physics>
            </KeyboardControls>
        </Suspense>
    </>;
}
