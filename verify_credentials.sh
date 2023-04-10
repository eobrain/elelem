set -x

. ./secrets.env

curl \
  -H "Authorization: Bearer $MASTODON_ACCESS_TOKEN" \
  $MASTODON_BASE_URL/api/v1/apps/verify_credentials