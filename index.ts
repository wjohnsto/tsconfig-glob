import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';
const stable: any = require('stable');

function unique(arr: Array<string>) {
    var keys: { [key: string]: boolean; } = {},
        out: Array<string> = [];

    for (var i = 0, l = arr.length; i < l; ++i) {
        if (keys.hasOwnProperty(arr[i])) {
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

    if (aTsd) {
        return -1;
    }

    if (bTsd) {
        return 1;
    }

    if (aD && bD) {
        return 0;
    }

    if (aD) {
        return -1;
    }

    if (bD) {
        return 1;
    }

    return 0;
}

function getFiles(options: IOptions, configFile: IConfigFile) {
    let root = options.cwd || process.cwd(),
        configDir = path.resolve(root, options.configPath || '.'),
        filesGlob: Array<string> = configFile.filesGlob || [],
        files: Array<string> = [];

    files = unique(files.concat(filesGlob));

    let include = files.filter((file) => {
        return file[0] !== '!';
    }),
        ignore = files.filter((file) => {
            return file[0] === '!';
        }),
        sortedFiles: Array<Array<string>> = [];

    for (let pattern of include) {
        sortedFiles.push(glob.sync(pattern, {
            cwd: configDir,
            root: root,
            ignore: ignore.map(file => file.slice(1))
        }));
    }

    sortedFiles = sortedFiles.map((files) => {
        return stable(files);
    });

    files = unique(sortedFiles.reduce((files, current) => {
        return files.concat(current);
    }, []));

    return stable(files, sort);
}

function eol(str: string): string {
    let cr = '\r',
        lf = '\n',
        r = /\r/.test(str),
        n = /\n/.test(str);

    if (r && n) {
        return cr + lf;
    }

    return lf;
}

export = function(options: IOptions): any {
    let root = options.cwd || process.cwd(),
        configDir = path.resolve(root, options.configPath || '.'),
        filePath = path.resolve(configDir, 'tsconfig.json'),
        fileStr = fs.readFileSync(filePath, 'utf8'),
        configFile: IConfigFile = JSON.parse(fileStr),
        EOL = eol(fileStr);

    if (options.empty) {
        configFile.files = [];
    } else {
        configFile.files = getFiles(options, configFile);
    }

    fs.writeFileSync(filePath, JSON.stringify(configFile, null, options.indent || 4)
        .replace(/\n\r|\n|\r/g, EOL));

    return configFile;
};

interface IConfigFile {
    filesGlob: Array<string>;
    files: Array<string>;
}

interface IOptions {
    args?: Array<string>;
    configPath?: string;
    cwd?: string;
    indent?: number;
    empty?: boolean;
}
