const { introspectionFromSchema } = require("graphql")
const { GraphQLFileLoader } = require("@graphql-tools/graphql-file-loader")
const { loadSchema : gqlLoadSchema } = require("@graphql-tools/load")
const fs = require("fs")
const { unwrapAll, isList, unwrapNonNull, isNonNull} = require("./type-utils")

let transformName
const BLACKLIST = [
    "BackReference",
    "QueryType",
    "MutationType",
    "ComputedValue",
    "DomainObject",
    "FieldExpression",
    "GenericScalar",
]
const SCALARS = ["BigDecimal","Boolean","Byte","Condition","Date","Int","JSONB","Long","String","Text","Timestamp"]

function collectBackReferences(typeDefinitions)
{
    const backReferences = {};
    for (let i = 0; i < typeDefinitions.length; i++)
    {
        const { name, fields } = typeDefinitions[i]
        for (let j = 0; j < fields.length; j++)
        {
            const field = fields[j]


            const { name: sourceField, args, type } = field
            for (let k = 0; k < args.length; k++)
            {
                const arg = args[k]
                if (arg.type && arg.type.name === "BackReference")
                {
                    const typeName = unwrapAll(type).name
                    const { name : backRefName } = arg
                    let array = backReferences[typeName]
                    if (!array)
                    {
                        array = []
                        backReferences[typeName] = array
                    }

                    array.push({
                        name: transformName(backRefName),
                        type: transformName(typeName),
                        sourceType: transformName(name),
                        sourceField: transformName(sourceField),
                    })
                }
            }
        }
    }

    return backReferences
}


const maxLengthRE = /m([0-9]+)/

function getMaxLength(args)
{
    for (let i = 0; i < args.length; i++)
    {
        const arg = args[i]
        const m = maxLengthRE.exec(arg.name)
        if (m)
        {
            return +m[1]
        }
    }
    return 100
}


function getFields(def)
{
    let out = []
    const { fields } = def
    for (let i = 0; i < fields.length; i++)
    {
        const {name,type,args,description} = fields[i]

        const typeName = unwrapAll(type).name

        if (SCALARS.indexOf(typeName) >= 0 && !isList(unwrapNonNull(type)))
        {
            let maxLength  = 0
            if (typeName === "String")
            {
                maxLength = getMaxLength(args)
            }
            const nonNull = isNonNull(type)
            out.push({
                name: transformName(name),
                description,
                type: transformName(typeName),
                nonNull,
                maxLength
            })
        }
    }

    return out
}

function getReferences(def)
{
    let out = []
    const { fields } = def
    for (let i = 0; i < fields.length; i++)
    {
        const {name,type,description} = fields[i]

        const typeName = unwrapAll(type).name

        if (SCALARS.indexOf(typeName) < 0 && !isList(unwrapNonNull(type)))
        {
            const nonNull = isNonNull(type)
            out.push({
                name: transformName(name),
                description,
                type: transformName(typeName),
                nonNull
            })
        }
    }

    return out
}

function getToMany(def)
{
    let out = []
    const { fields } = def
    for (let i = 0; i < fields.length; i++)
    {
        const {name,type,description} = fields[i]

        const nonNull = isNonNull(type)

        if (isList(unwrapNonNull(type)))
        {
            out.push({
                name: transformName(name),
                description,
                type: transformName(unwrapAll(type).name),
                nonNull,
                sourceType: transformName(def.name),
                sourceField: transformName(name)
            })
        }
    }

    return out
}


/**
 * Convert a GraphQL schema introspection into the internal automaton-centric format
 *
 * @param schema    GraphQL schema introspection
 * @param opts      options
 * @return {{types: *[], linkTables: *[]}}  internal format (see README.md)
 */
function processSchema(schema, opts)
{
    const typeDefinitions = schema.types
        .filter(
            t => t.name[0] !== "_" && BLACKLIST.indexOf(t.name) < 0 && SCALARS.indexOf(t.name) < 0
        )
    const backReferences = collectBackReferences(typeDefinitions)

    const processedTypes = []
    const linkTables = []

    for (let i = 0; i < typeDefinitions.length; i++)
    {
        const def = typeDefinitions[i]
        const typeName = transformName(def.name)

        const backRefs = backReferences[def.name]
        const fields = getFields(def)
        const toMany = getToMany(def)
        const refs = getReferences(def)

        processedTypes.push({
            name: typeName,
            description: def.description,
            fields,
            refs,
            backRefs,
            toMany
        })

        if (opts.verbose)
        {
            console.log("TABLE",  typeName)
            for (let j = 0; j < fields.length; j++)
            {
                const {name, type, maxLength} = fields[j]
                console.log("    ", name, ": ", type, maxLength !== 0 ? "( maxLength = " + maxLength + ")" : "")
            }

            if (refs.length)
            {
                for (let j = 0; j < refs.length; j++)
                {
                    const {name,type} = refs[j]
                    console.log("    ",name, ": -> ", type, "# ref")

                }
            }
            if (backRefs)
            {
                for (let j = 0; j < backRefs.length; j++)
                {
                    const {name, type} = backRefs[j]
                    console.log("    ",name, ": -> ", type, "# backref")
                }
            }
            if (toMany.length)
            {
                for (let j = 0; j < toMany.length; j++)
                {
                    const {name, type} = toMany[j]
                    console.log("    ",name, ": -> ", type, "# toMany")
                }
            }
        }



        if (toMany.length && opts.addLinkTableData)
        {
            for (let j = 0; j < toMany.length; j++)
            {
                const { name, type, sourceType, sourceField } = toMany[j]

                linkTables.push({
                    name: transformName(sourceType) + "_" + transformName(sourceField),
                    left: transformName(sourceType) + "_id",
                    right: transformName(type) + "_id",
                    leftType: sourceType,
                    rightType: type
                })
            }
        }


    }
    return {
        types: processedTypes,
        linkTables
    }
}


module.exports = function loadSchema(path, opts)
{
    transformName = opts.transformName

    if (!fs.existsSync(path))
    {
        throw new Error("Could not find schema " + path)
    }

    return gqlLoadSchema(path, {
        loaders: [new GraphQLFileLoader()],
    }).then(
        schema => {
            const introspection = introspectionFromSchema(schema)

            const input = introspection.__schema
            //console.log(JSON.stringify(input, null, 4))
            return processSchema(input, opts)
        }
    )
    .catch(error => {
        console.error("Error loading schema", error)
        process.exit(2)
    })

}
