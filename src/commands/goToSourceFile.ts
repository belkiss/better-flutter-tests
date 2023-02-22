import * as vscode from 'vscode';

import * as fileOperations from '../file_operations';

export function activate(context: vscode.ExtensionContext) {
	let disposableGoToSource = vscode.commands.registerCommand('better-tests.goToSourceFile', async (args) => {
		// TODO: First see if the test file exists at the scheduled location
		// If not, you can still search for the file to move the file (Info Dialog)

		var path = vscode.window.activeTextEditor?.document.uri.path;
		if (path !== undefined) {
			var searchResultPath = fileOperations.getPathOfSourceFile(path);

			if (searchResultPath !== null) {
				//Note: Maybe check, if the path is correct to the original file path? Otherwise recommend to move it to another path?

				fileOperations.openDocumentInEditor(searchResultPath);
			}
			else {
				vscode.window.showInformationMessage("Could not find test '" + fileOperations.getNameOfSourceFile(path) + "' in 'test/'. Do you want to create it?");

			}
		}
		else {
			vscode.window.showErrorMessage("Could not get path of currently open file in explorer");
		}
	});

	context.subscriptions.push(disposableGoToSource);

}