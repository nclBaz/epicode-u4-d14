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

    const { books, total } = await BooksModel.findBooksWithAuthors(mongoQuery)

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
