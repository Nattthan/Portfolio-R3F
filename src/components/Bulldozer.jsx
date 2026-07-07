import { useGLTF, useKeyboardControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { RigidBody } from "@react-three/rapier";
import { useLayoutEffect, useMemo, useRef } from "react";
import exhaustFragmentShader from "../shaders/exhaust/fragment.glsl";
import exhaustVertexShader from "../shaders/exhaust/vertex.glsl";
import * as THREE from "three";
import Cursor from "./Cursor";

const modelPath = "./models/bulldozer.glb";
const bulldozerNodeName = "bulldozer";

const moveSpeed = 1.45;
const turnSpeed = 1.75;

const forward = new THREE.Vector3( -1, 0, 0 );
const zeroAngularVelocity = { x: 0, y: 0, z: 0 };

function getExhaustTransform ( object )
{
    const box = new THREE.Box3().setFromObject( object );
    const size = box.getSize( new THREE.Vector3() );
    const center = box.getCenter( new THREE.Vector3() );

    return {
        position: [
            box.max.x,
            center.y - size.y * 0.10,
            center.z
        ]
    };
}

function getControlHintTransform ( object )
{
    const box = new THREE.Box3().setFromObject( object );
    const size = box.getSize( new THREE.Vector3() );
    const center = box.getCenter( new THREE.Vector3() );

    return {
        cursorPosition: [
            center.x ,
            box.max.y + size.y * 0.4,
            center.z
        ],
        hitboxPosition: center.toArray(),
        hitboxSize: [
            size.x * 1.15,
            size.y * 1.35,
            size.z * 1.15
        ]
    };
}

function createExhaustGeometry ()
{
    const count = 20;
    const positions = new Float32Array( count * 3 );
    const alphas = new Float32Array( count );
    const progresses = new Float32Array( count );
    const seeds = new Float32Array( count );
    const sizes = new Float32Array( count );
    const geometry = new THREE.BufferGeometry();
    const particles = [];

    for ( let i = 0; i < count; i++ )
    {
        const stride = i * 3;
        const seed = ( i * 37.137 ) % 97.31;
        const particle = createExhaustParticle( seed, true );

        particles.push( particle );
        positions[ stride ] = particle.position.x;
        positions[ stride + 1 ] = particle.position.y;
        positions[ stride + 2 ] = particle.position.z;
        alphas[ i ] = particle.alpha;
        progresses[ i ] = particle.progress;
        seeds[ i ] = seed;
        sizes[ i ] = particle.size;
    }

    geometry.setAttribute( "position", new THREE.BufferAttribute( positions, 3 ) );
    geometry.setAttribute( "aAlpha", new THREE.BufferAttribute( alphas, 1 ) );
    geometry.setAttribute( "aProgress", new THREE.BufferAttribute( progresses, 1 ) );
    geometry.setAttribute( "aSeed", new THREE.BufferAttribute( seeds, 1 ) );
    geometry.setAttribute( "aSize", new THREE.BufferAttribute( sizes, 1 ) );

    return {
        geometry,
        particles
    };
}

function createExhaustParticle ( seed, randomizeLife = false )
{
    const maxLife = THREE.MathUtils.lerp( 0.8, 1.35, randomFromSeed( seed + 1.7 ) );
    const particle = {
        alpha: 0,
        baseSize: THREE.MathUtils.lerp( 32, 72, randomFromSeed( seed + 17.4 ) ),
        driftY: THREE.MathUtils.lerp( -0.36, 0.36, randomFromSeed( seed + 4.1 ) ),
        driftZ: THREE.MathUtils.lerp( -0.42, 0.42, randomFromSeed( seed + 8.3 ) ),
        life: randomizeLife ? maxLife * randomFromSeed( seed + 12.9 ) : 0,
        maxLife,
        position: new THREE.Vector3(),
        progress: 0,
        respawnCount: 0,
        seed,
        size: 0
    };

    updateExhaustParticle( particle, 0, 0.7 );

    return particle;
}

function randomFromSeed ( seed )
{
    return THREE.MathUtils.euclideanModulo(
        Math.sin( seed * 12.9898 ) * 43758.5453,
        1
    );
}

function resetExhaustParticle ( particle )
{
    particle.life = 0;
    particle.respawnCount++;
    particle.maxLife = THREE.MathUtils.lerp(
        0.8,
        1.35,
        randomFromSeed( particle.seed + particle.respawnCount * 13.7 )
    );
    particle.driftY = THREE.MathUtils.lerp(
        -0.36,
        0.36,
        randomFromSeed( particle.seed + particle.maxLife * 21.1 )
    );
    particle.driftZ = THREE.MathUtils.lerp(
        -0.42,
        0.42,
        randomFromSeed( particle.seed + particle.maxLife * 34.7 )
    );
    particle.baseSize = THREE.MathUtils.lerp(
        32,
        72,
        randomFromSeed( particle.seed + particle.maxLife * 55.3 )
    );
}

function updateExhaustParticle ( particle, delta, activity )
{
    particle.life += delta * THREE.MathUtils.lerp( 0.5, 0.9, activity );

    if ( particle.life >= particle.maxLife )
        resetExhaustParticle( particle );

    const progress = THREE.MathUtils.clamp( particle.life / particle.maxLife, 0, 1 );
    const easeOut = 1 - Math.pow( 1 - progress, 2 );
    const dissolve = 1 - THREE.MathUtils.smoothstep( progress, 0.3, 0.64 );
    const birth = THREE.MathUtils.smoothstep( progress, 0, 0.12 );
    const flicker = 0.82 + Math.sin( particle.life * 14 + particle.seed ) * 0.18;

    particle.progress = progress;
    particle.alpha = birth * dissolve * flicker;
    particle.position.set(
        easeOut * THREE.MathUtils.lerp( 0.18, 1.08, activity ),
        particle.driftY * easeOut + Math.sin( particle.life * 6 + particle.seed ) * 0.04,
        particle.driftZ * easeOut + Math.cos( particle.life * 5 + particle.seed ) * 0.05
    );
    particle.size = particle.baseSize * THREE.MathUtils.lerp( 0.75, 1.95, easeOut );
}

function updateExhaustSystem ( exhaustSystem, delta, activity )
{
    const positionAttribute = exhaustSystem.geometry.getAttribute( "position" );
    const alphaAttribute = exhaustSystem.geometry.getAttribute( "aAlpha" );
    const progressAttribute = exhaustSystem.geometry.getAttribute( "aProgress" );
    const sizeAttribute = exhaustSystem.geometry.getAttribute( "aSize" );

    exhaustSystem.particles.forEach( ( particle, index ) =>
    {
        updateExhaustParticle( particle, delta, activity );

        positionAttribute.setXYZ(
            index,
            particle.position.x,
            particle.position.y,
            particle.position.z
        );
        alphaAttribute.setX( index, particle.alpha );
        progressAttribute.setX( index, particle.progress );
        sizeAttribute.setX( index, particle.size );
    } );

    positionAttribute.needsUpdate = true;
    alphaAttribute.needsUpdate = true;
    progressAttribute.needsUpdate = true;
    sizeAttribute.needsUpdate = true;
}

function cloneForRigidBody ( object )
{
    const clone = object.clone( true );
    const position = object.position.clone();
    const rotation = object.rotation.toArray().slice( 0, 3 );

    clone.position.set( 0, 0, 0 );
    clone.rotation.set( 0, 0, 0 );
    clone.scale.copy( object.scale );

    return {
        object: clone,
        position,
        rotation
    };
}

function prepareModelObject ( object )
{
    object.traverse( ( child ) =>
    {
        if ( !child.isMesh )
            return;

        child.castShadow = true;
        child.receiveShadow = true;

        const materials = Array.isArray( child.material )
            ? child.material
            : [ child.material ];

        materials.forEach( ( material ) =>
        {
            if ( material )
                material.envMapIntensity = 0.8;
        } );
    } );
}

export default function Bulldozer ( {
    introRef,
    keyboardControlEnabled = false,
    controlEnabled = false,
    controlHintVisible = false,
    onToggleControl
} )
{
    const model = useGLTF( modelPath );
    const [ , getKeyboardState ] = useKeyboardControls();
    const body = useRef();
    const exhaustGroup = useRef();
    const controlHintGroup = useRef();

    const bulldozer = useMemo( () =>
    {
        const source = model.scene.getObjectByName( bulldozerNodeName )
            ?? model.scene.children[ 0 ]
            ?? model.scene;

        return cloneForRigidBody( source );
    }, [ model.scene ] );

    const direction = useRef( new THREE.Vector3() );
    const bodyRotation = useRef( new THREE.Quaternion() );
    const exhaustActivity = useRef( 0.58 );
    const exhaustUniforms = useMemo( () =>
    {
        return {
            uActivity: new THREE.Uniform( exhaustActivity.current ),
            uDepth: new THREE.Uniform( 0.7 ),
            uHeight: new THREE.Uniform( 0.48 ),
            uLength: new THREE.Uniform( 1.35 ),
            uOpacity: new THREE.Uniform( 0.2 ),
            uTime: new THREE.Uniform( 0 )
        };
    }, [] );
    const exhaustSystem = useMemo( createExhaustGeometry, [] );
    const exhaustTransform = useMemo( () =>
    {
        bulldozer.object.updateMatrixWorld( true );

        return getExhaustTransform( bulldozer.object );
    }, [ bulldozer.object ] );
    const controlHintTransform = useMemo( () =>
    {
        bulldozer.object.updateMatrixWorld( true );

        return getControlHintTransform( bulldozer.object );
    }, [ bulldozer.object ] );

    useLayoutEffect( () =>
    {
        prepareModelObject( bulldozer.object );
    }, [ bulldozer.object ] );

    useFrame( ( state, delta ) =>
    {
        const introCommand = !keyboardControlEnabled && introRef?.current?.active
            ? introRef.current
            : null;
        const keyboardState = keyboardControlEnabled
            ? getKeyboardState()
            : {};
        const keyboardTurnDirection = ( keyboardState.bulldozerLeft ? 1 : 0 )
            - ( keyboardState.bulldozerRight ? 1 : 0 );
        const keyboardMoveDirection = ( keyboardState.bulldozerForward ? 1 : 0 )
            - ( keyboardState.bulldozerBackward ? 1 : 0 );
        const turnDirection = keyboardControlEnabled
            ? keyboardTurnDirection
            : introCommand?.turnDirection ?? 0;
        const moveDirection = keyboardControlEnabled
            ? keyboardMoveDirection
            : introCommand?.moveDirection ?? 0;
        const currentMoveSpeed = introCommand?.speed ?? moveSpeed;
        const targetActivity = keyboardControlEnabled
            ? 0.78 + Number( turnDirection !== 0 || moveDirection !== 0 ) * 0.36
            : introCommand?.activity ?? 0.58;

        exhaustActivity.current = THREE.MathUtils.damp(
            exhaustActivity.current,
            targetActivity,
            4,
            delta
        );
        exhaustUniforms.uActivity.value = exhaustActivity.current;
        exhaustUniforms.uTime.value = state.clock.elapsedTime;
        updateExhaustSystem(
            exhaustSystem,
            Math.min( delta, 0.04 ),
            exhaustActivity.current
        );

        if ( !body.current )
            return;

        const translation = body.current.translation();
        const rotation = body.current.rotation();

        bodyRotation.current.set(
            rotation.x,
            rotation.y,
            rotation.z,
            rotation.w
        );

        if ( exhaustGroup.current )
        {
            exhaustGroup.current.position.set(
                translation.x,
                translation.y,
                translation.z
            );
            exhaustGroup.current.quaternion.copy( bodyRotation.current );
        }

        if ( controlHintGroup.current )
        {
            controlHintGroup.current.position.set(
                translation.x,
                translation.y,
                translation.z
            );
        }

        const currentVelocity = body.current.linvel();
        const targetAngularVelocity = turnDirection * turnSpeed;

        body.current.setAngvel(
            targetAngularVelocity === 0
                ? zeroAngularVelocity
                : { x: 0, y: targetAngularVelocity, z: 0 },
            true
        );

        if ( moveDirection !== 0 )
        {
            direction.current
                .copy( forward )
                .applyQuaternion( bodyRotation.current );

            body.current.setLinvel(
                {
                    x: direction.current.x * moveDirection * currentMoveSpeed,
                    y: currentVelocity.y,
                    z: direction.current.z * moveDirection * currentMoveSpeed
                },
                true
            );
            return;
        }

        body.current.setLinvel(
            {
                x: 0,
                y: currentVelocity.y,
                z: 0
            },
            true
        );
    } );

    function takeControlFromPointer ( event )
    {
        event.stopPropagation();

        if ( !controlEnabled )
            return;

        resetPointerCursor();
        onToggleControl?.();
    }

    function showPointerCursor ()
    {
        if ( !controlEnabled )
            return;

        document.body.style.cursor = "pointer";
    }

    function resetPointerCursor ()
    {
        document.body.style.cursor = "default";
    }

    return <>
        <RigidBody
            ref={ body }
            name="bulldozer"
            type="dynamic"
            colliders="hull"
            canSleep={ false }
            ccd
            enabledRotations={ [ false, true, false ] }
            linearDamping={ 3.8 }
            angularDamping={ 5.5 }
            mass={ 90 }
            position={ bulldozer.position.toArray() }
            rotation={ bulldozer.rotation }
            friction={ 1.2 }
        >
            <primitive object={ bulldozer.object } />
        </RigidBody>

        <group
            ref={ exhaustGroup }
            position={ bulldozer.position.toArray() }
            rotation={ bulldozer.rotation }
        >
            <points
                position={ exhaustTransform.position }
                renderOrder={ 3 }
            >
                <primitive object={ exhaustSystem.geometry } attach="geometry" />
                <shaderMaterial
                    blending={ THREE.NormalBlending }
                    depthWrite={ false }
                    fragmentShader={ exhaustFragmentShader }
                    transparent
                    uniforms={ exhaustUniforms }
                    vertexShader={ exhaustVertexShader }
                />
            </points>
        </group>

        <group
            ref={ controlHintGroup }
            position={ bulldozer.position.toArray() }
        >
            <mesh
                position={ controlHintTransform.hitboxPosition }
                onClick={ takeControlFromPointer }
                onPointerOver={ showPointerCursor }
                onPointerLeave={ resetPointerCursor }
            >
                <boxGeometry args={ controlHintTransform.hitboxSize } />
                <meshBasicMaterial
                    transparent
                    opacity={ 0 }
                    depthWrite={ false }
                    colorWrite={ false }
                />
            </mesh>
            <Cursor
                label="Take bulldozer control"
                onClick={ onToggleControl }
                position={ controlHintTransform.cursorPosition }
                screenRotation={ 160 }
                size={ 0.1 }
                transform={ false }
                visible={ controlHintVisible }
            />
        </group>
    </>;
}

useGLTF.preload( modelPath );
