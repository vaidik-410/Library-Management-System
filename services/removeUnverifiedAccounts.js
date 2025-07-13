import cron from "node-cron";
import { User } from "../models/userModels.js";

export const removeUnverifiedAccount = () => {
    cron.schedule("*/5 * * * *", async () => {
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
        await User.deleteMany({
            accountVerified: false,
            createdAt: {$lt: thirtyMinutesAgo},
        })
    });
}