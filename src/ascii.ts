

const log = require('@pioneer-platform/loggerdog')()

export const startArt = function(){
    try{
        log.info(
            "\n",
            "Pioneer-cli"
        );
        log.info(
            "\n        ,    .  ,   .           .\n" +
            "    *  / \\_ *  / \\_      " +
            ".-." +
            "  *       *   /\\'__        *\n" +
            "      /    \\  /    \\,   " +
            "( ₿ )" +
            "     .    _/  /  \\  *'.\n" +
            " .   /\\/\\  /\\/ :' __ \\_  " +
            " - " +
            "          _^/  ^/    `--.\n" +
            "    /    \\/  \\  _/  \\-'\\      *    /.' ^_   \\_   .'\\  *\n" +
            "  /\\  .-   `. \\/     \\ /==~=-=~=-=-;.  _/ \\ -. `_/   \\\n" +
            " /  `-.__ ^   / .-'.--\\ =-=~_=-=~=^/  _ `--./ .-'  `-\n" +
            "/        `.  / /       `.~-^=-=~=^=.-'      '-._ `._"
        );
        log.info(
            " \n A simple Multi-Coin Wallet and explorer CLI      \n \n                        ---Highlander \n "
        );
    }catch(e){
        console.error(e)
    }
}
