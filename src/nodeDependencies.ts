import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as fg from 'fast-glob';

import Spec from './Dependencies/Spec';
import Suite from './Dependencies/Suite';
import Test from './Dependencies/Test';

import { workspace, WorkspaceFolder } from "vscode";

export class DepNodeProvider implements vscode.TreeDataProvider<any> {

	private _onDidChangeTreeData: vscode.EventEmitter<Spec | Suite | Test | undefined> = new vscode.EventEmitter<Spec | Suite | Test | undefined>();
	readonly onDidChangeTreeData: vscode.Event<Spec | Suite | Test | undefined> = this._onDidChangeTreeData.event;
	jsonData: any;

	constructor(private workspaceRoot: string) {
		this.jsonData = this.getResults();
	}

	refresh(): void {
		this.jsonData = this.getResults();
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: any): vscode.TreeItem {
		return element;
	}

	getChildren(element?: any): Thenable<any[]> {
		if (!element) {
			return Promise.resolve(this.getSpecDeps(this.jsonData));
		} else if (Array.isArray(element.entry)) {
			return Promise.resolve(this.getDeps(element.entry[0]));
		} else {
			return Promise.resolve(this.getDeps(element.entry));
		}
	}

	private getResults(){
		const configuration = workspace.getConfiguration(
			"test-run-explorer"
		);

		const searchDir = vscode.workspace.rootPath + configuration.get("resultFolder");
		const files = fg.sync([configuration.get("resultGlob")], {cwd: searchDir});

		return files.map((file: string) => {
				return {
					filename: file,
					entry: JSON.parse(fs.readFileSync(path.join(searchDir, file),'utf-8'))
				};
			});
	}

	private getSpecDeps(arrayOfSpecObj: any[]): Spec[] {
		return arrayOfSpecObj.map((spec: any) => {
			return new Spec(
				vscode.TreeItemCollapsibleState.Expanded,
				spec.entry.results,
				spec.filename
			);
		});
	}

	private getDeps(rootObj): any[] {
		const suites = rootObj.suites.map(suiteObj => {
			return new Suite(
				vscode.TreeItemCollapsibleState.Expanded,
				suiteObj
			);
		});

		const tests = rootObj.tests.map(suiteObj => {
			return new Test(
				vscode.TreeItemCollapsibleState.None,
				suiteObj
			);
		});

		return tests.concat(suites);
	}

}
