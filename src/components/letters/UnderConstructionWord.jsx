import RigidLetter from "./RigidLetter";
import {
    constructionBasePosition,
    constructionLetterSpacing,
    constructionText,
    constructionWordRotation,
    getLetterPosition,
    looseULetterPosition,
    looseULetterRotation,
    underBasePosition,
    underLetterSpacing,
    underText,
    underWordRotation
} from "./letterLayout";

export default function UnderConstructionWord ( {
    activeLetterType = "dynamic",
    introLetterRef,
    introLetterCollisionRef,
    missingLetterColor = "#fff1dc",
    settledLetterColor = "#ffd8a8"
} )
{
    const underCharacters = Array.from( underText );
    const constructionCharacters = Array.from( constructionText );

    const updateIntroLetterCollision = ( payload, isColliding ) =>
    {
        const otherName = payload.other.rigidBodyObject?.name;

        if ( !introLetterCollisionRef?.current )
            return;

        if ( otherName === "floor" )
            introLetterCollisionRef.current.isTouchingFloor = isColliding;

        if ( otherName === "hook" )
        {
            introLetterCollisionRef.current.isTouchingHook = isColliding;

            if ( isColliding && payload.manifold )
            {
                const point = payload.manifold.solverContactPoint( 0 );

                if ( point )
                {
                    introLetterCollisionRef.current.hookContactPoint = [
                        point.x,
                        point.y,
                        point.z
                    ];
                }
            }
        }
    };

    const renderUnderLetter = ( character, index ) =>
    {
        const isIntroLetter = index === 0;
        const position = isIntroLetter
            ? looseULetterPosition
            : getLetterPosition(
                index,
                underText,
                underLetterSpacing,
                underBasePosition,
                underWordRotation
            );

        return <RigidLetter
            key={ `${ character }-${ index }` }
            ref={ isIntroLetter ? introLetterRef : undefined }
            name={ `letter-${ character.toLowerCase() }-${ index }` }
            color={ isIntroLetter ? missingLetterColor : settledLetterColor }
            fontSize={ 1 }
            linearDamping={ isIntroLetter ? 1.6 : 0.2 }
            angularDamping={ isIntroLetter ? 3.2 : 0.4 }
            letter={ character }
            onCollisionEnter={ isIntroLetter
                ? ( payload ) => updateIntroLetterCollision( payload, true )
                : undefined }
            onCollisionExit={ isIntroLetter
                ? ( payload ) => updateIntroLetterCollision( payload, false )
                : undefined }
            position={ position }
            rotation={ isIntroLetter ? looseULetterRotation : underWordRotation }
            type={ isIntroLetter ? activeLetterType : "dynamic" }
        />;
    };

    const renderConstructionLetter = ( character, index ) =>
    {
        return <RigidLetter
            key={ `${ character }-${ index }` }
            name={ `letter-${ character.toLowerCase() }-${ underText.length + index }` }
            color={ settledLetterColor }
            fontSize={ 1.4 }
            linearDamping={ 0.2 }
            angularDamping={ 0.4 }
            letter={ character }
            position={ getLetterPosition(
                index,
                constructionText,
                constructionLetterSpacing,
                constructionBasePosition,
                constructionWordRotation
            ) }
            rotation={ constructionWordRotation }
            type="dynamic"
        />;
    };

    return <group name="under-construction-word">
        { underCharacters.map( renderUnderLetter ) }
        { constructionCharacters.map( renderConstructionLetter ) }
    </group>;
}
