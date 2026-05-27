import dotenv from "dotenv"
import connectDB from "./src/DB/database.js"
import app from "./app.js"

dotenv.config({
    path: './.env'
});

connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`the server is running on the port: ${process.env.PORT || 8000}`);
    });
})
.catch((error) => {
    console.log("mongo db connection is failed:");
    throw error;
});
