const { EOL } = require("os")
const { loadSchema } = require("../loadSchema")

module.exports = function config(path,opts)
{
    return loadSchema(path,opts)
        .then(
            (schema) => {

                return "TODO: implement config"
            })
}

