# Mastodon LLM-driven chat bot

Mention @elelem@botsin.space in a Mastodon toot and the bot might respond to you.

## Setup

Create a file called `secrets.env` for your various secrets:

```bash
export OPENAI_API_KEY=...
export MASTODON_BASE_URL=https://botsin.space
export MASTODON_ACCESS_TOKEN=...
```

You can get the OPENAI_API_KEY from https://platform.openai.com/account/api-keys and the MASTODON_ACCESS_TOKEN from https://botsin.space/settings/applications/ 

Assuming you are using `nvm` for managing your node versions, do

```bash
nvm use
npm install
```

## Running

```bash
./run.sh
```

