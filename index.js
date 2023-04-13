import { answer } from './llm.js'
import { mentions, dismissNotification, getToot, toot } from './mastodon.js'
import { pp } from 'passprint'

async function main () {
  const posts = pp(await mentions())

  if (posts.length === 0) {
    console.log('No posts to reply to')
    return
  }

  let post = pp(posts[posts.length - 1])
  const originalAcct = post.acct
  const originalStatusId = post.statusId
  const notificationId = post.notificationId

  let thread = `@${post.acct}: ${post.text}`
  while (post.inReplyToId) {
    const parentPost = await getToot(post.inReplyToId)
    thread = `@${parentPost.acct}: ${parentPost.text}\n\n${thread}`
    post = parentPost
  }

  const response = await answer(post.acct, thread)

  if (response.trim() === '') {
    console.log('LLM response is empty')
    return
  }

  console.log(`toot(${response}), ${originalStatusId}, ${originalAcct}`)
  // await toot(response, originalStatusId, originalAcct)

  // await dismissNotification(pp(notificationId))
}

await main()
