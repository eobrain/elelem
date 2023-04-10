import { answer } from './llm.js'
import { mentions, dismissNotification, toot } from './mastodon.js'
import { pp } from 'passprint'

async function main () {
  const posts = pp(await mentions())

  if (posts.length === 0) {
    console.log('No posts to reply to')
    return
  }

  const post = pp(posts[posts.length - 1])

  const response = await answer(pp(post.acct), pp(post.text))

  await toot(pp(response), pp(post.statusId), post.acct)

  await dismissNotification(pp(post.notificationId))
}

await main()
