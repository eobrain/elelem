import { pp } from 'passprint'
import { compile } from 'html-to-text'

const accessToken = process.env.MASTODON_ACCESS_TOKEN
const baseUrl = process.env.MASTODON_BASE_URL

const headers = {
  Authorization: `Bearer ${accessToken}`
}

const notifications = async () => {
  const result = await (
    await fetch(pp(`${baseUrl}/api/v1/notifications/`), { headers })
  ).json()
  if (result.error) {
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

export const assembleThread = async (post) => {
  let thread = `@${post.acct}: ${post.text}`
  while (post.inReplyToId) {
    const parentPost = await getToot(post.inReplyToId)
    thread = `@${parentPost.acct}: ${parentPost.text}\n\n${thread}`
    post = parentPost
  }
  return thread
}

const INCLUDE_TYPES = ['mention']

const convert = compile({
  selectors: [{ selector: 'a', options: { ignoreHref: true } }]
})

const filteredStatus = (status) =>
  !status.sensitive &&
  !status.spoiler_text &&
  (!status.media_attachments || status.media_attachments.length === 0) &&
  !status.poll &&
  !status.card

const statusText = (status) => convert(status.content)

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
        acct: n.status.account.acct,
        inReplyToId: n.status.in_reply_to_id,
        text: statusText(n.status)
      }))
  )
