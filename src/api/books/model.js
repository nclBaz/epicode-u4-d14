import mongoose from "mongoose"

const { Schema, model } = mongoose

const booksSchema = new Schema(
  {
    asin: { type: String, required: true },
    title: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true, enum: ["history", "horror", "romance", "fantasy"] },
    img: { type: String, required: true },
    authors: [{ type: Schema.Types.ObjectId, ref: "Author" }],
  },
  {
    timestamps: true,
  }
)

// *************************************************** CUSTOM METHOD *****************************************************

booksSchema.static("findBooksWithAuthors", async function (query) {
  // If I use an arrow function here, "this" will be undefined. If I use a traditional function, "this" will refer to BooksModel itself
  console.log("THIS: ", this)
  const total = await this.countDocuments(query.criteria)
  const books = await this.find(query.criteria, query.options.fields)
    .limit(query.options.limit) // no matter the order of usage of these three methods, Mongo will ALWAYS apply SORT then SKIP then LIMIT in this order
    .skip(query.options.skip)
    .sort(query.options.sort)
    .populate({ path: "authors", select: "firstName lastName" })
  return { books, total }
})

export default model("Book", booksSchema)
