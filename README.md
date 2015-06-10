[![npm version](https://badge.fury.io/js/tsconfig-glob.svg)](http://badge.fury.io/js/tsconfig-glob)
[![Downloads](http://img.shields.io/npm/dm/tsconfig-glob.svg)](https://npmjs.org/package/tsconfig-glob)

# tsconfig-glob
A lightweight npm package + cli that allows you to specify glob patterns for tsconfig files. Most of the credit is due to glob/minimatch, this is a very thin layer on top of those libraries. 

## Install

Use `npm` to install this package.

Locally:

```shell
npm install tsconfig-glob --save-dev
```

or, Globally:

```shell
npm install -g tsconfig-glob --save-dev
```

## Usage

You can use this library as either a CLI or in a node script. It follows a similar format to the [atom-typescript](https://github.com/TypeStrong/atom-typescript/blob/master/docs/tsconfig.md) plugin:

0. You provide a path to a directory containing a tsconfig.json
0. You specify a `filesGlob` pattern in your tsconfig.json
0. The library will find the files matching the `filesGlob` patterns and put them in the `files` property

### Using the CLI
```shell
tsconfig .
```

#### Options

	```shell
	-i, --indent <number> The number of spaces to indent the tsconfig.json file (defaults to 4)
	```

### Using with Node

```ts
import * as tsconfig from 'tsconfig-glob';
tsconfig();
```

#### Options

```ts
{
	/**
	 * A relative path from cwd to the directory containing a tsconfig.json. If not specified, the '.' is used.
	 */
	configPath?: string;
	
	/**
	 * The current working directory, defaults to `process.cwd()`
	 */
	cwd?: string;
	
	/**
	 * The number of spaces to indent the tsconfig.json
	 */
	indent?: number;
}
```
#### Realistic Node Usage

```ts
import * as tsconfig from 'tsconfig-glob';
tsconfig({
	configPath: '.',
	cwd: process.cwd(),
	indent: 2
});
```