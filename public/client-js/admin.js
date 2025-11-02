const socket = io();
document.getElementById("start").onclick=()=>socket.emit("admin:start");
document.getElementById("pause").onclick=()=>socket.emit("admin:pause");
document.getElementById("reset").onclick=()=>socket.emit("admin:reset");

socket.on("players",p=>{
  document.getElementById("players").innerHTML = Object.values(p).map(x=>`${x.name} (${x.team})`).join("<br>");
});
socket.on("state",s=>{
  document.getElementById("scores").innerHTML = Object.entries(s.scores).map(([t,v])=>`${t}: ${v}`).join("<br>");
  document.getElementById("turn").innerText = "Turn: "+s.teams[s.turn];
});
socket.on("played",d=>{
  document.getElementById("scores").innerHTML = Object.entries(d.scores).map(([t,v])=>`${t}: ${v}`).join("<br>");
});
