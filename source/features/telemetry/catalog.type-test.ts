import type {
	Expect,
	IsClosed,
	MapGroupLabel,
	PublicEventTitle,
	PublicTextIsAnonymous,
	RoutePattern,
} from './catalog'

/** Literal unions and numbers pass. */
export type LiteralUnionPasses = Expect<
	IsClosed<{name: 'x'; attributes: {axis: 'a' | 'b'; count: number}}>
>

/** A branded route pattern passes. */
export type BrandedTextPasses = Expect<IsClosed<{name: 'x'; attributes: {route: RoutePattern}}>>

/** An event with no attributes passes. */
export type EmptyAttributesPass = Expect<IsClosed<{name: 'x'; attributes: Record<string, never>}>>

/** A plain string fails: this is the guard doing its job. */
// @ts-expect-error -- `query: string` would let free text reach Sentry
export type PlainStringFails = Expect<IsClosed<{name: 'x'; attributes: {query: string}}>>

/** One open attribute among closed ones still fails. */
// @ts-expect-error -- `name: string` sits beside a closed attribute
export type MixedFails = Expect<IsClosed<{name: 'x'; attributes: {axis: 'a'; name: string}}>>

/** An anonymous event may carry a public title. */
export type AnonymousTitlePasses = Expect<
	PublicTextIsAnonymous<{name: 'x'; anonymous: true; attributes: {title: PublicEventTitle}}>
>

/** An event with no attributes carries no public text. */
export type EmptyHasNoPublicText = Expect<
	PublicTextIsAnonymous<{name: 'x'; attributes: Record<string, never>}>
>

/** A public title on an ordinary event, which would sit beside the device ID. */
type TitleBesideDeviceId = {name: 'x'; attributes: {title: PublicEventTitle}}

/** That event fails: the formatter keeps this on one line, so the directive covers it. */
// @ts-expect-error -- a title on an event that keeps the device ID
export type NamedTitleFails = Expect<PublicTextIsAnonymous<TitleBesideDeviceId>>

/** A branded map group label passes. */
export type MapGroupLabelPasses = Expect<IsClosed<{name: 'x'; attributes: {group: MapGroupLabel}}>>
