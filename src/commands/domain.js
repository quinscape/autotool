const loadSchema = require("./loadSchema")

module.exports = function db(path,opts)
{
    return loadSchema(path,opts)
        .then(
            (schema) => {
                console.log(JSON.stringify(schema, null, opts.prettyJSON ? 4 : 0))
            })
}

