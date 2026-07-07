import { useEffect, useRef, useState } from "react";

const transitionDuration = 260;

const controls = {
    crane: {
        title: "Crane",
        items: [
            "Left / Right arrows: rotate",
            "Up / Down arrows: raise / lower",
            "A: grab",
            "D: release"
        ]
    },
    bulldozer: {
        title: "Bulldozer",
        items: [
            "Up / Down arrows: move forward / backward",
            "Left / Right arrows: turn"
        ]
    }
};

export default function ControlsOverlay ( {
    selectedControl
} )
{
    const [ displayedControl, setDisplayedControl ] = useState( selectedControl );
    const [ isVisible, setIsVisible ] = useState( Boolean( selectedControl ) );
    const timeoutRef = useRef();
    const frameRef = useRef();
    const activeControls = controls[ displayedControl ];

    useEffect( () =>
    {
        window.clearTimeout( timeoutRef.current );
        window.cancelAnimationFrame( frameRef.current );

        if ( selectedControl === displayedControl )
        {
            setIsVisible( Boolean( selectedControl ) );
            return;
        }

        if ( !displayedControl )
        {
            setDisplayedControl( selectedControl );

            frameRef.current = window.requestAnimationFrame( () =>
            {
                setIsVisible( Boolean( selectedControl ) );
            } );
            return;
        }

        setIsVisible( false );

        timeoutRef.current = window.setTimeout( () =>
        {
            setDisplayedControl( selectedControl );

            frameRef.current = window.requestAnimationFrame( () =>
            {
                setIsVisible( Boolean( selectedControl ) );
            } );
        }, transitionDuration );

        return () =>
        {
            window.clearTimeout( timeoutRef.current );
            window.cancelAnimationFrame( frameRef.current );
        };
    }, [ displayedControl, selectedControl ] );

    return <div
        className={ `controls-overlay${ isVisible && activeControls ? "" : " controls-overlay--hidden" }` }
        aria-hidden={ !isVisible || !activeControls }
    >
        { activeControls && <>
            <div className="controls-overlay__title">{ activeControls.title }</div>
            <ul className="controls-overlay__list">
                { activeControls.items.map( ( item ) =>
                    <li key={ item }>{ item }</li>
                ) }
            </ul>
        </> }
    </div>;
}
