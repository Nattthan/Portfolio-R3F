import { useGLTF, useKeyboardControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { RigidBody, useFixedJoint, useRopeJoint } from "@react-three/rapier";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

const cranePosition = new THREE.Vector3( -2, 0, 0 );
const craneRotation = [ 0, -Math.PI / 6, 0 ];
const craneScale = 0.25;
const ropeLength = 1;
const hookMass = 12;

const manualYawSpeed = 0.75;
const manualHoistSpeed = 0.35;
const minManualYaw = -Infinity;
const maxManualYaw = Infinity;
const minManualHoist = -0.8;
const maxManualHoist = 1;
const idleHomeYaw = -0.3;
const idleHomeHoistOffset = 0;
const idleHoistAmplitude = 0.2;
const idleHoistSpeed = 1.0;
const returnToIdleHoistOffset = -0.6;
const returnToIdleLiftDuration = 1.4;
const returnToIdleTurnDuration = 2.4;
const returnToIdleSettleDuration = 1.2;
const hookFlatSurfaceLocalY = -0.16;

const up = new THREE.Vector3( 0, 1, 0 );
const down = new THREE.Vector3( 0, -1, 0 );
const zero = { x: 0, y: 0, z: 0 };

function ManualGrabJoint ( {
    frames,
    grabbedBodyRef,
    hookBodyRef
} )
{
    useFixedJoint( hookBodyRef, grabbedBodyRef, [
        frames.hook.position,
        frames.hook.rotation,
        frames.grabbed.position,
        frames.grabbed.rotation
    ] );

    return null;
}

function getBodyLocalPoint ( body, worldPoint )
{
    const translation = body.translation();
    const rotation = body.rotation();
    const inverseRotation = new THREE.Quaternion(
        rotation.x,
        rotation.y,
        rotation.z,
        rotation.w
    ).invert();
    const localPoint = new THREE.Vector3(
        worldPoint[ 0 ] - translation.x,
        worldPoint[ 1 ] - translation.y,
        worldPoint[ 2 ] - translation.z
    );

    localPoint.applyQuaternion( inverseRotation );

    return localPoint.toArray();
}

function getBodyQuaternion ( body )
{
    const rotation = body.rotation();

    return new THREE.Quaternion(
        rotation.x,
        rotation.y,
        rotation.z,
        rotation.w
    );
}

function getBodyLocalRotation ( body, worldRotation )
{
    return getBodyQuaternion( body )
        .invert()
        .multiply( worldRotation )
        .toArray();
}

function getBodyWorldPoint ( body, localPoint )
{
    const translation = body.translation();
    const worldPoint = new THREE.Vector3( ...localPoint );

    worldPoint.applyQuaternion( getBodyQuaternion( body ) );
    worldPoint.add( new THREE.Vector3( translation.x, translation.y, translation.z ) );

    return worldPoint.toArray();
}

function getFlatJointFramesAtContact ( hookBody, grabbedBody )
{
    const hookWorldRotation = getBodyQuaternion( hookBody );
    const hookLocalPosition = [ 0, hookFlatSurfaceLocalY, 0 ];
    const grabWorldPoint = getBodyWorldPoint( hookBody, hookLocalPosition );

    return {
        hook: {
            position: hookLocalPosition,
            rotation: getBodyLocalRotation( hookBody, hookWorldRotation )
        },
        grabbed: {
            position: getBodyLocalPoint( grabbedBody, grabWorldPoint ),
            rotation: getBodyLocalRotation( grabbedBody, hookWorldRotation )
        }
    };
}

function getContactPointFromCollision ( payload )
{
    const point = payload.manifold?.solverContactPoint( 0 );

    if ( point )
        return [ point.x, point.y, point.z ];

    return null;
}

function canGrabRigidBody ( payload )
{
    const name = payload.other.rigidBodyObject?.name;

    return Boolean( payload.other.rigidBody )
        && name !== "floor"
        && name !== "hook";
}

function getSmoothProgress ( elapsed, duration )
{
    const progress = THREE.MathUtils.clamp( elapsed / duration, 0, 1 );

    return THREE.MathUtils.smoothstep( progress, 0, 1 );
}

function mix ( start, end, progress )
{
    return THREE.MathUtils.lerp( start, end, progress );
}

export default function Crane ( {
    hookRef,
    introRef,
    keyboardControlEnabled = false
} )
{
    const model = useGLTF( "./models/Crane.glb" );
    const hook = model.scene.getObjectByName( "Hook" );
    const anchor = model.scene.getObjectByName( "Cable_Anchor" );
    const rotativePart = model.scene.getObjectByName( "Crane_Top" );
    const [ , getKeyboardState ] = useKeyboardControls();

    const cable = useRef();
    const anchorBody = useRef();
    const hookBody = useRef();
    const grabbedBodyRef = useRef();

    const anchorVisualWorld = useRef( new THREE.Vector3() );
    const anchorConstraintWorld = useRef( new THREE.Vector3() );
    const hookWorld = useRef( new THREE.Vector3() );
    const cableDirection = useRef( new THREE.Vector3() );

    const wasGrabPressed = useRef( false );
    const wasReleasePressed = useRef( false );
    const wasKeyboardControlEnabled = useRef( keyboardControlEnabled );
    const manualCrane = useRef( {
        hasStarted: false,
        hoistOffset: -0.25,
        yaw: 0
    } );
    const smoothCrane = useRef( {
        hoistOffset: introRef?.current?.hoistOffset ?? -0.25
    } );
    const idleMotion = useRef( {
        hasStarted: false,
        startHoistOffset: -0.14,
        startTime: 0,
        startYaw: 0
    } );
    const returnToIdle = useRef( {
        active: false,
        hasStarted: false,
        startHoistOffset: 0,
        startTime: 0,
        startYaw: 0
    } );
    const lastTouchedBody = useRef( null );
    const resetFrames = useRef( 6 );

    const [ manualGrab, setManualGrab ] = useState( null );

    const setHookBody = useCallback( ( body ) =>
    {
        hookBody.current = body;

        if ( hookRef )
            hookRef.current = body;
    }, [ hookRef ] );

    const hookVisual = useMemo( () =>
    {
        const clone = hook.clone();

        clone.position.set( 0, 0, 0 );
        clone.rotation.set( 0, 0, 0 );
        clone.scale.set( 1, 1, 1 );

        return clone;
    }, [ hook ] );

    const anchorStartPosition = useMemo( () =>
    {
        const modelMatrix = new THREE.Matrix4().compose(
            cranePosition,
            new THREE.Quaternion().setFromEuler( new THREE.Euler( ...craneRotation ) ),
            new THREE.Vector3( craneScale, craneScale, craneScale )
        );

        model.scene.updateMatrixWorld( true );

        return anchor
            .getWorldPosition( new THREE.Vector3() )
            .applyMatrix4( modelMatrix );
    }, [ anchor, model.scene ] );

    const hookStartPosition = useMemo( () =>
    {
        return anchorStartPosition
            .clone()
            .addScaledVector( down, ropeLength );
    }, [ anchorStartPosition ] );

    useLayoutEffect( () =>
    {
        hook.visible = false;

        model.scene.traverse( ( child ) =>
        {
            if ( !child.isMesh )
                return;

            child.castShadow = true;
            child.receiveShadow = true;

            if ( child.material )
                child.material.envMapIntensity = 0.8;
        } );
    }, [ hook, model.scene ] );

    useRopeJoint( anchorBody, hookBody, [
        [ 0, 0, 0 ],
        [ 0, 0, 0 ],
        ropeLength
    ] );

    useEffect( () =>
    {
        const queueReset = () =>
        {
            resetFrames.current = 6;
        };

        const handleVisibilityChange = () =>
        {
            if ( document.visibilityState === "visible" )
                queueReset();
        };

        window.addEventListener( "focus", queueReset );
        document.addEventListener( "visibilitychange", handleVisibilityChange );

        return () =>
        {
            window.removeEventListener( "focus", queueReset );
            document.removeEventListener( "visibilitychange", handleVisibilityChange );
        };
    }, [] );

    useEffect( () =>
    {
        if ( keyboardControlEnabled )
        {
            returnToIdle.current.active = false;
            returnToIdle.current.hasStarted = false;
            wasKeyboardControlEnabled.current = true;
            return;
        }

        if ( !wasKeyboardControlEnabled.current )
            return;

        wasGrabPressed.current = false;
        wasReleasePressed.current = false;
        manualCrane.current.hasStarted = false;
        idleMotion.current.hasStarted = false;
        returnToIdle.current.active = true;
        returnToIdle.current.hasStarted = false;
        wasKeyboardControlEnabled.current = false;
        releaseGrabbedBody();
    }, [ keyboardControlEnabled ] );

    useFrame( ( state, delta ) =>
    {
        if ( !anchorBody.current || !hookBody.current || !cable.current )
            return;

        const keyboardState = keyboardControlEnabled
            ? getKeyboardState()
            : {};
        const craneCommand = keyboardControlEnabled
            ? getManualCraneCommand( delta, keyboardState )
            : getAutomaticCraneCommand( state.clock.elapsedTime );
        const smoothHoistOffset = getSmoothHoistOffset( craneCommand.hoistOffset, craneCommand.hoistDamping, delta );

        updateManualGrabInput( keyboardState );
        rotateCraneTop( craneCommand.boomYaw, craneCommand.rotationDamping, delta );
        updateHookAnchor( smoothHoistOffset );
        updateCableMesh();
    } );

    function updateManualGrabInput ( keyboardState )
    {
        if ( !keyboardControlEnabled )
        {
            wasGrabPressed.current = false;
            wasReleasePressed.current = false;
            manualCrane.current.hasStarted = false;
            return;
        }

        const isGrabPressed = Boolean( keyboardState.grab );
        const isReleasePressed = Boolean( keyboardState.release );

        if ( isGrabPressed && !wasGrabPressed.current )
            grabTouchedBody();

        if ( isReleasePressed && !wasReleasePressed.current )
            releaseGrabbedBody();

        wasGrabPressed.current = isGrabPressed;
        wasReleasePressed.current = isReleasePressed;
    }

    function getAutomaticCraneCommand ( elapsedTime )
    {
        const intro = introRef?.current;

        if ( intro?.active )
        {
            idleMotion.current.hasStarted = false;
            returnToIdle.current.active = false;
            returnToIdle.current.hasStarted = false;

            return {
                boomYaw: intro.boomYaw,
                hoistOffset: intro.hoistOffset ?? 0,
                hoistDamping: 7,
                rotationDamping: 1
            };
        }

        if ( returnToIdle.current.active )
            return getReturnToIdleCommand( elapsedTime );

        if ( !idleMotion.current.hasStarted )
        {
            idleMotion.current.hasStarted = true;
            idleMotion.current.startTime = elapsedTime;
            idleMotion.current.startHoistOffset = smoothCrane.current.hoistOffset;
            idleMotion.current.startYaw = rotativePart.rotation.y;
        }

        const idleElapsed = elapsedTime - idleMotion.current.startTime;

        return {
            boomYaw: idleMotion.current.startYaw
                + Math.sin( idleElapsed * 0.45 ) * Math.PI * 0.135,
            hoistOffset: idleMotion.current.startHoistOffset
                + Math.sin( idleElapsed * idleHoistSpeed ) * idleHoistAmplitude * 2,
            hoistDamping: 2,
            rotationDamping: 1.8
        };
    }

    function getReturnToIdleCommand ( elapsedTime )
    {
        if ( !returnToIdle.current.hasStarted )
        {
            returnToIdle.current.hasStarted = true;
            returnToIdle.current.startTime = elapsedTime;
            returnToIdle.current.startHoistOffset = smoothCrane.current.hoistOffset;
            returnToIdle.current.startYaw = rotativePart.rotation.y;
        }

        const elapsed = elapsedTime - returnToIdle.current.startTime;

        if ( elapsed < returnToIdleLiftDuration )
        {
            const progress = getSmoothProgress( elapsed, returnToIdleLiftDuration );

            return {
                boomYaw: returnToIdle.current.startYaw,
                hoistOffset: mix(
                    returnToIdle.current.startHoistOffset,
                    returnToIdleHoistOffset,
                    progress
                ),
                hoistDamping: 3,
                rotationDamping: 3
            };
        }

        const turnElapsed = elapsed - returnToIdleLiftDuration;

        if ( turnElapsed < returnToIdleTurnDuration )
        {
            const progress = getSmoothProgress( turnElapsed, returnToIdleTurnDuration );

            return {
                boomYaw: mix(
                    returnToIdle.current.startYaw,
                    idleHomeYaw,
                    progress
                ),
                hoistOffset: returnToIdleHoistOffset,
                hoistDamping: 3,
                rotationDamping: 2.4
            };
        }

        const settleElapsed = turnElapsed - returnToIdleTurnDuration;

        if ( settleElapsed < returnToIdleSettleDuration )
        {
            const progress = getSmoothProgress( settleElapsed, returnToIdleSettleDuration );

            return {
                boomYaw: idleHomeYaw,
                hoistOffset: mix(
                    returnToIdleHoistOffset,
                    idleHomeHoistOffset,
                    progress
                ),
                hoistDamping: 3,
                rotationDamping: 2.4
            };
        }

        returnToIdle.current.active = false;
        returnToIdle.current.hasStarted = false;
        idleMotion.current.hasStarted = false;

        return {
            boomYaw: idleHomeYaw,
            hoistOffset: idleHomeHoistOffset,
            hoistDamping: 3,
            rotationDamping: 2.4
        };
    }

    function getManualCraneCommand ( delta, keyboardState )
    {
        if ( !manualCrane.current.hasStarted )
        {
            manualCrane.current.hasStarted = true;
            manualCrane.current.yaw = rotativePart.rotation.y;
            manualCrane.current.hoistOffset = introRef?.current?.hoistOffset ?? -0.25;
        }

        if ( keyboardState.left )
            manualCrane.current.yaw += manualYawSpeed * delta;

        if ( keyboardState.right )
            manualCrane.current.yaw -= manualYawSpeed * delta;

        if ( keyboardState.up )
            manualCrane.current.hoistOffset -= manualHoistSpeed * delta;

        if ( keyboardState.down )
            manualCrane.current.hoistOffset += manualHoistSpeed * delta;

        manualCrane.current.yaw = THREE.MathUtils.clamp(
            manualCrane.current.yaw,
            minManualYaw,
            maxManualYaw
        );
        manualCrane.current.hoistOffset = THREE.MathUtils.clamp(
            manualCrane.current.hoistOffset,
            minManualHoist,
            maxManualHoist
        );

        return {
            boomYaw: manualCrane.current.yaw,
            hoistOffset: manualCrane.current.hoistOffset,
            hoistDamping: 10,
            rotationDamping: 10
        };
    }

    function getSmoothHoistOffset ( targetHoistOffset, damping, delta )
    {
        smoothCrane.current.hoistOffset = THREE.MathUtils.damp(
            smoothCrane.current.hoistOffset,
            targetHoistOffset,
            damping,
            delta
        );

        return smoothCrane.current.hoistOffset;
    }

    function rotateCraneTop ( targetYaw, damping, delta )
    {
        rotativePart.rotation.y = THREE.MathUtils.damp(
            rotativePart.rotation.y,
            targetYaw,
            damping,
            delta
        );

        model.scene.updateMatrixWorld( true );
    }

    function updateHookAnchor ( hoistOffset )
    {
        if ( resetFrames.current > 0 )
        {
            resetHookToCableBottom( hoistOffset );
            resetFrames.current--;
            return;
        }

        anchor.getWorldPosition( anchorVisualWorld.current );
        anchorConstraintWorld.current
            .copy( anchorVisualWorld.current )
            .addScaledVector( down, hoistOffset );

        anchorBody.current.setNextKinematicTranslation( anchorConstraintWorld.current );
    }

    function resetHookToCableBottom ( hoistOffset )
    {
        model.scene.updateMatrixWorld( true );
        anchor.getWorldPosition( anchorVisualWorld.current );

        anchorConstraintWorld.current
            .copy( anchorVisualWorld.current )
            .addScaledVector( down, hoistOffset );

        hookWorld.current
            .copy( anchorConstraintWorld.current )
            .addScaledVector( down, ropeLength );

        anchorBody.current.setTranslation( anchorConstraintWorld.current, true );
        anchorBody.current.setNextKinematicTranslation( anchorConstraintWorld.current );
        hookBody.current.setTranslation( hookWorld.current, true );
        hookBody.current.setLinvel( zero, true );
        hookBody.current.setAngvel( zero, true );
    }

    function updateCableMesh ()
    {
        const translation = hookBody.current.translation();

        hookWorld.current.set(
            translation.x,
            translation.y,
            translation.z
        );
        cableDirection.current.subVectors( hookWorld.current, anchorVisualWorld.current );

        const cableLength = cableDirection.current.length();

        cable.current.position
            .copy( anchorVisualWorld.current )
            .addScaledVector( cableDirection.current, 0.5 );

        cable.current.quaternion.setFromUnitVectors(
            up,
            cableDirection.current.normalize()
        );

        cable.current.scale.set( 1, cableLength, 1 );
    }

    function rememberTouchedBody ( payload )
    {
        if ( !canGrabRigidBody( payload ) )
            return;

        lastTouchedBody.current = {
            body: payload.other.rigidBody,
            contactPoint: getContactPointFromCollision( payload )
        };
    }

    function forgetTouchedBody ( payload )
    {
        if ( !lastTouchedBody.current )
            return;

        if ( lastTouchedBody.current.body === payload.other.rigidBody )
            lastTouchedBody.current = null;
    }

    function grabTouchedBody ()
    {
        if ( manualGrab || !lastTouchedBody.current || !hookBody.current )
            return;

        grabbedBodyRef.current = lastTouchedBody.current.body;
        setManualGrab( {
            frames: getFlatJointFramesAtContact(
                hookBody.current,
                grabbedBodyRef.current
            )
        } );
    }

    function releaseGrabbedBody ()
    {
        grabbedBodyRef.current = null;
        setManualGrab( null );
    }

    return <>
        <primitive
            object={ model.scene }
            scale={ craneScale }
            position={ cranePosition }
            rotation={ craneRotation }
        />

        <mesh ref={ cable } castShadow>
            <cylinderGeometry args={ [ 0.015, 0.015, 1, 12 ] } />
            <meshStandardMaterial color={ "#7f7f7f" } />
        </mesh>

        <RigidBody
            ref={ anchorBody }
            type="kinematicPosition"
            colliders={ false }
            position={ anchorStartPosition.toArray() }
        />

        <RigidBody
            ref={ setHookBody }
            name="hook"
            type="dynamic"
            colliders="hull"
            mass={ hookMass }
            linearDamping={ 3.2 }
            angularDamping={ 5.5 }
            ccd
            position={ hookStartPosition.toArray() }
            onCollisionEnter={ rememberTouchedBody }
            onCollisionExit={ forgetTouchedBody }
        >
            <group rotation={ craneRotation } scale={ craneScale }>
                <primitive object={ hookVisual } castShadow />
            </group>
        </RigidBody>

        { manualGrab && <ManualGrabJoint
            frames={ manualGrab.frames }
            grabbedBodyRef={ grabbedBodyRef }
            hookBodyRef={ hookBody }
        /> }
    </>;
}
