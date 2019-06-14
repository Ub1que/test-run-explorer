import * as vscode from 'vscode';
import * as fg from 'fast-glob';
import * as fs from 'fs';
import * as path from 'path';
import { parse, ParserOptions } from "@babel/parser";
import { ConfigurationProvider } from '../Configuration/ConfProvider';
import { workspace, WorkspaceFolder } from "vscode";


const TEST_TOKENS = ['it', 'test'];

export default function codeParser(testName: string) {
	const configuration = workspace.getConfiguration(
		"test-run-explorer"
	);

	const parserOptions: ParserOptions = {
		plugins: ["jsx", "typescript"],
		sourceType: "module",
		tokens: true
	};

	const searchDir = vscode.workspace.rootPath + configuration.get("testsFolder");
	const files = fg.sync([configuration.get("testsGlob")], {cwd: searchDir});

	const filesSoureCode = files.map((file: string) => {
		const sourceCode = fs.readFileSync(path.join(searchDir, file),'utf-8');
		return {
			tokens: parse(sourceCode, parserOptions).tokens,
			path: path.join(searchDir, file)
		};
	});

	return filesSoureCode
		.map(({tokens, path}) => {

			return tokens.map(({ value, loc, type }, index) => {
				
				if (
					TEST_TOKENS.includes(value)
					&& type.label === "name"
					// && !!ast.tokens[index + 1].type.startsExpr
				) {
					//loop through 6 nearest tokens to find test name
					for (let i = 1; i <= 6; i++) {
						if (tokens[index + i].value === testName){
							return { loc, value, path };
						}
					}
				}

			}).filter(Boolean);

		})
		.reduce((acc, occurance) => {
			return [...acc, ...occurance];
		},[]);


		
}