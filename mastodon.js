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

const INCLUDE_TYPES = ['mention']

const convert = compile({
  selectors: [{ selector: 'a', options: { ignoreHref: true } }]
})

/** Return an array of all mentions, where each mention is {notificationId, acct, text} */
export const mentions = async () =>
  (await notifications())
    .filter(
      (n) =>
        INCLUDE_TYPES.includes(n.type) &&
        !!n.status &&
        !n.status.sensitive &&
        !n.status.spoiler_text &&
        (!n.status.media_attachments ||
          n.status.media_attachments.length === 0) &&
        !n.status.poll &&
        !n.status.card
    )
    .map((n) => ({
      notificationId: n.id,
      statusId: n.status.id,
      acct: n.status.account.acct,
      text: convert(n.status.content)
    }))
