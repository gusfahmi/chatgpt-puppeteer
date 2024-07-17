const os = require('os')
const puppeteer = require('puppeteer-extra');
// Add stealth plugin and use defaults (all tricks to hide puppeteer usage)
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())


const { convert } = require('html-to-text');
const options = {
    wordwrap: 130,
};


const EventEmitter = require('node:events'); 
const randomUseragent = require('random-useragent');



const welcomePopupSelector = "div > div > p.mb-1.text-center.text-2xl.font-semibold";
const stayLogoutSelector = "div > div > a";

const inputAsk = "#prompt-textarea";
const selector = "div.markdown";


const btnLogin = "button[data-testid=login-button]";

const emailSelector = "#email-input";
const btnContinue = "#root > div > main > section > div.login-container > button";

const passSelector = "#password";
const btnContinuePass = "button[data-action-button-primary=true]";

const profilePicSelector = "button[data-testid=fruit-juice-profile]";

function sleep(time) {
    return new Promise(resolve=>setTimeout(resolve, time));
}

 
class ChatGPT extends EventEmitter{

    #page;

    constructor(email, password){
        super();
        this.email = email;
        this.password = password;
        this.#setup();
    }

    
    async #setup(){

        try{

            let browser;
            if(process.platform == "linux"){
                browser = await puppeteer.launch({
                    userDataDir: `./data/${this.email}`,
                    headless: true,
                    executablePath: "/usr/bin/google-chrome",
                    args: [
                        "--no-sandbox"
                    ],
                });
            }else{
                browser = await puppeteer.launch({
                    userDataDir: `./data/${this.email}`,
                    headless: true,
                    args: [
                        "--no-sandbox"
                    ],
                });
            }

            const page = await browser.newPage();
            await page.setUserAgent(randomUseragent.getRandom());
            

            await page.goto('https://chatgpt.com');

            //user already login
            if(await page.$(profilePicSelector) !== null){
                
                this.#page = page; 
                this.emit('ready', 'Client is ready'); 

            }else{

                if(await page.$(welcomePopupSelector) !== null){
                    await page.locator(stayLogoutSelector).click()
                }

                await page.locator(btnLogin).click()

                await page.waitForNavigation({waitUntil: 'networkidle0'})

                await page.type(emailSelector, this.email, {delay: 100});
                await page.locator(btnContinue).click();

                await page.waitForNavigation({waitUntil: 'domcontentloaded'})

                await page.type(passSelector, this.password, {delay: 100});
                await page.locator(btnContinuePass).click();

        
                await page.waitForNavigation({waitUntil: 'networkidle0'})

                this.#page = page; 
                this.emit('ready', 'Client is ready'); 

            } 
            

        }catch(e){
            this.emit('error', 'Client is not ready, Please open chatgpt.com to see the error, Err : ' + e.message); 
        }
        

    }

 

    async ask(text){

        try{

            const page = this.#page; 

            await page.waitForSelector(inputAsk); 
            await page.type(inputAsk, text, {delay: 150});
            await sleep(900);

            await page.keyboard.press('Enter')

            await sleep(1000);

            const btnSelector = "button[data-testid=fruitjuice-stop-button]" 
            await page.waitForSelector(btnSelector, {hidden: true, timeout: 0});
    
            const textChat = await page.$$(selector);
            const getText = textChat[textChat.length - 1]; 
            const textResponse = await getText?.evaluate(el => el.innerHTML);  
            return convert(textResponse, options);

        }catch(e){
            return "Can not generate response right now, Err : " + e.message
        }
        
 

    }
 
 
}


module.exports = ChatGPT



