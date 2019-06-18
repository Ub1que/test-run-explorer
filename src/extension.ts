'use strict';

import * as vscode from 'vscode';

import { DepNodeProvider } from './nodeDependencies';

import navigateToFile from './Commands/navigate';

export function activate(context: vscode.ExtensionContext) {

	const nodeDependenciesProvider = new DepNodeProvider(vscode.workspace.rootPath);
	vscode.window.registerTreeDataProvider('nodeDependencies', nodeDependenciesProvider);
	vscode.commands.registerCommand('nodeDependencies.refreshEntry', () => nodeDependenciesProvider.refresh());
	vscode.commands.registerCommand('nodeDependency.navigate', navigateToFile);

}