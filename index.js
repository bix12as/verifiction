require('dotenv').config();
const { Client, GatewayIntentBits, Partials, EmbedBuilder, ButtonStyle, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const express = require('express');

// Create an express app to bind to a port
const app = express();
const port = process.env.PORT || 3000; // Use Render's PORT or default to 3000

app.get('/', (req, res) => {
  res.send('Hello from the bot app!');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});


const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember],
});

// Define the verification questions and answers
const verificationQuestions = [
  { question: 'What is 2 + 2?', answer: '4' },
  { question: 'What color is the sky on a clear day?', answer: 'blue' },
  { question: 'What is the capital of France?', answer: 'paris' },
  { question: 'How many legs does a spider have?', answer: '8' },
  { question: 'Which planet is known as the Red Planet?', answer: 'mars' },
  { question: 'What is the square root of 16?', answer: '4' },
  { question: 'What is the largest mammal on Earth?', answer: 'blue whale' },
  { question: 'How many continents are there?', answer: '7' },
  { question: 'What is the boiling point of water in Celsius?', answer: '100' },
  { question: 'Who wrote "Romeo and Juliet"?', answer: 'shakespeare' },
  { question: 'Which ocean is the largest?', answer: 'pacific' },
  { question: 'What is the chemical symbol for water?', answer: 'h2o' },
  { question: 'How many hours are in a day?', answer: '24' },
  { question: 'In which country is the Great Wall located?', answer: 'china' },
  { question: 'What is the smallest prime number?', answer: '2' },
  { question: 'What color are bananas when ripe?', answer: 'yellow' },
  { question: 'Which animal is known as the "King of the Jungle"?', answer: 'lion' },
  { question: 'What currency is used in Japan?', answer: 'yen' },
  { question: 'What is the capital city of the United Kingdom?', answer: 'london' },
  { question: 'What gas do plants absorb from the atmosphere?', answer: 'carbon dioxide' },
];

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  
  updateUptime(); // Call the function initially
  setInterval(updateUptime, 60000); // Update every minute
});

// Function to update the bot's bio with uptime
function updateUptime() {
  const uptimeSeconds = Math.floor(process.uptime());
  const days = Math.floor(uptimeSeconds / (3600 * 24));
  const hours = Math.floor((uptimeSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = uptimeSeconds % 60;

  const uptimeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;

  client.user.setPresence({
    activities: [{ name: `Uptime: ${uptimeString} | Zespera`, type: 3 }],
    status: 'online',
  });
}

// Handle new member joins
client.on('guildMemberAdd', async (member) => {
  const verifyChannel = member.guild.channels.cache.find(channel => channel.name === '✅｜verify'); // Find the verify channel

  if (!verifyChannel) {
    console.log("No '✅｜verify' channel found.");
    return;
  }

  try {
    // Create the verify button and the embed
    const verifyButton = new ButtonBuilder()
      .setCustomId('verify')
      .setLabel('Verify Me!')
      .setStyle(ButtonStyle.Primary); // Use ButtonStyle enum for the button style
  
    const buttonRow = new ActionRowBuilder().addComponents(verifyButton); // Correct usage of ActionRowBuilder
  
    const welcomeEmbed = new EmbedBuilder()
      .setColor('Blue')
      .setTitle('Welcome to the Server!')
      .setDescription('Please click the button below to start the verification process.');
  
    // Send the verification message to the 'verify' channel
    await verifyChannel.send({
      embeds: [welcomeEmbed],
      components: [buttonRow],
    });

  } catch (error) {
    console.error('Error sending message to verify channel:', error);
  }
});

// Handle the button interaction
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId === 'verify') {
    // Check if the user is already verified
    if (interaction.member.roles.cache.some((role) => role.name === 'Verified')) {
      const alreadyVerifiedEmbed = new EmbedBuilder()
        .setColor('Green')
        .setTitle('Verification Status')
        .setDescription('You are already verified!')
        .setFooter({ text: 'No further action needed.' });
      return interaction.reply({ embeds: [alreadyVerifiedEmbed], ephemeral: true });
    }

    // Select a random verification question
    const randomQuestion = verificationQuestions[Math.floor(Math.random() * verificationQuestions.length)];
    const questionEmbed = new EmbedBuilder()
      .setColor('Blue')
      .setTitle('Verification Question')
      .setDescription(`**${randomQuestion.question}**\nYou have 30 seconds to answer!`)
      .setFooter({ text: 'Please type your answer in the chat.' });

    await interaction.reply({
      embeds: [questionEmbed],
      ephemeral: true, // Make the response only visible to the user
    });

    // Collect the user's answer
    const filter = (response) => response.author.id === interaction.user.id;
    const collector = interaction.channel.createMessageCollector({ filter, time: 30000 });

    collector.on('collect', async (response) => {
      const answer = response.content.toLowerCase();
      if (answer === randomQuestion.answer.toLowerCase()) {
        const verifiedRole = interaction.guild.roles.cache.find((role) => role.name === 'Verified');
        if (verifiedRole) {
          await interaction.member.roles.add(verifiedRole);
          const successEmbed = new EmbedBuilder()
            .setColor('Green')
            .setTitle('Verification Successful')
            .setDescription('🎉 Congratulations! You have been verified and assigned the "Verified" role.')
            .setFooter({ text: 'Enjoy your stay!' });

          await interaction.followUp({ embeds: [successEmbed], ephemeral: true });

          // Clear recent messages (including the bot's and user's)
          const messages = await interaction.channel.messages.fetch({ limit: 50 });
          const messagesToDelete = messages.filter(
            (msg) => msg.author.id === client.user.id || msg.author.id === interaction.user.id
          );

          await interaction.channel.bulkDelete(messagesToDelete, true).catch(() => {
            console.error('Could not delete messages (messages older than 2 weeks can’t be bulk deleted).');
          });
        } else {
          interaction.followUp('Could not find the "Verified" role. Please contact an admin.');
        }
        collector.stop();
      } else {
        const incorrectEmbed = new EmbedBuilder()
          .setColor('Red')
          .setTitle('Incorrect Answer')
          .setDescription('❌ That answer is incorrect. Please try again.')
          .setFooter({ text: 'Better luck next time!' });
        interaction.followUp({ embeds: [incorrectEmbed], ephemeral: true });
      }
    });

    collector.on('end', (collected, reason) => {
      if (reason === 'time') {
        const timeoutEmbed = new EmbedBuilder()
          .setColor('Red')
          .setTitle('Verification Timed Out')
          .setDescription('⏳ You did not answer in time. Please try again.')
          .setFooter({ text: 'Be quick next time!' });
        interaction.followUp({ embeds: [timeoutEmbed], ephemeral: true });
      }
    });
  }
});

client.login(process.env.TOKEN);
