const {describe, it} = require("mocha")
const fs = require("fs")
const fsPromise = require("fs/promises")
const path = require("path")
const assert = require("assert")
const { introspectionFromSchema } = require("graphql")
const { withFile } = require("tmp-promise")
const { loadSchema, processSchema}= require("../src/loadSchema")
const {makeExecutableSchema} = require("@graphql-tools/schema")

const empty = fs.readFileSync(path.resolve(__dirname , "../domain/new.graphql"))

function testSchema(partial)
{
    return import("snake-case")
    .then(
        ({snakeCase}) => {

            return withFile(
                ({ path : schemaPath}) => {
                    const source = empty + partial
                    //console.log("SOURCE", source)
                    return fsPromise.writeFile(schemaPath, source, "utf8")
                        .then(
                            () =>
                                loadSchema(
                                    schemaPath,
                                    {
                                        verbose: false,
                                        transformName: snakeCase,
                                        addLinkTableData: true,
                                        prettyJSON: true,
                                        maxLength: 100,
                                        precision: 19,
                                        scale: 2
                                    }
                                )
                        )
                },
                {
                    postfix: ".graphql"
                }
            )
        }
    )
}

describe("Autotool", function () {
    describe("Analysis", function () {

        it("converts types", function () {
            // language=GraphQL
            return testSchema(`
                "Test type"
                type Foo
                {
                    "Name Field"
                    name: String!
                    num: Int!
                    flag: Boolean
                }
            `).then(
                schema => {

                    assert(schema.types.length === 1)
                    const fooType = schema.types[0]
                    assert(fooType.name === "foo")
                    assert(fooType.description === "Test type")
                    const { fields } = fooType

                    assert(fields.length === 3)
                    assert(fields[0].name === "name")
                    assert(fields[0].type === "String")
                    assert(fields[0].description === "Name Field")
                    assert(fields[0].nonNull)
                    assert(fields[1].name === "num")
                    assert(fields[1].type === "Int")
                    assert(fields[1].nonNull)
                    assert(fields[2].name === "flag")
                    assert(fields[2].type === "Boolean")
                    assert(!fields[2].nonNull)
                }
            )
        })

        it("reads field attributes", function () {
            // language=GraphQL
            return testSchema(`
                type Foo
                {
                    str: String!
                    str2(m200: _): String!
                    dec: BigDecimal!
                    dec2(p20: _,s4: _): BigDecimal!
                    text: Text
                }
            `).then(
                schema => {

                    assert(schema.types.length === 1)
                    const fooType = schema.types[0]
                    assert(fooType.name === "foo")
                    const { fields } = fooType

                    assert(fields.length === 5)
                    assert(fields[0].name === "str")
                    assert(fields[0].maxLength === 100)
                    assert(fields[1].name === "str2")
                    assert(fields[1].maxLength === 200)
                    assert(fields[2].name === "dec")
                    assert(fields[2].precision === 19)
                    assert(fields[2].scale === 2)
                    assert(fields[3].name === "dec2")
                    assert(fields[3].precision === 20)
                    assert(fields[3].scale === 4)
                    assert(fields[4].name === "text")
                    assert(fields[4].maxLength === null)
                }
            )
        })

        it("detects *-to-one references", function () {
            // language=GraphQL
            return testSchema(`
                type Foo
                {
                    name: String!
                }
                type Bar
                {
                    foos: Foo
                }
            `).then(
                schema => {

                    //console.log(JSON.stringify(schema, null, 4))

                    assert(schema.types.length === 2)
                    {
                        const fooType = schema.types[0]
                        assert(fooType.name === "foo")
                        assert(fooType.refs.length === 0)
                        assert(fooType.toMany.length === 0)
                        const { fields } = fooType

                        assert(fields.length === 1)
                        assert(fields[0].name === "name")
                    }
                    {
                        const barType = schema.types[1]
                        assert(barType.fields.length === 0)
                        assert(barType.name === "bar")
                        assert(barType.refs.length === 1)
                        assert(barType.refs[0].name === "foos")
                        assert(barType.refs[0].type === "foo")
                        assert(!barType.refs[0].nonNull)
                    }
                }
            )
        })
        it("detects many-to-many references", function () {
            // language=GraphQL
            return testSchema(`
                type Foo
                {
                    name: String!
                    bars: [Bar]!
                }
                type Bar
                {
                    name: String!
                }
            `).then(
                schema => {

                    //console.log(JSON.stringify(schema, null, 4))

                    assert(schema.types.length === 2)
                    {
                        const fooType = schema.types[0]
                        assert(fooType.name === "foo")
                        assert(fooType.refs.length === 0)
                        assert(fooType.toMany.length === 1)
                        assert(fooType.toMany[0].name === "bars")
                        assert(fooType.toMany[0].type === "bar")
                        assert(fooType.toMany[0].nonNull)
                        const { fields } = fooType

                        assert(fields.length === 1)
                        assert(fields[0].name === "name")
                    }

                    // ignore bar here

                    assert(schema.linkTables.length === 1)
                    assert(schema.linkTables[0].name === "foo_bars")
                    assert(schema.linkTables[0].left === "foo_id")
                    assert(schema.linkTables[0].right === "bar_id")
                    assert(schema.linkTables[0].leftType === "foo")
                    assert(schema.linkTables[0].rightType === "bar")
                }
            )
        })

        it("detects back references", function () {
            // language=GraphQL
            return testSchema(`
                type Foo
                {
                    name: String!
                    bars(foos: BackReference): [Bar]!
                }
                type Bar
                {
                    name: String!
                }
                type Baz
                {
                    name: String!
                    foo(bazes: BackReference): Foo
                }
            `).then(
                schema => {

                    //console.log(JSON.stringify(schema, null, 4))

                    assert(schema.types.length === 3)
                    {
                        const fooType = schema.types[0]
                        assert(fooType.name === "foo")
                        assert(fooType.refs.length === 0)
                        assert(fooType.toMany.length === 1)
                        assert(fooType.toMany[0].name === "bars")
                        assert(fooType.toMany[0].type === "bar")
                        assert(fooType.toMany[0].nonNull)

                        assert(fooType.fields.length === 1)
                        assert(fooType.fields[0].name === "name")
                        assert(fooType.backRefs.length === 1)
                        assert(fooType.backRefs[0].name === "bazes")
                        assert(fooType.backRefs[0].type === "foo")
                        assert(fooType.backRefs[0].sourceType === "baz")
                        assert(fooType.backRefs[0].sourceField === "foo")
                    }
                    {
                        const barType = schema.types[1]
                        assert(barType.name === "bar")

                        assert(barType.backRefs.length === 1)
                        assert(barType.backRefs[0].name === "foos")
                        assert(barType.backRefs[0].type === "bar")
                        assert(barType.backRefs[0].sourceType === "foo")
                        assert(barType.backRefs[0].sourceField === "bars")
                    }
                    {
                        const bazType = schema.types[2]
                        assert(bazType.name === "baz")
                        assert(bazType.refs.length === 1)
                        assert(bazType.refs[0].name === "foo")
                        assert(bazType.refs[0].type === "foo")
                        assert(!bazType.refs[0].nonNull)
                    }
                }
            )
        })
    })
})
