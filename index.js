const create = require("./src/create")
const db = require("./src/db")
const config = require("./src/config")
const Yargs = require('yargs')
    .count('verbose')
    .alias('v', 'verbose')
    // .option('max', {
    //     describe: 'Max clump count',
    // })
    // .option('min', {
    //     describe: 'Min clump count',
    // })
    // .option('pow', {
    //     alias: 'p',
    //     describe: 'Clump distribution power',
    // })
    // .option('step', {
    //     describe: 'clump size step',
    // })
    // .default("pow", 3, "(power of distribution)")
    // .default("step", 1, "clump size step")
    .help();
const argv = Yargs
    .argv;

const fileArgs = argv._

const COMMANDS = {
    create : create,
    db : db,
    config : config,
}

if (fileArgs.length < 2 || Object.keys(COMMANDS).indexOf(fileArgs[0]) < 0)
{
    console.log("Usage: ff-autotool <command> <schema-file>");
    console.log("Commands:\n" +
                "  create\tcreate new schema file with helper definitions\n" +
                "  config\tPrint relation config for the domain");
    Yargs.showHelp();
    process.exit(1);
}

const [cmd, schemaPath] = fileArgs

import("snake-case").then(({snakeCase}) => {

    const opts = {
        verbose: argv.verbose,
        snakeCase
    }

    COMMANDS[cmd](schemaPath,opts).then(
        schema => {
            console.info(schema);
        }
    ).catch(e => {
        console.error("ERROR", e)
        process.exit(2);

    })

})

