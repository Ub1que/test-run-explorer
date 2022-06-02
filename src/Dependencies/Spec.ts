import * as vscode from 'vscode';
import * as path from 'path';

export default class Spec extends vscode.TreeItem {
	constructor(
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly entry: any,
		public readonly fileName: any,
		public readonly status: any,
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

	get iconPath() {
		switch (this.status) {
			case 'skipped':
				return {
					light: path.join(__filename, '..', '..', '..', 'resources', 'color', 'skip.svg'),
					dark: path.join(__filename, '..', '..', '..', 'resources', 'color', 'skip.svg')
				};
			case 'failed':
				return {
					light: path.join(__filename, '..', '..', '..', 'resources', 'color', 'fail.svg'),
					dark: path.join(__filename, '..', '..', '..', 'resources', 'color', 'fail.svg')
				};
			default:
				return {
					light: path.join(__filename, '..', '..', '..', 'resources', 'color', 'pass.svg'),
					dark: path.join(__filename, '..', '..', '..', 'resources', 'color', 'pass.svg')
				};
		}
	}

	contextValue = 'dependency';

}