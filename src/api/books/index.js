import express from "express"
import q2m from "query-to-mongo"
import BooksModel from "./model.js"

const booksRouter = express.Router()

booksRouter.post("/", async (req, res, next) => {
  try {
    const newBook = new BooksModel(req.body)
    const { _id } = await newBook.save()
    res.status(201).send({ _id })
  } catch (error) {
    next(error)
  }
})

booksRouter.get("/", async (req, res, next) => {
  try {
    const mongoQuery = q2m(req.query)

    const total = await BooksModel.countDocuments(mongoQuery.criteria)
    const books = await BooksModel.find(mongoQuery.criteria, mongoQuery.options.fields)
      .limit(mongoQuery.options.limit) // no matter the order of usage of these three methods, Mongo will ALWAYS apply SORT then SKIP then LIMIT in this order
      .skip(mongoQuery.options.skip)
      .sort(mongoQuery.options.sort)
    res.send({ links: mongoQuery.links("http://localhost:3001/books", total), total, totalPages: Math.ceil(total / mongoQuery.options.limit), books })
  } catch (error) {
    next(error)
  }
})

booksRouter.get("/:bookId", async (req, res, next) => {
  try {
    const book = await BooksModel.findById(req.params.bookId).populate({ path: "authors", select: "firstName lastName" })
    res.send(book)
  } catch (error) {
    next(error)
  }
})

booksRouter.put("/:bookId", async (req, res, next) => {
  try {
  } catch (error) {
    next(error)
  }
})

booksRouter.delete("/:bookId", async (req, res, next) => {
  try {
  } catch (error) {
    next(error)
  }
})

export default booksRouter
