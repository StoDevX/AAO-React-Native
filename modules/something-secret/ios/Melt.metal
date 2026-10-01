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

/// One facet of the cut: which way it faces, and a number naming it.
struct Facet {
	float3 normal;
	float id;
};

/// The facet under `p` (gem space: the octagon's flat sides at 1), and how far `p` is toward the
/// edge. The cut: an octagonal table, a ring of eight kites leaning alternately, sixteen girdle
/// facets.
static Facet facetAt(float2 p, float d) {
	float angle = atan2(p.y, p.x) + M_PI_F;
	float sector = floor(angle / (M_PI_F / 4.0));
	float half16 = floor(angle / (M_PI_F / 8.0));
	Facet facet;
	if (d < 0.48) {
		facet.normal = float3(0.0, 0.0, 1.0);
		facet.id = 0.0;
	} else if (d < 0.78) {
		float c = (sector + 0.5) * M_PI_F / 4.0 - M_PI_F;
		float lean = fmod(half16, 2.0) * 2.0 - 1.0;
		float2 outward = float2(cos(c), sin(c));
		float2 along = float2(-outward.y, outward.x);
		facet.normal = normalize(float3(outward * 0.45 + along * 0.18 * lean, 1.0));
		facet.id = 1.0 + half16;
	} else {
		float c = (half16 + 0.5) * M_PI_F / 8.0 - M_PI_F;
		facet.normal = normalize(float3(cos(c) * 0.9, sin(c) * 0.9, 1.0));
		facet.id = 17.0 + half16;
	}
	return facet;
}

/// A small room for the gem to reflect: a soft bright window above, a dark floor below, dim walls.
/// The room turns with the light, so tilting the phone moves the reflections too.
static float room(float3 direction, float3 light) {
	float2 r = direction.xy - light.xy * 0.6;
	float window = smoothstep(0.45, 0.2, abs(r.x)) * smoothstep(-0.15, -0.45, r.y);
	float floorDark = smoothstep(0.2, 0.6, r.y);
	return 0.22 + window * 0.9 - floorDark * 0.2;
}

/// A brilliant-cut ruby seen from above. Each facet is tilted its own way, so a facet flashes as it
/// turns `light` (a direction in screen space, z toward the eye) into the eye. It reflects a small
/// room, light bounces once inside it to a facet across the stone, the edges between facets split
/// light into colour, and where the light meets the stone square a starburst glints. The body
/// colour shifts a little differently in each channel over `time`, for fire. Transparent outside.
[[ stitchable ]] half4 gem(float2 position, half4 color, float time, float2 size, float3 light) {
	float radius = min(size.x, size.y) / 2.0;
	// Scaled so the octagon's corners, a little further out than its flat sides, stay in frame;
	// the frame's spare margin holds the glint's rays.
	float2 p = (position - size / 2.0) / radius / cos(M_PI_F / 8.0) * 1.25;
	light = normalize(light);

	// The glint sits where the light would reflect straight back out of the table.
	float2 glintAt = clamp(-light.xy / max(light.z, 0.3) * 0.45, -0.6, 0.6);
	float2 g = p - glintAt;
	float rays = exp(-abs(g.x) * 60.0) * exp(-abs(g.y) * 4.0) + exp(-abs(g.y) * 60.0) * exp(-abs(g.x) * 4.0);
	float glint = (rays * 0.7 + exp(-length(g) * 14.0)) * smoothstep(0.6, 1.0, light.z);

	float d = octagonDistance(p);
	float pixel = 1.5 / radius;
	float coverage = 1.0 - smoothstep(1.0 - pixel, 1.0, d);
	if (coverage <= 0.0) {
		return half4(half3(glint), half(saturate(glint)));
	}

	Facet facet = facetAt(p, d);
	float3 normal = facet.normal;
	float3 eye = float3(0.0, 0.0, 1.0);
	float sparkle = pow(saturate(dot(reflect(-light, normal), eye)), 40.0);

	float phase = facet.id * 1.7 + time * 0.6;
	float3 inner = 0.5 + 0.5 * sin(float3(phase, phase + 2.1, phase + 4.2));
	float3 body = float3(0.55 + 0.4 * inner.r, 0.02 + 0.06 * inner.g, 0.06 + 0.12 * inner.b);
	body *= 0.45 + 0.45 * saturate(dot(normal, light));

	// One bounce inside: light entering here leaves through a facet across the stone, and flashes
	// red when that facet faces the light.
	float2 across = p - normal.xy * 1.1;
	Facet far = facetAt(across, octagonDistance(across));
	float bounce = pow(saturate(dot(reflect(-light, far.normal), eye)), 18.0);
	body += float3(0.95, 0.12, 0.18) * bounce * 0.8;

	// The room, reflected more strongly the more a facet slants away from the eye.
	float fresnel = 0.08 + 0.6 * pow(1.0 - normal.z, 2.0);
	float3 mirrored = reflect(-eye, normal);
	body += room(mirrored, light) * fresnel;

	// Dark seams where facets meet, with a thin split of colour along them where light falls.
	float angle = atan2(p.y, p.x) + M_PI_F;
	float seam = min(abs(d - 0.48), abs(d - 0.78));
	if (d >= 0.48) {
		float acrossSeam = fract(angle / (M_PI_F / 8.0));
		seam = min(seam, min(acrossSeam, 1.0 - acrossSeam) * (M_PI_F / 8.0) * length(p));
	}
	body *= mix(0.45, 1.0, smoothstep(0.0, 0.025, seam));
	float3 rainbow = 0.5 + 0.5 * cos(6.2832 * (angle * 1.5 + float3(0.0, 0.33, 0.67)));
	body += rainbow * (1.0 - smoothstep(0.0, 0.03, seam)) * saturate(dot(normal, light)) * 0.25;

	float3 rgb = body + sparkle * 0.9 + glint;
	float alpha = saturate(max(coverage, glint));
	return half4(half3(rgb * coverage + glint * (1.0 - coverage)), half(alpha));
}

// MARK: - Stone

/// A repeatable pseudo-random number in [0, 1) for a 2D point.
static float hash2(float2 p) {
	return fract(sin(dot(p, float2(127.1, 311.7))) * 43758.5453);
}

/// Smooth 2D value noise.
static float noise2(float2 p) {
	float2 i = floor(p);
	float2 f = fract(p);
	float2 u = f * f * (3.0 - 2.0 * f);
	return mix(
		mix(hash2(i), hash2(i + float2(1.0, 0.0)), u.x),
		mix(hash2(i + float2(0.0, 1.0)), hash2(i + float2(1.0, 1.0)), u.x),
		u.y);
}

/// Five octaves of noise, each finer and fainter: the roughness of natural surfaces.
static float fbm(float2 p) {
	float value = 0.0;
	float amplitude = 0.5;
	for (int octave = 0; octave < 5; octave++) {
		value += amplitude * noise2(p);
		p = p * 2.03 + 17.1;
		amplitude *= 0.5;
	}
	return value;
}

/// The bare rock's height at `p` (points / 38): folds from noise warped through itself, a fine
/// grain over them, and scattered pits.
static float rockHeight(float2 p) {
	float2 warp = float2(fbm(p), fbm(p + float2(5.2, 1.3)));
	float height = fbm(p + 1.8 * warp);
	height += 0.15 * fbm(p * 6.0);
	height -= 0.04 * smoothstep(0.8, 0.92, noise2(p * 7.0));
	return height;
}

/// How deep the carving runs, in the same units as the rock's height.
constant float carveDepth = 0.35;

/// The slab's surface height at `position`: the rock, less whatever the mask carves out of it.
static float surfaceHeight(SwiftUI::Layer mask, float2 position) {
	return rockHeight(position / 38.0) - float(mask.sample(position).r) * carveDepth;
}

/// The slab's face as weathered stone. `mask` is the face's shape, black, with the inscription and
/// cracks in white: those are pressed into the rock, so they shade as cuts rather than paint.
/// Lit from `light` (screen space, z toward the eye), with dark crevices, a faint sheen on the high
/// points, mineral flecks, and lichen toward the ground. The silhouette is chipped.
[[ stitchable ]] half4 stone(float2 position, SwiftUI::Layer mask, float2 size, float3 light) {
	half4 here = mask.sample(position);
	if (here.a < 0.01) {
		return half4(0.0h);
	}

	// Chips: near the edge, where noise says so, the stone is missing.
	float2 p = position / 38.0;
	float inside = 1.0;
	for (int k = 0; k < 4; k++) {
		float a = float(k) * M_PI_F / 2.0;
		inside = min(inside, float(mask.sample(position + float2(cos(a), sin(a)) * 5.0).a));
	}
	// Never along the bottom, which stands in the ground.
	bool nearBottom = position.y > size.y - 8.0;
	if (inside < 0.5 && !nearBottom && noise2(p * 1.6) > 0.72) {
		return half4(0.0h);
	}

	float carve = float(here.r);
	float height = surfaceHeight(mask, position);
	float e = 1.0;
	float dx = surfaceHeight(mask, position + float2(e, 0.0)) - surfaceHeight(mask, position - float2(e, 0.0));
	float dy = surfaceHeight(mask, position + float2(0.0, e)) - surfaceHeight(mask, position - float2(0.0, e));
	float3 normal = normalize(float3(-dx * 8.0, -dy * 8.0, 1.0));

	// Crevices in the rock, lower than their surroundings, get less light. Measured on the bare
	// rock: the carving is shaded by its walls' lighting instead, so a cut is not filled black.
	float around = 0.0;
	for (int k = 0; k < 4; k++) {
		float a = float(k) * M_PI_F / 2.0 + M_PI_F / 4.0;
		around += rockHeight((position + float2(cos(a), sin(a)) * 3.0) / 38.0);
	}
	float occlusion = saturate(0.85 + (rockHeight(p) - around / 4.0) * 2.5);

	float3 color = mix(float3(0.47, 0.46, 0.44), float3(0.62, 0.61, 0.58), fbm(p * 1.3));
	color = mix(color, float3(0.78, 0.77, 0.74), step(0.93, noise2(p * 25.0)) * 0.7);
	float ground = smoothstep(0.72, 1.0, position.y / size.y);
	float lichen = ground * smoothstep(0.55, 0.7, fbm(p * 2.2 + 3.7));
	color = mix(color, float3(0.55, 0.58, 0.34), lichen * 0.6);
	// The floor of a cut is in its own shadow, a little darker than the face.
	color *= 1.0 - carve * 0.25;

	light = normalize(light);
	float diffuse = saturate(dot(normal, light));
	float sheen = pow(saturate(dot(reflect(-light, normal), float3(0.0, 0.0, 1.0))), 30.0);
	sheen *= 0.15 * smoothstep(0.55, 0.75, height);

	float3 rgb = color * (0.35 + 0.75 * diffuse) * occlusion + sheen;
	float alpha = float(here.a);
	return half4(half3(rgb * alpha), half(alpha));
}
