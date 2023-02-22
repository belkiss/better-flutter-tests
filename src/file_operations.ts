import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

/// Looks, if the path is in /lib folder
export function isPathInLibFolder(path: string): boolean {
	return path.indexOf("/lib/") >= 0;
}

export function isTestFile(filePath: string): boolean {
	return filePath.indexOf("/test/") >= 0 && path.basename(filePath).indexOf("_test.dart") >= 0;
}

export function getRelativePathInLibFolder(filePath: string): string {
	if (isPathInLibFolder(filePath)) {
		var index = filePath.indexOf("/lib/");
		return filePath.substring(index + 4);
	}
	else {
		throw new Error(`${filePath} is not inside of /lib`);
	}
}

///returns all paths of files in nested folders.
///can be used so: for (let filePath of walkSync(parentFolderPath)) {...
export function* walkSync(dir: string): Generator<string, any, undefined> {
	const files = fs.readdirSync(dir, { withFileTypes: true });
	for (let i = 0; i < files.length; i++) {
		if (files[i].isDirectory()) {
			yield* walkSync(path.join(dir, files[i].name));
		} else {
			yield path.join(dir, files[i].name);
		}
	}
}

export function isDirectoryEmpty(folderPath: string) {
	return fs.readdirSync(folderPath).length === 0;
}

///Takes a folderName!!!
export function getPathOfTestFolder(originalFolderPath: string): string {
	var relativPathToLibFolder = getRelativePathInLibFolder(originalFolderPath);
	var testFolder = "test" + relativPathToLibFolder; //path.dirname(relativPathToLibFolder);

	if (vscode.workspace.workspaceFolders !== undefined) {
		var rootPath = vscode.workspace.workspaceFolders[0].uri.path;
		return rootPath + "/" + testFolder;
	}
	else {
		throw new Error("No open workspaceFolders");
	}
}

export function findPubspecYamlDir(filePath: string): string | undefined {
	if (fs.existsSync(filePath)) {
		var candidate = filePath;
		if (fs.lstatSync(filePath).isFile()) {
			candidate = path.dirname(filePath);
		}

		do {
			if (fs.existsSync(candidate + "/pubspec.yaml")) {
				return candidate;
			}

			var parent = path.dirname(candidate);
			candidate = parent !== candidate ? parent : "";
		}
		while (candidate !== "");
	}
	return undefined;
}

export function getPathOfSourceFile(filePath: string): string {
	var nameOfSourceFile = getNameOfSourceFile(filePath);
	var folderOfSourceFile = path.dirname(filePath).replace("/test/", "/lib/");

	return folderOfSourceFile + "/" + nameOfSourceFile;
}

export function getPathOfTestFile(originalFilePath: string): string {
	var nameOfTestFile = getNameOfTestFile(originalFilePath);
	var folderOfTestFile = path.dirname(originalFilePath).replace("/lib/", "/test/");

	return folderOfTestFile + "/" + nameOfTestFile;
}

export function getNameOfSourceFile(originalFilePath: string): string {
	var nameOfOriginalFile = path.basename(originalFilePath);
	var idx = nameOfOriginalFile.indexOf("_test.dart");
	if (idx === -1) {
		//TODO: Throw Exception, its not a test file
		return "";
	}
	else {
		var nameOfSourceFile = nameOfOriginalFile.substring(0, idx) + path.extname(originalFilePath);
		return nameOfSourceFile;
	}
}

export function getNameOfTestFile(originalFilePath: string): string {
	var nameOfOriginalFile = path.basename(originalFilePath, path.extname(originalFilePath));
	var nameOfTestFile = nameOfOriginalFile + "_test" + path.extname(originalFilePath);

	return nameOfTestFile;
}

export function searchTestFilePath(test_file_name: string): string | null {

	var pathOfTestFolder = vscode.workspace.rootPath + "/test";

	var result = findPathsWithFileName(pathOfTestFolder, test_file_name, []);

	if (result.length >= 1) {
		return result[0];
	}
	else {
		return null;
	}

}

/// Returns paths of files with 
export function findPathsWithFileName(baseFolder: string, fileName: string, result: string[]) {
	var files = fs.readdirSync(baseFolder);
	result = result || [];

	files.forEach(
		function (file: string) {
			var newBaseFolder = path.join(baseFolder, file);
			if (fs.statSync(newBaseFolder).isDirectory()) {
				result = findPathsWithFileName(newBaseFolder, fileName, result);
			}
			else {
				if (file === fileName) {
					result.push(newBaseFolder);
				}
			}
		}
	);
	return result;
}

export function openDocumentInEditor(filePath: string) {

	//console.log("Open File: " + filePath);

	var openPath = vscode.Uri.parse("file://" + filePath);
	vscode.workspace.openTextDocument(openPath).then(doc => {

		//console.log("Opened " + openPath);


		vscode.window.showTextDocument(doc);
	});
}

//Returns the name of the package from pubspec.yaml
export function getPackageName() {
	var pubspecPath = vscode.workspace.rootPath + "/pubspec.yaml";

	var content = fs.readFileSync(pubspecPath).toString();

	//Search for the line "name: <package-name>" in pubspec.yaml
	var matches = content.match(/^name: (\w*)/);

	if (matches !== null && matches.length >= 2) {
		return matches[1];
	}
	else {
		throw new Error("Could not find the package name in pubspec.yaml");
	}

}
