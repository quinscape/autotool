const create = require("./src/cmd/create")
const db = require("./src/cmd/db")
const config = require("./src/cmd/config")
const domain = require("./src/cmd/domain")
const typedocs = require("./src/cmd/typedocs")
const Yargs = require('yargs')
    .count('verbose')
    .alias('v', 'verbose')
    .describe('verbose', "Print more information while processing")
    .boolean('pretty')
    .option('maxLength', {
        alias: "m",
        describe: 'Default maximum length for String fields',
    })
    .default('maxLength', 100)
    .option('precision', {
        alias: "p",
        describe: 'Default precision for decimal fields',
    })
    .default('precision', 19)
    .option('scale', {
        alias: "s",
        describe: 'Default scale for decimal fields',
    })
    .default('scale', 2)
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
                "  create\tCreate new schema file with helper definitions\n" +
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
        prettyJSON: argv.pretty,
        maxLength: argv.maxLength,
        precision: argv.precision,
        scale: argv.scale
    }
    try
    {
        const fn = COMMANDS[cmd]
        if (!fn)
        {
            throw new Error("Could not find command " + cmd)
        }
        fn(schemaPath,opts)
            .then(output => {
                if (typeof output === "string")
                {
                    console.log(output)
                }
                else
                {
                    console.log(JSON.stringify(output, null, opts.prettyJSON ? 4 : 0))
                }
            })
            .catch(e => {
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

