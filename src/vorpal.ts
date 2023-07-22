import { startArt } from './ascii'
const vorpal = require('vorpal')();
const log = require('@pioneer-platform/loggerdog')()
const fs = require('fs-extra');
const path = require('path');

let currentDirectory = process.cwd();
let fileList: string[] = [];
let skills:any = []

let refreshSkills = async function() {
    try {
        // Create "skills" directory if it does not exist
        let skillsDirPath = path.join(currentDirectory, "skills");
        await fs.ensureDir(skillsDirPath);

        // Read skills from the directory
        skills = await fs.readdir(skillsDirPath);
        fileList = fs.readdirSync(currentDirectory);
        //log.info("skills: ",skills)
    } catch (e) {
        log.error(e);
    }
}

export const onStart = async function(){
    try{

        // Run command definition
        vorpal
            .command('run <filename>', 'Perform a skill.')
            .action(async function(args: any, callback: () => void) {
                //@ts-ignore
                await runSkillLoop.call(this, args, callback);  // Use .call() here
            })
            .autocomplete(skills);


        vorpal
            .command('ls', 'list a directory.')
            .action(function(args: any, callback: () => void) {
                let tag = " | run | "
                try{
                    fs.readdir(currentDirectory, (err: any, files: any[]) => {
                        if (err) {
                            console.log(tag, 'Error reading directory:', err);
                        } else {
                            console.log(files.join('\n'));
                            fileList = files; // Update fileList after listing the directory
                        }
                        callback();
                    });
                }catch(e){
                    console.log(e);
                }
            });

        vorpal
            .command('cd <path>', 'change directory.')
            .autocomplete({
                data: () => {
                    return fileList;
                }
            })
            .action(function(args: { path: any; }, callback: () => void) {
                let tag = " | run | "
                try{
                    let newDirectory = path.resolve(currentDirectory, args.path);
                    if (fs.existsSync(newDirectory)) {
                        currentDirectory = newDirectory;
                        console.log(`Changed directory to ${newDirectory}`);
                        refreshSkills(); // Update fileList after changing the directory
                    } else {
                        console.log(`${tag} Invalid directory: ${newDirectory}`);
                    }
                    callback();
                }catch(e){
                    console.log(e);
                }
            });

        startArt()

        vorpal
            .delimiter('pioneer:')
            .show();
    }catch(e){

    }
}
