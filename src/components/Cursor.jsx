import { Html, Float } from "@react-three/drei";
import { degToRad } from "three/src/math/MathUtils.js";

export default function Cursor ( {
    position,
    rotation = [ degToRad( -25 ), 0, degToRad( -170 ) ],
    size = 0.55,
    visible = true,
    onClick,
    transform = true,
    screenRotation = 0,
    label = "Control target"
} )
{
    const isInteractive = Boolean( onClick );

    function handleClick ( event )
    {
        event.stopPropagation();

        if ( visible )
            onClick?.();
    }

    function handleKeyDown ( event )
    {
        if ( event.key !== "Enter" && event.key !== " " )
            return;

        event.preventDefault();
        handleClick( event );
    }

    return <>
        <Float
            floatIntensity={ 0.2 }
            rotationIntensity={ 0.01 }
            speed={ 8 }
        >
            <Html
                position={ position }
                rotation={ rotation }
                scale={ size }
                center
                transform={ transform }
                occlude={ false }
                style={ {
                    pointerEvents: visible && isInteractive ? "auto" : "none",
                    userSelect: "none"
                } }
            >
                <div
                    aria-hidden={ !isInteractive }
                    aria-label={ isInteractive ? label : undefined }
                    className={ `cursor-hint${ visible ? "" : " cursor-hint--hidden" }${ isInteractive ? " cursor-hint--interactive" : "" }` }
                    onClick={ isInteractive ? handleClick : undefined }
                    onKeyDown={ isInteractive ? handleKeyDown : undefined }
                    role={ isInteractive ? "button" : undefined }
                    tabIndex={ visible && isInteractive ? 0 : -1 }
                >
                    <img
                        src="/models/cursor.png"
                        alt=""
                        className="cursor-hint__image"
                        style={ { transform: `rotate(${ screenRotation }deg)` } }
                    />
                </div>
            </Html>
        </Float>
    </>;
}
