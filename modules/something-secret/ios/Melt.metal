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

/// How far `p` is toward a regular octagon's edge: 0 at the centre, 1 on its flat sides.
static float octagonDistance(float2 p) {
	float d = 0.0;
	for (int k = 0; k < 8; k++) {
		float a = float(k) * M_PI_F / 4.0 + M_PI_F / 8.0;
		d = max(d, dot(p, float2(cos(a), sin(a))));
	}
	return d;
}

/// A brilliant-cut ruby seen from above: an octagonal table, a ring of eight kite facets, and a
/// girdle of sixteen. Each facet is tilted its own way, so a facet flashes as it turns `light`
/// (a direction in screen space, z toward the eye) into the eye; the body colour shifts a little
/// differently in each channel over `time`, for a hint of fire. Transparent outside the stone.
[[ stitchable ]] half4 gem(float2 position, half4 color, float time, float2 size, float3 light) {
	float radius = min(size.x, size.y) / 2.0;
	// Scaled so the octagon's corners, a little further out than its flat sides, stay in frame.
	float2 p = (position - size / 2.0) / radius / cos(M_PI_F / 8.0);
	float d = octagonDistance(p);
	float pixel = 1.5 / radius;
	float coverage = 1.0 - smoothstep(1.0 - pixel, 1.0, d);
	if (coverage <= 0.0) {
		return half4(0.0h);
	}

	float angle = atan2(p.y, p.x) + M_PI_F;
	float sector = floor(angle / (M_PI_F / 4.0));
	float half16 = floor(angle / (M_PI_F / 8.0));
	float3 normal;
	float facet;
	if (d < 0.48) {
		normal = float3(0.0, 0.0, 1.0);
		facet = 0.0;
	} else if (d < 0.78) {
		float c = (sector + 0.5) * M_PI_F / 4.0 - M_PI_F;
		// Each kite leans a little to one side or the other, as a brilliant's star facets do.
		float lean = fmod(half16, 2.0) * 2.0 - 1.0;
		float2 outward = float2(cos(c), sin(c));
		float2 along = float2(-outward.y, outward.x);
		normal = normalize(float3(outward * 0.45 + along * 0.18 * lean, 1.0));
		facet = 1.0 + half16;
	} else {
		float c = (half16 + 0.5) * M_PI_F / 8.0 - M_PI_F;
		normal = normalize(float3(cos(c) * 0.9, sin(c) * 0.9, 1.0));
		facet = 17.0 + half16;
	}

	light = normalize(light);
	float sparkle = pow(saturate(dot(reflect(-light, normal), float3(0.0, 0.0, 1.0))), 40.0);
	float phase = facet * 1.7 + time * 0.6;
	float3 inner = 0.5 + 0.5 * sin(float3(phase, phase + 2.1, phase + 4.2));
	float3 body = float3(0.55 + 0.4 * inner.r, 0.02 + 0.06 * inner.g, 0.06 + 0.12 * inner.b);
	body *= 0.55 + 0.45 * saturate(dot(normal, light));

	// Dark seams where facets meet: at the two ring boundaries, and between the sectors outside
	// the table.
	float seam = min(abs(d - 0.48), abs(d - 0.78));
	if (d >= 0.48) {
		float across = fract(angle / (M_PI_F / 8.0));
		seam = min(seam, min(across, 1.0 - across) * (M_PI_F / 8.0) * length(p));
	}
	body *= mix(0.45, 1.0, smoothstep(0.0, 0.025, seam));

	float3 rgb = body + sparkle * 0.9;
	return half4(half3(rgb * coverage), half(coverage));
}
