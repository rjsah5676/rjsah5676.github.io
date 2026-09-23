const functions = require('firebase-functions');
const express = require('express');
const socketio = require('socket.io');
const http = require('http');
const cors = require('cors');
const path = require('path');

const PORT = process.env.PORT || 5000

const app = express();
const server = http.createServer(app);
app.use(cors());
const io = socketio(server)
//--for test
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../build')));
app.use('/api', (req, res)=> res.json({username:'bryan'}));
//--

server.listen(PORT,()=>console.log(`서버가 ${PORT} 에서 시작되었어요`,__dirname))

exports.api = functions.https.onRequest(app);