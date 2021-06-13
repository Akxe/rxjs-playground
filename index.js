const initialCode = `import { of } from 'file:///node_modules/rxjs/src/index';
import { map } from 'file:///node_modules/rxjs/src/operators/index';

of([1,2,3]).pipe(
	map(x => \`!\${x}!\`),
);
`;

export function initializeVSCode (dtsFiles) {
	require.config({
		paths: {
			vs: 'https://typescript.azureedge.net/cdn/4.0.5/monaco/min/vs',
			sandbox: 'https://www.typescriptlang.org/js/sandbox',
		},
		// This is something you need for monaco to work
		ignoreDuplicateModules: ['vs/editor/editor.main'],
	});

	// Grab a copy of monaco, TypeScript and the sandbox
	require([
		'vs/editor/editor.main',
		'vs/language/typescript/tsWorker',
		'sandbox/index',
	], (main, _tsWorker, sandboxFactory) => {
		const isOK = main && window.ts && sandboxFactory;
		if (isOK) {
			document.getElementById('loader').remove();
		} else {
			console.error('Could not get all the dependencies of sandbox set up!');
			console.error({
				main: !!main,
				ts: !!window.ts,
				sandbox: !!sandbox,
			});
			return;
		}

		// Create a sandbox and embed it into the the div #monaco-editor-embed
		/** @type {import('./vendor/dts/sandbox').PlaygroundConfig} */
		const sandboxConfig = {
			text: initialCode,
			domID: 'monaco-editor-embed',
			acquireTypes: false,
			supportTwoslashCompilerOptions: true,
		};

		/** @type {import('./vendor/dts/sandbox').Sandbox} */
		const sb = sandboxFactory.createTypeScriptSandbox(sandboxConfig, main, window.ts);
		window.sandbox = sb;

		// Loop through the paths in the JSON file and add them to the monaco background workers
		Object.keys(dtsFiles).forEach((path) => {
			sb.languageServiceDefaults.addExtraLib(dtsFiles[path], `file:///${path}`);
		});

		// Adds a global instance of rxjs to the type system
		const toImport = ['rxjs', 'rxjs/operators', 'rxjs/testing'];
		const globalDTS = toImport.map(pcg => `/// <reference path="${pcg}" />`).join('/n');
		sb.languageServiceDefaults.addExtraLib(globalDTS, 'file:///node_modules/@types/ambient/index.d.ts');
	});
}
