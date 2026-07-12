import { Html } from "@react-three/drei";
import { useEffect, useMemo, useState } from "react";

const introMessageSegments = [
    { text: "Ah! You wanna talk to " },
    { text: "Natthan", isName: true },
    { text: "'s referent? Click me and I'll tell you..." }
];

const copiedMessageSegments = [
    { text: "Her name is " },
    { text: "Elodie Moussin", isName: true },
    { text: ", she is a Senior Software Developer at Schneider Electric in Germany. I just copied her email to your clipboard." }
];

function getTypedSegments ( segments, typedLength )
{
    let remainingLength = typedLength;

    return segments
        .map( ( segment ) =>
        {
            const visibleLength = Math.min( remainingLength, segment.text.length );
            remainingLength -= visibleLength;

            return {
                ...segment,
                text: segment.text.slice( 0, visibleLength )
            };
        } )
        .filter( ( segment ) => segment.text.length > 0 );
}

export default function WorkerSpeechBubble ( { visible, copied } )
{
    const messageSegments = copied
        ? copiedMessageSegments
        : introMessageSegments;
    const text = useMemo( () =>
    {
        return messageSegments.map( ( segment ) => segment.text ).join( "" );
    }, [ messageSegments ] );
    const [ typedLength, setTypedLength ] = useState( 0 );
    const typedSegments = useMemo( () =>
    {
        return getTypedSegments( messageSegments, typedLength );
    }, [ messageSegments, typedLength ] );

    useEffect( () =>
    {
        if ( !visible )
        {
            setTypedLength( 0 );
            return;
        }

        setTypedLength( 0 );

        const intervalId = window.setInterval( () =>
        {
            setTypedLength( ( currentLength ) =>
            {
                if ( currentLength >= text.length )
                {
                    window.clearInterval( intervalId );
                    return currentLength;
                }

                return currentLength + 1;
            } );
        }, copied ? 28 : 34 );

        return () =>
        {
            window.clearInterval( intervalId );
        };
    }, [ copied, text, visible ] );

    return <>
        <Html
            position={ [ 0, 2, 0 ] }
            center
            transform={ false }
            occlude={ false }
            style={ { pointerEvents: "none" } }
        >
            <div
                aria-hidden={ !visible }
                aria-label={ visible ? text : undefined }
                className={ `worker-bubble${ visible ? "" : " worker-bubble--hidden" }${ copied ? " worker-bubble--copied" : "" }` }
            >
                <span className="worker-bubble__badge">ref</span>
                <span className="worker-bubble__text">
                    { typedSegments.map( ( segment, index ) =>
                    {
                        return <span
                            key={ `${ index }-${ segment.text }` }
                            className={ segment.isName ? "worker-bubble__name" : undefined }
                        >
                            { segment.text }
                        </span>;
                    } ) }
                    <span
                        className={ `worker-bubble__caret${ typedLength >= text.length ? " worker-bubble__caret--done" : "" }` }
                    />
                </span>
            </div>
        </Html>
    </>;
}
