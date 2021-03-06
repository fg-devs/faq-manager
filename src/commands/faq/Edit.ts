import * as commando from 'discord.js-commando'
import {CommandoMessage} from "discord.js-commando";
import {TextChannel} from "discord.js";
import {config, pg} from "../../bot";
import {faqEmbed} from "../../utils";

export = class EditCommand extends commando.Command {
    private readonly channel: string;
    constructor(client: commando.Client) {
        super(client, {
            name: 'edit',
            group: 'faq',
            memberName: 'edit',
            description: 'edits a faq question',
            aliases: ['change', 'set'],
            userPermissions: ['MANAGE_MESSAGES'],
            guildOnly: true,
            args: [
                {
                    key: 'id',
                    prompt: 'What question do you want to edit?',
                    type: 'string'
                },
                {
                    key: 'question',
                    prompt: 'What question do you need to be answered?',
                    type: 'string'
                },
                {
                    key: 'answer',
                    prompt: 'What answer do you want for the question?',
                    type: 'string'
                }
            ],
        });
        this.channel = config.channel_id
    }

    public async run(msg: CommandoMessage, {id, question, answer}: {id: string, question: string, answer: string}): Promise<null> {
        let res = await pg.query("SELECT question, answer, id, message_id FROM faq.faq WHERE message_id = $1 OR id = $1::bigint LIMIT 1", [id]);
        if (res.rowCount === 0) {
            await msg.reply("Unable to locate faq");
            return null;
        }

        let embed = faqEmbed({question, answer});
        let channel = (await this.client.channels.fetch(this.channel, true)) as TextChannel;
        let message = await channel.messages.fetch(res.rows[0].message_id);
        await message.edit(embed)
        await pg.query("UPDATE faq.faq SET question = $1, answer = $2 WHERE id = $3", [res.rows[0].question, res.rows[0].answer, res.rows[0].id]);
        await msg.react("???");
        return null
    }
}
