const { loadSchema } = require("../loadSchema")

module.exports = function db(path,opts)
{
    return loadSchema(path,opts)
        .then(
            (schema) => {
                return schema
            })
}

