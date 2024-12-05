require('dotenv').config();
const { Client, GatewayIntentBits, Partials, EmbedBuilder } = require('discord.js');

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
});

client.on('messageCreate', async (message) => {
  if (message.content.toLowerCase() === '!verify') {
    if (message.member.roles.cache.some((role) => role.name === 'Verified')) {
      const alreadyVerifiedEmbed = new EmbedBuilder()
        .setColor('Green')
        .setTitle('Verification Status')
        .setDescription('You are already verified!')
        .setFooter({ text: 'No further action needed.' });
      return message.reply({ embeds: [alreadyVerifiedEmbed] });
    }

    const randomQuestion = verificationQuestions[Math.floor(Math.random() * verificationQuestions.length)];
    const questionEmbed = new EmbedBuilder()
      .setColor('Blue')
      .setTitle('Verification Question')
      .setDescription(`**${randomQuestion.question}**\nYou have 30 seconds to answer!`)
      .setFooter({ text: 'Please type your answer in the chat.' });

    const questionMessage = await message.channel.send({ embeds: [questionEmbed] });

    const filter = (response) => response.author.id === message.author.id;
    const collector = message.channel.createMessageCollector({ filter, time: 35000 });

    collector.on('collect', async (response) => {
      const answer = response.content.toLowerCase();
      if (answer === randomQuestion.answer.toLowerCase()) {
        const verifiedRole = message.guild.roles.cache.find((role) => role.name === 'Verified');
        if (verifiedRole) {
          await message.member.roles.add(verifiedRole);
          const successEmbed = new EmbedBuilder()
            .setColor('Green')
            .setTitle('Verification Successful')
            .setDescription('🎉 Congratulations! You have been verified and assigned the "Verified" role.')
            .setFooter({ text: 'Enjoy your stay!' });

          await response.reply({ embeds: [successEmbed] });

          // Clear recent messages (including the bot's and user's)
          const messages = await message.channel.messages.fetch({ limit: 50 });
          const messagesToDelete = messages.filter(
            (msg) => msg.author.id === client.user.id || msg.author.id === message.author.id
          );

          await message.channel.bulkDelete(messagesToDelete, true).catch(() => {
            console.error('Could not delete messages (messages older than 2 weeks can’t be bulk deleted).');
          });
        } else {
          response.reply('Could not find the "Verified" role. Please contact an admin.');
        }
        collector.stop();
      } else {
        const incorrectEmbed = new EmbedBuilder()
          .setColor('Red')
          .setTitle('Incorrect Answer')
          .setDescription('❌ That answer is incorrect. Please try again by typing `/verify`.')
          .setFooter({ text: 'Better luck next time!' });
        response.reply({ embeds: [incorrectEmbed] });
      }
    });

    collector.on('end', (collected, reason) => {
      if (reason === 'time') {
        const timeoutEmbed = new EmbedBuilder()
          .setColor('Red')
          .setTitle('Verification Timed Out')
          .setDescription('⏳ You did not answer in time. Please try again by typing `/verify`.')
          .setFooter({ text: 'Be quick next time!' });
        message.reply({ embeds: [timeoutEmbed] });
      }
    });
  }
});

client.login(process.env.TOKEN);
