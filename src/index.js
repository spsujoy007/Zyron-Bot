const http = require('http');
const { Bot, InlineKeyboard } = require('grammy');
require('dotenv').config();
const nodemailer = require('nodemailer');
const connectDB = require('./config/db');
const Note = require('./models/Note');
const Idea = require('./models/Idea');
const Reminder = require('./models/Reminder');
const Task = require('./models/Task');
const Mood = require('./models/Mood');

const bot = new Bot(process.env.BOT_TOKEN);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const emailSessions = new Map();

const startMenu = new InlineKeyboard()
  .text('📝 Save Note', 'menu_note')
  .text('💡 Save Idea', 'menu_idea')
  .row()
  .text('⏰ Set Reminder', 'menu_remind')
  .text('✅ Add Task', 'menu_task')
  .row()
  .text('😊 Log Mood', 'menu_mood')
  .text('📊 Summary', 'menu_summary')
  .row()
  .text('📧 Send Email', 'menu_email')
  .text('❓ Help', 'menu_help');

bot.command('start', (ctx) => {
  ctx.reply(
    `👋 Hey! I'm your **Daily Life Assistant**.\n\nChoose an option below:`,
    { parse_mode: 'Markdown', reply_markup: startMenu }
  );
});

bot.callbackQuery('menu_note', (ctx) => {
  ctx.answerCallbackQuery();
  ctx.reply('📝 Send me your note:\n\nExample: `/note Buy groceries`', { parse_mode: 'Markdown' });
});

bot.callbackQuery('menu_idea', (ctx) => {
  ctx.answerCallbackQuery();
  ctx.reply('💡 Send me your idea:\n\nExample: `/idea Build a mobile app`', { parse_mode: 'Markdown' });
});

bot.callbackQuery('menu_remind', (ctx) => {
  ctx.answerCallbackQuery();
  ctx.reply('⏰ Send reminder:\n\nExample: `/remind 30 Call mom`', { parse_mode: 'Markdown' });
});

bot.callbackQuery('menu_task', (ctx) => {
  ctx.answerCallbackQuery();
  ctx.reply('✅ Send me your task:\n\nExample: `/task Finish report`', { parse_mode: 'Markdown' });
});

bot.callbackQuery('menu_mood', (ctx) => {
  ctx.answerCallbackQuery();
  ctx.reply('😊 Log your mood:\n\nExample: `/mood happy`', { parse_mode: 'Markdown' });
});

bot.callbackQuery('menu_email', (ctx) => {
  ctx.answerCallbackQuery();
  emailSessions.set(ctx.from.id, { step: 'to' });
  ctx.reply('📧 Send an email!\n\nStep 1/3: Send me the recipient email address:');
});

bot.callbackQuery('menu_summary', async (ctx) => {
  ctx.answerCallbackQuery();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const notes = await Note.find({ userId: ctx.from.id, createdAt: { $gte: today } });
  const ideas = await Idea.find({ userId: ctx.from.id, createdAt: { $gte: today } });
  const tasks = await Task.find({ userId: ctx.from.id, createdAt: { $gte: today } });
  const moods = await Mood.find({ userId: ctx.from.id, createdAt: { $gte: today } });
  const done = tasks.filter(t => t.done).length;
  let summary = `📊 **Today's Summary:**\n\n`;
  summary += `📝 Notes: ${notes.length}\n`;
  summary += `💡 Ideas: ${ideas.length}\n`;
  summary += `✅ Tasks: ${done}/${tasks.length} done\n`;
  if (moods.length) summary += `😊 Moods: ${moods.map(m => m.mood).join(', ')}\n`;
  if (!notes.length && !ideas.length && !tasks.length && !moods.length) summary += `\nNothing logged today yet.`;
  ctx.reply(summary, { parse_mode: 'Markdown' });
});

const helpMenu = new InlineKeyboard()
  .text('📝 Notes', 'help_notes')
  .text('💡 Ideas', 'help_ideas')
  .row()
  .text('⏰ Reminders', 'help_reminders')
  .text('✅ Tasks', 'help_tasks')
  .row()
  .text('😊 Mood', 'help_mood')
  .text('📊 Summary', 'help_summary')
  .row()
  .text('📧 Email', 'help_email')
  .text('🔎 Search', 'help_search')
  .row()
  .text('👨‍💻 Creator', 'help_creator')
  .text('🏠 Main Menu', 'menu_main');

bot.command('help', (ctx) => {
  ctx.reply(
    `📖 **Help Menu**\n\nChoose a topic below:`,
    { parse_mode: 'Markdown', reply_markup: helpMenu }
  );
});

bot.callbackQuery('menu_main', (ctx) => {
  ctx.answerCallbackQuery();
  ctx.reply(
    `👋 Hey! I'm your **Daily Life Assistant**.\n\nChoose an option below:`,
    { parse_mode: 'Markdown', reply_markup: startMenu }
  );
});

bot.callbackQuery('help_notes', (ctx) => {
  ctx.answerCallbackQuery();
  ctx.reply(
    `📝 **Notes Commands:**\n\n` +
    `/note <text> — Save a note\n` +
    `/notes — List all notes\n` +
    `/delnote <#> — Delete a note`,
    { parse_mode: 'Markdown', reply_markup: helpMenu }
  );
});

bot.callbackQuery('help_ideas', (ctx) => {
  ctx.answerCallbackQuery();
  ctx.reply(
    `💡 **Ideas Commands:**\n\n` +
    `/idea <text> — Save an idea\n` +
    `/ideas — List all ideas\n` +
    `/randomidea — Get a random idea`,
    { parse_mode: 'Markdown', reply_markup: helpMenu }
  );
});

bot.callbackQuery('help_reminders', (ctx) => {
  ctx.answerCallbackQuery();
  ctx.reply(
    `⏰ **Reminders Commands:**\n\n` +
    `/remind <minutes> <message> — Set a reminder\n` +
    `/reminders — List pending reminders`,
    { parse_mode: 'Markdown', reply_markup: helpMenu }
  );
});

bot.callbackQuery('help_tasks', (ctx) => {
  ctx.answerCallbackQuery();
  ctx.reply(
    `✅ **Tasks Commands:**\n\n` +
    `/task <text> — Add a task\n` +
    `/tasks — List all tasks\n` +
    `/donetask <#> — Mark task done`,
    { parse_mode: 'Markdown', reply_markup: helpMenu }
  );
});

bot.callbackQuery('help_mood', (ctx) => {
  ctx.answerCallbackQuery();
  ctx.reply(
    `😊 **Mood Command:**\n\n` +
    `/mood <mood> — Log your mood\n\n` +
    `Moods: happy, sad, neutral, angry, excited, tired`,
    { parse_mode: 'Markdown', reply_markup: helpMenu }
  );
});

bot.callbackQuery('help_email', (ctx) => {
  ctx.answerCallbackQuery();
  ctx.reply(
    `📧 **Email Commands:**\n\n` +
    `/email — Send an email (3-step flow)\n\n` +
    `Or click "📧 Send Email" from the main menu.\n\n` +
    `Steps:\n` +
    `1️⃣ Enter recipient email\n` +
    `2️⃣ Enter subject\n` +
    `3️⃣ Enter email body`,
    { parse_mode: 'Markdown', reply_markup: helpMenu }
  );
});

bot.callbackQuery('help_summary', (ctx) => {
  ctx.answerCallbackQuery();
  ctx.reply(
    `📊 **Summary Command:**\n\n` +
    `/summary — View today's activity\n\n` +
    `Shows your notes, ideas, tasks, and moods for today.`,
    { parse_mode: 'Markdown', reply_markup: helpMenu }
  );
});

bot.callbackQuery('help_search', (ctx) => {
  ctx.answerCallbackQuery();
  ctx.reply(
    `🔎 **Search Command:**\n\n` +
    `/search <keyword> — Search through notes & ideas`,
    { parse_mode: 'Markdown', reply_markup: helpMenu }
  );
});

bot.callbackQuery('help_creator', (ctx) => {
  ctx.answerCallbackQuery();
  ctx.reply(
    `👨‍💻 **Creator Info**\n\n` +
    `Built with ❤️ by\n` +
    `**Sujoy**\n\n` +
    `🔗 [GitHub](https://github.com/spsujoy007)\n` +
    `📦 [Source Code](https://github.com/spsujoy007/Telegram-BOT)\n\n` +
    `Feel free to check out my other projects!`,
    { parse_mode: 'Markdown', reply_markup: helpMenu }
  );
});

bot.command('creatorinfo', (ctx) => {
  ctx.reply(
    `👨‍💻 **Creator Info**\n\n` +
    `Built with ❤️ by\n` +
    `**Sujoy**\n\n` +
    `🔗 [GitHub](https://github.com/spsujoy007)\n` +
    `📦 [Source Code](https://github.com/spsujoy007/Telegram-BOT)\n\n` +
    `Feel free to check out my other projects!`,
    { parse_mode: 'Markdown', reply_markup: helpMenu }
  );
});

bot.command('note', async (ctx) => {
  const text = ctx.message.text.replace('/note ', '').replace('/note', '');
  if (!text) return ctx.reply('Usage: /note <your note>');
  await Note.create({ userId: ctx.from.id, content: text });
  ctx.reply('📝 Note saved!');
});

bot.command('notes', async (ctx) => {
  const notes = await Note.find({ userId: ctx.from.id }).sort({ createdAt: -1 }).limit(20);
  if (!notes.length) return ctx.reply('No notes yet. Use /note <text> to add one.');
  const list = notes.map((n, i) => `${i + 1}. ${n.content}`).join('\n');
  ctx.reply(`📝 **Your Notes:**\n\n${list}`, { parse_mode: 'Markdown' });
});

bot.command('delnote', async (ctx) => {
  const num = parseInt(ctx.message.text.replace('/delnote ', ''));
  if (!num) return ctx.reply('Usage: /delnote <number>');
  const notes = await Note.find({ userId: ctx.from.id }).sort({ createdAt: -1 });
  if (num < 1 || num > notes.length) return ctx.reply('Invalid note number.');
  await Note.findByIdAndDelete(notes[num - 1]._id);
  ctx.reply(`🗑 Note #${num} deleted.`);
});

bot.command('idea', async (ctx) => {
  const text = ctx.message.text.replace('/idea ', '').replace('/idea', '');
  if (!text) return ctx.reply('Usage: /idea <your idea>');
  await Idea.create({ userId: ctx.from.id, content: text });
  ctx.reply('💡 Idea saved!');
});

bot.command('ideas', async (ctx) => {
  const ideas = await Idea.find({ userId: ctx.from.id }).sort({ createdAt: -1 }).limit(20);
  if (!ideas.length) return ctx.reply('No ideas yet. Use /idea <text> to add one.');
  const list = ideas.map((n, i) => `${i + 1}. ${n.content}`).join('\n');
  ctx.reply(`💡 **Your Ideas:**\n\n${list}`, { parse_mode: 'Markdown' });
});

bot.command('randomidea', async (ctx) => {
  const ideas = await Idea.find({ userId: ctx.from.id });
  if (!ideas.length) return ctx.reply('No ideas saved yet.');
  const random = ideas[Math.floor(Math.random() * ideas.length)];
  ctx.reply(`💡 **Random Idea:**\n\n${random.content}`, { parse_mode: 'Markdown' });
});

bot.command('remind', async (ctx) => {
  const parts = ctx.message.text.split(' ');
  const minutes = parseInt(parts[1]);
  const message = parts.slice(2).join(' ');
  if (!minutes || !message) return ctx.reply('Usage: /remind <minutes> <message>');
  const remindAt = new Date(Date.now() + minutes * 60 * 1000);
  await Reminder.create({ userId: ctx.from.id, message, remindAt });
  ctx.reply(`⏰ Reminder set for ${minutes} minute(s) from now.`);
});

bot.command('reminders', async (ctx) => {
  const reminders = await Reminder.find({ userId: ctx.from.id, completed: false }).sort({ remindAt: 1 });
  if (!reminders.length) return ctx.reply('No pending reminders.');
  const list = reminders.map((r, i) => {
    const time = new Date(r.remindAt).toLocaleString();
    return `${i + 1}. ${r.message} — ${time}`;
  }).join('\n');
  ctx.reply(`⏰ **Pending Reminders:**\n\n${list}`, { parse_mode: 'Markdown' });
});

bot.command('task', async (ctx) => {
  const text = ctx.message.text.replace('/task ', '').replace('/task', '');
  if (!text) return ctx.reply('Usage: /task <task description>');
  await Task.create({ userId: ctx.from.id, title: text });
  ctx.reply('✅ Task added!');
});

bot.command('tasks', async (ctx) => {
  const tasks = await Task.find({ userId: ctx.from.id }).sort({ createdAt: -1 }).limit(20);
  if (!tasks.length) return ctx.reply('No tasks yet.');
  const list = tasks.map((t, i) => `${i + 1}. ${t.done ? '✅' : '⬜'} ${t.title}`).join('\n');
  ctx.reply(`📋 **Your Tasks:**\n\n${list}`, { parse_mode: 'Markdown' });
});

bot.command('donetask', async (ctx) => {
  const num = parseInt(ctx.message.text.replace('/donetask ', ''));
  if (!num) return ctx.reply('Usage: /donetask <number>');
  const tasks = await Task.find({ userId: ctx.from.id }).sort({ createdAt: -1 });
  if (num < 1 || num > tasks.length) return ctx.reply('Invalid task number.');
  await Task.findByIdAndUpdate(tasks[num - 1]._id, { done: true });
  ctx.reply(`✅ Task #${num} marked as done!`);
});

bot.command('mood', async (ctx) => {
  const mood = ctx.message.text.replace('/mood ', '').replace('/mood', '').toLowerCase();
  const validMoods = ['happy', 'sad', 'neutral', 'angry', 'excited', 'tired'];
  if (!validMoods.includes(mood)) {
    return ctx.reply(`Usage: /mood <${validMoods.join('|')}>`);
  }
  await Mood.create({ userId: ctx.from.id, mood });
  ctx.reply(`😊 Mood logged: ${mood}`);
});

bot.command('email', (ctx) => {
  emailSessions.set(ctx.from.id, { step: 'to' });
  ctx.reply('📧 Send an email!\n\nStep 1/3: Send me the recipient email address:');
});

bot.on('message:text', async (ctx) => {
  const session = emailSessions.get(ctx.from.id);
  if (!session) return;

  const text = ctx.message.text;

  if (session.step === 'to') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(text)) {
      return ctx.reply('❌ Invalid email. Please send a valid email address:');
    }
    session.to = text;
    session.step = 'subject';
    return ctx.reply(`✅ To: ${text}\n\nStep 2/3: Send me the subject:`);
  }

  if (session.step === 'subject') {
    session.subject = text;
    session.step = 'body';
    return ctx.reply(`✅ Subject: ${text}\n\nStep 3/3: Send me the email body text:`);
  }

  if (session.step === 'body') {
    emailSessions.delete(ctx.from.id);
    try {
      await transporter.sendMail({
        from: `"${ctx.from.first_name}" <${process.env.EMAIL_USER}>`,
        to: session.to,
        subject: session.subject,
        text: text,
      });
      ctx.reply(`✅ Email sent successfully!\n\n📬 To: ${session.to}\n📝 Subject: ${session.subject}`);
    } catch (err) {
      console.error('Email error:', err);
      ctx.reply('❌ Failed to send email. Make sure your App Password is configured correctly in .env');
    }
  }
});

bot.command('search', async (ctx) => {
  const keyword = ctx.message.text.replace('/search ', '').replace('/search', '');
  if (!keyword) return ctx.reply('Usage: /search <keyword>');
  const regex = new RegExp(keyword, 'i');
  const notes = await Note.find({ userId: ctx.from.id, content: regex }).limit(5);
  const ideas = await Idea.find({ userId: ctx.from.id, content: regex }).limit(5);
  if (!notes.length && !ideas.length) return ctx.reply(`No results for "${keyword}".`);
  let result = `🔎 **Results for "${keyword}":**\n\n`;
  if (notes.length) {
    result += `📝 **Notes:**\n${notes.map(n => `- ${n.content}`).join('\n')}\n\n`;
  }
  if (ideas.length) {
    result += `💡 **Ideas:**\n${ideas.map(i => `- ${i.content}`).join('\n')}`;
  }
  ctx.reply(result, { parse_mode: 'Markdown' });
});

bot.command('summary', async (ctx) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const notes = await Note.find({ userId: ctx.from.id, createdAt: { $gte: today } });
  const ideas = await Idea.find({ userId: ctx.from.id, createdAt: { $gte: today } });
  const tasks = await Task.find({ userId: ctx.from.id, createdAt: { $gte: today } });
  const moods = await Mood.find({ userId: ctx.from.id, createdAt: { $gte: today } });

  const done = tasks.filter(t => t.done).length;
  const total = tasks.length;

  let summary = `📊 **Today's Summary:**\n\n`;
  summary += `📝 Notes: ${notes.length}\n`;
  summary += `💡 Ideas: ${ideas.length}\n`;
  summary += `✅ Tasks: ${done}/${total} done\n`;
  if (moods.length) {
    summary += `😊 Moods: ${moods.map(m => m.mood).join(', ')}\n`;
  }
  if (!notes.length && !ideas.length && !total && !moods.length) {
    summary += `\nNothing logged today yet. Get started!`;
  }
  ctx.reply(summary, { parse_mode: 'Markdown' });
});

bot.on('inline_query', async (ctx) => {
  const query = ctx.inlineQuery.query.trim();
  const userId = ctx.from.id;

  if (!query) {
    return ctx.answerInlineQuery([], {
      cache_time: 0,
      switch_pm_text: 'Type something to search your notes & ideas',
      switch_pm_parameter: 'inline_help',
    });
  }

  const regex = new RegExp(query, 'i');
  const notes = await Note.find({ userId, content: regex }).limit(5);
  const ideas = await Idea.find({ userId, content: regex }).limit(5);

  const results = [];

  notes.forEach((n, i) => {
    results.push({
      type: 'article',
      id: `note_${n._id}`,
      title: `📝 ${n.content.substring(0, 50)}`,
      description: n.content.substring(0, 100),
      input_message_content: {
        message_text: `📝 **Note:**\n${n.content}`,
        parse_mode: 'Markdown',
      },
    });
  });

  ideas.forEach((n, i) => {
    results.push({
      type: 'article',
      id: `idea_${n._id}`,
      title: `💡 ${n.content.substring(0, 50)}`,
      description: n.content.substring(0, 100),
      input_message_content: {
        message_text: `💡 **Idea:**\n${n.content}`,
        parse_mode: 'Markdown',
      },
    });
  });

  if (!results.length) {
    return ctx.answerInlineQuery([], {
      cache_time: 0,
      switch_pm_text: `No results for "${query}"`,
      switch_pm_parameter: 'inline_no_results',
    });
  }

  ctx.answerInlineQuery(results, { cache_time: 0 });
});

setInterval(async () => {
  const now = new Date();
  const due = await Reminder.find({ completed: false, remindAt: { $lte: now } });
  for (const r of due) {
    try {
      await bot.api.sendMessage(r.userId, `⏰ **Reminder:** ${r.message}`, { parse_mode: 'Markdown' });
      await Reminder.findByIdAndUpdate(r._id, { completed: true });
    } catch (e) { }
  }
}, 30000);

bot.catch((err) => console.error('Bot error:', err));

const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Bot is running');
});

async function main() {
  await connectDB();
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => console.log(`🌐 Server listening on port ${PORT}`));
  bot.start();
  console.log('🤖 Bot is running...');
}

main().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  bot.stop();
  server.close();
  process.exit(0);
});
