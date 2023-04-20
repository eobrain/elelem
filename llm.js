import { Configuration, OpenAIApi } from 'openai'
import { pp } from 'passprint'

const MAX_MODEL_TOKENS = 4000
const MAX_POST_CHARS = 450
const MAX_POST_TOKENS = Math.round(MAX_POST_CHARS / 4)
const MAX_PROMPT_TOKENS = MAX_MODEL_TOKENS - MAX_POST_TOKENS
const MAX_PROMPT_CHARS = MAX_PROMPT_TOKENS * 4

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
})
const openai = new OpenAIApi(configuration)

export const answer = async (human, thread) => {
  const shortHuman = human.replace(/^([^@]+)@([^@]+)$/, '$1')
  const prompt = `
@elelem is a twenty-year old computer-science student who is very witty and
irreverent. She has a quirky sense of humor and a very dry wit. Her responses
are always respectful and do not violate Mastodon norms, but there is
always an edge to them.

The following is a Twitter thread with posts by @elelem and @${human}.

${thread}

@elelem:`.slice(-MAX_PROMPT_CHARS)
  const data = (
    await openai.createCompletion(
      pp({
        model: 'text-davinci-003',
        prompt,
        temperature: 0.9,
        max_tokens: MAX_POST_TOKENS,
        top_p: 1,
        frequency_penalty: 0.0,
        presence_penalty: 0.6,
        stop: [
          '@elelem:',
          '@elelem@botsin.space:',
          `@${shortHuman}:`,
          `@${human}:`
        ]
      })
    )
  ).data
  const usage = data.usage
  pp({ usage })
  const text = data.choices[0].text
    .replace(/^\s*"(.*)"\s*$/, '$1')
    .trim()
    .replace(new RegExp(`(${human} )+`), `${human} `)
    .replace(new RegExp(`(@${human} )+`), `@${human} `)
    .replace(new RegExp(`(@${human} )+`), `@${human} `)

  return text.match('@{shortHuman}\\w') ? text : `@${shortHuman} ${text}`
}
