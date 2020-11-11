// Node framework dependencied
// ------------------------------------------------------------------------------------------------------------------------------------------------------
const Discord = require('discord.js');
const Mongoose = require('mongoose');
const Net = require('net');
const dotenv = require('dotenv').config();

// Global variables
// ------------------------------------------------------------------------------------------------------------------------------------------------------
//checker if train is growing
let bigTrain100k = false;
let bigTrain250k = false;
let bigTrain500k = false;
let bigTrain1m = false;
//checker to send the first connection message of the server
let firstMessage = true;
//saves all connected servers (from Mongo Database)
let servers = [];
//check if train message is already send
let train_send = false;
//content of data and transformed as integer
let train_data_str = "";
let train_data_int = 0
//prefix for Bot command
const prefix = '.';

// MongoDB connection
// ------------------------------------------------------------------------------------------------------------------------------------------------------
//Set up default mongoose connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}${process.env.DB_HOST}`;
Mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
//Get the default connection
let database = Mongoose.connection;
database.once('open', () => console.log("Database connected!"));
database.on('error', console.error.bind(console, 'MongoDB connection error:'));


var Schema = Mongoose.Schema;
var ServerSchema = new Schema({
  "server_name": String,
  "server_id": String,
  "channel_id": String,
  "server_role": String,
  "bigTrainMessage": Object
});

var ServerModel = Mongoose.model('server', ServerSchema);

function updateServers() {
  servers = [];
  ServerModel.find({}, (err, result) => {
    if (err) throw err;
    result.forEach((res, index) => {
      //if (index == 0)
        servers.push(res);
    })
  });
}

function updateChannelByServer(serverId, channelID) {
  let pos = servers.findIndex(server => server.server_id == serverId);
  ServerModel.updateOne({
    server_id: serverId
  }, {
    channel_id: channelID
  }, (err) => {
    if (err) throw err;
    servers[pos].channel_id = channelID;
  });
}

function updateRoleByServer(serverId, roleId) {
  let pos = servers.findIndex(server => server.server_id == serverId);
  ServerModel.updateOne({
    server_id: serverId
  }, {
    server_role: roleId
  }, (err, result) => {
    if (err) throw err;
    servers[pos].server_role = roleId;
  });
}

updateServers();

// Net connection
// ------------------------------------------------------------------------------------------------------------------------------------------------------
let server = Net.createServer(socket => {
  // data = trainamount which gets updated on client message "data"
  socket.on("data", (data) => {
    if (firstMessage) {
      servers.forEach(info => {
        client.channels.fetch(info.channel_id).then(channel => channel.send({
          embed: {
            color: '#008E44',
            "fields": [{
              "name": "Train",
              "value": `Bot is ready!`
            }]
          }
        }));
      });
      firstMessage = false;
    }

    try {
      train_data_str = "";
      train_data_int = 0;
      // transform from byte to string
      train_data_str = data.toString();
      // transform from 1,000 to 1000
      train_data_int = parseInt(train_data_str);

      // check if train ended and reset train message
      if (train_data_int <= 1000) {
        servers.forEach(info => {
          info.bigTrainMessage = {};
        });

        bigTrain100k = false;
        bigTrain250k = false;
        bigTrain500k = false;
        bigTrain1m = false;
        train_send = false;
      }

      // send a message to every server
      servers.forEach(info => {
        if (Object.keys(info.bigTrainMessage).length !== 0) {
          if (!bigTrain100k && train_data_int > 100000) {
            editTrainMessage(info, train_data_int);
            bigTrain100k = true;
            return;
          }
          if (!bigTrain250k && train_data_int > 250000) {
            editTrainMessage(info, train_data_int);
            bigTrain250k = true;
            return;
          }
          if (!bigTrain500k && train_data_int > 500000) {
            editTrainMessage(info, train_data_int);
            bigTrain500k = true;
            return;
          }
          if (!bigTrain1m && train_data_int > 1000000) {
            editTrainMessage(info, train_data_int);
            bigTrain1m = true;
            return;
          }
        };
      });

      // send the train message if train is big
      if (train_data_int > 50000 && !train_send) {
        servers.forEach(info => {
          client.channels.fetch(info.channel_id).then(async (channel) => {
            info.bigTrainMessage = await channel.send({
              embed: {
                color: '#008E44',
                "fields": [{
                  "name": "Train",
                  "value": `The Train has over **${numberWithCommas(train_data_int)}** Bux`
                }],
                timestamp: new Date()
              }
            });
            channel.send(`${client.guilds.cache.get(info.server_id).roles.cache.get(info.server_role)}`);
          });
        });

        train_send = true;
      }
    } catch (error) {
      console.log('[Error]: ' + error);
    }
    //console.log(data.toString());
  });

  socket.on('error', (error) => {
    //console.log('Error : ' + error);
  });

  socket.on('close', (error) => {
    console.log('Socket closed!');
    if (error) {
      //console.log('Socket was closed coz of transmission error');
    }
  });

});

server.listen(8080);

// Discord.js connection
// ------------------------------------------------------------------------------------------------------------------------------------------------------
const client = new Discord.Client();

client.once('ready', () => {
  console.log('Johanes\' Bot is online!');
});

// listen for messages from the servers
client.on('message', async (message) => {
  // check if message is meant for  the server (and not from itself)
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  // devide the message into command and arguments
  const args = message.content.slice(prefix.length).split(/ +/);
  const command = args.shift().toLowerCase();

  //check if channel is the channel for the server
  let pos = servers.findIndex(item => item.channel_id == message.channel.id);
  switch (command) {
    case "ping":
      if (pos == -1) return;
      message.channel.send('> pong!');
      break;
    case "train":
      if (pos == -1) return;
      message.channel.send({
        embed: {
          color: '#008E44',
          "fields": [{
            "name": "Train",
            "value": `The Train is at **${numberWithCommas(train_data_int)}** Bux`
          }]
        }
      });
      break;
    case "help":
    case "settings":
      if (pos == -1) return;
      message.channel.send({
        "embed": {
          "color": 7344700,
          "fields": [{
              "name": "Channel",
              "value": `${client.channels.cache.get(servers[pos].channel_id)}\n \`\`\`.set_channel #ChannelName\`\`\``,
              "inline": true
            },
            {
              "name": "Role",
              "value": `${message.member.guild.roles.cache.get(servers[pos].server_role)}\n \`\`\`.set_channel @RoleName\`\`\``,
              "inline": true
            },
            {
              "name": "Train",
              "value": "get the current train amount```.train```",
              "inline": true
            }
          ]
        }
      })
      break;
    case "set_channel":
      // use all servers which are saved inside the Database
      if (args[0] == null) {
        updateChannelByServer(message.guild.id, message.channel.id);
      } else {
        args[0] = args[0].split("<").join("");
        args[0] = args[0].split(">").join("");
        args[0] = args[0].split("?").join("");
        args[0] = args[0].split("#").join("");
        updateChannelByServer(message.guild.id, args[0]);
      }
      message.channel.send('> Channel Updated!');
      break;
    case "set_role":
      args[0] = args[0].split("<").join("");
      args[0] = args[0].split(">").join("");
      args[0] = args[0].split("&").join("");
      args[0] = args[0].split("@").join("");
      updateRoleByServer(message.guild.id, args[0]);
      message.channel.send('> Role Updated!');
      break;
    default:
      if (pos == -1) return;
      message.channel.send('> command not found');
      break;
  }
});

function editTrainMessage(info, train_data) {
  info.bigTrainMessage.edit({
    embed: {
      color: '#008E44',
      "fields": [{
        "name": "Train",
        "value": `The Train has over **${numberWithCommas(train_data)}** Bux`
      }],
      timestamp: new Date()
    }
  });
}

function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Client Token for Discord Bot
client.login(`${process.env.DISCORD_TOKEN}`);