const url = "https://api.restful-api.dev/objects";

function randomMove(){
    const moves = ["kamen", "škare", "papir"];
    const computerMove = moves[Math.floor(Math.random() * moves.length)];
    return computerMove;
}

async function createNewGame(){

    const gameId = String(Date.now());
    const roundIds = [];

    for(let i = 1; i <= 5; i++){
        const computerMove = randomMove();
        const payload = {
            name: "rps-round",
            data:{
                gameId,
                roundIndex: i,
                playerMove: "pending",
                computerMove,
                result: "pending",
            },
        };
    
        const response = await fetch(url,{
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`POST failed: ${response.status}`);
        } 
    
        const created = await response.json();
        console.log("Created round: ", created.id, created.data);
    
        roundIds.push(created.id);
    }

    console.log("Game created:", gameId, roundIds);
    return { gameId, roundIds};
}

const newGameButton = document.getElementById("new-game");
newGameButton.addEventListener("click", async () =>{
    try{
        const {gameId, roundIds} = await createNewGame();
        localStorage.setItem("lastGameId", gameId);
        localStorage.setItem("lastRoundIds", JSON.stringify(roundIds));
        localStorage.setItem("currentRoundIndex", "0");

        startGameButton.disabled = false;
        document.getElementById("review-content").innerHTML = "";
        document.getElementById("controls").innerHTML = "";
        document.getElementById("player-option").innerHTML = "";        

    }catch(err){
        console.error(err);
    }
});

async function getRound(Id) {
    const response = await fetch(`https://api.restful-api.dev/objects/${Id}`);
    if (!response.ok) throw new Error("GET failed: " + response.status);
    return await response.json();
}

async function startGame() {
    await loadCurrentRound();
}

async function loadCurrentRound() {
    const controls = document.getElementById("controls");
    controls.innerHTML = "";
    const roundIds = JSON.parse(localStorage.getItem("lastRoundIds") || "[]");
    if(roundIds.length !== 5){

        const message = "Ne možeš započeti ako nisi ni kreirao igru, Kreiraj igru.";
        const messageEl = document.createElement("p");
        messageEl.textContent = message;
        messageEl.style.color = "white";
        
        controls.appendChild(messageEl);
        console.log(message);
        return;
    }
    
    const currentRoundIndex = Number(localStorage.getItem("currentRoundIndex") || "0");
    const round = await getRound(roundIds[currentRoundIndex]);
    console.log(`Runda ${currentRoundIndex + 1}/5`, round.data);
    renderGameButtons("player-option", roundIds[currentRoundIndex], round.data);    
}

const startGameButton = document.getElementById("start-game");
startGameButton.addEventListener("click", () => {
    startGame().catch(console.error);
});

function renderGameButtons(containerId, roundId, roundData){
    const container = document.getElementById(containerId);
    container.innerHTML = "";

    ["kamen", "škare", "papir"].forEach((move) =>{
        const btn = document.createElement("button");
        btn.textContent = move;
        btn.addEventListener("click", async ()=>{
            container.querySelectorAll("button").forEach(b => b.disabled = true);
            try{
                const result = decideResult(move, roundData.computerMove);

                displayResult(move, roundData.computerMove, result);

                const updatedData = {
                    ...roundData,      
                    playerMove: move,
                    result,            
                };
                const updated = await updateRound(roundId, updatedData);

                renderNextButton();

                console.log("Kompjuter:", roundData.computerMove);
                console.log("Rezultat:", result);
                console.log("Saved on server:", updated.data);

            }catch(err){
                console.error(err);
                container.querySelectorAll("button").forEach(b => b.disabled = false);
            }
        });
        container.append(btn);
    });
}

function displayResult(playerMove, computerMove, result){
    const controls = document.getElementById("controls");
    controls.innerHTML = "";
    const resultText = `Ti: ${playerMove}  Komp: ${computerMove} → ${result.toUpperCase()}`;
    const resultEl = document.createElement("p");
    resultEl.textContent = resultText;
    resultEl.style.color = result === "pobjeda" ? "lightgreen" : (result === "poraz" ? "salmon" : "lightgray");
    resultEl.style.fontSize = "1.2em";
    controls.appendChild(resultEl);
}

function decideResult(player, computer){
    if (player === computer) return "draw";
    if (
        (player === "kamen" && computer === "škare") ||
        (player === "škare" && computer === "papir") ||
        (player === "papir" && computer === "kamen")
    ) return "pobjeda";
    return "poraz";
}

async function updateRound(roundId, newData){
    const response = await fetch(`https://api.restful-api.dev/objects/${roundId}`,{
        method: "PUT",
        headers: {"Content-Type" : "application/json"},
        body: JSON.stringify({
            name: "rps-round",
            data: newData,
        }),
    });

    if(!response.ok) throw new Error("PUT failed " + response.status);
    return await response.json();
}

function renderNextButton(){
    const controls = document.getElementById("controls");

    const btn = document.createElement("button");
    btn.innerText = "Next round ➜";

    btn.addEventListener("click", async ()=>{
        const currentRoundIndex = Number(localStorage.getItem("currentRoundIndex") || "0");
        const nextIndex = currentRoundIndex + 1;

        if(nextIndex >= 5){
            controls.innerHTML = "";
            document.getElementById("buttons").innerHTML = "";
            const reviewBtn = document.createElement("button");
            reviewBtn.id = "review";
            reviewBtn.textContent = "Review game";
          
            reviewBtn.addEventListener("click", reviewGame);
            reviewBtn.disabled = false;

            startGameButton.disabled = true;

            controls.appendChild(reviewBtn);
            console.log("Kraj igre");
            return;
        }
        localStorage.setItem("currentRoundIndex", String(nextIndex));
        await loadCurrentRound();
    });
    
    controls.appendChild(btn);
}

async function reviewGame(){
    const out = document.getElementById("review-content");
    out.innerHTML = "Učitavam review...";

    const roundIds = JSON.parse(localStorage.getItem("lastRoundIds") || "[]");
    const rounds = await getRoundsBulk(roundIds);

    let won = 0, lost = 0, draw = 0;
    for(const r of rounds){
        if (r.data.result === "pobjeda")won++;
        else if (r.data.result === "poraz")lost++;
        else draw++;
    }

    while (out.firstChild) out.removeChild(out.firstChild);
    
    const summary = document.createElement("p");
    summary.textContent = `Pobjeda: ${won}, poraza: ${lost}, neriješenih: ${draw}`;
    out.appendChild(summary);
    
    rounds.sort((a, b) => a.data.roundIndex - b.data.roundIndex);
    for (const r of rounds) {
        const p = document.createElement("p");
        p.textContent = `Runda ${r.data.roundIndex}: Ti=${r.data.playerMove}, Komp=${r.data.computerMove}, Rezultat=${r.data.result}`;
        out.appendChild(p);
    }
    
    console.log("REVIEW:", rounds.map(r => r.data));
}

async function getRoundsBulk(ids) {
    const qs = ids.map(id => `id=${encodeURIComponent(id)}`).join("&");
    const res = await fetch(`https://api.restful-api.dev/objects?${qs}`);
    if (!res.ok) throw new Error("Bulk GET failed: " + res.status);
    return await res.json(); 
}
