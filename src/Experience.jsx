import { KeyboardControls, OrbitControls } from "@react-three/drei";
import { Physics } from "@react-three/rapier";
import { button, useControls } from "leva";
import { Suspense, useEffect, useRef, useState } from "react";
import Floor from "./components/Floor";
import Bulldozer from "./components/Bulldozer";
import Crane from "./components/Crane";
import ConstructionAssets from "./components/ConstructionAssets";
import BloomEffect from "./components/effects/BloomEffect";
import UnderConstructionWord from "./components/letters/UnderConstructionWord";
import BulldozerIntroSequence from "./components/intro/BulldozerIntroSequence";
import CraneIntroSequence from "./components/intro/CraneIntroSequence";

const craneKeyboardMap = [
    { name: "left", keys: [ "ArrowRight" ] },
    { name: "right", keys: [ "ArrowLeft" ] },
    { name: "up", keys: [ "ArrowUp" ] },
    { name: "down", keys: [ "ArrowDown" ] },
    { name: "bulldozerLeft", keys: [ "ArrowLeft" ] },
    { name: "bulldozerRight", keys: [ "ArrowRight" ] },
    { name: "bulldozerForward", keys: [ "ArrowUp" ] },
    { name: "bulldozerBackward", keys: [ "ArrowDown" ] },
    { name: "grab", keys: [ "KeyA", "a", "A" ] },
    { name: "release", keys: [ "KeyD", "d", "D" ] }
];

export default function Experience ()
{
    const [ isCraneKeyboardControlEnabled, setIsCraneKeyboardControlEnabled ] = useState( false );
    const [ isBulldozerKeyboardControlEnabled, setIsBulldozerKeyboardControlEnabled ] = useState( false );
    const [ isIntroSequenceEnabled, setIsIntroSequenceEnabled ] = useState( true );
    const craneIntroRef = useRef( {
        active: true,
        boomYaw: 0.12,
        hoistOffset: -0.3
    } );
    const bulldozerIntroRef = useRef( {
        active: true,
        activity: 0.58,
        moveDirection: 0,
        speed: 0,
        turnDirection: 0
    } );
    const hookRef = useRef();
    const introLetterRef = useRef();
    const bulldozerLetterRef = useRef();
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

        if ( bulldozerIntroRef.current )
            bulldozerIntroRef.current.active = false;
    }

    function takeCraneKeyboardControl ()
    {
        stopIntroSequence();
        setIsBulldozerKeyboardControlEnabled( false );
        setIsCraneKeyboardControlEnabled( true );
    }

    function releaseCraneKeyboardControl ()
    {
        stopIntroSequence();
        setIsCraneKeyboardControlEnabled( false );
    }

    function takeBulldozerKeyboardControl ()
    {
        stopIntroSequence();
        setIsCraneKeyboardControlEnabled( false );
        setIsBulldozerKeyboardControlEnabled( true );
    }

    function releaseBulldozerKeyboardControl ()
    {
        setIsBulldozerKeyboardControlEnabled( false );
    }

    useControls( "crane keyboard", {
        takeControl: button( takeCraneKeyboardControl ),
        releaseControl: button( releaseCraneKeyboardControl )
    }, { collapsed: true } );

    useControls( "bulldozer keyboard", {
        takeControl: button( takeBulldozerKeyboardControl ),
        releaseControl: button( releaseBulldozerKeyboardControl )
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

        <hemisphereLight args={ [ "#fff1d6", "#2b2521", 0.82 ] } />
        <directionalLight
            color={ "#ffd8a8" }
            intensity={ 1.85 }
            position={ [ -3.5, 5, 4 ] }
            castShadow
            shadow-mapSize={ [ 2048, 2048 ] }
            shadow-camera-near={ 0.1 }
            shadow-camera-far={ 18 }
            shadow-camera-left={ -8 }
            shadow-camera-right={ 8 }
            shadow-camera-top={ 8 }
            shadow-camera-bottom={ -8 }
            shadow-bias={ -0.0008 }
            shadow-normalBias={ 0.035 }
        />
        <pointLight
            color={ "#8fb7ff" }
            intensity={ 0.55 }
            distance={ 8 }
            position={ [ 3.5, 2.3, -2.8 ] }
        />

        <Suspense fallback={ null }>
            <KeyboardControls map={ craneKeyboardMap }>
                <Physics paused={ physicsPaused }>
                    <ConstructionAssets />
                    <Crane
                        hookRef={ hookRef }
                        introRef={ craneIntroRef }
                        keyboardControlEnabled={ isCraneKeyboardControlEnabled }
                    />
                    <Bulldozer
                        introRef={ bulldozerIntroRef }
                        keyboardControlEnabled={ isBulldozerKeyboardControlEnabled }
                    />
                    <UnderConstructionWord
                        activeLetterType="dynamic"
                        bulldozerLetterRef={ bulldozerLetterRef }
                        introLetterCollisionRef={ introLetterCollisionRef }
                        introLetterRef={ introLetterRef }
                    />
                    { !isBulldozerKeyboardControlEnabled && isIntroSequenceEnabled &&
                        <BulldozerIntroSequence
                            bulldozerIntroRef={ bulldozerIntroRef }
                            letterRef={ bulldozerLetterRef }
                        /> }
                    { !isCraneKeyboardControlEnabled && isIntroSequenceEnabled &&
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
        <BloomEffect />
    </>;
}
