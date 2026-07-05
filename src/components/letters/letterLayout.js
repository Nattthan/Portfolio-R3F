import * as THREE from "three";

const degrees = THREE.MathUtils.degToRad;

export const underText = "UNDER";
export const constructionText = "CONSTRUCTION";
export const underLetterSpacing = 0.62;
export const constructionLetterSpacing = 0.75;
export const underBasePosition = [ -.5, 0.72, 2.15 ];
export const constructionBasePosition = [ 2.7, 0.7, -2 ];
export const underWordRotation = [ 0, degrees( 0 ), 0 ];
export const constructionWordRotation = [ 0, degrees( -20 ), 0 ];
export const looseULetterPosition = [ -4, 0.72, 0.47 ];
export const looseULetterRotation = underWordRotation;
export const looseRLetterPosition = [ 3.72, 0.72, 2.15 ];
export const looseRLetterRotation = underWordRotation;

export function getLetterPosition (
    index,
    text,
    letterSpacing,
    basePosition,
    wordRotation = [ 0, 0, 0 ]
)
{
    const [ baseX, baseY, baseZ ] = basePosition;
    const wordWidth = ( text.length - 1 ) * letterSpacing;
    const localPosition = new THREE.Vector3(
        index * letterSpacing - wordWidth * 0.5,
        0,
        0
    );

    localPosition.applyEuler( new THREE.Euler( ...wordRotation ) );

    return [
        baseX + localPosition.x,
        baseY + localPosition.y,
        baseZ + localPosition.z
    ];
}
