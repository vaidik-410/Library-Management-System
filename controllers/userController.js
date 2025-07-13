import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import { User } from "../models/userModels.js";
import ErrorHandler from "../middlewares/errorMiddlewares.js";
import bcrypt, { hash } from "bcrypt";
import { v2 as cloudinary } from "cloudinary";

export const getAllUsers = catchAsyncErrors( async(req,res,next) => {
    const users = await User.find({accountVerified: true});
    res.status(200).json({
        success: true,
        users,
    });
});

export const registerNewAdmin = catchAsyncErrors( async(req,res,next) => {
    if(!req.files || Object.keys(req.files).length === 0){
        return next(new ErrorHandler("Admin's avatar is required.",400));
    }

    const { name , email , password } = req.body;
    if(!name || !email || !password){
        return next(new ErrorHandler("Please fill all the details.",400));
    }

    const isRegistered = await User.findOne({email,accountVerified: true});

    if(isRegistered){
        return next(new ErrorHandler("User already registered.",400));
    }

    if(password.length < 8 || password.length > 16){
        return next(new ErrorHandler("Password must be between 8 and 16 characters.",400));
    }

    const {avatar} = req.files;
    const allowedFormats = ["image/png","image/jpeg","image/webp"];

    if(!allowedFormats.includes(avatar.mimetype)){
        return next(new ErrorHandler("File format not supported.",400));
    }

    const hashedPassword = await bcrypt.hash(password,10);
    const cloudinaryResponse = await cloudinary.uploader.upload(
        avatar.tempFilePath, {
            folder: "LIBRARY_MANAGEMENT_SYSTEM_ADMIN_AVATAR"
        }
    );
    if(!cloudinaryResponse || cloudinaryResponse.error){
        console.error("Cloudinay Error.",cloudinaryResponse.error || "Unknow Cloudinary Error.");
        return next(new ErrorHandler("Failed to upload avatar to cloudinary.",400));
    }

    const admin = await User.create({
        name,
        email,
        password: hashedPassword,
        role: "Admin",
        accountVerified: true,
        avatar: {
            public_id: cloudinaryResponse.public_id,
            url: cloudinaryResponse.secure_url
        }
    });
    res.status(201).json({
        success: true,
        message: "Admin registered successfully.",
        admin,
    })
});