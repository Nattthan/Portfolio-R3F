import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import { useFixedJoint } from "@react-three/rapier";
import * as THREE from "three";

const yaw = {
    idle: -0.3,
    pickup: -0.75,
    drop: 0.62
};

const hoist = {
    high: -0.6,
    low: 0.1,
    deposit: 0.08
};

const timing = {
    turnToPickup: 2.2,
    lowerHook: 2.35,
    pauseAfterAttach: 0.35,
    liftLetter: 1.7,
    turnToDrop: 4.5,
    lowerLetter: 2.5,
    leaveAfterRelease: 4.35
};

const hookAttachLocalY = -0.06;
const letterAttachLocalY = 0.44;
const attachDistance = 0.42;
const releaseFloorY = 0.78;
const zero = { x: 0, y: 0, z: 0 };

function getSmoothProgress ( elapsed, duration )
{
    const progress = THREE.MathUtils.clamp( elapsed / duration, 0, 1 );

    return THREE.MathUtils.smoothstep( progress, 0, 1 );
}

function mix ( start, end, progress )
{
    return THREE.MathUtils.lerp( start, end, progress );
}

function makeCommand ( {
    active = true,
    boomYaw = yaw.idle,
    canRelease = false,
    hoistOffset = 0,
    shouldAttach = false
} )
{
    return {
        active,
        boomYaw,
        canRelease,
        hoistOffset,
        shouldAttach
    };
}

function getCraneCommand ( {
    attachedElapsed,
    hasReleased,
    introElapsed,
    isAttached,
    releasedElapsed
} )
{
    if ( introElapsed < timing.turnToPickup )
    {
        const progress = getSmoothProgress( introElapsed, timing.turnToPickup );

        return makeCommand( {
            boomYaw: mix( yaw.idle, yaw.pickup, progress ),
            hoistOffset: hoist.high
        } );
    }

    const lowerHookStart = timing.turnToPickup;
    const lowerHookEnd = lowerHookStart + timing.lowerHook;

    if ( introElapsed < lowerHookEnd )
    {
        const progress = getSmoothProgress( introElapsed - lowerHookStart, timing.lowerHook );

        return makeCommand( {
            boomYaw: yaw.pickup,
            hoistOffset: mix( hoist.high, hoist.low, progress )
        } );
    }

    if ( !isAttached && !hasReleased )
    {
        return makeCommand( {
            boomYaw: yaw.pickup,
            hoistOffset: hoist.low,
            shouldAttach: true
        } );
    }

    if ( isAttached )
        return getAttachedCraneCommand( attachedElapsed );

    if ( hasReleased )
        return getReleasedCraneCommand( releasedElapsed );

    return makeCommand( {
        active: false
    } );
}

function getAttachedCraneCommand ( elapsed )
{
    if ( elapsed < timing.pauseAfterAttach )
    {
        return makeCommand( {
            boomYaw: yaw.pickup,
            hoistOffset: hoist.low,
            shouldAttach: true
        } );
    }

    const liftStart = timing.pauseAfterAttach;
    const liftEnd = liftStart + timing.liftLetter;

    if ( elapsed < liftEnd )
    {
        const progress = getSmoothProgress( elapsed - liftStart, timing.liftLetter );

        return makeCommand( {
            boomYaw: yaw.pickup,
            hoistOffset: mix( hoist.low, hoist.high, progress ),
            shouldAttach: true
        } );
    }

    const turnStart = liftEnd;
    const turnEnd = turnStart + timing.turnToDrop;

    if ( elapsed < turnEnd )
    {
        const progress = getSmoothProgress( elapsed - turnStart, timing.turnToDrop );

        return makeCommand( {
            boomYaw: mix( yaw.pickup, yaw.drop, progress ),
            hoistOffset: hoist.high,
            shouldAttach: true
        } );
    }

    const lowerStart = turnEnd;
    const lowerEnd = lowerStart + timing.lowerLetter;

    if ( elapsed < lowerEnd )
    {
        const progress = getSmoothProgress( elapsed - lowerStart, timing.lowerLetter );

        return makeCommand( {
            boomYaw: yaw.drop,
            canRelease: true,
            hoistOffset: mix( hoist.high, hoist.deposit, progress ),
            shouldAttach: true
        } );
    }

    return makeCommand( {
        boomYaw: yaw.drop,
        canRelease: true,
        hoistOffset: hoist.deposit,
        shouldAttach: true
    } );
}

function getReleasedCraneCommand ( elapsed )
{
    if ( elapsed < timing.leaveAfterRelease )
    {
        const progress = getSmoothProgress( elapsed, timing.leaveAfterRelease );

        return makeCommand( {
            boomYaw: mix( yaw.drop, yaw.idle, progress ),
            hoistOffset: mix( hoist.deposit, 0, progress )
        } );
    }

    return makeCommand( {
        active: false,
        boomYaw: yaw.idle
    } );
}

function HookLetterJoint ( {
    frames,
    hookRef,
    letterRef
} )
{
    useFixedJoint( hookRef, letterRef, [
        frames.hook.position,
        frames.hook.rotation,
        frames.letter.position,
        frames.letter.rotation
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

function getFallbackContactPoint ( hookBody )
{
    const hookTranslation = hookBody.translation();

    return [
        hookTranslation.x,
        hookTranslation.y + hookAttachLocalY,
        hookTranslation.z
    ];
}

function getFlatJointFramesAtContact ( hookBody, letterBody, contactPoint )
{
    const hookWorldRotation = getBodyQuaternion( hookBody );

    return {
        hook: {
            position: getBodyLocalPoint( hookBody, contactPoint ),
            rotation: getBodyLocalRotation( hookBody, hookWorldRotation )
        },
        letter: {
            position: getBodyLocalPoint( letterBody, contactPoint ),
            rotation: getBodyLocalRotation( letterBody, hookWorldRotation )
        }
    };
}

function getAttachDistance ( hookBody, letterBody )
{
    const hookTranslation = hookBody.translation();
    const letterTranslation = letterBody.translation();
    const dx = hookTranslation.x - letterTranslation.x;
    const dy = hookTranslation.y + hookAttachLocalY - letterTranslation.y - letterAttachLocalY;
    const dz = hookTranslation.z - letterTranslation.z;

    return Math.sqrt( dx * dx + dy * dy + dz * dz );
}

function applyCraneCommand ( craneIntroRef, command )
{
    if ( !craneIntroRef.current )
        return;

    craneIntroRef.current.active = command.active;
    craneIntroRef.current.boomYaw = command.boomYaw;
    craneIntroRef.current.hoistOffset = command.hoistOffset;
}

export default function CraneIntroSequence ( {
    craneIntroRef,
    hookRef,
    introLetterCollisionRef,
    letterRef
} )
{
    const startTime = useRef( null );
    const attachedTime = useRef( null );
    const releasedTime = useRef( null );
    const hasReleasedLetter = useRef( false );
    const isAttached = useRef( false );
    const [ jointFrames, setJointFrames ] = useState( null );

    useFrame( ( state ) =>
    {
        const now = state.clock.elapsedTime;

        if ( startTime.current === null )
            startTime.current = now;

        const command = getCraneCommand( {
            attachedElapsed: getElapsedSince( now, attachedTime.current ),
            hasReleased: hasReleasedLetter.current,
            introElapsed: now - startTime.current,
            isAttached: isAttached.current,
            releasedElapsed: getElapsedSince( now, releasedTime.current )
        } );

        applyCraneCommand( craneIntroRef, command );

        if ( !hookRef.current || !letterRef.current )
            return;

        if ( command.shouldAttach )
            tryAttachLetter( now );

        if ( command.canRelease )
            tryReleaseLetter( now );
    } );

    function tryAttachLetter ( now )
    {
        if ( isAttached.current || hasReleasedLetter.current )
            return;

        const collision = introLetterCollisionRef.current;
        const distance = getAttachDistance( hookRef.current, letterRef.current );
        const canAttach = collision?.isTouchingHook || distance <= attachDistance;

        if ( !canAttach )
            return;

        const contactPoint = collision?.isTouchingHook && collision.hookContactPoint
            ? collision.hookContactPoint
            : getFallbackContactPoint( hookRef.current );

        setJointFrames(
            getFlatJointFramesAtContact( hookRef.current, letterRef.current, contactPoint )
        );

        isAttached.current = true;
        attachedTime.current = now;

        if ( collision )
            collision.isTouchingFloor = false;
    }

    function tryReleaseLetter ( now )
    {
        if ( !isAttached.current )
            return;

        const collision = introLetterCollisionRef.current;
        const letterTranslation = letterRef.current.translation();
        const isTouchingGround = collision?.isTouchingFloor
            && letterTranslation.y <= releaseFloorY;

        if ( !isTouchingGround )
            return;

        letterRef.current.setLinvel( zero, true );
        letterRef.current.setAngvel( zero, true );

        isAttached.current = false;
        hasReleasedLetter.current = true;
        releasedTime.current = now;
        setJointFrames( null );
    }

    return isAttached.current && jointFrames
        ? <HookLetterJoint
            frames={ jointFrames }
            hookRef={ hookRef }
            letterRef={ letterRef }
        />
        : null;
}

function getElapsedSince ( now, start )
{
    if ( start === null )
        return 0;

    return now - start;
}
