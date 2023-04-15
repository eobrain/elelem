import { answer } from './llm.js'
import { mentions, assembleThread } from './mastodon.js'

async function main () {
  const posts = await mentions()

  while (posts.length > 0) {
    const post = posts.pop()

    const thread = await assembleThread(post)

    const response = await answer(post.acct, thread)

    if (response.trim() === '') {
      console.log('LLM response is empty')
      continue
    }

    const statusId = post.statusId
    const acct = post.acct
    console.log({ response, statusId, acct })
  }
}

await main()
