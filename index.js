const create = require("./src/create")
const db = require("./src/db")
const config = require("./src/config")
const domain = require("./src/domain")
const typedocs = require("./src/typedocs")
const Yargs = require('yargs')
    .count('verbose')
    .alias('v', 'verbose')
    .boolean('pretty')
    .alias('pretty', ['p'])
    .describe('pretty', 'Pretty print JSON outputs')    // .option('min', {
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
    domain : domain,
    typedocs : typedocs,
}

if (fileArgs.length < 2 || Object.keys(COMMANDS).indexOf(fileArgs[0]) < 0)
{
    console.log("Usage: ff-autotool <command> <schema-file>");
    console.log("Commands:\n" +
                "  create\tcreate new schema file with helper definitions\n" +
                "  db    \tPrint PostgreSQL script for the domain\n" +
                "  config\tPrint relation config for the domain\n" + 
                "  domain\tPrint internal domain format\n" +
                "  typedocs\tPrint typedocs JSON");
    Yargs.showHelp();
    process.exit(1);
}

const [cmd, schemaPath] = fileArgs

import("snake-case").then(({snakeCase}) => {

    const opts = {
        verbose: argv.verbose,
        transformName: snakeCase,
        addLinkTableData: true,
        prettyJSON: argv.pretty
    }
    try
    {
        const fn = COMMANDS[cmd]
        if (!fn)
        {
            throw new Error("Could not find command " + cmd)
        }
        fn(schemaPath,opts).catch(e => {
            console.error("ERROR", e)
            process.exit(2);
        })
    }
    catch(e)
    {
        console.error("ERROR: ", e)
        process.exit(2);
    }
})

