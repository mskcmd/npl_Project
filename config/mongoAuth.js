const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();
const Text = require("../models/Text");

module.exports = {
    mongoDB: () => {
        mongoose
            .connect(process.env.MONGODB_URI, {
                
            })
            .then(async () => {
                console.log("Connected to MongoDB");

                try {
                    await Text.createIndexes();
                    console.log("TTL index created successfully");
                } catch (error) {
                    console.error("Error creating indexes:", error);
                }
            })
            .catch((err) => {
                console.error("Error connecting to MongoDB:", err);
            });
    }
}
