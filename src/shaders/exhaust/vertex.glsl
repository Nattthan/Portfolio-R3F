attribute float aAlpha;
attribute float aProgress;
attribute float aSeed;
attribute float aSize;

uniform float uActivity;
uniform float uTime;

varying float vAlpha;
varying float vProgress;
varying float vSeed;

void main()
{
    vec3 transformed = position;

    vec4 modelViewPosition = modelViewMatrix * vec4(transformed, 1.0);

    vAlpha = aAlpha * mix(0.72, 1.0, uActivity);
    vProgress = aProgress;
    vSeed = aSeed;

    gl_PointSize = aSize * (1.0 + aProgress * 0.9) * (7.5 / -modelViewPosition.z);
    gl_Position = projectionMatrix * modelViewPosition;
}
