const socket=io();
const b=document.getElementById("board");
function render(grid){
  b.innerHTML="";
  for(let r=0;r<15;r++){
    for(let c=0;c<15;c++){
      const d=document.createElement("div");
      d.className="cell";
      if(r===7&&c===7){d.classList.add("center");d.textContent="★";}
      if(grid[r][c]) d.textContent=grid[r][c];
      b.appendChild(d);
    }
  }
}
socket.on("state",s=>render(s.board));
socket.on("played",d=>render(d.board));
socket.on("msg",m=>document.getElementById("msg").textContent=m);

document.getElementById("joinBtn").onclick=()=>{
  socket.emit("join",{team:team.value,name:name.value});
};
document.getElementById("submit").onclick=()=>{
  socket.emit("play:word",{word:word.value,row:+row.value,col:+col.value,dir:dir.value});
};
document.getElementById("pass").onclick=()=>socket.emit("play:pass");
