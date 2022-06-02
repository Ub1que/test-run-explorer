import * as vscode from 'vscode';
import codeParser from '../Parser/parser';

export default function navigate(location, path){
	vscode.workspace.openTextDocument(path).then(d=> {
		vscode.window.showTextDocument(d).then(textEditor=>{
			goTolLine(location.line);           
		});
	});
}

// export default function navigateToFile(testName){
// 	const token = codeParser(testName);
	
// 	switch (true) {
// 		case (token.length === 0):
// 			vscode.window.showInformationMessage(`No tests found on name '${testName}'`);
// 			break;
	
// 		case (token.length > 1):
// 			vscode.window.showInformationMessage(`More than one test was found on name '${testName}'. Moveing to first`);

// 		default:
// 			vscode.workspace.openTextDocument(token[0].path).then(d=> {
// 				vscode.window.showTextDocument(d).then(textEditor=>{
// 					goTolLine(token[0].loc.start.line);           
// 				});
// 			});
// 	}

// }

function goTolLine(line: number):void {
	var line = line===0 ? line : line-1;
	var newSelection = new vscode.Selection(line, 0, line, 0);
	vscode.window.activeTextEditor.selection = newSelection;
	vscode.window.activeTextEditor.revealRange(newSelection, vscode.TextEditorRevealType.InCenter);
}