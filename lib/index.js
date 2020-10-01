"use strict";

const ucFirst = require("uc-first")
    , findValue = require("find-value")

/**
 * bloggifySequelizeDatatableViews
 * Visualize Sequelize data in data tables.
 *
 * When using this plugin, the `Bloggify.partials.datatable_view` will be
 * available and will require the following parameters:
 *
 *   - `columns` (Array of Strings): The table headers. If you need special actions, you can pass HTML.
 *   - `name` (String): The model name (e.g. `users`)
 *   - `type` (String): The table type (`default` | `compact`)
 *
 * **Example**:
 *
 * ```html
 * <div class="bg-light p-3 rounded mt-5 table-responsive">
 *     <%
 *         include(Bloggify.partials.datatable_view, {
 *             columns: [
 *                 "ID",
 *                 "Email",
 *                 "First Name",
 *                 "Last Name",
 *                 "Roles",
 *                 "Actions",
 *             ],
 *             name: "users",
 *             type: "compact" // or "default"
 *         })
 *     %>
 * </div>
 * ```
 *
 * :bulb: Note: You have to initialize the datatables in your own JavaScript code.
 *
 * @name bloggifySequelizeDatatableViews
 * @function
 */
class bloggifySequelizeDatatableViews {

    static init () {
        if (!Bloggify.partials.datatable_view) {
            Bloggify.partials.datatable_view = require.resolve("./views/datatable_view.ajs")
        }
    }

    /**
     * tableDraw
     * Generates the action to draw the table.
     *
     * ```js
     * Assets.tableDraw = Bloggify.services.utils.tableDraw([
     *     "id",
     *     "serial_number",
     *     "user.email",
     *     "file.id"
     * ], {
     *     base: Bloggify.models.Document,
     *     include: [
     *         Bloggify.models.File
     *       , Bloggify.models.User
     *     ]
     * }, {
     *     searchFields: [
     *         "serial_number",
     *         "$user.email$",
     *     ],
     *     output: [
     *         "id",
     *         "serial_number",
     *         "user.email",
     *         // Return null elements if on the client
     *         // side you want to have empty columns
     *         // populated via JavaScript
     *         null, null,
     *         // This will resolve into an object with these fields
     *         [ "edit_url", "delete_url" ]
     *     ]
     * })
     * ```
     *
     * The above will resolve to the following:
     *
     * ```js
     * {
     *     data: [
     *       [
     *          42,            // id
     *          143,           // serial_number
     *          "foo@bar.com", // email
     *          null,
     *          null,
     *          {
     *              edit_url: "...",
     *              delete_url: "...
     *          }
     *       ]
     *     ],
     *     draw: <timestamp>,
     *     recordsFiltered: <count>,
     *     recordsTotal: <total>
     * }
     * ```
     *
     * @param {Array} headers The column names the table has.
     * @param {Object} models An object containing:
     *
     *      - `base` (Model): The base model.
     *      - `include` (Array of Models): The models to include (for join).
     *
     * @param {Object} options Additional querying options:
     *
     *      - `searchFields` (Array): The column names you want to enable searching for.
     *      - `output` (Array): An array of column names, `null` (for empty output) and array (for object output) elements.
     */
    static tableDraw (headers, models, options) {
        return async ctx => {
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
                order,
                where: {}
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

            if (options.beforeQuery) {
                await options.beforeQuery(ctx, findQuery)
            }

            const countQuery = Object.assign({}, findQuery)

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
