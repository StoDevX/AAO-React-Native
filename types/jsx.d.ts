// @types/react@19 removed the global JSX namespace; the React team now recommends
// referencing React.JSX.* instead of JSX.*. This codebase has hundreds of existing
// JSX.Element references that predate the removal. Re-export the relevant members
// of React.JSX as a global JSX namespace so existing type annotations keep resolving.
//
// Migration note: new code should prefer React.JSX.Element directly. This shim exists
// to avoid a mechanical sweep across ~160 files as part of the RN 0.76 → 0.79
// (React 18 → 19) upgrade.
import type {JSX as ReactJSX} from 'react'

declare global {
	namespace JSX {
		type ElementType = ReactJSX.ElementType
		type Element = ReactJSX.Element
		type ElementClass = ReactJSX.ElementClass
		type ElementAttributesProperty = ReactJSX.ElementAttributesProperty
		type ElementChildrenAttribute = ReactJSX.ElementChildrenAttribute
		type LibraryManagedAttributes<C, P> = ReactJSX.LibraryManagedAttributes<
			C,
			P
		>
		type IntrinsicAttributes = ReactJSX.IntrinsicAttributes
		type IntrinsicClassAttributes<T> = ReactJSX.IntrinsicClassAttributes<T>
		type IntrinsicElements = ReactJSX.IntrinsicElements
	}
}
