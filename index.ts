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
            ignore: ignore.map(file => file.slice(1))
        } as glob.IOptions));
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

function bomCheck1(str: any): boolean {
    return typeof str === 'string' && str.charCodeAt(0) === 0xFEFF;
}

function bomCheck2(str: any): boolean {
    return typeof str === 'string' && (<any>str)[0] === 0xEF && (<any>str)[1] === 0xBB && (<any>str)[2] === 0xBF;
}

function getBom(str: string): string {
    if (bomCheck1(str)) {
        return str[0];
    }

    if (bomCheck2(str)) {
        return str.slice(0, 3);
    }

    return '';
}

function stripBom(str: string): string {
    if (bomCheck1(str)) {
        return str.slice(1);
    }

    if (bomCheck2(str)) {
        return str.slice(3);
    }

    return str;
}

export = function(options: IOptions = {}, done: Function = () => { }): any {
    let root = options.cwd || process.cwd(),
        configName = options.configFileName || 'tsconfig.json',
        configDir = path.resolve(root, options.configPath || '.'),
        filePath = path.resolve(configDir, configName),
        fileStr = fs.readFileSync(filePath, 'utf8');

    let bom = getBom(fileStr);

    fileStr = stripBom(fileStr);

    let configFile: IConfigFile = JSON.parse(fileStr),
        async = (options.async != null) ? options.async : true,
        EOL = eol(fileStr);

    if (options.empty) {
        configFile.files = [];
    } else {
        configFile.files = getFiles(options, configFile);
    }

    if (!options.indent || Number(options.indent) === 0) {
        options.indent = 4;
    }

    let newLineRegex = /\n\r|\r\n|\n|\r/g,
        outputStr = JSON.stringify(configFile, null, options.indent),
        outputCompare = outputStr.replace(newLineRegex, ''),
        fileCompare = fileStr.replace(newLineRegex, '');

    if (outputCompare === fileCompare) {
        if (async) {
            setImmediate(done);
        } else {
            done();
        }
    } else {
        outputStr = outputStr.replace(newLineRegex, EOL) + EOL;
        outputStr = bom.concat(outputStr);

        if (async) {
            fs.writeFile(filePath, outputStr, done);
        } else {
            try {
                fs.writeFileSync(filePath, outputStr);
                done();
            } catch (error) {
                done(error);
            }
        }
    }

    return configFile;
};

interface IConfigFile {
    filesGlob: Array<string>;
    files: Array<string>;
}

interface IOptions {
    args?: Array<string>;
    configPath?: string;
    configFileName?: string;
    cwd?: string;
    indent?: number;
    empty?: boolean;
    async?: boolean;
}
