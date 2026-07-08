import { Text } from "@react-three/drei";
import { degToRad } from "three/src/math/MathUtils.js";
import Cursor from "./Cursor";
import { trackEvent } from "../utils/analytics";

export default function ClickableSign ( {
    label,
    eventName,
    url,
    position,
    rotation,
    width = 1.3,
    height = 1,
    cursorPosition
} )
{
    function openLink ( event )
    {
        event.stopPropagation();
        trackEvent( eventName, {
            label,
            url
        } );
        window.open( url, "_blank", "noopener,noreferrer" );
    }

    return <>
        <group position={ position } rotation={ rotation }>
            <mesh
                onClick={ openLink }
                onPointerOver={ () => { document.body.style.cursor = "pointer"; } }
                onPointerLeave={ () => { document.body.style.cursor = "default"; } }
            >
                <boxGeometry args={ [ width, height, 0.7 ] } />
                <meshBasicMaterial transparent={ true } opacity={ 0 } depthWrite={ false } />
            </mesh>

            <Text
                position={ [ 0, 0.025, 0.25 ] }
                rotation={ [ degToRad( -25 ), 0, 0 ] }
                fontSize={ 0.22 }
                font="fonts/BebasNeue-Regular.ttf"
                color="#2b2521"
                anchorX="center"
                anchorY="middle"
                onClick={ openLink }
            >
                { label }
            </Text>

            { cursorPosition &&
                <Cursor
                    position={ cursorPosition }
                    rotation={ [ degToRad( -25 ), 0, degToRad( -25 ) ] }
                    size={ 0.15 }
                /> }
        </group>
    </>;
}
