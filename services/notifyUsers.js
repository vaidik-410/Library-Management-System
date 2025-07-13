import cron from "node-cron";
import { Borrow } from "../models/borrowModels.js";
import { User } from "../models/userModels.js";
import { sendEmail } from "../utils/sendEmial.js";

export const notifyUsers = () => {
    cron.schedule("*/30 * * * *",async () => {
        try{
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 *1000);
            const borrowers = await Borrow.find({
                dueDate:{
                    $lt: oneDayAgo,
                },
                returnDate: null,
                notified: false,
            });

            for(const element of borrowers){
                if(element.user && element.user.email){
                    await User.findById(element.user.id);
                    sendEmail({
                        email: element.user.email,
                        subject: "Book Return Remainder.",
                        message: `Hello ${element.user.name},\n\n This is a remainder that the book you borrowed is due for return today. Please return to the library as soon as possible.\n\n\n Thank You.`,
                    });
                    element.notified = true;
                    await element.save();
                    console.log(`Email sent to ${element.user.email}`);
                }
            }
        }catch(error){
            console.error("Some error occured while notifying user.",error);
        }
    });
};