import { useGLTF } from "@react-three/drei";
import { MeshCollider, RigidBody } from "@react-three/rapier";
import { useLayoutEffect, useMemo } from "react";
import * as THREE from "three";

const modelPath = "./models/Assets.glb";
const anchoredGroupName = "asset_anchored";
const emissiveMaterialName = "Emissive";

const lightPairs = [
    {
        position: "Light1_pos",
        target: "Light1_target",
        intensity: 100,
        distance: 4.8,
        angle: 0.56,
        positionOffset: [ 0, 0.32, 0 ],
        targetY: 0.08
    },
    {
        position: "Light2_pos",
        target: "Light2_target",
        intensity: 100,
        distance: 5.2,
        angle: 0.54,
        positionOffset: [ 0, 0.28, 0 ],
        targetY: 0.08
    }
];

const emissiveColor = new THREE.Color( "#fff2c4" );
const spotLightColor = "#fff2c4";
const positionPrecision = 10000;

function cloneForRigidBody ( object )
{
    const clone = object.clone( true );
    const position = object.position.clone();
    const rotation = object.rotation.toArray().slice( 0, 3 );

    clone.position.set( 0, 0, 0 );
    clone.rotation.set( 0, 0, 0 );
    clone.scale.copy( object.scale );

    return {
        name: object.name,
        object: clone,
        position: position.toArray(),
        rotation,
        scale: object.scale.toArray()
    };
}

function getPositionKey ( positionAttribute, index )
{
    return [
        Math.round( positionAttribute.getX( index ) * positionPrecision ),
        Math.round( positionAttribute.getY( index ) * positionPrecision ),
        Math.round( positionAttribute.getZ( index ) * positionPrecision )
    ].join( "," );
}

function createDisjointSet ( size )
{
    const parents = Array.from( { length: size }, ( _, index ) => index );

    function find ( index )
    {
        let current = index;

        while ( parents[ current ] !== current )
        {
            parents[ current ] = parents[ parents[ current ] ];
            current = parents[ current ];
        }

        return current;
    }

    function union ( first, second )
    {
        const firstRoot = find( first );
        const secondRoot = find( second );

        if ( firstRoot !== secondRoot )
            parents[ secondRoot ] = firstRoot;
    }

    return {
        find,
        union
    };
}

function splitGeometryByConnectedParts ( geometry )
{
    const positionAttribute = geometry.getAttribute( "position" );
    const indexAttribute = geometry.index;

    if ( !positionAttribute || !indexAttribute )
        return [];

    const indexArray = indexAttribute.array;
    const disjointSet = createDisjointSet( positionAttribute.count );
    const verticesByPosition = new Map();

    for ( let index = 0; index < positionAttribute.count; index++ )
    {
        const key = getPositionKey( positionAttribute, index );
        const matchingIndex = verticesByPosition.get( key );

        if ( matchingIndex === undefined )
            verticesByPosition.set( key, index );
        else
            disjointSet.union( matchingIndex, index );
    }

    for ( let index = 0; index < indexArray.length; index += 3 )
    {
        disjointSet.union( indexArray[ index ], indexArray[ index + 1 ] );
        disjointSet.union( indexArray[ index ], indexArray[ index + 2 ] );
    }

    const trianglesByRoot = new Map();

    for ( let index = 0; index < indexArray.length; index += 3 )
    {
        const root = disjointSet.find( indexArray[ index ] );
        const triangles = trianglesByRoot.get( root ) ?? [];

        triangles.push(
            indexArray[ index ],
            indexArray[ index + 1 ],
            indexArray[ index + 2 ]
        );
        trianglesByRoot.set( root, triangles );
    }

    return [ ...trianglesByRoot.values() ].map( ( triangleIndices ) =>
    {
        const componentPositions = [];
        const componentIndices = [];
        const vertexMap = new Map();

        triangleIndices.forEach( ( sourceIndex ) =>
        {
            const key = getPositionKey( positionAttribute, sourceIndex );
            let targetIndex = vertexMap.get( key );

            if ( targetIndex === undefined )
            {
                targetIndex = componentPositions.length / 3;
                vertexMap.set( key, targetIndex );
                componentPositions.push(
                    positionAttribute.getX( sourceIndex ),
                    positionAttribute.getY( sourceIndex ),
                    positionAttribute.getZ( sourceIndex )
                );
            }

            componentIndices.push( targetIndex );
        } );

        const componentGeometry = new THREE.BufferGeometry();

        componentGeometry.setAttribute(
            "position",
            new THREE.Float32BufferAttribute( componentPositions, 3 )
        );
        componentGeometry.setIndex( componentIndices );
        componentGeometry.computeBoundingBox();

        return componentGeometry;
    } );
}

function createAnchoredCollisionMeshes ( object )
{
    const collisionMeshes = [];

    object.traverse( ( child ) =>
    {
        if ( !child.isMesh )
            return;

        splitGeometryByConnectedParts( child.geometry ).forEach( ( geometry, index ) =>
        {
            collisionMeshes.push( {
                geometry,
                key: `${ child.name }-${ index }`,
                position: child.position.toArray(),
                rotation: child.rotation.toArray().slice( 0, 3 ),
                scale: child.scale.toArray()
            } );
        } );
    } );

    return collisionMeshes;
}

function prepareModelObject ( object )
{
    object.traverse( ( child ) =>
    {
        if ( !child.isMesh )
            return;

        child.castShadow = true;
        child.receiveShadow = true;

        const materials = Array.isArray( child.material )
            ? child.material
            : [ child.material ];

        materials.forEach( ( material ) =>
        {
            if ( !material )
                return;

            material.envMapIntensity = 0.8;

            if ( material.name !== emissiveMaterialName || !material.emissive )
                return;

            material.color.set( "#fff8dd" );
            material.emissive.copy( emissiveColor );
            material.emissiveIntensity = 3.5;
            material.toneMapped = false;
        } );
    } );
}

function getWorldPosition ( scene, name )
{
    return scene
        .getObjectByName( name )
        ?.getWorldPosition( new THREE.Vector3() );
}

function ConstructionSpotLight ( {
    angle,
    distance,
    intensity,
    position,
    targetPosition
} )
{
    const target = useMemo( () => new THREE.Object3D(), [] );

    useLayoutEffect( () =>
    {
        target.position.copy( targetPosition );
    }, [ target, targetPosition ] );

    return <>
        <primitive object={ target } />
        <spotLight
            color={ spotLightColor }
            intensity={ intensity }
            distance={ distance }
            angle={ angle }
            penumbra={ 1 }
            decay={ 3.2 }
            position={ position.toArray() }
            target={ target }
        />
    </>;
}

export default function ConstructionAssets ()
{
    const model = useGLTF( modelPath );

    const constructionAssets = useMemo( () =>
    {
        model.scene.updateMatrixWorld( true );

        const anchoredObject = model.scene.getObjectByName( anchoredGroupName );
        const anchoredAsset = anchoredObject
            ? cloneForRigidBody( anchoredObject )
            : null;
        const anchoredCollisionMeshes = anchoredObject
            ? createAnchoredCollisionMeshes( anchoredObject )
            : [];

        const dynamicAssets = model.scene.children
            .filter( ( child ) =>
            {
                return child.name !== anchoredGroupName
                    && !child.name.match( /^Light\d+_/ );
            } )
            .map( cloneForRigidBody );

        const lights = lightPairs
            .map( ( light ) =>
            {
                const position = getWorldPosition( model.scene, light.position );
                const targetPosition = getWorldPosition( model.scene, light.target );

                if ( !position || !targetPosition )
                    return null;

                position.add( new THREE.Vector3( ...light.positionOffset ) );
                targetPosition.y = light.targetY;

                return {
                    name: light.position,
                    ...light,
                    position,
                    targetPosition
                };
            } )
            .filter( Boolean );

        if ( anchoredAsset )
            prepareModelObject( anchoredAsset.object );

        dynamicAssets.forEach( ( asset ) =>
        {
            prepareModelObject( asset.object );
        } );

        return {
            anchoredAsset,
            anchoredCollisionMeshes,
            dynamicAssets,
            lights
        };
    }, [ model.scene ] );

    return <>
        { constructionAssets.lights.map( ( light ) =>
        {
            return <ConstructionSpotLight
                key={ light.name }
                angle={ light.angle }
                distance={ light.distance }
                intensity={ light.intensity }
                position={ light.position }
                targetPosition={ light.targetPosition }
            />;
        } ) }

        { constructionAssets.anchoredAsset && <RigidBody
            name="solid-assets"
            type="fixed"
            colliders={ false }
            includeInvisible
            position={ constructionAssets.anchoredAsset.position }
            rotation={ constructionAssets.anchoredAsset.rotation }
            friction={ 1.1 }
            restitution={ 0 }
        >
            <MeshCollider type="hull">
                <group scale={ constructionAssets.anchoredAsset.scale }>
                    { constructionAssets.anchoredCollisionMeshes.map( ( collider ) =>
                    {
                        return <mesh
                            key={ collider.key }
                            geometry={ collider.geometry }
                            position={ collider.position }
                            rotation={ collider.rotation }
                            scale={ collider.scale }
                            visible={ false }
                        />;
                    } ) }
                </group>
            </MeshCollider>
            <primitive object={ constructionAssets.anchoredAsset.object } />
        </RigidBody> }

        { constructionAssets.dynamicAssets.map( ( asset ) =>
        {
            return <RigidBody
                key={ asset.name }
                name={ asset.name }
                type="dynamic"
                colliders="hull"
                position={ asset.position }
                rotation={ asset.rotation }
                linearDamping={ 0.35 }
                angularDamping={ 0.65 }
                friction={ 0.9 }
            >
                <primitive object={ asset.object } />
            </RigidBody>;
        } ) }
    </>;
}

useGLTF.preload( modelPath );
