import util from "util";

let TAG = " app "
import { OpenAI } from "langchain/llms/openai";
import { VectorDBQAChain } from "langchain/chains";
import { HNSWLib } from "langchain/vectorstores";
import { OpenAIEmbeddings } from "langchain/embeddings";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import {exec, execSync} from 'child_process';
import * as path from 'path';
import fs from "fs"; // for path normalization
import { BufferMemory } from "langchain/memory";
import { PromptTemplate } from "langchain/prompts";
import { LLMChain } from "langchain/chains";
//@ts-ignore
import {query} from "@pioneer-platform/langchain";
const log = require('@pioneer-platform/loggerdog')()
let wait = require('wait-promise');
let ai = require('@pioneer-platform/pioneer-intelligence')
ai.init()

export async function runSkillLoop(this: any, args: any, callback: () => void) {
    //@ts-ignore
    let scriptPath = path.join(__dirname, '..', 'skills', `${args.filename}`);

    // Running skill and collecting result
    let result = await perform_skill(scriptPath,[])

    console.log('result: ', result);
    console.log('result: ', JSON.stringify(result));

    // Prompt for user feedback on output
    const resultChoice = await this.prompt([
        {
            type: 'list',
            name: 'choice',
            message: 'is this output suffecient? ',
            choices: ['correct', 'improve (fixme)']
        }
    ]);

    console.log('Your choice is: ', resultChoice.choice);
    if(resultChoice.choice == "correct"){
        log.info("Running skill successful");
        // publish(scriptPath)
        callback();
    } else {
        log.info("Skill run unsuccessful, marking file as broke");
        // // Logic for marking file as broke
        // // You need to implement 'mark_file_broke' function
        // await mark_file_broke(scriptPath);

        const results = await this.prompt([
            {
                type: 'input',
                name: 'issue',
                message: 'describe the issue: '
            },
            {
                type: 'input',
                name: 'context',
                message: '(output already included) provide context or extra info: '
            }
        ]);

        console.log('Your context is: ', results.context);
        console.log('Your issue is: ', results.issue);
        results.context = "script output was: "+ JSON.stringify(result) +" user included content is: " + results.context
        let resultFix = await fix_skill(args.filename,results.issue,results.context)
        console.log('resultFix: ', resultFix);

        // Change filename for next iteration
        args.filename = resultFix.skillName; // You need to implement 'increment_filename' function
        log.info("===========================================")
        log.info("CREATED NEW SKILL: ",args.filename)
        log.info("===========================================")
        await runSkillLoop.call(this, args, callback);  // Use .call() here
    }
}

export async function create_skill(skill: any, inputs:any, outputs:any, context:any): Promise<any> {
    const tag = TAG + " | handle_input | "
    try{
        log.info(tag,"skill: ",skill)
        log.info(tag,"inputs: ",inputs)
        log.info(tag,"outputs: ",outputs)
        log.info(tag,"context: ",context)

        let result = await ai.buildScript(skill, inputs, outputs, context)
        log.info(tag,"result: ",result)
        if(!result) throw Error("Failed to build script! audit AI module")
        //write the skill to file
        const path = require('path');
        const fs = require('fs');
        //@ts-ignore
        const newFilePath = path.join(__dirname, '..', 'skills', `${result.scriptName}_untested.sh`);
        log.info(tag,"newFilePath: ",newFilePath)
        fs.writeFileSync(newFilePath, result.script, 'utf8');

        //execute the skill

        //return the result

        return result
    }catch(e){
        console.error(e);
        throw e;
    }
}

export async function fix_skill(skill: string, issue:any, context:any): Promise<any> {
    const tag = TAG + " | handle_input | ";
    let script = '', scriptWorking = '';
    try{
        log.info(tag,"skill: ",skill);
        log.info(tag,"context: ",context);
        log.info(tag,"issue: ",issue);

        try {
            script = fs.readFileSync(path.join(__dirname, '..', 'skills', `${skill}`), 'utf8');
        } catch (error: any) {
            if (error.code === 'ENOENT') {
                log.warn(tag, `File not found, but continuing: ${error.message}`);
            } else {
                throw error;
            }
        }

        if (skill.includes('_untested')) {
            let skillWorking = skill.replace('_untested', '');
            log.info(tag,"skillWorking1: ",skillWorking);
            skillWorking = skillWorking.replace(/_v\d+(?=.sh$)/, '');
            log.info(tag,"skillWorking2: ",skillWorking);
            const scriptPath = path.join(__dirname, '..', 'skills', `${skillWorking}`);
            log.info(tag,"scriptPath: ",scriptPath);

            try {
                scriptWorking = fs.readFileSync(scriptPath, 'utf8');
                context = {
                    skill: skillWorking,
                    working: true,
                    script: scriptWorking
                };
            } catch (error: any) {
                if (error.code === 'ENOENT') {
                    log.warn(tag, `Error reading script, file not found but continuing: ${error.message}`);
                    context = {
                        skill: skillWorking,
                        working: false,
                        script: null
                    };
                } else {
                    throw error;
                }
            }
        }
        log.info(tag,"context: ",context);
        let result = await ai.fixScript(script, issue, context);
        log.info(tag,"result: ",result);
        log.info(tag,"result type: ",typeof(result));

        if(!result.script) throw Error("Invalid result! Missing script");

        skill = skill.replace(".sh","");

        const versionMatch = skill.match(/_v(\d+)/);
        let versionNumber = 1;
        if (versionMatch) {
            versionNumber = parseInt(versionMatch[1]) + 1;
            skill = skill.replace(/_v\d+/, `_v${versionNumber}`);
        } else {
            skill += `_v${versionNumber}`;
        }

        skill = skill.replace(/_untested/, '');
        skill += "_untested";

        const newFilePath = path.join(__dirname,'..', 'skills', `${skill}.sh`);
        fs.writeFileSync(newFilePath, result.script, 'utf8');
        result.skillName = `${skill}.sh`;
        return result;
    }catch(e: any){
        log.error(tag, 'Error in fix_skill: ', e.message);
        throw e;
    }
}



export async function perform_skill(skill: any, inputs: any) {
    let tag = TAG + " | perform_skill | ";
    try {
        let messages = [];
        let cmd = "bash "+skill;
        log.info(tag, "cmd: ", cmd);
        try {
            const TIMEOUT_MS = 60000; // 60 seconds

            const startTime = Date.now();
            const elapsedTime = Date.now() - startTime;
            if (elapsedTime > TIMEOUT_MS) {
                throw new Error("Timeout: Script took too long to execute.");
            }

            let {stdout, stderr } = await util.promisify(exec)(cmd);
            log.info(tag, "stdout: ", stdout);
            log.info(tag, "stderr: ", stderr);

            if(stdout && stdout.length > 0 && stdout !== "null\\n"){
                log.info(tag, "Valid Execution: ", stdout);

                // Attempt to parse stdout as JSON
                let stdoutData;
                try {
                    stdoutData = JSON.parse(stdout);
                    stdout = JSON.stringify(stdoutData, null, 2); // Prettify JSON if possible
                } catch (err) {
                    // If stdout is not JSON, treat it as plain text
                }

                messages.push({
                    role: "assistant",
                    content: stdout
                });
            } else if(stderr){
                messages.push({
                    role: "user",
                    content: "That errored: error: " + stderr
                });
            } else if(stdout == "null\\n") {
                messages.push({
                    role: "user",
                    content: "That returned null, you should add error handling to the script"
                });
            } else {
                messages.push({
                    role: "user",
                    content: "Something is wrong, not getting any good output"
                });
            }
        } catch(e){
            if (e instanceof Error) { // Check if e is an instance of Error
                log.error(tag,"error: ",e);
                log.error(tag, "Error stack: ", e.stack); // log the error stack trace
                messages.push({
                    role: "user",
                    content: "Error: "+ e?.toString(),
                    stack: e.stack  // append the stack trace to the message
                });
            } else {
                log.error(tag,"An unknown error occurred: ",e);
                messages.push({
                    role: "user",
                    content: "An unknown error occurred: "+ e
                });
            }
        }

        return messages;
    } catch(e) {
        console.error(e);
        throw e;
    }
}
