const http = require("http");
const fs = require("fs");

const mongoose = require('mongoose');

// Replace this with your actual link from MongoDB
const mongoURI = process.env.MONGO_URI;
mongoose.connect(mongoURI)
  .then(() => console.log('✅ Connected to Violet Database!'))
  .catch(err => console.error('❌ Database Connection Error:', err));

const counterSchema = new mongoose.Schema({
  id: String,
  seq: { type: Number, default: 0 }
});
const Counter = mongoose.model('Counter', counterSchema);

// Keeps the bot alive on Render
http.createServer((req, res) => res.end("Bot is running!")).listen(8080);

const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionsBitField,
  AttachmentBuilder,
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// ✅ DATABASE COUNTER (Lives in the cloud, never resets to 1)
async function getNextTicketNumber() {
    let counter = await Counter.findOneAndUpdate(
        { id: 'ticket_counter' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );
    return counter.seq;
}

// ✅ BOT READY
client.once("clientReady", () => {
  console.log(`✅ ${client.user.tag} is Online and ready for violet!`);
});

// 👋 WELCOME MESSAGE SYSTEM
client.on('guildMemberAdd', async (member) => {
    // 1. Fetch the user data FIRST to make sure PFP is loaded
    await member.user.fetch().catch(console.error);
  
    // Log it after fetching so you can see the real link in Render
    console.log(`User: ${member.user.tag} | Avatar URL: ${member.user.displayAvatarURL({ extension: 'png' })}`);

    const welcomeChannelID = '1496844901382492201'; 
    const channel = member.guild.channels.cache.get(welcomeChannelID);

    if (!channel)
        return console.log("❌ Welcome channel not found. Check the ID!");

    const welcomeEmbed = new EmbedBuilder()
        .setAuthor({
            name: `Welcome to Violet!`,
            iconURL: member.guild.iconURL(),
        })
        .setTitle(`✨ NEW MEMBER ✨`)
        // 2. Updated Thumbnail logic for better compatibility
        .setThumbnail(member.user.displayAvatarURL({ extension: 'png', forceStatic: false, size: 512 }))
        .setDescription(
            `### Hello, ${member}!\n` +
            `We're glad to have you here. Follow these steps to get started:\n\n` +
            `📜 **STEP 1**\nRead the rules in <#1494890673734680778>\n\n` +
            `📩 **STEP 2**\nApply for Crew in <#1495949406850121768>\n\n` +
            `🚩 *Make sure to follow the instructions carefully!*`,
        )
        .setColor("#8F00FF")
        .setImage(
            "https://media.discordapp.net/attachments/1420357526406430824/1496847734051701008/standard_5.gif?ex=69eb5f95&is=69ea0e15&hm=9956a40f08c6881922c26769f4ebaaf224494d93f901ab948776c93f730b9fb2&=&width=550&height=194",
        )
        .setFooter({
            text: `You are our ${member.guild.memberCount}th member!`,
            iconURL: client.user.displayAvatarURL(),
        })
        .setTimestamp();

    await channel.send({
        content: `Welcome to the Violet, ${member}! 🌊`,
        embeds: [welcomeEmbed],
    }).catch(console.error); // Catch errors to prevent crashes
});

// 📩 SETUP COMMANDS
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // 📢 Revive Chat (Keep command, delete bot ping)
  if (message.content === '!revive-chat') {
    const generalChannelID = '1494936734373380116'; 
    const generalChannel = message.guild.channels.cache.get(generalChannelID);

    if (generalChannel) {
      // 1. Bot sends the ping to General
      generalChannel.send('<@&1495947230660788224>').then(botPing => {
        // 2. Bot deletes ITS OWN ping immediately
        botPing.delete().catch(() => {});
      });
    }
  }

  // Ticket Setup
  if (message.content === "!setup-ticket") {
    const embed = new EmbedBuilder()
      .setAuthor({
        name: "Violet Support System",
        iconURL: client.user.displayAvatarURL(),
      })
      .setTitle("✨ VIOLET Ticket's ✨")
      .setThumbnail(client.user.displayAvatarURL())
      .setDescription(
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
          "**Welcome to the Violet Support System!**\n\n" +
          "Please select an option from the dropdown menu below to create a ticket.\n\n" +
          "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
          "*Click the dropdown below to get started!*",
      )
      .setColor("#ffffff")
      .setImage(
        "https://media.discordapp.net/attachments/1420357526406430824/1496847734051701008/standard_5.gif?ex=69eb5f95&is=69ea0e15&hm=9956a40f08c6881922c26769f4ebaaf224494d93f901ab948776c93f730b9fb2&=&width=550&height=194",
      )
      .setFooter({
        text: "V I O L E T • Your satisfaction is our priority",
        iconURL: client.user.displayAvatarURL(),
      });

    const menu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("ticket_menu")
        .setPlaceholder("Select a ticket type...")
        .addOptions(
          {
            label: "Support",
            emoji: "🆘",
            value: "support",
            description: "Get help from staff",
          },
          {
            label: "Claim Reward",
            emoji: "🎁",
            value: "reward",
            description: "Claim your reward",
          },
        ),
    );

    await message.channel.send({
      embeds: [embed],
      components: [menu],
    });

    await message.delete().catch((err) => {
      if (err.code !== 10008) console.error("Error deleting message:", err);
    });
  }

  // Application Setup
  if (message.content === "!setup-application") {
    const embed = new EmbedBuilder()
      .setAuthor({
        name: "World Savers Support System",
        iconURL: client.user.displayAvatarURL(),
      })
      .setTitle("**📩 Crew Application**")
      .setThumbnail(client.user.displayAvatarURL())
      .setDescription(
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
          "To apply for the crew, press the option below!\n\n" +
          "Make sure you’re ready to be an active and respectful member.\n\n" +
          "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
          "*Click the dropdown below to get started!*",
      )
      .setColor("#ffffff")
      .setImage(
        "https://media.discordapp.net/attachments/1420357526406430824/1493996540451098755/standard_1_1.gif",
      )
      .setFooter({
        text: "World Savers • Your satisfaction is our priority",
        iconURL: client.user.displayAvatarURL(),
      });

    const menu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("apply_menu")
        .setPlaceholder("Select a ticket type...")
        .addOptions({
          label: "Apply for Crew",
          emoji: "📩",
          value: "Crew Application",
        }),
    );

    await message.channel.send({
      embeds: [embed],
      components: [menu],
    });

    await message.delete().catch((err) => {
      if (err.code !== 10008) console.error("Error deleting message:", err);
    });
  }

  // Rules Setup Command
  if (message.content === "!setup-rules") {
    const embed = new EmbedBuilder()
      .setAuthor({
        name: "World Savers Official Rules",
        iconURL: client.user.displayAvatarURL(),
      })
      .setTitle("**📜 Server & Crew Guidelines**")
      .setDescription(
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
          "### 🌍 **Server Rules:**\n" +
          "1. Do not break Discord or Roblox Terms of Service.\n" +
          "2. Be respectful. Arguments should take place in DMs only.\n" +
          "3. Spamming/Spam-pinging is a bannable offense.\n" +
          "4. No blackmailing or harassing others.\n" +
          "5. No advertising in DMs or server channels.\n" +
          "6. Hate speech, racism, or extremism will not be tolerated.\n" +
          "7. Toxicity is strictly prohibited.\n" +
          "8. Bypassing slurs results in an immediate ban.\n\n" +
          "### 🏴‍☠️ **World Savers Crew Rules:**\n" +
          "1 | Do not leak any crew information.\n" +
          "2 | Failure to complete your quota will result in a kick.\n" +
          "3 | No leaking personal info or flaming crew members.\n" +
          "4 | Trolling or ragebaiting crewmates will result in strikes.\n" +
          "5 | Do not attack crewmates/allies without permission.\n" +
          "6 | DM the Captain or Admin for any questions.\n\n" +
          "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
          "*By staying in this server, you agree to follow these rules.*",
      )
      .setColor("#ffffff")
      .setImage(
        "https://media.discordapp.net/attachments/1494251438472167504/1494256613090000957/standard_2_1.gif?ex=69e1f26a&is=69e0a0ea&hm=17423eaba3561d88d0cfff1fe9bc92299c89aba7463c1c527f846b2c01ab5381&=",
      )
      .setFooter({
        text: "World Savers • Safety and Respect first",
        iconURL: client.user.displayAvatarURL(),
      });

    await message.channel.send({ embeds: [embed] });

    await message.delete().catch((err) => {
      if (err.code !== 10008) console.error("Error deleting message:", err);
    }); // This deletes your "!setup-rules" message to keep it clean
  }

  if (message.content === "!test-join") {
    client.emit("guildMemberAdd", message.member);
  }
});

// 🎫 INTERACTION SYSTEM
client.on("interactionCreate", async (interaction) => {
  if (
    interaction.isStringSelectMenu() &&
    (interaction.customId === "ticket_menu" ||
      interaction.customId === "apply_menu")
  ) {
if (!interaction.deferred && !interaction.replied) {
    await interaction.deferUpdate().catch(() => {});
}
    const type = interaction.values[0];

    try {
const ticketNumber = await getNextTicketNumber();
      
      const channel = await interaction.guild.channels.create({
        name: `ticket-${ticketNumber}`,
        type: ChannelType.GuildText,
        parent: "1494027527427981352", // ✅ UPDATED CATEGORY ID
        permissionOverwrites: [
          {
            id: interaction.guild.id,
            deny: [PermissionsBitField.Flags.ViewChannel],
          },
          {
            id: interaction.user.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ReadMessageHistory,
            ],
          },
        ],
      });

      const captainID = '1494000597312208896';
      const viceCaptainID = '1494000633416515604';
      const adminID = '1494000663267508396';
      const pings = `<@&${captainID}> <@&${viceCaptainID}> <@&${adminID}>`;

      const closeRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("close_ticket")
          .setLabel("Close Ticket")
          .setEmoji("🔒")
          .setStyle(ButtonStyle.Danger),
      );

      await channel.send({
        content:
          `${pings}\n` +
          "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
          `🎫 **${type.toUpperCase()} TICKET**\n\n` +
          `Welcome ${interaction.user}!\nPlease explain your issue/application. Our staff will be with you shortly.\n` +
          "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        components: [closeRow],
      });

      await interaction.followUp({
        content: `✅ Ticket created: ${channel}`,
        ephemeral: true,
      });
    } catch (error) {
      console.error(error);
      await interaction.followUp({
        content: "❌ Error! Check bot permissions and role IDs.",
        ephemeral: true,
      });
    }
  }

  if (interaction.isButton() && interaction.customId === "close_ticket") {
    const logChannelID = "1494009255622213632"; // ✅ UPDATED LOG CHANNEL ID
    const logChannel = interaction.guild.channels.cache.get(logChannelID);

    await interaction.reply("🔒 **Closing ticket in 5 seconds...**");

    try {
      const messages = await interaction.channel.messages.fetch({ limit: 100 });
      let transcriptText = `TRANSCRIPT: ${interaction.channel.name}\n`;
      transcriptText += `Closed by: ${interaction.user.tag} (${interaction.user.id})\n`;
      transcriptText += `Date: ${new Date().toLocaleString()}\n`;
      transcriptText += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

      messages.reverse().forEach((msg) => {
        transcriptText += `[${msg.createdAt.toLocaleString()}] ${msg.author.tag}: ${msg.content}\n`;
      });

      const attachment = new AttachmentBuilder(
        Buffer.from(transcriptText, "utf-8"),
        {
          name: `transcript-${interaction.channel.name}.txt`,
        },
      );

      if (logChannel) {
        await logChannel.send({
          content: `📄 **Ticket Closed**\n**Channel:** \`${interaction.channel.name}\`\n**Closed by:** ${interaction.user}`,
          files: [attachment],
        });
      }
    } catch (err) {
      console.error("Transcript Error: ", err);
    }

    setTimeout(async () => {
      try {
        await interaction.channel.delete();
      } catch (err) {
        console.log("Could not delete channel: ", err);
      }
    }, 5000);
  }
});

client.login(process.env.TOKEN);

process.on('unhandledRejection', (reason, p) => {
    console.log(' [Anti-Crash] Unhandled Rejection/Catch');
    console.log(reason, p);
});
process.on("uncaughtException", (err, origin) => {
    console.log(' [Anti-Crash] Uncaught Exception/Catch');
    console.log(err, origin);
});

process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log("🛑 MongoDB connection closed due to bot shutdown.");
    process.exit(0);
});
