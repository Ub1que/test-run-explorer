import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as fg from 'fast-glob';
import * as AWS from 'aws-sdk';

import Spec from './Dependencies/Spec';
import Suite from './Dependencies/Suite';
import Test from './Dependencies/Test';

import { workspace, WorkspaceFolder } from "vscode";

import { Octokit, App } from "octokit";

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
		}

		return Promise.resolve(this.getDeps(element.entry))

		// return Promise.resolve(this.nestData(element.entry));

		//  else if (Array.isArray(element.entry)) {
		// 	return Promise.resolve(this.getDeps(element.entry[0]));
		// } else {
		// 	return Promise.resolve(this.getDeps(element.entry));
		// }
	}

	private getCurrentLocalBranchLastCommitSHA(){
		return new Promise((resolve, reject)=>{
			let simpleGit;
			try {
				simpleGit = require('simple-git')(vscode.workspace.workspaceFolders[0].uri.fsPath);
			} catch (error) {
				vscode.window.showErrorMessage('Couldn\'t find git repository');
			}

			simpleGit.log((error, data) => {
				if (error) {
					reject(error);
				} else {
					resolve(data.latest.hash);
				}
			});

		});
	}

	private async getResults(){
		const octokit = new Octokit({
			auth: 'personal-access-token123'
		})
		
		await octokit.request('GET /repos/{owner}/{repo}/actions/artifacts', {
			owner: 'OWNER',
			repo: 'REPO'
		})
	}

	private async getResults2(){
		const configuration = workspace.getConfiguration(
			"test-run-explorer"
		);

		const LOCAL = configuration.get("local");
		const S3_BUCKET: string = configuration.get("s3.bucket");
		// const S3_FOLDER: string = configuration.get("s3.folder");

		if (S3_BUCKET) {

			const currentCommitSHA: any = await this.getCurrentLocalBranchLastCommitSHA()
				.then((hash: string) => hash.slice(0, configuration.get("commitHashLength")))
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
					else {
						if (data.Contents.length === 0){
							vscode.window.showInformationMessage(`No Objects found in S3 bucket "${S3_BUCKET}" with prefix "${currentCommitSHA}"`);
						}
						resolve(data);
					}
				});
			});

			objects.Contents = objects.Contents.filter(obj => obj.Size !== 0);

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

			// const searchDir = vscode.workspace.rootPath + configuration.get("local.resultFolder");
			// const files = fg.sync([configuration.get("local.resultGlob")], {cwd: searchDir});
	
			// return files
			// 	.map((file: string) => {
			// 		return {
			// 			filename: file,
			// 			entry: JSON.parse(fs.readFileSync(path.join(searchDir, file),'utf-8'))
			// 		};
			// 	})
			// 	.map((spec: any) => {
			// 		console.log('149: ', spec);
			// 		return new Spec(
			// 			vscode.TreeItemCollapsibleState.Collapsed,
			// 			spec.entry.results,
			// 			spec.filename
			// 		);
			// 	});
			// console.log('160: ', vscode.workspace.workspaceFolders);
			const rootPath = vscode.workspace.workspaceFolders[0].uri.path;
			const rootPathFolderName = vscode.workspace.workspaceFolders[0].name;

			const resultFile = path.join(rootPath, configuration.get("local.resultFilePath"));
			const jsonResult = JSON.parse(fs.readFileSync(resultFile,'utf-8'));

			return jsonResult.testResults.map(testFile => {
					const localPath = this.replacePathWithLocalRoot(rootPath, rootPathFolderName, testFile.testFilePath);
					return new Spec(
						vscode.TreeItemCollapsibleState.Collapsed,
						this.nestData(testFile, localPath),
						path.basename(testFile.testFilePath),
						this.getSuiteStatus(testFile)
					);
			});

		} else {
			vscode.window.showInformationMessage(`Please provide "test-run-explorer" configuration in settings.json`);
		}

	}

	getSuiteStatus(testFile){
		if (testFile.skipped){
			return 'skipped'
		}
		
		const haveFailed = !!testFile.testResults.find(test => test.status === 'failed');

		return haveFailed ? 'failed' : 'passed';
	}

	replacePathWithLocalRoot(rootPath, folderNameReplaceFrom, filePath){
		const furtherPath = filePath.match(new RegExp(`${folderNameReplaceFrom}(.*)`));

		if (!furtherPath){
			throw new Error(`Haven't found project folder name "${folderNameReplaceFrom}" in test result filepath`)
		}

		return path.join(rootPath, furtherPath[1]);
	}

	private nestData({testResults}, localPath): any[] {
		const data = testResults.reduce((acc, testItem) => {
			// create suites
			let deeperObject = acc;

			testItem.ancestorTitles.forEach((ancestorName) => {
				if (!deeperObject[ancestorName]){
					deeperObject[ancestorName] = {
						tests: []
					};
				}
				
				deeperObject = deeperObject[ancestorName];
			});

			// put test
			deeperObject.tests.push({
				...testItem,
				localPath
			});

			return acc;
		}, {})

		return data;
	}

	private getDeps(rootObj): any[] {
		const {tests, ...suites} = rootObj;
		const suiteItems = Object.entries(suites).map(([title, entry]) => {
			return new Suite(
				vscode.TreeItemCollapsibleState.Expanded,
				title,
				entry
			);
		});
		
		const testArray = tests || [];

		const testItems = testArray.map(testObj => {
			return new Test(
				vscode.TreeItemCollapsibleState.None,
				testObj
			);
		});

		return testItems.concat(suiteItems);
	}

	// private getDeps(rootObj): any[] {
	// 	const suites = rootObj.suites.map(suiteObj => {
	// 		return new Suite(
	// 			vscode.TreeItemCollapsibleState.Expanded,
	// 			suiteObj
	// 		);
	// 	});

	// 	const tests = rootObj.tests.map(suiteObj => {
	// 		return new Test(
	// 			vscode.TreeItemCollapsibleState.None,
	// 			suiteObj
	// 		);
	// 	});

	// 	return tests.concat(suites);
	// }

}
