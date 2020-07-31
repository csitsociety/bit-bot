# Bit <img width="100" align="right" src="https://raw.githack.com/csitsociety/bit-bot/master/avatar.png" alt="avatar">

Bit is CSIT's mascot, they help manage the CSIT Discord server.

- [Commands](#commands)
- [Other Functions](#other-functions)
- [Setup](#setup)

## Commands

#### `poll [channel name]`

Run this command in a dm with Bit, and they will go through the name, description and poll options before posting it in the specified channel on the CSIT Discord server.

**Examples:**
`poll announcements`, `poll club-events`

#### `endpoll [channel name] [poll ID]`

Run this command in a dm with Bit, and they will close the poll specified by the poll ID. Note: The poll ID is given to the user when a poll is created.

**Examples:**
`endpoll announcements 123456789`

#### `reactionroles [channel name] [message ID]`

Run this command in a dm with Bit, and they will ask some questions to set up reaction roles on the message specified. **Note:** Running `reactionroles` on a previously registered message will overwrite the previous config.

**Examples:**
`reactionroles rules 123456789`

#### `cancelrr [channel name] [message ID]`

Run this command in a dm with Bit, and they will unregister a message that has previously been set up for reaction roles.

**Examples:**
`cancelrr rules 123456789`

#### `s[student number]`

Dm Bit your student number, and they will check if you have signed up for CSIT and give you a member role in Dicord.

**Examples:**
`s1234567`

## Other Functions

#### Welcome messages

Bit welcomes new members to the server and also sends a DM to every new user with info about the server. The `intro_channel_id` variable will need to be set in the config file.

#### Auto server icon rotation

**Note: requires 'manage server' permissions**

Bit can automatically cycle between different server icons at certain intervals. To enable, set the `auto_icon` config variable to a cron pattern for when the icon should be changed, and create a folder called `icons` with different icons to use. Bit will select a random icon from that folder. To disable this feature, leave the `auto_icon` config variable empty.

To change the icon every day at midnight, set the `auto_icon` config variable to `0 0 * * *`.

## Setup

1. Clone repository and run `npm i`
2. Rename `config.json.example` to `config.json` and fill out the details
3. The Google service account credentials must be saved in `service_account_credentials.json` in the root directory
4. Run `node .` to start the bot
