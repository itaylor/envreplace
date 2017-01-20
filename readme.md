# envreplace

Searches through files and replaces references to environment variables with the value of the named environment variable.

I use this to replace environment variables in config files at Docker container startup.

## Example

Given a file `test.file`:
```
My File with an ${env.ENV_VAR}
```
And a variable set in the shell:
```
export ENV_VAR='environment variable'
```
You could run:
```
envreplace test.file
```
And `test.file` would be changed to:
```
My File with an environment variable
```

## Installation
```
npm install -g envreplace
```

## Features:
* Supports specifying your own format for the regular expression that finds env var matches
* Allows use of node.js file globbing
* Verbose mode that logs all replacements
* Option to fail on missing variables

## CLI Documentation
```
envreplace --help
```
