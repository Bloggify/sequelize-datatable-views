"use strict";

const ucFirst = require("uc-first")
    , findValue = require("find-value")

/**
 * bloggifySequelizeDatatableViews
 * Visualize Sequelize data in data tables.
 *
 * @name bloggifySequelizeDatatableViews
 * @function
 * @param {Number} a Param descrpition.
 * @param {Number} b Param descrpition.
 * @return {Number} Return description.
 */
class bloggifySequelizeDatatableViews {

    static init () {
        if (!Bloggify.partials.datatable_view) {
            Bloggify.partials.datatable_view = require.resolve("./views/datatable_view.ajs")
        }
    }

    static tableDraw (headers, models, options) {
        return ctx => {
            const order = ctx.query.order.map(c => {
                const splits = headers[c.column].split(".")
                const data = {
                    column: "",
                    field: splits[0]
                }

                if (splits.length === 2) {
                    data.column = splits[0]
                    data.model = Bloggify.models[ucFirst(data.column)]
                    data.field = splits[1]
                }

                if (data.model) {
                    return [
                        { model: data.model },
                        data.field,
                        c.dir
                    ]
                }

                return [
                    headers[c.column],
                    c.dir
                ]
            })

            // Process the find query
            const findQuery = {
                include: models.include || [],
                order
            }


            // Handle search
            if (ctx.query.search.value) {
                const searchQuery = { [Bloggify.sequelize.Op.like]: `%${ctx.query.search.value}%` }
                const searchFields = options.searchFields.reduce((acc, c) => {
                    acc[c] = searchQuery
                    return acc
                }, {})
                const whereQuery = {
                    [Bloggify.sequelize.Op.or]: searchFields
                }
                findQuery.where = whereQuery
            }

            const countQuery = {...findQuery}

            findQuery.offset = +ctx.query.start
            findQuery.limit = +ctx.query.length
            findQuery.subQuery = false

            return Promise.all([
                models.base.count(countQuery),
                models.base.findAll(findQuery)
            ]).then(([total, data]) => {
                return {
                    data: data.map(item => {
                        item = item.toJSON()
                        const out = options.output.map(outputField => {
                            if (typeof outputField === "string") {
                                return findValue(item, outputField)
                            } else if (Array.isArray(outputField)) {
                                return outputField.reduce((acc, c) => {
                                    acc[c] = findValue(item, c)
                                    return acc
                                }, {})
                            }
                            return outputField
                        })
                        return out
                    }),
                    draw: Date.now(),
                    recordsFiltered: total,
                    recordsTotal: total
                }
            })
        }
    }
}

module.exports = bloggifySequelizeDatatableViews
