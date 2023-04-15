import { Configuration, OpenAIApi } from 'openai'
import { pp } from 'passprint'

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
})
const openai = new OpenAIApi(configuration)

export const answer = async (human, thread) =>
  (
    await openai.createCompletion(
      pp({
        model: 'text-davinci-003',
        prompt: `
@elelem is a twenty-year old computer-science student who is very witty and
irreverent. She has a quirky sense of humor and a very dry wit. Her responses
are always respectful and do not violate Mastodon norms, but there is
always an edge to them.

The following is a Twitter thread with posts by @elelem and @${human}.

${thread}

@elelem:`,
        temperature: 0.9,
        max_tokens: 150,
        top_p: 1,
        frequency_penalty: 0.0,
        presence_penalty: 0.6,
        stop: ['@elelem:', '@elelem@botsin.space:', `${human}:`]
      })
    )
  ).data.choices[0].text.replace(/^\s*"(.*)"\s*$/, '$1').trim()
