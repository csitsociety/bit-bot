# Bit

Bit is CSIT's mascot, they help manage the CSIT Discord server.

## Commands

#### `poll [channel name]`

Run this command in a dm with Bit, and they will go through the name, description and poll options before posting it in the specified channel on the CSIT Discord server.

**Examples:**
`poll announcements`, `poll club-events`

#### `endpoll [channel name] [poll ID]`

Run this command in a dm with Bit, and they will close the poll specified by the poll ID. Note: The poll ID is given to the user when a poll is created.

**Examples:**
`endpoll announcements 123456789`

## Setup

1. Clone repository and run `npm i`
2. Rename `config.json.example` to `config.json` and fill out the details
3. Run `node .` to start the bot
