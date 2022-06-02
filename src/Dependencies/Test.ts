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
			arguments: [
				this.navigateLocation,
				this.entry.localPath.trim()
			],
		};
	}

	get navigateLocation(){
		if (this.entry.status === 'failed'){
			const errLocationRegExp = new RegExp(`${this.entry.localPath.trim()}:([0-9]+):([0-9]+)`);
			const matchResult = this.entry.failureMessages[0].match(errLocationRegExp);
			
			return matchResult ? { line: Number(matchResult[1]), column: Number(matchResult[2]) } : this.entry.location;
		}

		return this.entry.location;
	}

	get tooltip(): string {
		return `${this.entry.title}`;
	}

	get description(): string {
		return;
	}

	get iconPath() {
		switch (this.entry.status) {
			case 'passed':
				return {
					light: path.join(__filename, '..', '..', '..', 'resources', 'color', 'pass.svg'),
					dark: path.join(__filename, '..', '..', '..', 'resources', 'color', 'pass.svg')
				}
			case 'failed':
				return {
					light: path.join(__filename, '..', '..', '..', 'resources', 'color', 'fail.svg'),
					dark: path.join(__filename, '..', '..', '..', 'resources', 'color', 'fail.svg')
				};
			case 'pending':
				return {
					light: path.join(__filename, '..', '..', '..', 'resources', 'color', 'skip.svg'),
					dark: path.join(__filename, '..', '..', '..', 'resources', 'color', 'skip.svg')
				};
			default:
				return {
					light: path.join(__filename, '..', '..', '..', 'resources', 'color', 'caution.svg'),
					dark: path.join(__filename, '..', '..', '..', 'resources', 'color', 'caution.svg'),
				};
		}

	}

	contextValue = 'dependency';

}