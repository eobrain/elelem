import { pp } from 'passprint'
import { compile } from 'html-to-text'

const accessToken = process.env.MASTODON_ACCESS_TOKEN
const baseUrl = process.env.MASTODON_BASE_URL

const notifications = async () => {
  const result = await (
    await fetch(
      pp(`${baseUrl}/api/v1/notifications/`),
      pp({
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      })
    )
  ).json()
  if (result.error) {
    throw new Error(result.error)
  }
  return result
}

const INCLUDE_TYPES = ['mention']

const convert = compile({
  selectors: [{ selector: 'a', options: { ignoreHref: true } }]
})

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
      acct: n.status.account.acct,
      text: convert(n.status.content)
    }))
