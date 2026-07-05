uniform float uOpacity;
uniform float uTime;

varying float vAlpha;
varying float vProgress;
varying float vSeed;

vec3 mod289(vec3 x)
{
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec2 mod289(vec2 x)
{
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec3 permute(vec3 x)
{
    return mod289(((x * 34.0) + 10.0) * x);
}

float simplexNoise(vec2 v)
{
    const vec4 c = vec4(
        0.211324865405187,
        0.366025403784439,
       -0.577350269189626,
        0.024390243902439
    );

    vec2 i = floor(v + dot(v, c.yy));
    vec2 x0 = v - i + dot(i, c.xx);
    vec2 i1 = x0.x > x0.y ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + c.xxzz;

    x12.xy -= i1;
    i = mod289(i);

    vec3 p = permute(
        permute(i.y + vec3(0.0, i1.y, 1.0))
            + i.x + vec3(0.0, i1.x, 1.0)
    );

    vec3 m = max(
        0.5 - vec3(
            dot(x0, x0),
            dot(x12.xy, x12.xy),
            dot(x12.zw, x12.zw)
        ),
        0.0
    );

    m = m * m;
    m = m * m;

    vec3 x = 2.0 * fract(p * c.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;

    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);

    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;

    return 130.0 * dot(m, g);
}

void main()
{
    vec2 centeredUv = gl_PointCoord - vec2(0.5);
    float circle = 1.0 - smoothstep(0.22, 0.5, length(centeredUv));
    vec2 smokeUv = gl_PointCoord * 2.6;

    float largeNoise = simplexNoise(vec2(
        smokeUv.x + vSeed * 0.13 - uTime * 0.55,
        smokeUv.y + vProgress * 4.8 + uTime * 0.22
    )) * 0.5 + 0.5;
    float rollingNoise = simplexNoise(vec2(
        smokeUv.x * 4.8 + vSeed * 0.31 - uTime * 1.0,
        smokeUv.y * 4.2 + uTime * 0.38
    )) * 0.5 + 0.5;
    float dissolveNoise = simplexNoise(vec2(
        smokeUv.x * 7.4 + vSeed * 0.47 + uTime * 0.7,
        smokeUv.y * 6.8 - uTime * 0.52
    )) * 0.5 + 0.5;

    float alphaNoise = mix(0.42, 1.0, largeNoise)
        * mix(0.38, 1.08, rollingNoise);
    float dissolveCut = smoothstep(0.1 + vProgress * 0.92, 0.95, dissolveNoise);
    float alpha = circle * alphaNoise * dissolveCut * vAlpha * uOpacity;

    if (alpha < 0.01)
        discard;

    vec3 color = mix(
        vec3(0.18, 0.17, 0.16),
        vec3(0.58, 0.55, 0.5),
        smoothstep(0.0, 0.85, vProgress) * largeNoise
    );

    gl_FragColor = vec4(color, alpha);
}
