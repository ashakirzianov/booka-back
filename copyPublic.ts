import * as shell from "shelljs";

shell.mkdir(__dirname + '/dist/public');
shell.cp('-R', __dirname + '/public', __dirname + '/dist/public');
