import { useProgress } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";

const exitDuration = 500;
const minimumVisibleTime = 900;
const readyHoldTime = 700;

export default function LoadingScreen ()
{
    const { active, progress } = useProgress();
    const [ visible, setVisible ] = useState( true );
    const [ leaving, setLeaving ] = useState( false );
    const [ displayedProgress, setDisplayedProgress ] = useState( 0 );
    const mountedAt = useRef( performance.now() );
    const roundedProgress = Math.max( 0, Math.min( 100, Math.round( progress ) ) );

    useEffect( () =>
    {
        setDisplayedProgress( ( currentProgress ) =>
            Math.max( currentProgress, roundedProgress )
        );
    }, [ roundedProgress ] );

    useEffect( () =>
    {
        if ( active || progress < 100 )
        {
            setVisible( true );
            setLeaving( false );
            return;
        }

        const elapsed = performance.now() - mountedAt.current;
        const holdTime = Math.max( readyHoldTime, minimumVisibleTime - elapsed );

        const leaveTimer = window.setTimeout( () =>
        {
            setLeaving( true );
        }, holdTime );

        const removeTimer = window.setTimeout( () =>
        {
            setVisible( false );
        }, holdTime + exitDuration );

        return () =>
        {
            window.clearTimeout( leaveTimer );
            window.clearTimeout( removeTimer );
        };
    }, [ active, progress ] );

    if ( !visible )
        return null;

    return <div className={ `loading-screen${ leaving ? ' loading-screen--leaving' : '' }` }>
        <div className="loading-screen__content">
            <div className="loading-screen__label">Loading</div>
            <div className="loading-screen__bar" aria-hidden="true">
                <div
                    className="loading-screen__bar-fill"
                    style={ { transform: `scaleX(${ displayedProgress / 100 })` } }
                />
            </div>
            <div className="loading-screen__progress">{ displayedProgress }%</div>
        </div>
    </div>;
}
