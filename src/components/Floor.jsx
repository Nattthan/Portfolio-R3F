import { RigidBody } from "@react-three/rapier";
import { useControls } from "leva";
import * as THREE from "three";
import floorFragmentShader from "../shaders/floor/fragment.glsl";
import floorVertexShader from "../shaders/floor/vertex.glsl";

const floorDebugSettings = {
    uRadius: {
        value: 0.45,
        min: 0,
        max: 2,
        step: 0.01
    },
    uFeather: {
        value: 0.3,
        min: 0,
        max: 2,
        step: 0.01
    },
    uOpacity: {
        value: 0.58,
        min: 0,
        max: 2,
        step: 0.01
    }
};

export default function Floor ()
{
    const floorDebug = useControls( 'floor',
        floorDebugSettings,
        { collapsed: true }
    );
    const floorUniforms = {
        uRadius: new THREE.Uniform( floorDebug.uRadius ),
        uFeather: new THREE.Uniform( floorDebug.uFeather ),
        uOpacity: new THREE.Uniform( floorDebug.uOpacity )
    };

    return <>
        <RigidBody name="floor" type="fixed">
            <mesh rotation={ [ -Math.PI / 2, 0, 0 ] }>
                <planeGeometry args={ [ 20, 20 ] } />
                <shaderMaterial
                    transparent={ true }
                    fragmentShader={ floorFragmentShader }
                    vertexShader={ floorVertexShader }
                    uniforms={ floorUniforms }
                />
            </mesh>
        </RigidBody>

        <mesh
            position-y={ 0.012 }
            rotation={ [ -Math.PI / 2, 0, 0 ] }
            receiveShadow
            renderOrder={ 2 }
        >
            <planeGeometry args={ [ 20, 20 ] } />
            <shadowMaterial
                transparent
                opacity={ 0.4 }
                color={ "#0d0906" }
                depthWrite={ false }
            />
        </mesh>
    </>;
}
