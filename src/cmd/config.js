const { EOL } = require("os")
const { loadSchema } = require("../loadSchema")

module.exports = function config(path,opts)
{
    return loadSchema(path,opts)
        .then(
            (schema) => {

                //console.log(JSON.stringify(schema, null, 4))

                let out = ""
                const { types, linkTables } = schema
                for (let i = 0; i < types.length; i++)
                {
                    const {name, refs, backRefs} = types[i]

                    for (let j = 0; j < refs.length; j++)
                    {
                        const ref = refs[j]

                        const targetType = types.find( t => t.name === ref.type)
                        const backRef = targetType.backRefs.find(b => b.sourceType === name && b.sourceField === ref.name)
                        //console.log({backRef, name, field: ref.name, backRefs})

                        out += `.configureRelation(${name.toUpperCase()}.${ref.name.toUpperCase()}, SourceField.OBJECT_AND_SCALAR, TargetField.${backRef != null ? "MANY" : "NONE"}, "${ref.name}", ${backRef != null ? '"' + backRef.name + '"' : "null"})${EOL}`
                    }
                }

                for (let i = 0; i < linkTables.length; i++)
                {
                    const { name, refs } = linkTables[i]
                    const targetType = types.find( t => t.name === refs[1].type)
                    const backRef = targetType.backRefs.find(b => b.type === refs[1].type && b.name === refs[1].name)

                    out += `.configureRelation(${name.toUpperCase()}.${(refs[1].type + "_id").toUpperCase()}, SourceField.OBJECT_AND_SCALAR, TargetField.MANY, "${refs[1].type}", ${backRef != null ? '"' + backRef.name + '"' : "null"})${EOL}`
                    out += `.configureRelation(${name.toUpperCase()}.${(refs[0].type + "_id").toUpperCase()}, SourceField.OBJECT_AND_SCALAR, TargetField.MANY, "${refs[0].type}", ${refs[0].name})${EOL}`

                }


                return out;
            })
}

