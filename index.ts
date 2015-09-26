import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';

function unique(arr: Array<string>) {
	var keys: { [key: string]: boolean; } = {}, 
		out: Array<string> = [];
	
	for(var i = 0, l = arr.length; i < l; ++i){
		if(keys.hasOwnProperty(arr[i])) {
			continue;
		}

		out.push(arr[i]);
		keys[arr[i]] = true;
	}
	
	return out;
}

function sort(a: string, b: string) {
	var aTsd = a.indexOf('tsd.d.ts') > -1,
		bTsd = b.indexOf('tsd.d.ts') > -1,
		aD = a.indexOf('.d.ts') > -1,
		bD = b.indexOf('.d.ts') > -1;

	if(aTsd) {
		return -1;
	}

	if(bTsd) {
		return 1;
	}

	if(aD && bD) {
		return 0;
	}
	
	if(aD) {
		return -1;
	}
	
	if(bD) {
		return 1;
	}
	
	return 0;
}

export = function(options: { args?: Array<string>; configPath?: string; cwd?: string; indent?: number; replace?: boolean; empty?: boolean; }): any {
	var root = options.cwd || process.cwd(),
		configDir = path.resolve(root, options.configPath || '.'),
		filePath = path.resolve(configDir, 'tsconfig.json'),
		configFile: { filesGlob: Array<string>; files: Array<string>; } = require(filePath),
		filesGlob: Array<string> = configFile.filesGlob || [],
		files = unique(filesGlob.concat(!options.replace && configFile.files || [])),
		include = files.filter(function(file) {
			return file[0] !== '!';
		}),
		ignore = files.filter(function(file) {
			return file[0] === '!';
		});

	if (options.empty) {
		configFile.files = [];
	} else {
		configFile.files = include.reduce(function(files, pattern) {
			return unique(files.concat(glob.sync(pattern, {
				cwd: configDir,
				root: root,
				ignore: ignore.map(file => file.slice(1))
			})));
		}, []).sort(sort);
	}

	fs.writeFileSync(filePath, JSON.stringify(configFile, null, options.indent || 4));
	
	return configFile;
};
