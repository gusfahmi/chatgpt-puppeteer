
const puppeteer = require('puppeteer-extra');
// Add stealth plugin and use defaults (all tricks to hide puppeteer usage)
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())


const { convert } = require('html-to-text');
const options = {
    wordwrap: 130,
    selectors: [{
        selector: 'hr', format: 'skip'
    }]
};


const EventEmitter = require('node:events'); 
const randomUseragent = require('random-useragent');

const {sleep, splitter} = require('./libs') 

const LanguageDetect = require('languagedetect');
const lngDetector = new LanguageDetect();



//element selectors
const welcomePopupSelector = "div > div > p.mb-1.text-center.text-2xl.font-semibold";
const stayLogoutSelector = "div > div > a";

const inputAsk = "#prompt-textarea";
const selector = "div.markdown";


const btnLogin = "button[data-testid=login-button]";

const emailSelector = "#email-input";
const btnContinue = "#root > div > main > section > div.login-container > button";

const passSelector = "#password";
const btnContinuePass = "button[data-action-button-primary=true]";

const profilePicSelector = "img[alt=User]";
 
 
class ChatGPT extends EventEmitter{

    #page;
    #responseText;

    constructor(email, password, headless=true){
        super();
        this.email = email;
        this.password = password;
        this.headless = headless;
        this.#setup();
    }

    
    async #setup(){

        try{

            let browser;
            if(process.platform == "linux"){
                browser = await puppeteer.launch({
                    userDataDir: `./data/${this.email}`,
                    headless: this.headless,
                    executablePath: "/usr/bin/google-chrome",
                    args: [
                        "--no-sandbox"
                    ],
                });
            }else{
                browser = await puppeteer.launch({
                    userDataDir: `./data/${this.email}`,
                    headless: this.headless,
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
            await page.type(inputAsk, text, {delay: 130});
            await sleep(900);

            await page.keyboard.press('Enter')

            await sleep(1000);

            
            const pageSelectorStreaming = "form > div > div.flex.w-full.items-center > div > div > button > svg > rect" 
            await page.waitForSelector(pageSelectorStreaming, {hidden: true, timeout: 0});
        
            const textChat = await page.$$(selector);
            const getText = textChat[textChat.length - 1]; 
            const textResponse = await getText?.evaluate(el => el.innerHTML);  
            const convertText =  convert(textResponse, options);
            this.#responseText = convertText;
            return convertText

        }catch(e){
            return "Can not generate response right now, Err : " + e.message
        }
        
 

    }


    async getSound(){
        try{

            const resText = this.#responseText
            if(resText == null || resText == ""){
                return "Text can not be empty!"
            }else{

                let arrText = []
                let audios = [];


                if(resText.trim().length > 600){

                    const texts = splitter(resText, 600);
                    arrText = texts

                }else{
                    arrText.push(resText)
                }

 

                for await (let text of arrText){

                    const dLang = lngDetector.detect(text, 1)
                    const getLang = dLang[0][0];

                    const lang = getLang == "english" ? 'English' : 'Indonesian'
                    const sound = getLang == "english" ? 'en-US-ChristopherNeural' : 'id-ID-ArdiNeural'

                    const fSound = await fetch("https://crikk.com/app/generate-audio", {
                      "headers": {
                        "accept": "application/json, text/javascript, */*; q=0.01",
                        "accept-language": "en-US,en;q=0.9,id;q=0.8",
                        "cache-control": "no-cache",
                        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
                        "pragma": "no-cache",
                        "priority": "u=1, i",
                        "sec-ch-ua": "\"Not/A)Brand\";v=\"8\", \"Chromium\";v=\"126\", \"Google Chrome\";v=\"126\"",
                        "sec-ch-ua-mobile": "?0",
                        "sec-ch-ua-platform": "\"Windows\"",
                        "sec-fetch-dest": "empty",
                        "sec-fetch-mode": "cors",
                        "sec-fetch-site": "same-origin",
                        "x-requested-with": "XMLHttpRequest"
                      },
                      "referrer": "https://crikk.com/text-to-speech/indonesian/",
                      "referrerPolicy": "strict-origin-when-cross-origin",
                      "body": `languages=${lang}&voice=${sound}&text=${text}`,
                      "method": "POST",
                      "mode": "cors",
                      "credentials": "include"
                    })
    
                    const response = await fSound.json();
                    audios.push(response)


                }

                return audios;
                 

            }           

        }catch(e){
            return "Can not generate sound right now, Err : " + e.message 
        }

        

    }
 
 
}


module.exports = ChatGPT



