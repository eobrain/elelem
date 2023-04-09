import { answer } from './llm.js'
import { mentions } from './mastodon.js'
import { pp } from 'passprint'

async function main () {
  const posts = pp(await mentions())

  if (posts.length === 0) {
    console.log('No posts to reply to')
    return
  }

  const post = pp(posts.slice(-1))[0]

  console.log(await answer(pp(post.acct), pp(post.text)))
}

await main()
