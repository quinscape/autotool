const loadSchema = require("../loadSchema")

const data =     {
    "name": "AppVersion",
    "description": "Stores merge version metadata",
    "fieldDocs": [
        {
            "name" : "id",
            "description" : "Id of the version. Is the same as the version field in the entity."
        },
        {
            "name" : "data",
            "description" : "JSONB containing the meta-data of the version"
        },
        {
            "name" : "ownerId",
            "description" : "User-id of the owner that created the version"
        },
        {
            "name" : "owner",
            "description" : "Embedded owner object"
        },
        {
            "name" : "created",
            "description" : "Timestamp when the version was created"
        }
    ]
}

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

                console.log(JSON.stringify(typeDocs, null, opts.prettyJSON ? 4 : 0))
            })
}

