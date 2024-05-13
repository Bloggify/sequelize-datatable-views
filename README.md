<!-- Please do not edit this file. Edit the `blah` field in the `package.json` instead. If in doubt, open an issue. -->


















# bloggify-sequelize-datatable-views

 [![Version](https://img.shields.io/npm/v/bloggify-sequelize-datatable-views.svg)](https://www.npmjs.com/package/bloggify-sequelize-datatable-views) [![Downloads](https://img.shields.io/npm/dt/bloggify-sequelize-datatable-views.svg)](https://www.npmjs.com/package/bloggify-sequelize-datatable-views)







> Visualize Sequelize data in data tables.

















## :cloud: Installation

```sh
# Using npm
npm install --save bloggify-sequelize-datatable-views

# Using yarn
yarn add bloggify-sequelize-datatable-views
```























## :question: Get Help

There are few ways to get help:



 1. Please [post questions on Stack Overflow](https://stackoverflow.com/questions/ask). You can open issues with questions, as long you add a link to your Stack Overflow question.
 2. For bug reports and feature requests, open issues. :bug:







## :memo: Documentation


### `bloggifySequelizeDatatableViews()`
Visualize Sequelize data in data tables.

When using this plugin, the `Bloggify.partials.datatable_view` will be
available and will require the following parameters:

  - `columns` (Array of Strings): The table headers. If you need special actions, you can pass HTML.
  - `name` (String): The model name (e.g. `users`)
  - `type` (String): The table type (`default` | `compact`)

**Example**:

```html
<div class="bg-light p-3 rounded mt-5 table-responsive">
    <%
        include(Bloggify.partials.datatable_view, {
            columns: [
                "ID",
                "Email",
                "First Name",
                "Last Name",
                "Roles",
                "Actions",
            ],
            name: "users",
            type: "compact" // or "default"
        })
    %>
</div>
```

:bulb: Note: You have to initialize the datatables in your own JavaScript code.

### `tableDraw(headers, models, options)`
Generates the action to draw the table.

```js
Assets.tableDraw = Bloggify.services.utils.tableDraw([
    "id",
    "serial_number",
    "user.email",
    "file.id"
], {
    base: Bloggify.models.Document,
    include: [
        Bloggify.models.File
      , Bloggify.models.User
    ]
}, {
    searchFields: [
        "serial_number",
        "$user.email$",
    ],
    output: [
        "id",
        "serial_number",
        "user.email",
        // Return null elements if on the client
        // side you want to have empty columns
        // populated via JavaScript
        null, null,
        // This will resolve into an object with these fields
        [ "edit_url", "delete_url" ]
    ],
    beforeQuery (ctx, findQuery) {
       // For example, restrict the results
       // to a specific user id
       findQuery.where.userId = ctx.user.id
    }
})
```

The above will resolve to the following:

```js
{
    data: [
      [
         42,            // id
         143,           // serial_number
         "foo@bar.com", // email
         null,
         null,
         {
             edit_url: "...",
             delete_url: "...
         }
      ]
    ],
    draw: <timestamp>,
    recordsFiltered: <count>,
    recordsTotal: <total>
}
```

#### Params

- **Array** `headers`: The column names the table has.
- **Object** `models`: An object containing:
     - `base` (Model): The base model.
     - `include` (Array of Models): The models to include (for join).
- **Object** `options`: Additional querying options:
     - `searchFields` (Array): The column names you want to enable searching for.
     - `output` (Array): An array of column names, `null` (for empty output) and array (for object output) elements.














## :yum: How to contribute
Have an idea? Found a bug? See [how to contribute][contributing].
























## :scroll: License

[MIT][license] © [Bloggify][website]






[license]: /LICENSE
[website]: https://bloggify.org
[contributing]: /CONTRIBUTING.md
[docs]: /DOCUMENTATION.md
