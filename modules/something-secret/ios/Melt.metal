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

/// How far the glass at `x` has slumped after `time` seconds: smooth lobes across the screen,
/// each falling faster as time passes, all of them past the bottom edge by 3 seconds.
static float fallAt(float x, float time, float2 size) {
	float speed = 0.4 + noise(x / 38.0) * 0.5 + noise(x / 11.0 + 7.3) * 0.1;
	return speed * time * time * size.y * 0.35;
}

/// The snapshot slumping off the screen like thick, clear glass. Where the fall changes across
/// the screen, the slope bends the image seen through it; each drip's rounded lower rim catches
/// a highlight. At time 0 the image is untouched, so a rewind ends exactly on the app.
[[ stitchable ]] half4 glassMelt(float2 position, SwiftUI::Layer layer, float time, float2 size) {
	float fall = fallAt(position.x, time, size);
	float sourceY = position.y - fall;
	if (sourceY < 0.0) {
		return half4(0.0h);
	}

	// Effects ease in, so the first frames of a melt (and the last of a rewind) are the app itself.
	float strength = smoothstep(0.0, 0.25, time);
	float slope = (fallAt(position.x + 2.0, time, size) - fallAt(position.x - 2.0, time, size)) / 4.0;
	// 1 at a drip's leading edge, fading to 0 a little way into the glass.
	float rim = (1.0 - smoothstep(0.0, 22.0, sourceY)) * strength;

	// Clamped inside the 32-point reach MeltView gives the shader; beyond it a sample is empty.
	float bend = clamp(slope * 14.0 * strength, -28.0, 28.0);
	float2 sample = float2(position.x + bend, sourceY + rim * rim * 10.0);
	half4 color = layer.sample(sample);

	float3 normal = normalize(float3(-slope * 3.0 * strength, -rim * 1.2, 1.0));
	float3 light = normalize(float3(-0.35, -0.8, 0.5));
	float shine = pow(max(dot(normal, light), 0.0), 12.0) * strength + rim * 0.2;
	color.rgb = min(color.rgb + half3(shine) * color.a, half3(color.a));
	// A soft edge, so the drips are not cut with a knife.
	return color * half(smoothstep(0.0, 1.5, sourceY));
}
