const ChatGPT = require("./ChatGPT");
 

const ai = new ChatGPT("Your Registered Email", "Your Password");
ai.on('ready', async () => {

    const response = await ai.ask("How are you today?");
    console.log(response)

})

ai.on('error', (err) => {
    console.log(err)
})
 