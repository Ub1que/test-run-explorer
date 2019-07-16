import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as fg from 'fast-glob';
import * as AWS from 'aws-sdk';

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
			return Promise.resolve(this.jsonData);
		} else if (Array.isArray(element.entry)) {
			return Promise.resolve(this.getDeps(element.entry[0]));
		} else {
			return Promise.resolve(this.getDeps(element.entry));
		}
	}

	private getCurrentLocalBranchLastCommitSHA(){
		return new Promise((resolve, reject)=>{
			let simpleGit;
			try {
				simpleGit = require('simple-git')(vscode.workspace.workspaceFolders[0].uri.fsPath);
			} catch (error) {
				vscode.window.showErrorMessage('Couldn\'t find git repository');
			}

			simpleGit.branchLocal((error, data) => {
				if (error) {
					reject(error);
				} else {
					resolve(data.branches[data.current].commit);
				}
			});

		});
	}

	private async getResults(){
		const configuration = workspace.getConfiguration(
			"test-run-explorer"
		);

		const LOCAL = configuration.get("local");
		const S3_BUCKET: string = configuration.get("s3.bucket");
		// const S3_FOLDER: string = configuration.get("s3.folder");

		if (S3_BUCKET) {

			const currentCommitSHA: any = await this.getCurrentLocalBranchLastCommitSHA()
				.catch(error => {
					vscode.window.showErrorMessage(error);
				});

			AWS.config.update(
				{
					accessKeyId: configuration.get("s3.aws_access_key_id"),
					secretAccessKey: configuration.get("s3.aws_secret_access_key"),
					region: configuration.get("s3.region")
				}
			);

			const s3 = new AWS.S3({apiVersion: '2006-03-01'});

			const objects: any = await new Promise((resolve, reject) => {
				s3.listObjectsV2({
					Bucket: S3_BUCKET,
					Prefix: currentCommitSHA
				}, function(err, data) {
					if (err) reject(err);
					else resolve(data);
				});
			});

			let promisedObjects = objects.Contents.map(obj => {
				return new Promise((resolve,reject) => {
					s3.getObject({
						Bucket: S3_BUCKET,
						Key: obj.Key
					}, function(err, data) {
						if (err) reject(err);
						else resolve(data);
					});
				})
				.then((data: any) => {
					return {
						filename: obj.Key,
						entry: JSON.parse(data.Body.toString())
					};
				});
			});

			const resultData = await Promise.all(promisedObjects);

			return resultData.map((spec: any) => {
				return new Spec(
					vscode.TreeItemCollapsibleState.Collapsed,
					spec.entry.results,
					spec.filename
				);
			});

		} else if (LOCAL) {

			const searchDir = vscode.workspace.rootPath + configuration.get("local.resultFolder");
			const files = fg.sync([configuration.get("local.resultGlob")], {cwd: searchDir});
	
			return files
				.map((file: string) => {
					return {
						filename: file,
						entry: JSON.parse(fs.readFileSync(path.join(searchDir, file),'utf-8'))
					};
				})
				.map((spec: any) => {
					return new Spec(
						vscode.TreeItemCollapsibleState.Collapsed,
						spec.entry.results,
						spec.filename
					);
				});
		} else {
			vscode.window.showInformationMessage(`Please provide "test-run-explorer" configuration in settings.json`);
		}

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
