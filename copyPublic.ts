import * as shell from "shelljs";

shell.mkdir('dist/public');
shell.cp('-R', 'public', 'dist/public');
