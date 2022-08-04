import express from "express"
import createHttpError from "http-errors"
import UsersModel from "./model.js"
import BooksModel from "../books/model.js"

const usersRouter = express.Router()

usersRouter.post("/", async (req, res, next) => {
  try {
    const newUser = new UsersModel(req.body) // here it happens the validation (thanks to Mongoose) of request body, if it is not ok Mongoose will throw an error (if it is ok it is NOT saved yet)
    const { _id } = await newUser.save()

    res.status(201).send({ _id })
  } catch (error) {
    next(error)
  }
})

usersRouter.get("/", async (req, res, next) => {
  try {
    const users = await UsersModel.find()
    res.send(users)
  } catch (error) {
    next(error)
  }
})

usersRouter.get("/:userId", async (req, res, next) => {
  try {
    const user = await UsersModel.findById(req.params.userId)
    if (user) {
      res.send(user)
    } else {
      next(createHttpError(404, `User with id ${req.params.userId} not found!`))
    }
  } catch (error) {
    next(error)
  }
})

usersRouter.put("/:userId", async (req, res, next) => {
  try {
    const updatedUser = await UsersModel.findByIdAndUpdate(
      req.params.userId, // WHO you want to modify
      req.body, // HOW you want to modify
      { new: true, runValidators: true } // OPTIONS. By default findByIdAndUpdate returns the record pre-modification. If you want to get back the newly update record you should use the option new: true
      // By default validation is off here --> runValidators: true
    )
    // ************************************************* ALTERNATIVE METHOD *******************************************************

    // const user = await UsersModel.findById(req.params.userId) // when you do a findById, findOne, etc,... you get back a MONGOOSE DOCUMENT which is NOT a normal object but an object with some superpowers (like the .save() method) that will be useful in the future

    // user.firstName = "Diego"

    // await user.save()

    // res.send(user)

    if (updatedUser) {
      res.send(updatedUser)
    } else {
      next(createHttpError(404, `User with id ${req.params.userId} not found!`))
    }
  } catch (error) {
    next(error)
  }
})

usersRouter.delete("/:userId", async (req, res, next) => {
  try {
    const deletedUser = await UsersModel.findByIdAndDelete(req.params.userId)
    if (deletedUser) {
      res.status(204).send()
    } else {
      next(createHttpError(404, `User with id ${req.params.userId} not found!`))
    }
  } catch (error) {
    next(error)
  }
})

usersRouter.post("/:userId/purchaseHistory", async (req, res, next) => {
  try {
    // We gonna receive a bookId in the req.body. Given that Id, we would like to insert the corresponding book into the purchaseHistory of the specified user

    // 1. Find the book in the books' collection by id
    const purchasedBook = await BooksModel.findById(req.body.bookId, { _id: 0 }) // here we could use projection {_id: 0} to remove the original _id from the purchasedBook. We should do this because in this way Mongo will automagically create a unique _id for the items in the array

    if (purchasedBook) {
      // 2. If the book is found --> add additional informations like purchaseDate
      const bookToInsert = { ...purchasedBook.toObject(), purchaseDate: new Date() } // purchasedBook (and EVERYTHING you get from .find .findById .findOne, ...) is a MONGOOSE OBJECT. Therefore if I want to spread it I shall convert it into a PLAIN OBJECT first by using .toObject() (as an alternative you could use .lean() after find methods)

      // 3. Update the specified user by adding that book to the purchaseHistory array
      const updatedUser = await UsersModel.findByIdAndUpdate(
        req.params.userId, // WHO
        { $push: { purchaseHistory: bookToInsert } }, // HOW
        { new: true, runValidators: true } // OPTIONS
      )
      if (updatedUser) {
        res.send(updatedUser)
      } else {
        next(createHttpError(404, `User with id ${req.params.userId} not found!`))
      }
    } else {
      // 4. In case of book not found --> 404
      next(createHttpError(404, `Book with id ${req.body.bookId} not found!`))
    }
  } catch (error) {
    next(error)
  }
})

usersRouter.get("/:userId/purchaseHistory", async (req, res, next) => {
  try {
    const user = await UsersModel.findById(req.params.userId)
    if (user) {
      res.send(user.purchaseHistory)
    } else {
      next(createHttpError(404, `User with id ${req.params.userId} not found!`))
    }
  } catch (error) {
    next(error)
  }
})

usersRouter.get("/:userId/purchaseHistory/:productId", async (req, res, next) => {
  try {
    const user = await UsersModel.findById(req.params.userId)
    if (user) {
      const purchasedBook = user.purchaseHistory.find(book => req.params.productId === book._id.toString()) // You CANNOT compare a string (req.params.productId) with an ObjectId (book._id)! --> SOLUTION: you could either convert the string into an ObjectId or the ObjectId into a string
      if (purchasedBook) {
        res.send(purchasedBook)
      } else {
        next(createHttpError(404, `Book with id ${req.params.productId} not found!`))
      }
    } else {
      next(createHttpError(404, `User with id ${req.params.userId} not found!`))
    }
  } catch (error) {
    next(error)
  }
})

usersRouter.put("/:userId/purchaseHistory/:productId", async (req, res, next) => {
  try {
    // 1. Find user by id (obtaining a MONGOOSE DOCUMENT)
    const user = await UsersModel.findById(req.params.userId)

    if (user) {
      // 2. Update the item in the array by using normal JS code
      // 2.1 Search for the index of the product into the purchaseHistory array

      const index = user.purchaseHistory.findIndex(book => book._id.toString() === req.params.productId)

      if (index !== -1) {
        // 2.2 Modify that product
        user.purchaseHistory[index] = { ...user.purchaseHistory[index].toObject(), ...req.body }

        // 3. Since the user object is a MONGOOSE DOCUMENT I can then use .save() to update that record
        await user.save()
        res.send(user)
      } else {
        next(createHttpError(404, `Book with id ${req.params.productId} not found!`))
      }
    } else {
      next(createHttpError(404, `User with id ${req.params.userId} not found!`))
    }
  } catch (error) {
    next(error)
  }
})

usersRouter.delete("/:userId/purchaseHistory/:productId", async (req, res, next) => {
  try {
    const updatedUser = await UsersModel.findByIdAndUpdate(
      req.params.userId, // WHO
      { $pull: { purchaseHistory: { _id: req.params.productId } } }, // HOW
      { new: true, runValidators: true } // OPTIONS
    )
    if (updatedUser) {
      res.send(updatedUser)
    } else {
      next(createHttpError(404, `User with id ${req.params.userId} not found!`))
    }
  } catch (error) {
    next(error)
  }
})

export default usersRouter
