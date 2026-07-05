import { forwardRef } from "react";
import { Center, Text3D } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";

const RigidLetter = forwardRef( function RigidLetter ( {
    color = "#ffd8a8",
    depth = 0.5,
    font = "/fonts/BebasNeue_Regular.json",
    fontSize = 1.1,
    letter,
    linearDamping = 0,
    angularDamping = 0,
    name,
    onCollisionEnter,
    onCollisionExit,
    position = [ 0, 0, 0 ],
    rotation = [ 0, 0, 0 ],
    type = "dynamic",
}, ref )
{
    return <RigidBody
        ref={ ref }
        name={ name }
        type={ type }
        linearDamping={ linearDamping }
        angularDamping={ angularDamping }
        colliders="cuboid"
        onCollisionEnter={ onCollisionEnter }
        onCollisionExit={ onCollisionExit }
        position={ position }
        rotation={ rotation }
    >
        <Center>
            <Text3D
                castShadow
                receiveShadow
                bevelEnabled
                bevelSize={ 0.012 }
                bevelThickness={ 0.014 }
                curveSegments={ 8 }
                font={ font }
                height={ depth }
                size={ fontSize }
            >
                { letter }
                <meshStandardMaterial color={ color } metalness={ 0.08 } roughness={ 0.42 } />
            </Text3D>
        </Center>
    </RigidBody>;
} );

export default RigidLetter;
