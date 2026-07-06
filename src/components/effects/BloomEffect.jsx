import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { HalfFloatType } from "three";
import {
    BlendFunction,
    BloomEffect as PostProcessingBloomEffect,
    EffectComposer,
    EffectPass,
    RenderPass,
    SMAAEffect,
    SMAAPreset,
    ToneMappingEffect,
    ToneMappingMode
} from "postprocessing";

const bloomSettings = {
    intensity: 1.95,
    levels: 8,
    luminanceSmoothing: 2,
    luminanceThreshold: 2,
    mipmapBlur: true,
    radius: 0.88
};

export default function BloomEffect ()
{
    const { camera, gl, scene, size } = useThree();

    const composer = useMemo( () =>
    {
        const effectComposer = new EffectComposer( gl, {
            frameBufferType: HalfFloatType
        } );
        const bloomEffect = new PostProcessingBloomEffect( {
            blendFunction: BlendFunction.ADD,
            intensity: bloomSettings.intensity,
            levels: bloomSettings.levels,
            luminanceSmoothing: bloomSettings.luminanceSmoothing,
            luminanceThreshold: bloomSettings.luminanceThreshold,
            mipmapBlur: bloomSettings.mipmapBlur,
            radius: bloomSettings.radius
        } );
        const smaaEffect = new SMAAEffect( {
            preset: SMAAPreset.HIGH
        } );
        const toneMappingEffect = new ToneMappingEffect( {
            mode: ToneMappingMode.AGX
        } );

        effectComposer.addPass( new RenderPass( scene, camera ) );
        effectComposer.addPass( new EffectPass( camera, bloomEffect ) );
        effectComposer.addPass( new EffectPass( camera, toneMappingEffect ) );
        effectComposer.addPass( new EffectPass( camera, smaaEffect ) );

        return effectComposer;
    }, [ camera, gl, scene ] );

    useEffect( () =>
    {
        composer.setSize( size.width, size.height );
    }, [ composer, size.height, size.width ] );

    useEffect( () =>
    {
        return () =>
        {
            composer.dispose();
        };
    }, [ composer ] );

    useFrame( ( _, delta ) =>
    {
        composer.render( delta );
    }, 1 );

    return null;
}
