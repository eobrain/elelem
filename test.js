import { answer } from './llm.js'
import { mentions, assembleThread } from './mastodon.js'

async function main () {
  const posts = await mentions()

  let count = 0
  while (posts.length > 0 && count++ < 3) {
    const post = posts.pop()

    const { thread, terminate } = await assembleThread(post)

    let response = await answer(post.acct, thread)

    if (terminate) {
      // Strip out the mentions from the response, to terminate the thread
      response = response.replaceAll(`@${post.acct}`, post.acct)
    }

    if (response.trim() === '') {
      console.log('LLM response is empty')
      continue
    }

    const statusId = post.statusId
    console.log({ response, statusId })
  }
}

await main()
