import { generateVerificationOtpEmailTemplate } from "../utils/emailTemplates.js";
import { sendEmail } from "../utils/sendEmial.js";

export async function sendVerificationCode(verificationCode,email,res){
    try{

        const message = generateVerificationOtpEmailTemplate(verificationCode);
        sendEmail({
            email,
            subject: "Verification Code Library Management System",
            message,
        });
        res.status(200).json({
            success: true,
            message: "Verification code sent successfully.",
        })

    }catch(error){
        return res.status(500).json({
            success: false,
            message: "Verification Code failed to Send.",
        });
    }
}