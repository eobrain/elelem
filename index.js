import { answer } from './llm.js'
import {
  mentions,
  dismissNotification,
  assembleThread,
  toot
} from './mastodon.js'
import { pp } from 'passprint'

async function main () {
  const posts = pp(await mentions())

  if (posts.length === 0) {
    console.log('No posts to reply to')
    return
  }

  // Randomly select a post to reply to
  const post = posts[Math.floor(Math.random() * posts.length)]

  const thread = await assembleThread(post)

  const response = await answer(post.acct, thread)

  if (response.trim() === '') {
    console.log('LLM response is empty')
    return
  }

  console.log(`toot(${response}), ${post.statusId}, ${post.acct}`)
  await toot(response, post.statusId, post.acct)

  await dismissNotification(pp(post.notificationId))
}

await main()
