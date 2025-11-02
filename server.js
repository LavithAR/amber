const express = require("express");
const http = require("http");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 10000;

let dictionary = new Set();
try {
  const words = fs.readFileSync(path.join(__dirname, "dictionary.txt"), "utf8");
  words.split(/\r?\n/).forEach(w => w && dictionary.add(w.trim().toUpperCase()));
  console.log("✅ Dictionary loaded:", dictionary.size, "words");
} catch {
  console.log("⚠️ dictionary.txt missing!");
}

const LETTER_VALUES = {
  A:1,B:3,C:3,D:2,E:1,F:4,G:2,H:4,I:1,J:8,K:5,L:1,M:3,N:1,O:1,P:3,Q:10,R:1,S:1,T:1,U:1,V:4,W:4,X:8,Y:4,Z:10
};

const BONUS = { "7,7":"DW" }; // star center double word
function makeEmptyBoard() {
  return Array.from({length:15},()=>Array(15).fill(""));
}

let state = {
  board: makeEmptyBoard(),
  players: {},
  teams: ["arabica","robusta","excelsa","liberica"],
  scores: { arabica:0, robusta:0, excelsa:0, liberica:0 },
  turn: 0,
  running: false
};

function saveState() {
  fs.writeFileSync(path.join(__dirname,"data","saved_game.json"),JSON.stringify(state,null,2));
}

app.use(express.static(path.join(__dirname,"public")));
app.get("/admin",(req,res)=>res.sendFile(path.join(__dirname,"public","admin.html")));
app.get("/display",(req,res)=>res.sendFile(path.join(__dirname,"public","display.html")));
app.get("/play",(req,res)=>res.sendFile(path.join(__dirname,"public","play.html")));

function wordScore(word,row,col,dir){
  let total=0, multi=1;
  word=word.toUpperCase();
  for(let i=0;i<word.length;i++){
    let r=dir==="down"?row+i:row, c=dir==="across"?col+i:col;
    let l=word[i], s=LETTER_VALUES[l]||0;
    if(BONUS[`${r},${c}`]==="DW") multi*=2;
    total+=s;
  }
  return total*multi;
}

io.on("connection",socket=>{
  socket.on("join",({team,name})=>{
    state.players[socket.id]={team,name:name||team};
    io.emit("players",state.players);
  });

  socket.on("admin:start",()=>{state.running=true;io.emit("state",state);});
  socket.on("admin:pause",()=>{state.running=false;io.emit("state",state);});
  socket.on("admin:reset",()=>{state={...state,board:makeEmptyBoard(),scores:{arabica:0,robusta:0,excelsa:0,liberica:0},turn:0,running:false};io.emit("state",state);});

  socket.on("play:word",({word,row,col,dir})=>{
    if(!state.running) return socket.emit("msg","Game not started");
    const team=state.teams[state.turn];
    if(!dictionary.has(word.toUpperCase())) return socket.emit("msg","Invalid word");
    for(let i=0;i<word.length;i++){
      const r=dir==="down"?row+i:row, c=dir==="across"?col+i:col;
      state.board[r][c]=word[i].toUpperCase();
    }
    const score=wordScore(word,row,col,dir);
    state.scores[team]+=score;
    io.emit("played",{board:state.board,scores:state.scores,team,word,score});
    state.turn=(state.turn+1)%4;
    saveState();
  });

  socket.on("play:pass",()=>{
    state.turn=(state.turn+1)%4;
    io.emit("state",state);
  });

  socket.emit("state",state);
});

server.listen(PORT,()=>console.log("🚀 Server on",PORT));
