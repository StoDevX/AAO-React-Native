#include <metal_stdlib>
#include <SwiftUI/SwiftUI_Metal.h>
using namespace metal;

/// A repeatable pseudo-random number in [0, 1) for `n`.
static float hash(float n) {
	return fract(sin(n) * 43758.5453);
}

/// Smooth 1D noise: neighbouring inputs give neighbouring outputs.
static float noise(float x) {
	float i = floor(x);
	float f = fract(x);
	float u = f * f * (3.0 - 2.0 * f);
	return mix(hash(i), hash(i + 1.0), u);
}

/// Where each pixel of the melting snapshot samples from. The image falls in 4pt columns, each at
/// its own speed, faster as time passes; by 3 seconds every column has fallen out of view.
[[ stitchable ]] float2 melt(float2 position, float time, float2 size) {
	float column = floor(position.x / 4.0);
	float speed = 0.4 + noise(column * 0.15) * 0.6 + hash(column) * 0.08;
	float fall = speed * time * time * size.y * 0.35;
	return float2(position.x, position.y - fall);
}

/// Tints the snapshot toward orange, then toward black, over the melt's 3 seconds.
[[ stitchable ]] half4 heat(float2 position, half4 color, float time) {
	half t = half(clamp(time / 3.0, 0.0, 1.0));
	half3 orange = half3(1.0, 0.45, 0.1) * color.a;
	half3 tinted = mix(color.rgb, orange, t * 0.6h);
	half dark = max(t - 0.5h, 0.0h) * 2.0h;
	return half4(mix(tinted, half3(0.0h), dark), color.a);
}
