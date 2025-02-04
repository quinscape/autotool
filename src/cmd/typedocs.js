const { loadSchema } = require("../loadSchema")

module.exports = function typedocs(path,opts)
{
    // keep names as-is for typedocs
    opts.transformName = n => n
    // we need no link table data
    opts.addLinkTableData = false

    return loadSchema(path,opts)
        .then(
            (schema) => {

                const typeDocs = []

                const { types } = schema
                for (let i = 0; i < types.length; i++)
                {
                    const { name, description, fields, refs, backRefs, toMany} = types[i]

                    typeDocs.push({
                        name,
                        description,
                        fieldDocs : fields.concat(refs, backRefs, toMany)
                            .filter(e => !!e.description)
                            .map(({name,description}) => ({
                            name,
                            description
                        }))
                    })

                }
                return typeDocs
            })
}

