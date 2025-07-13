import { Borrow } from "../models/borrowModels.js";
import { Book } from "../models/bookModels.js";
import { User } from "../models/userModels.js";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/errorMiddlewares.js";
import { calculateFine } from "../utils/fineCalculator.js"

export const recordBorrowedBook = catchAsyncErrors(async(req,res,next) => {
    const { id } = req.params;
    const { email } = req.body;

    const book = await Book.findById(id);
    if(!book){
        return next(new ErrorHandler("Book not found.",404));
    }

    const user = await User.findOne({email , accountVerified: true});
    if(!user){
        return next(new ErrorHandler("User not found.",404));
    }

    if(book.quantity === 0){
        return next(new ErrorHandler("Book not available.",400));
    }

    const isAlreadyBorrowed = await Borrow.findOne({
        "user.id":user._id,
        book: book._id,
        returned: false,
    });

    if(isAlreadyBorrowed){
        return next(new ErrorHandler("Book already borrowed!",400));
    }

    book.quantity -= 1;
    book.availability = book.quantity > 0;
    await book.save();

    const dueDate = new Date(Date.now()+ 7 * 24 * 60 * 60 * 1000);

    user.borrowedBooks.push({
        bookId: book._id,
        bookTitle: book.title,
        borrowedDate: new Date(),
        dueDate,
        returned: false,
    });

    await user.save();
    await Borrow.create({
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
        },
        book: book._id,
        dueDate: Date.now()+ 7 * 24 * 60 * 60 *1000,
        price: book.price,
    });
    res.status(200).json({
        success: true,
        message: "Borrowed book recorded successfully.",
    });
});

export const returnBorrowBook = catchAsyncErrors(async (req, res, next) => {
    const { bookId } = req.params;
    const { email } = req.body;

    const book = await Book.findById(bookId);
    if (!book) {
        return next(new ErrorHandler("Book not found.", 400));
    }

    const user = await User.findOne({ email, accountVerified: true });
    if (!user) {
        return next(new ErrorHandler("User not found.", 400));
    }

    const borrowedBook = user.borrowedBooks.find((item) => {
        return (
            item.bookId?.toString() === book._id.toString() &&
            item.returned === false
        );
    });
    
    if (!borrowedBook) {
        return next(new ErrorHandler("You have not borrowed this book.", 400));
    }

    borrowedBook.returned = true;
    await user.save();

    book.quantity += 1;
    book.availability = book.quantity > 0;
    await book.save();

    const borrow = await Borrow.findOne({
        book: bookId,
        "user.email": email,
        returned: false,
    });

    if (!borrow) {
        return next(new ErrorHandler("You have not borrowed this book.", 400));
    }

    borrow.returnDate = new Date();
    const fine = calculateFine(borrow.dueDate);
    borrow.fine = fine;
    borrow.returned = true; 
    await borrow.save();

    res.status(200).json({
        success: true,
        message:
            fine !== 0
                ? `The book has been returned successfully. The total charges, including the fine, are $${book.price + fine}`
                : `The book has been returned successfully. The total charges are $${book.price}`,
    });
});


export const borrowedBooks = catchAsyncErrors(async(req,res,next) => {
    const { borrowedBooks } = req.user;
    res.status(200).json({
        success: true,
        borrowedBooks,
    });
});

export const getBorrowedBooksForAdmin= catchAsyncErrors(async(req,res,next) => {
    const borrowedBooks = await Borrow.find();
    res.status(200).json({
        success: true,
        borrowedBooks,
    });
});
