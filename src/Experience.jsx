import { KeyboardControls, OrbitControls, SpotLight } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { Suspense, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import Floor from "./components/Floor";
import Bulldozer from "./components/Bulldozer";
import Crane from "./components/Crane";
import ConstructionAssets from "./components/ConstructionAssets";
import BloomEffect from "./components/effects/BloomEffect";
import UnderConstructionWord from "./components/letters/UnderConstructionWord";
import BulldozerIntroSequence from "./components/intro/BulldozerIntroSequence";
import CraneIntroSequence from "./components/intro/CraneIntroSequence";
import ClickableSign from "./components/ClickableSign";
import { trackEvent } from "./utils/analytics";
import { degToRad } from "three/src/math/MathUtils.js";

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

const signLights = [
    {
        name: "cv",
        targetPos: [ -2, 4, 10 ],
        lightTargetPos: [ -0.9, 0.2, 5.4 ],
        lightTarget: new THREE.Object3D()
    },
    {
        name: "portfolio",
        targetPos: [ 2, 4, 10 ],
        lightTargetPos: [ 0.5, 0.2, 5.4 ],
        lightTarget: new THREE.Object3D()
    }
];

const bulldozerInitialPose = {
    position: [ 4.7427, 0.4554, 2.1 ],
    rotation: [ 0, degToRad( 1.0 ), 0 ]
};


function SignSpotLight ()
{
    return signLights.map( ( element ) =>
    {
        const target = element.lightTarget;

        target.position.set( ...element.lightTargetPos );
        target.updateMatrixWorld();

        return (
            <group key={ element.name }>
                <primitive object={ target } />
                <SpotLight
                    color="#fff1d6"
                    intensity={ 60 }
                    opacity={ 0.67 }
                    distance={ 6.75 }
                    angle={ 0.1 }
                    attenuation={ 6 }
                    anglePower={ 6 }
                    penumbra={ 1 }
                    decay={ 1.2 }
                    position={ element.targetPos }
                    target={ target }
                    castShadow={ false }
                />
            </group>
        );
    } );
}

export default function Experience ( {
    onSelectedControlChange
} )
{
    const [ isCraneKeyboardControlEnabled, setIsCraneKeyboardControlEnabled ] = useState( false );
    const [ isBulldozerKeyboardControlEnabled, setIsBulldozerKeyboardControlEnabled ] = useState( false );
    const [ isIntroSequenceEnabled, setIsIntroSequenceEnabled ] = useState( true );
    const [ isIntroSequenceComplete, setIsIntroSequenceComplete ] = useState( false );
    const isIntroSequenceCompleteRef = useRef( false );
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
    const selectedControl = isCraneKeyboardControlEnabled
        ? "crane"
        : isBulldozerKeyboardControlEnabled
            ? "bulldozer"
            : null;

    useEffect( () =>
    {
        onSelectedControlChange?.( selectedControl );
    }, [ onSelectedControlChange, selectedControl ] );

    function stopIntroSequence ()
    {
        setIsIntroSequenceEnabled( false );
        isIntroSequenceCompleteRef.current = true;
        setIsIntroSequenceComplete( true );

        if ( craneIntroRef.current )
            craneIntroRef.current.active = false;

        if ( bulldozerIntroRef.current )
            bulldozerIntroRef.current.active = false;
    }

    function takeCraneKeyboardControl ()
    {
        trackEvent( "crane_control_click", {
            action: "take_control"
        } );
        stopIntroSequence();
        setIsBulldozerKeyboardControlEnabled( false );
        setIsCraneKeyboardControlEnabled( true );
    }

    function toggleCraneKeyboardControl ()
    {
        if ( !isIntroSequenceCompleteRef.current )
            return;

        if ( isCraneKeyboardControlEnabled )
        {
            releaseCraneKeyboardControl();
            return;
        }

        takeCraneKeyboardControl();
    }

    function releaseCraneKeyboardControl ()
    {
        trackEvent( "crane_control_click", {
            action: "release_control"
        } );
        setIsCraneKeyboardControlEnabled( false );
    }

    function takeBulldozerKeyboardControl ()
    {
        trackEvent( "bulldozer_control_click", {
            action: "take_control"
        } );
        stopIntroSequence();
        setIsCraneKeyboardControlEnabled( false );
        setIsBulldozerKeyboardControlEnabled( true );
    }

    function toggleBulldozerKeyboardControl ()
    {
        if ( !isIntroSequenceCompleteRef.current )
            return;

        if ( isBulldozerKeyboardControlEnabled )
        {
            releaseBulldozerKeyboardControl();
            return;
        }

        takeBulldozerKeyboardControl();
    }

    function releaseBulldozerKeyboardControl ()
    {
        trackEvent( "bulldozer_control_click", {
            action: "release_control"
        } );
        setIsBulldozerKeyboardControlEnabled( false );
    }

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

    useFrame( () =>
    {
        if ( isIntroSequenceComplete )
            return;

        const isComplete = craneIntroRef.current.active === false
            && bulldozerIntroRef.current.active === false;

        if ( isComplete )
        {
            isIntroSequenceCompleteRef.current = true;
            setIsIntroSequenceComplete( true );
        }
    } );

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
            // minAzimuthAngle={ -Math.PI / 4 }
            // maxAzimuthAngle={ Math.PI / 4 }
        />

        <hemisphereLight args={ [ "#fff1d6", "#2b2521", 0.82 ] } />
        <directionalLight
            color={ "#ffd8a8" }
            intensity={ 1.85 }
            position={ [ -3.5, 5, 4 ] }
            castShadow
            shadow-mapSize={ [ 1024, 1024 ] }
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
            intensity={ 15 }
            distance={ 8 }
            position={ [ 3.5, 2.3, -2.8 ] }
        />
        <ambientLight
            intensity={ 0.7 }
            color={ '#fff1d6' }
        />
        <SignSpotLight />

        <Suspense fallback={ null }>
            <KeyboardControls map={ craneKeyboardMap }>
                <Physics paused={ physicsPaused }>
                    <ConstructionAssets />
                    <Crane
                        controlEnabled={ isIntroSequenceComplete }
                        controlHintVisible={ isIntroSequenceComplete && !isCraneKeyboardControlEnabled }
                        hookRef={ hookRef }
                        introRef={ craneIntroRef }
                        keyboardControlEnabled={ isCraneKeyboardControlEnabled }
                        onToggleControl={ toggleCraneKeyboardControl }
                    />
                    <Bulldozer
                        controlEnabled={ isIntroSequenceComplete }
                        controlHintVisible={ isIntroSequenceComplete && !isBulldozerKeyboardControlEnabled }
                        initialPosition={ bulldozerInitialPose.position }
                        initialRotation={ bulldozerInitialPose.rotation }
                        introRef={ bulldozerIntroRef }
                        keyboardControlEnabled={ isBulldozerKeyboardControlEnabled }
                        onToggleControl={ toggleBulldozerKeyboardControl }
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
                    <ClickableSign
                        label="CV"
                        eventName="cv_sign_click"
                        url="/CV/Natthan-GUILLOT_CV.pdf"
                        position={ [ -0.96, 0.35, 5.5 ] }
                        rotation={ [ 0, degToRad( 6 ), 0 ] }
                        width={ 0.94 }
                        height={ 0.78 }
                        cursorPosition={ [ -0.08, -0.13, 0.34 ] }
                    />

                    <ClickableSign
                        label="PORTFOLIO"
                        eventName="portfolio_sign_click"
                        url="https://old-portfolio.nguillot.fr"
                        position={ [ 0.5, 0.35, 5.46 ] }
                        rotation={ [ 0, degToRad( -5 ), 0 ] }
                        width={ 0.94 }
                        height={ 0.78 }
                        cursorPosition={ [ -0.14, -0.13, 0.34 ] }
                    />
                </Physics>
            </KeyboardControls>
        </Suspense>
        <BloomEffect />
    </>;
}
