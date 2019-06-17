import * as vscode from 'vscode';
import * as path from 'path';

export default class Test extends vscode.TreeItem {
	constructor(
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly entry: any,
		// public readonly command?: vscode.Command
	) {
		super(entry.title, collapsibleState);

		this.command = {
			title: 'Navigate',
			command: 'nodeDependency.navigate',
			arguments: [entry.title],
		};
	}

	get tooltip(): string {
		return `${this.entry.title}`;
	}

	get description(): string {
		return;
	}

	get iconPath() {
		if (this.entry.pass) {
			return {
				light: path.join(__filename, '..', '..', '..', 'resources', 'color', 'pass.svg'),
				dark: path.join(__filename, '..', '..', '..', 'resources', 'color', 'pass.svg')
			};
		} else if (this.entry.fail) {
			return {
				light: path.join(__filename, '..', '..', '..', 'resources', 'color', 'fail.svg'),
				dark: path.join(__filename, '..', '..', '..', 'resources', 'color', 'fail.svg')
			};
		} else if (this.entry.state === 'skipped') {
			return {
				light: path.join(__filename, '..', '..', '..', 'resources', 'color', 'skip.svg'),
				dark: path.join(__filename, '..', '..', '..', 'resources', 'color', 'skip.svg')
			};
		} else {
			return {
				light: path.join(__filename, '..', '..', '..', 'resources', 'color', 'caution.svg'),
				dark: path.join(__filename, '..', '..', '..', 'resources', 'color', 'caution.svg'),
			};
		}
	}

	contextValue = 'dependency';

}