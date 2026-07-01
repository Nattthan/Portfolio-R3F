import { OrbitControls } from "@react-three/drei";
import floorVertexShader from "./shaders/floor/vertex.glsl";
import floorFragmentShader from "./shaders/floor/fragment.glsl";
import * as THREE from 'three';
import { useControls } from "leva";

export default function Experience ()
{
    const floorDebug = useControls( 'floor',
        {
            uRadius: {
                value: 0.45,
                min: 0,
                max: 2,
                step: 0.01
            },
            uFeather: {
                value: 0.25,
                min: 0,
                max: 2,
                step: 0.01
            },
            uOpacity: {
                value: 1.0,
                min: 0,
                max: 2,
                step: 0.01
            }
        },
        {collapsed: true}
    );

    return <>
        <color args={ [ "#3b352f" ] } attach={ 'background' } />

        <OrbitControls
            makeDefault
            enableDamping
            dampingFactor={ 0.05 }
            rotateSpeed={ 0.5 }
            zoomSpeed={ 0.8 }
            panSpeed={ 0.5 }
            minDistance={ 8 }
            maxDistance={ 12 }
            target={ [ 0, 0, 0 ] }
            minPolarAngle={Math.PI / 3}
            maxPolarAngle={Math.PI / 2.1}
            minAzimuthAngle={-Math.PI / 4}
            maxAzimuthAngle={Math.PI / 4}
        />

        <ambientLight intensity={ 2 } />

        <mesh rotation={ [ -Math.PI / 2, 0, 0 ] }>
            <planeGeometry args={ [ 20, 20 ] } />
            <shaderMaterial
                transparent={ true }
                fragmentShader={ floorFragmentShader }
                vertexShader={ floorVertexShader }
                uniforms={ {
                    uRadius: new THREE.Uniform( floorDebug.uRadius ),
                    uFeather: new THREE.Uniform( floorDebug.uFeather ),
                    uOpacity: new THREE.Uniform( floorDebug.uOpacity )
                } }
            />
        </mesh>

        <mesh position-y={.5}>
            <boxGeometry />
            <meshNormalMaterial />
        </mesh>
    </>;
}