import { answer } from './llm.js'
import {
  mentions,
  dismissNotification,
  assembleThread,
  toot
} from './mastodon.js'
import { pp } from 'passprint'

const randomAlement = (xs) => xs[Math.floor(Math.random() * xs.length)]

async function main () {
  const posts = pp(await mentions())

  if (posts.length === 0) {
    console.log('No posts to reply to')
    return
  }

  // Group posts by acct
  const postsPerAcct = {}
  for (const post of posts) {
    if (post.acct in Object.keys(postsPerAcct)) {
      postsPerAcct[post.acct].push(post)
    } else {
      postsPerAcct[post.acct] = [post]
    }
  }

  // Randomly select a user to reply to
  const acct = randomAlement(Object.keys(postsPerAcct))

  // Randomly select a post from that user
  const post = randomAlement(postsPerAcct[acct])

  const thread = await assembleThread(post)

  const response = await answer(post.acct, thread)

  if (response.trim() === '') {
    console.log('LLM response is empty')
    return
  }

  console.log(`toot(${response}), ${post.statusId}`)
  await toot(response, post.statusId)

  await dismissNotification(pp(post.notificationId))
}

await main()
