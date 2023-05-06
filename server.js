const { REST, Routes } = require("discord.js");
const fs = require("fs");
const path = require('path');
const { createCanvas, loadImage } = require("canvas");
const { exec } = require("child_process");
const cron = require('node-cron');
const wait = require('node:timers/promises').setTimeout;

const { SlashCommandBuilder, ModalBuilder, UserSelectMenuBuilder, TextInputBuilder } = require('discord.js');

const commands = [
  {
    name: "ping",
    description: "Replies with Pong!",
  },
  {
    name: "cocofula",
    description: "ここフラ募集 [種類] [タイトル] [人数] [開始時間] [MOD] [配信]",
    options: [
      {
        name: "title",
        description: "タイトル",
        type: 3,
        required: true,
      },
      {
        name: "member",
        description: "参加人数",
        type: 3,
        required: true,
        choices: [
          { name: "2", value: "2" },
          { name: "3", value: "3" },
          { name: "4", value: "4" },
          { name: "5", value: "5" },
        ],
      },
      {
        name: "time",
        description: "開始時間",
        type: 3,
        required: true,
        choices: [
          { name: "集まり次第", value: "0" },
          { name: "9:00", value: "9:00" },
          { name: "9:30", value: "9:30" },
          { name: "10:00", value: "10:00" },
          { name: "10:30", value: "10:30" },
        ],
      },
      {
        name: "live",
        description: "配信の有無",
        type: 5,
        required: false,
      },
    ],
  },
];

const rest = new REST({ version: "10" }).setToken(
  process.env.DISCORD_BOT_TOKEN
);

(async () => {
  try {
    console.log("Started refreshing application (/) commands.");

    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
      body: commands,
    });

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
})();

const { Client, GatewayIntentBits } = require("discord.js");
const { ActionRowBuilder, TextInputStyle, ButtonBuilder, ButtonStyle, Events } = require('discord.js');
const { AttachmentBuilder, EmbedBuilder } = require('discord.js');
const client = new Client({ intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
	] });

//基本設定
const preFix = "cf-";

//観戦botオン専用チャンネルID
const kansenChannelId = "937322794906185750";
//開発部屋チャンネルID
const kaihatuChannelId = "933243440265846804";
//安眠botチェック ボイスチャンネルID
const anminVoiceChannnelId = "906269954247102526";

client.on("ready", async () => {
  console.log(`Logged in as ${client.user.tag}!`);
  
  //
  cron.schedule('0 * * * * *', async () => {
    //console.log('毎30分に実行');
    //let nowdate = new Date();
    //console.log(nowdate);
    //const channel = await client.channels.fetch(kaihatuChannelId);
    //channel.send(`${new Date().getHours()} 時 ${new Date().getMinutes()} 分 ${new Date().getSeconds()} 秒をお知らせします。`);
    //channel.send("!p 10FEET");
  });
    
  var cnt = 0;
  cnt = client.guilds.cache.get("848546403055566858").memberCount;
  //console.log(cnt);
  client.user.setPresence({ activities: [{ name: cnt + "人がここフラ" }] });
});

client.on('messageCreate', async message => {
  if (message.author.id == client.user.id || message.author.bot) {
    return;
  }
  
  //console.log(message.channelId);
  
  if (message.reference !== null && message.guild) {
    let refchannelID = message.reference.channelId;
    let refMessageId = message.reference.messageId;
    
    const receivedEmbed = await message.channel.messages.fetch(refMessageId);

  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "ping") {
    //await interaction.reply("Pong!");
    const testBtn = new ActionRowBuilder()
			.addComponents(
        new ButtonBuilder()
					.setCustomId('pong')
					.setLabel('Pong! test')
					.setStyle(ButtonStyle.Success),
        new ButtonBuilder()
					.setCustomId('modal')
					.setLabel('Modal test')
					.setStyle(ButtonStyle.Primary),
			);
    await interaction.reply({ contents: "Pong!", components: [testBtn] });
  }
  
  let channelId = interaction.channelId;

  //追加募集
  if (interaction.commandName === "add") {
    //console.log(interaction.options._hoistedOptions);
    
    var messageId = interaction.id;

    let defNumber = 0;
    let cCode, cType, cNumber, cTime;
    let cMod = false;
    let cLive = false;
    
    let options = interaction.options._hoistedOptions;
    for(var i=0; i<options.length; i++){
      if(options[i].name == 'code'){
        cCode = options[i].value;
      }
      if(options[i].name == 'type'){
        cType = options[i].value;
      }
      if(options[i].name == 'member'){
        cNumber = parseInt(options[i].value);
      }
    }
    
    //開催者
    let authorId = interaction.user.id;
    //メンバーデータ
    let memberArray = [];
    for (var i_m = 0; i_m < cNumber; i_m++) {
      memberArray.push(null);
    }
    
    var readAddFileName = preFix + channelId + "-" + cCode + ".json";
    //console.log(dataDir);
    //console.log(readAddFileName);
    fs.readFile(dataDir + readAddFileName, "utf8", async function (err, rData) {
        if (err == null) {
          //データ読み込み
          var jsonDataArray = JSON.parse(rData);
          //console.log(jsonDataArray.title);

          let dataArray = {
            channelId: channelId, //チャンネルID
            messageId: messageId, //メッセージID
            type: cType,          //種類
            code: cCode,          //コード
            title: jsonDataArray.title,//タイトル
            room: null,          //ルーム番号
            number: defNumber,   //現在人数
            maxNumber: cNumber,   //必要人数
            authorId: authorId,   //開催者
            members: memberArray, //メンバー
          };

          const addBtn = new ActionRowBuilder()
            .addComponents(
              new ButtonBuilder()
                .setCustomId('add_tsuibo')
                .setLabel('参加希望')
                .setStyle(ButtonStyle.Primary),
              new ButtonBuilder()
                .setCustomId('delete_tsuibo')
                .setLabel('参加削除')
                .setStyle(ButtonStyle.Danger),
              new ButtonBuilder()
                .setCustomId('event_delete_tsuibo')
                .setLabel('キャンセル')
                .setStyle(ButtonStyle.Secondary),
            );

          const requestEmbed = makeAddEmbed(dataArray);
          const confirmation = await interaction.reply({ embeds: [requestEmbed], components: [addBtn] });
          //console.log("interactionID", interaction.id);

          //var messageId = interaction.id;
          var reqfileName = preFix + channelId + "-" + messageId + ".json";

          //dataArray.messageId = messageId; //メッセージID書き換え

          //データファイルに書き込み
          fs.writeFile(
            dataDir + reqfileName,
            JSON.stringify(dataArray),
            function (err) {
              minimumJsonFiles(dataDir);
              let text = "@everyone " + dataArray.type + " @" + (dataArray.maxNumber - dataArray.number);
              sendMsg(interaction, text);
              return;
            }
          );

        }
    });
    
  }

});

client.login(process.env.DISCORD_BOT_TOKEN);

function makeAddEmbed(data) {
  
  //タイトル
  let titleStr = "#追加募集 「" + data.title + "」" + data.type + "@" + data.maxNumber;
  //必要人数
  let numberStr = data.number + "／" + data.maxNumber;
  //主催者
  let authorId = data.authorId;
  let messageId = data.messageId;
  let membersStr = "";

  const messageEmbed = new EmbedBuilder()
    .setTitle(titleStr)
    //.setAuthor({ name: typeStr })
    .setDescription("参加登録は参加希望を押してください。キャンセルは参加削除で。")
    .addFields({ name: '👬募集人数', value: numberStr, inline: true })
    .addFields({ name: '😊メンバー', value: membersStr, inline: true })
    //.addFields({ name: '🎖️開催者', value: "<@!" + authorId + ">" })
    //.addFields({ name: '募集ID', value: messageId })
    .setColor("Random")
    .setTimestamp()
    .setFooter({ text: 'ここから追加したらいいんじゃないですか' });
  return messageEmbed;
  
}

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isButton()) return;
  let userID = interaction.user.id;

  if(interaction.customId == "pong"){
  
    let text = "ピンポンパンポーン";
    await interaction.reply(text);

    return;
  }
  
  if(interaction.customId == "modal"){
    
    const modal = new ModalBuilder()
			.setCustomId('myModal')
			.setTitle('これはテストモードです。');
      //.setDescription('これはテストモードです。モーダルテストを行っています。');
		// Add components to modal

		// Create the text input components
		const favoriteColorInput = new TextInputBuilder()
			.setCustomId('favoriteColorInput')
		    // The label is the prompt the user sees for this input
			.setLabel("What's your favorite color?")
		    // Short means only a single line of text
			.setStyle(TextInputStyle.Short);

		const hobbiesInput = new TextInputBuilder()
			.setCustomId('hobbiesInput')
			.setLabel("What's some of your favorite hobbies?")
		    // Paragraph means multiple lines of text.
			.setStyle(TextInputStyle.Paragraph);
    
		// An action row only holds one text input,
		// so you need one action row per text input.
		const firstActionRow = new ActionRowBuilder().addComponents(favoriteColorInput);
		const secondActionRow = new ActionRowBuilder().addComponents(hobbiesInput);
		//const thirdActionRow = new ActionRowBuilder().addComponents(selectMenu);

		// Add inputs to the modal
		modal.addComponents(firstActionRow, secondActionRow);

		// Show the modal to the user
		await interaction.showModal(modal);    
    
    return;
  }

  if(interaction.customId == "help") {
    let text = "";
    text += "【参加者用操作方法】\n";
    text += "参加希望者は、参加希望を押してください。\n";
    text += "参加削除でキャンセルできます。\n";
    text += "お連れ様は登録できないようになりましたので、ご自身で参加希望ボタンを押してください。\n";
    text += "\n";
    text += "【主催者用操作方法】\n";
    text += "◆開催時コマンド\n";
    text += "/cocofula 必須:[種類] [部屋タイトル] [必要人数] [開始時間] 任意：[MOD有無] [配信有無]\n";
    text += "種類（必須）… アモアス、麻雀、スプラ、APEXなど、遊ぶ内容に沿って選択してください。\n";
    text += "部屋タイトル（必須）…部屋のタイトル（朝のポーラス）などいれてください。\n";
    text += "必要人数…必要人数をいれてください。\n";
    text += "開始時間…開始時間をいれてください。\n";
    //text += "役職有無…役職をいれるかどうか 入れる場合は1を入力してください。\n";
    text += "MOD有無…MODをいれるかどうか 入れる場合はTrueを入力してください。\n";
    text += "配信有無…配信するかどうか 入れる場合はTrueを入力してください。\n";
    text += "\n";
    text += "◆開催後コマンド\n";
    text += "返信コマンドがうまくできなかった方がおられたら、メンション入りで返信をいれて、登録してください。\n";
    text += "Twitter募集から人を見つけてきた場合は、返信でtwitterもしくはツイッター（トゥイッターも可）をいれてください。\n";
    text += "\n";
    text += "◆解散後コマンド\n";
    text += "解散をいれて返信してください。主催者が入れた時のみ解散となり、募集分が削除されます。\n";

    await interaction.user.send(text);
    return;
  } else {
    let text = "エラー";
    await interaction.reply(text);
    await setTimeout(() => interaction.deleteReply(), 3000);
    return;  
  }

});

//////////////////
//メッセージ等送信系
//////////////////
async function sendFlashMsg(message, text, timeout, mineDel) {
  const mes = await message.channel.send(text);
  setTimeout(() => mes.delete(), timeout);
  /*
  await reply.delete({ timeout: timeout });
  if (mineDel) {
    await message.delete();
  }*/
}

async function sendFlashReply(message, text, timeout, mineDel) {
  const reply = await message.reply(text);
  setTimeout(() => message.deleteReply(), timeout);
}

function sendReply(message, text) {
  message
    .reply(text)
    .then(console.log("リプライ送信: " + text))
    .catch(console.error);
}

function sendMsg(message, text) {
  message.channel
    .send(text)
    .then(console.log("メッセージ送信: " + text))
    .catch(console.error);
}

function sendImgReply(message, base64_img) {
  const imageStream = new Buffer.from(base64_img.split(",")[1], "base64");
  //const attachment = new discord.MessageAttachment(imageStream);
  const attachment = new AttachmentBuilder(imageStream);
  message.reply({ files: [attachment] });
}

function sendImg(message, base64_img) {
  const imageStream = new Buffer.from(base64_img.split(",")[1], "base64");
  //const attachment = new discord.MessageAttachment(imageStream);
  const attachment = new AttachmentBuilder(imageStream, { name: 'image.png' });
  message.channel.send({ files: [attachment] });
}

//////////////////
//ファイル操作系
//////////////////
function minimumJsonFiles(dir) {
  const filenames = fs.readdirSync(dir);
  if(filenames.size > 100){
    var cnt = 0;
    filenames.forEach((filename) => {
      const fullPath = path.join(dir, filename);
      const stats = fs.statSync(fullPath);
      if (stats.isFile()) {
        console.log(fullPath);
        fs.unlink(fullPath);
      }
      cnt++;
      if(cnt > 50){
        return;
      }
    });
  }
}

//日付から文字列に変換する関数
function getStringFromDate(date) {
  var format_str;
  
  var year_str = date.getFullYear();
  var month_str = 1 + date.getMonth();//月だけ+1すること
  var day_str = date.getDate();
  var hour_str = 9 + date.getHours();
  var minute_str = date.getMinutes();
  var second_str = date.getSeconds();

  format_str = "YYYY-MM-DD hh:mm:ss";
  format_str = format_str.replace(/YYYY/g, year_str);
  format_str = format_str.replace(/MM/g, month_str);
  format_str = format_str.replace(/DD/g, day_str);
  format_str = format_str.replace(/hh/g, hour_str);
  format_str = format_str.replace(/mm/g, minute_str);
  format_str = format_str.replace(/ss/g, second_str);

  return format_str;
}

//文字列から日付に変換する関数
function getDateFromString(dateStr) {
  var result = dateStr.replace( '-', '/' ) + "-09:00";
  var date = Date.parse(result);
  return date;
}

//月初
function getStringYYMM1(date) {
  var format_str;
  var year_str = date.getFullYear();
  //月だけ+1すること
  var month_str = 1 + date.getMonth();

  format_str = "YYYY-MM-DD";
  format_str = format_str.replace(/YYYY/g, year_str);
  format_str = format_str.replace(/MM/g, month_str);
  format_str = format_str.replace(/DD/g, "1");

  return format_str;
}

//日付から文字列に変換する関数
function getStringYYMM(date) {
  var format_str;
  var year_str = date.getFullYear();
  //月だけ+1すること
  var month_str = date.getMonth();

  format_str = "YYYY-MM";
  format_str = format_str.replace(/YYYY/g, year_str);
  format_str = format_str.replace(/MM/g, month_str);

  return format_str;
}

//開始時間から終了時間までの滞在時間を秒に変換する関数
function calcFromToDate(startDateStr, endDateStr) {
  var startDate = getDateFromString(startDateStr);
  var endDate = getDateFromString(endDateStr);
  //console.log(startDate, endDate);

  /*日時の差をミリ秒単位で取得*/
  var diffMilliSec = endDate - startDate;

  /*ミリ秒を秒数に変換*/
  var diffSec = parseInt(diffMilliSec / 1000);

  return diffSec;
}

//////////////////
//その他計算
//////////////////
function toHms(t) {
  var hms = "";
  var h = (t / 3600) | 0;
  var m = ((t % 3600) / 60) | 0;
  var s = t % 60;

  if (h != 0) {
    hms = h + "時間" + padZero(m) + "分" + padZero(s) + "秒";
  } else if (m != 0) {
    hms = m + "分" + padZero(s) + "秒";
  } else {
    hms = s + "秒";
  }

  return hms;
}

function padZero(v) {
  if (v < 10) {
    return "0" + v;
  } else {
    return v;
  }
}
