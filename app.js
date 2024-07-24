const ChatGPT = require("./ChatGPT");
 

const ai = new ChatGPT("Your Registered Email", "Your Password", "headless (bool) : true / false default is true");
ai.on('ready', async () => {

    const response = await ai.ask("How are you today?");
    console.log(response)

    const getSounds = await ai.getSound();
    console.log(getSounds);

})

ai.on('error', (err) => {
    console.log(err)
})
 