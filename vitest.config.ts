import {defineConfig, type Plugin} from 'vitest/config'
import {transformSync} from 'esbuild'

// Some React Native ecosystem packages ship raw JSX in .js files.
// Vite's default esbuild integration only parses .jsx/.tsx as JSX.
// This plugin transforms .js files containing JSX in node_modules.
function jsxInJsPlugin(): Plugin {
	return {
		name: 'jsx-in-js',
		enforce: 'pre',
		transform(code, id) {
			if (
				id.endsWith('.js') &&
				id.includes('node_modules') &&
				/<[A-Z]/.test(code)
			) {
				console.error(`[jsx-in-js] Transforming: ${id}`)
				try {
					const result = transformSync(code, {
						loader: 'jsx',
						jsx: 'transform',
						format: 'esm',
					})
					console.error(`[jsx-in-js] Success: ${id}`)
					return {code: result.code, map: null}
				} catch (e) {
					console.error(`[jsx-in-js] Failed: ${id}`, e)
					throw e
				}
			}
		},
	}
}

export default defineConfig({
	plugins: [jsxInJsPlugin()],
	define: {
		__DEV__: 'true',
	},
	resolve: {
		extensions: [
			'.ios.ts',
			'.ios.tsx',
			'.ios.js',
			'.ios.jsx',
			'.mjs',
			'.js',
			'.mts',
			'.ts',
			'.jsx',
			'.tsx',
			'.json',
		],
		conditions: ['react-native'],
	},
	test: {
		include: ['**/__tests__/**/*.(spec|test).(js|ts|tsx)'],
		exclude: ['**/node_modules/**'],
		globals: true,
		globalSetup: ['./scripts/vitest-global-setup.ts'],
		pool: 'forks',
		poolOptions: {
			forks: {
				execArgv: ['--require', './scripts/vitest-preload.cjs'],
			},
		},
		server: {
			deps: {
				external: [
					'react-native',
					/^@react-native\//,
					/^@react-native-/,
				],
				// RN ecosystem packages that need Vite transforms
				// (JSX in .js files, Flow types, etc.)
				inline: [
					'react-native-button',
					'react-native-inappbrowser-reborn',
					'react-native-vector-icons',
					'react-native-keychain',
				],
			},
		},
		coverage: {
			include: [
				'modules/**/*.js',
				'modules/**/*.ts',
				'modules/**/*.tsx',
				'source/**/*.js',
				'source/**/*.ts',
				'source/**/*.tsx',
			],
		},
		setupFiles: ['./scripts/vitest-setup.ts'],
		reporters: ['default'],
	},
})
