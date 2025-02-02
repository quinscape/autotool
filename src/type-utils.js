const NON_NULL = "NON_NULL";
const LIST = "LIST";

function unwrapAll(type) {
    if (type.kind === NON_NULL || type.kind === LIST)
    {
        return unwrapAll(type.ofType);
    }
    return type;
}

function unwrapNonNull(type)
{
    if (type.kind === NON_NULL)
    {
        return type.ofType;
    }
    return type;
}
function isNonNull(type)
{
    return (type.kind === NON_NULL)
}

function isList(type)
{
    return (type.kind === LIST)
}

module.exports.NON_NULL = NON_NULL
module.exports.LIST = LIST
module.exports.unwrapAll = unwrapAll
module.exports.unwrapNonNull = unwrapNonNull
module.exports.isNonNull = isNonNull
module.exports.isList = isList
