import * as vscode from 'vscode';
import * as path from 'path';

export default class Spec extends vscode.TreeItem {
	constructor(
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly entry: any,
		public readonly fileName: any,
		public readonly command?: vscode.Command
	) {
		super(fileName, collapsibleState);
	}

	get tooltip(): string {
		return `${this.fileName}`;
	}

	get description(): string {
		return;
	}

	iconPath = {
		light: path.join(__filename, '..','..', '..', 'resources', 'light', 'dependency.svg'),
		dark: path.join(__filename, '..', '..', '..', 'resources', 'dark', 'dependency.svg')
	};

	contextValue = 'dependency';

}