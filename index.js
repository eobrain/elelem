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
  const posts = await mentions()

  if (posts.length === 0) {
    console.log('No posts to reply to')
    return
  }

  // Group posts by acct
  const postsPerAcct = {}
  for (const post of posts) {
    if (Object.keys(postsPerAcct).includes(post.acct)) {
      postsPerAcct[post.acct].push(post)
    } else {
      postsPerAcct[post.acct] = [post]
    }
  }

  // Randomly select a user to reply to
  const acct = randomAlement(Object.keys(postsPerAcct))
  console.log(
    `Chose ${acct} with ${postsPerAcct[acct].length
    } elements from ${Object.keys(postsPerAcct)}`
  )

  // Randomly select a post from that user
  const post = randomAlement(postsPerAcct[acct])
  console.log(`Chose ${post.text}`)

  const { thread, terminate } = await assembleThread(post)

  if (terminate) {
    console.log(
      `Not replying to ${acct} because we seem to be stuck in a conversational loop`
    )
  } else {
    let response = await answer(post.acct, thread)

    if (response.trim() === '') {
      console.log('LLM response is empty')
      return
    }

    for (const mention of post.mentions) {
      if (!response.includes(mention)) {
        response = mention + ' ' + response
      }
    }

    console.log(`toot(${response}), ${post.statusId}`)
    const { status, statusText } = pp(await toot(response, post.statusId))
    if (status !== 200) {
      console.loog(`Failed to toot with status=#{status} (${statusText})`)
      return
    }
  }

  await dismissNotification(pp(post.notificationId))
}

await main()
