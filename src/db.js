const loadSchema = require("./loadSchema")
const {unwrapAll, isNonNull, isList, unwrapNonNull} = require("./type-utils")
let snakeCase


module.exports = function db(path,opts)
{
    snakeCase = opts.snakeCase

    return loadSchema(path,opts)
        .then(
            (schema) => {

                console.log(JSON.stringify(schema, null, 4))

        })
}

