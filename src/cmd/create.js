const fs = require("fs")
const path = require("path")
const shelljs = require("shelljs")
module.exports = function create(schemaPath)
{
    if (fs.existsSync(schemaPath))
    {
        throw new Error("Cannot create schema" + schemaPath + ": File does already exist.")
    }

    return new Promise(
        resolve => {
            shelljs.cp(
                path.resolve(__dirname, "../../domain/new.graphql"),
                schemaPath
            )
            resolve("Empty domain with helpers written to " + schemaPath)
        }
    )
}
