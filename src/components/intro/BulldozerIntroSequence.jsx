import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import {
    getLetterPosition,
    underBasePosition,
    underLetterSpacing,
    underText,
    underWordRotation
} from "../letters/letterLayout";

const rLetterIndex = underText.indexOf( "R" );
const rTargetPosition = getLetterPosition(
    rLetterIndex,
    underText,
    underLetterSpacing,
    underBasePosition,
    underWordRotation
);

const timing = {
    startDelay: 1.2,
    accelerate: 1.4,
    maxPush: 17
};

const pushSpeed = {
    end: 0.16,
    start: 0.2,
    cruise: 0.5
};

const slowDownDistance = 0.4;

function getSmoothProgress ( elapsed, duration )
{
    const progress = THREE.MathUtils.clamp( elapsed / duration, 0, 1 );

    return THREE.MathUtils.smoothstep( progress, 0, 1 );
}

function getPushSpeed ( pushElapsed, letterX )
{
    const accelerationProgress = getSmoothProgress( pushElapsed, timing.accelerate );
    const acceleratedSpeed = THREE.MathUtils.lerp(
        pushSpeed.start,
        pushSpeed.cruise,
        accelerationProgress
    );
    const remainingDistance = Math.max( letterX - rTargetPosition[ 0 ], 0 );
    const finishProgress = THREE.MathUtils.smoothstep(
        remainingDistance,
        0,
        slowDownDistance
    );

    return THREE.MathUtils.lerp(
        pushSpeed.end,
        acceleratedSpeed,
        finishProgress
    );
}

function applyBulldozerCommand ( bulldozerIntroRef, command )
{
    if ( !bulldozerIntroRef.current )
        return;

    bulldozerIntroRef.current.active = command.active;
    bulldozerIntroRef.current.activity = command.activity;
    bulldozerIntroRef.current.moveDirection = command.moveDirection;
    bulldozerIntroRef.current.speed = command.speed;
    bulldozerIntroRef.current.turnDirection = command.turnDirection;
}

export default function BulldozerIntroSequence ( {
    bulldozerIntroRef,
    letterRef
} )
{
    const startTime = useRef( null );
    const hasCompletedSequence = useRef( false );

    useFrame( ( state ) =>
    {
        const now = state.clock.elapsedTime;

        if ( startTime.current === null )
            startTime.current = now;

        if ( !letterRef.current || hasCompletedSequence.current )
        {
            applyBulldozerCommand( bulldozerIntroRef, {
                active: false,
                activity: 0.58,
                moveDirection: 0,
                speed: 0,
                turnDirection: 0
            } );
            return;
        }

        const elapsed = now - startTime.current;
        const letterTranslation = letterRef.current.translation();
        const hasReachedTarget = letterTranslation.x <= rTargetPosition[ 0 ] - 0.05;
        const hasTimedOut = elapsed >= timing.maxPush;

        if ( hasReachedTarget || hasTimedOut )
        {
            hasCompletedSequence.current = true;

            applyBulldozerCommand( bulldozerIntroRef, {
                active: false,
                activity: 0.58,
                moveDirection: 0,
                speed: 0,
                turnDirection: 0
            } );
            return;
        }

        if ( elapsed < timing.startDelay )
        {
            applyBulldozerCommand( bulldozerIntroRef, {
                active: true,
                activity: 0.66,
                moveDirection: 0,
                speed: 0,
                turnDirection: 0
            } );
            return;
        }

        const pushElapsed = elapsed - timing.startDelay;

        applyBulldozerCommand( bulldozerIntroRef, {
            active: true,
            activity: 0.94,
            moveDirection: 1,
            speed: getPushSpeed( pushElapsed, letterTranslation.x ),
            turnDirection: 0.033
        } );
    } );

    return null;
}
