const { EOL } = require("os")

function notNullConditional(nonNull)
{
    return nonNull ? " NOT NULL" : ""
}

function TABLE(schema, name, opts, fields)
{
    let out = `${opts.dropTables ? "" : "-- "}DROP TABLE IF EXISTS ${schema}.${name}${EOL}${EOL}`
    out += `create table ${schema}.${name}${EOL}(${EOL}`
    out += fields()
    out += `);${EOL}`
    return out
}


function FIELD(name, sqlType, nonNull, addComma = true)
{
    return `    ${name} ${sqlType}${notNullConditional(nonNull)}${addComma? "," : ""}${EOL}`
}

function PRIMARY_KEY(name)
{
    return `    CONSTRAINT ${ name } PRIMARY KEY (id)`
}


function PK(dbSchema, tableName, opts, refs)
{
    // Add primary key for table
    let out = `ALTER TABLE ONLY ${dbSchema}.${tableName}${EOL}  ADD CONSTRAINT uc_${tableName}_id UNIQUE (id);${EOL}`
    out += `ALTER TABLE ONLY ${dbSchema}.${tableName}${EOL}  ADD CONSTRAINT pk_${tableName} PRIMARY KEY (id);${EOL}${EOL}`
    return out
}

function FKS(dbSchema, tableName, opts, refs)
{
    // Add primary key for table
    let out = ""

    for (let j = 0; j < refs.length; j++)
    {
        // FOREIGN KEY
        const ref = refs[j]

        out += `ALTER TABLE ONLY ${dbSchema}.${tableName}${EOL}`
        out += `  ADD CONSTRAINT fk_${tableName}_${ref.name}_id FOREIGN KEY (${ref.name}_id) REFERENCES ${dbSchema}.${ref.type} (id);${EOL}${EOL}`
    }

    return out
}

function ID_FIELD()
{
    return `    id character varying(36) NOT NULL,${ EOL }`
}


function FK_FIELD(name, nonNull, addComma = true)
{
    return FIELD(name + "_id", "character varying(36)", nonNull, addComma)
}


function ALTER_TABLE(dbSchema, tableName, dbOwner)
{
    return `ALTER TABLE IF EXISTS ${dbSchema}.${tableName} OWNER TO ${dbOwner};${EOL}`
}

module.exports.TABLE = TABLE
module.exports.FIELD = FIELD
module.exports.PRIMARY_KEY = PRIMARY_KEY
module.exports.PK = PK
module.exports.FKS = FKS
module.exports.ID_FIELD = ID_FIELD
module.exports.FK_FIELD = FK_FIELD
module.exports.ALTER_TABLE = ALTER_TABLE
