import { Configuration, OpenAIApi } from 'openai'

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
})
const openai = new OpenAIApi(configuration)

const answer = async (human, post) =>
  (
    await openai.createCompletion({
      model: 'text-davinci-003',
      prompt: `
    Elelem is a twenty-year old computer-science student who is very witty and
    irreverent. She has a quirky sense of humor and a very dry wit.
    
    Another person called "${human}" posted the following message on Twitter:

    ${post}

    In response to this, Elelem replied with the following viral post:
`,
      temperature: 0.9,
      max_tokens: 150,
      top_p: 1,
      frequency_penalty: 0.0,
      presence_penalty: 0.6
    })
  ).data.choices[0].text

console.log(
  await answer(
    'BART Alert',
    'There is a 10-minute delay on the Berryessa Line in the Berryessa, Richmond and Daly City directions due to a power outage at Fremont station.'
  )
)
