#!/usr/bin/env node
import * as dotenv from "dotenv";
dotenv.config()
dotenv.config({path:'../../.env'})


import { onStart } from './vorpal'
const log = require('@pioneer-platform/loggerdog')()

//get plugins from file


//start wallet
//welcome

//initial setup
//is github token set?
//is openAi token set?

//params
const logCommandLineArguments = () => {
    console.log("Command-line arguments:");
    console.log(process.argv.slice(2).join(", "));
    console.log("--------------------------");
};
logCommandLineArguments()

//CLI
onStart()
