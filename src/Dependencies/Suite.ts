import * as vscode from 'vscode';
import * as path from 'path';

export default class Suite extends vscode.TreeItem {
	constructor(
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly title: any,
		public readonly entry: any
	) {
		super(title, collapsibleState);
	}

	get tooltip(): string {
		return `${this.title}`;
	}

	get description(): string {
		return;
	}

	iconPath = {
		light: path.join(__filename, '..','..', '..', 'resources', 'light', 'document.svg'),
		dark: path.join(__filename, '..','..', '..', 'resources', 'dark', 'document.svg')
	};

	contextValue = 'dependency';

}