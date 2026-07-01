varying vec2 vUv;

uniform float uRadius;
uniform float uFeather;
uniform float uOpacity;

void main()
{
    float dist = distance(vUv, vec2(0.5));

    float alpha = 1.0 - smoothstep(
        uRadius - uFeather,
        uRadius,
        dist);

    vec3 color = vec3(0.34, 0.3, 0.26);
 

    gl_FragColor = vec4(color, alpha * uOpacity);
}