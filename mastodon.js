import { pp } from 'passprint'
import { compile } from 'html-to-text'

const accessToken = process.env.MASTODON_ACCESS_TOKEN
const mastodonServer = process.env.MASTODON_SERVER
const baseUrl = `https://${mastodonServer}`

// Conditions for terminating a thread of conversations
const TERMINATE_MIN_COUNT = 20
const TERMINATE_MIN_FRACTION_REPEATED = 0.8

const fullAcct = (acct) =>
  acct.match(/@/) ? acct : `${acct}@${mastodonServer}`

const headers = {
  Authorization: `Bearer ${accessToken}`
}

const notifications = async () => {
  const result = await (
    await fetch(pp(`${baseUrl}/api/v1/notifications/`), { headers })
  ).json()
  if (result.error) {
    console.error({ result })
    throw new Error(result.error)
  }
  return result
}

/** Dismiss the notification so that it will not be returned in the next call to mentions() */
export const dismissNotification = async (notificationId) => {
  await fetch(pp(`${baseUrl}/api/v1/notifications/${notificationId}/dismiss`), {
    method: 'POST',
    headers
  })
}

const getToot = async (id) => {
  const result = await (
    await fetch(pp(`${baseUrl}/api/v1/statuses/${id}`), { headers })
  ).json()
  if (result.error) {
    throw new Error(result.error)
  }
  return {
    statusId: result.id,
    acct: result.account.acct,
    inReplyToId: result.in_reply_to_id,
    text: convert(result.content)
  }
}

/** Post a response */
export const toot = async (status, inReplyToId) => {
  const body = new URLSearchParams()
  body.append('status', status)
  body.append('in_reply_to_id', inReplyToId)
  pp(body)
  await fetch(pp(`${baseUrl}/api/v1/statuses`), {
    method: 'POST',
    headers,
    body
  })
}

const n = 3
const ngrams = (text) => {
  const result = []
  for (let i = 0; i < text.length - n + 1; i++) {
    result.push(text.slice(i, i + n))
  }
  return new Set(result)
}

/** Return a string that concatetes the text for all the posts
 * in the thread ending with the given post */
export const assembleThread = async (post) => {
  let thread = `@${post.acct}: ${post.text}`
  // let unusedNgrams = new Set(post.text.split(/\W+/))
  const unusedNgrams = {}
  const newPostText = post.text
  for (const ngram of ngrams(pp(newPostText))) {
    unusedNgrams[ngram] = true
  }
  const postWordCount = Object.keys(unusedNgrams).length
  let count = 0
  while (post.inReplyToId) {
    const parentPost = await getToot(post.inReplyToId)
    for (const ngram of ngrams(parentPost.text)) {
      delete unusedNgrams[ngram]
    }
    thread = `@${parentPost.acct}: ${parentPost.text}\n\n${thread}`
    post = parentPost
    count++
  }
  const fractionRepeated = 1 - Object.keys(unusedNgrams).length / postWordCount
  const terminate =
    count > TERMINATE_MIN_COUNT &&
    fractionRepeated > TERMINATE_MIN_FRACTION_REPEATED
  if (terminate) {
    console.log(
      `Terminating because "
${newPostText}
" is in ${count}-long thread and repeats ${fractionRepeated} what's already in thread`
    )
  }
  return { thread, terminate }
}

const INCLUDE_TYPES = ['mention', 'reblog', 'favourite']

const convert = compile({
  selectors: [
    { selector: 'a', options: { ignoreHref: true } },
    { selector: 'nav', format: 'skip' },
    { selector: 'button', format: 'skip' },
    { selector: 'form', format: 'skip' },
    { selector: 'script', format: 'skip' },
    { selector: 'style', format: 'skip' },
    { selector: 'header', format: 'skip' },
    { selector: 'footer', format: 'skip' },
    { selector: 'template', format: 'skip' }
  ]
})

const filteredStatus = (status) =>
  !status.sensitive &&
  !status.spoiler_text &&
  (!status.media_attachments ||
    status.media_attachments.length === 0 ||
    status.media_attachments.every((m) => !!m.description)) &&
  !status.poll &&
  (!status.card || status.card.type === 'link')

const statusText = async (status) => {
  let result = convert(status.content)
  if (status.media_attachments) {
    for (const media of status.media_attachments) {
      if (media.description) {
        result += `\n${media.description}`
      }
    }
  }
  if (status.card) {
    if (status.card.title) {
      result += `\n${status.card.title}`
    }
    if (status.card.description) {
      result += `\n${status.card.description}`
    }
    const linkContent = convert(await (await fetch(status.card.url)).text())
    result += `\n${linkContent}`
  }
  return result
}

/** Return an array of all mentions, where each mention is {notificationId, acct, text} */
export const mentions = async () =>
  await Promise.all(
    (
      await notifications()
    )
      .filter(
        (n) =>
          INCLUDE_TYPES.includes(n.type) &&
          !!n.status &&
          filteredStatus(n.status)
      )
      .map(async (n) => ({
        notificationId: n.id,
        statusId: n.status.id,
        acct: fullAcct(n.status.account.acct),
        inReplyToId: n.status.in_reply_to_id,
        text: await statusText(n.status)
      }))
  )
