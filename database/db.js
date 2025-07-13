import mongoose from "mongoose";

export const connectnDB = () => {
    mongoose
    .connect(process.env.MONGOSH_URL,{
        dbName: "Library_Management_System"
    }).then(()=>{
        console.log(`Database connected successfully!`);
    }).catch((err)=>{
        console.log("Error connecting to database",err);
    })
}