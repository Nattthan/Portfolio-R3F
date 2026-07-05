import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

export default function BloomEffect ()
{
    const { camera, gl, scene, size } = useThree();

    const composer = useMemo( () =>
    {
        const effectComposer = new EffectComposer( gl );
        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2( size.width, size.height ),
            0.3,
            0.25,
            1.45
        );

        effectComposer.addPass( new RenderPass( scene, camera ) );
        effectComposer.addPass( bloomPass );
        effectComposer.addPass( new OutputPass() );

        return effectComposer;
    }, [ camera, gl, scene, size.height, size.width ] );

    useEffect( () =>
    {
        composer.setSize( size.width, size.height );
        composer.setPixelRatio( gl.getPixelRatio() );
    }, [ composer, gl, size.height, size.width ] );

    useEffect( () =>
    {
        return () =>
        {
            composer.dispose();
        };
    }, [ composer ] );

    useFrame( () =>
    {
        composer.render();
    }, 1 );

    return null;
}
