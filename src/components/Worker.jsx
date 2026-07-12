import { useAnimations, useGLTF } from "@react-three/drei";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { LoopOnce } from "three";
import WorkerSpeechBubble from "./WorkerSpeechBubble";

let hasLoggedWorkerCredit = false;

function prepareModelObject ( object )
{
    object.traverse( ( child ) =>
    {
        if ( !child.isMesh )
            return;

        child.castShadow = true;
        // child.receiveShadow = true;
    } );
}



export default function Worker ( { position = [ 0, 0, 0 ], rotation = [ 0, 0, 0 ], size = 0.35 } )
{
    const [ isCopied, setIsCopied ] = useState( false );
    const [ isHovered, setIsHovered ] = useState( false );

    const model = useRef();
    const worker = useGLTF( './models/Worker.glb' );

    const { actions, mixer } = useAnimations( worker.animations, model );

    useEffect( () =>
    {
        if ( hasLoggedWorkerCredit )
            return;

        console.log( "Worker by Quaternius [CC-BY] via Poly Pizza" );
        hasLoggedWorkerCredit = true;
    }, [] );

    function handlePointerHover ( event )
    {
        event.stopPropagation();
        setIsHovered( true );
        document.body.style.cursor = "pointer";
    }

    function handlePointerLeave ( event )
    {
        event.stopPropagation();
        setIsHovered( false );
        setIsCopied( false );
        document.body.style.cursor = "default";
    }

    async function handleClick ( event )
    {
        event.stopPropagation();
        await navigator.clipboard.writeText( 'elodie.moussin@se.com' );
        setIsCopied( true );
    }

    useLayoutEffect( () =>
    {
        prepareModelObject( worker.scene );
    }, [ worker.scene ] );

    useEffect( () =>
    {
        const idle = actions[ "CharacterArmature|Idle" ];
        const wave = actions[ "CharacterArmature|Wave" ];

        if ( !idle || !wave )
            return;

        idle.reset();
        idle.play();
        wave.clampWhenFinished = true;

        wave.setLoop( LoopOnce, 1 );

        const playWave = () =>
        {
            wave.reset();
            wave.crossFadeFrom( idle, 0.5, false );
            wave.play();
        };

        const intervalId = setInterval( playWave, 10000 );

        const handleFinished = ( event ) =>
        {
            if ( event.action === wave )
            {
                idle.reset();
                idle.crossFadeFrom( wave, 0.5, false );
                idle.play();
            }
        };

        mixer.addEventListener( 'finished', handleFinished );

        return () =>
        {
            clearInterval( intervalId );
            mixer.removeEventListener( "finished", handleFinished );
            wave.stop();
            idle.stop();
        };

    }, [ actions, mixer ] );

    return (
        <group ref={ model } position={ position } rotation={ rotation } scale={ size }>
            <primitive object={ worker.scene } />

            <mesh
                position={ [ 0, 1, 0 ] }
                onPointerOver={ handlePointerHover }
                onPointerLeave={ handlePointerLeave }
                onClick={ handleClick }
            >
                <boxGeometry args={ [ 1.4, 2.2, 1 ] } />
                <meshBasicMaterial transparent opacity={ 0 } depthWrite={ false } />
            </mesh>

            <WorkerSpeechBubble visible={isHovered} copied={isCopied} />

            <pointLight
                color="#fff1d6"
                intensity={ 2.4 }
                distance={ 3 }
                decay={ 2 }
                position={ [ 0, 2.4, 0.8 ] }
                castShadow={ false }
            />
        </group>
    );
}
