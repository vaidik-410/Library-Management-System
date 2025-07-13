import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        require: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
        select: false,
    },
    role: {
        type: String,
        enum: ["Admin","User"],
        default: "User",
    },
    accountVerified: {
        type: Boolean,
        default: false,
    },
    borrowedBooks: [
        {
            bookId:{
                type: mongoose.Schema.Types.ObjectId,
                ref: "Book",
            },
            returned: {
                type: Boolean,
                default: false,
            },
            bookTitle: String,
            borrowedDate: Date,
            dueDate: Date,

        },
    ],
    avatar: {
        public_id: String,
        url: String,
    },
    verificationCode: Number,
    verificationCodeExpire: Date,
    resetPasswordToken: String, 
    resetPasswordExpire: Date,  
},
{
    timestamps: true
}
);

userSchema.methods.generateVerificationCode = function(){
    function generateRandomFiveDigitNumber(){
        const firstDigit = Math.floor(Math.random() * 9) + 1;
        const remaningDigits = Math.floor(Math.random() * 1000).toString().padStart(4,0);
        return parseInt(firstDigit + remaningDigits);
    };
    const verificationCode = generateRandomFiveDigitNumber();
    this.verificationCode = verificationCode;
    this.verificationCodeExpire = Date.now() + 15 * 60 * 1000;//15 minutes (1000milisec * 60 is 1 min)
    return verificationCode;
}

userSchema.methods.generateToken = function(){
    return jwt.sign({id: this._id},process.env.JWT_SECRET_KEY,{
        expiresIn: process.env.JWT_EXPIRE,
    })
};

userSchema.methods.getResetPasswordToken = function (){
    const resetToken = crypto.randomBytes(20).toString("hex");

    this.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

    return resetToken;
};

export const User = mongoose.model("User",userSchema);
