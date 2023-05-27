import { answer } from './llm.js'
import { mentions, assembleThread } from './mastodon.js'
import { pp } from 'passprint'

const fakeAnswer = async (acct, thread) => {
  return '@foo@bar.com @elelem@botsin.space Hello'
}

async function main () {
  const posts = await mentions()

  let count = 0
  while (posts.length > 0 && count++ < 3) {
    const post = posts.pop()

    const { thread, terminate } = await assembleThread(post)

    if (terminate) {
      console.log('Terminate')
      continue
    }
    let response = await answer(post.acct, thread)
    // let response = await fakeAnswer(post.acct, thread)

    if (response.trim() === '') {
      console.log('LLM response is empty')
      continue
    }

    for (const mention of post.mentions) {
      if (!response.includes(mention)) {
        response = mention + ' ' + response
      }
    }

    const statusId = post.statusId
    console.log({ response, statusId })
  }
}

await main()
