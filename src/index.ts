import express, { Express } from "express";
import serverConfig from "./config/serverConfig";

const app: Express = express()

app.listen(serverConfig.PORT,() =>{
    console.log(`[SUCCESS] : Server is Up at https://localhost:${serverConfig.PORT}`);
})