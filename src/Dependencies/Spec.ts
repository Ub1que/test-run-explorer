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

	get iconPath() {
	
		let overallFailed = [];
		let overallSkipped = [];

		function findFailed(object) {
			if (object && Array.isArray(object)){

				object.forEach(function (obj) {
					return findFailed(obj);
				});

			} else if (object && typeof object === 'object'){
				Object.keys(object).forEach(function (key) {

					if (object[key] && Array.isArray(object[key])){
						
						object[key].forEach(function (obj) {
							return findFailed(obj);
						});

					} else if (object[key] && typeof object[key] === 'object'){
						return findFailed(object[key]);
					}

					if (key === 'fail' && object[key] === true) {
						overallFailed.push(object.uuid);
					} else if (key === 'state' && object[key] === 'skipped') {
						overallSkipped.push(object.uuid);
					}
					
				});
			}
		}

		findFailed(this.entry);

		if (overallFailed.length !== 0) {
			return {
				light: path.join(__filename, '..', '..', '..', 'resources', 'color', 'fail.svg'),
				dark: path.join(__filename, '..', '..', '..', 'resources', 'color', 'fail.svg')
			};
		} else if (overallSkipped.length !== 0) {
			return {
				light: path.join(__filename, '..', '..', '..', 'resources', 'color', 'skip.svg'),
				dark: path.join(__filename, '..', '..', '..', 'resources', 'color', 'skip.svg')
			};
		} else {
			return {
				light: path.join(__filename, '..', '..', '..', 'resources', 'color', 'pass.svg'),
				dark: path.join(__filename, '..', '..', '..', 'resources', 'color', 'pass.svg')
			};
		}
	}

	contextValue = 'dependency';

}