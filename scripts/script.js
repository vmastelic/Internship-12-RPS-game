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
    document.getElementById("controls").innerHTML = "";
    const roundIds = JSON.parse(localStorage.getItem("lastRoundIds") || "[]");
    if(roundIds.length !== 5){
        console.log("Ne možeš započeti ako nisi ni kreirao igru.");
        return;
    }
    
    const currentRoundIndex = Number(localStorage.getItem("currentRoundIndex") || "0");
    const round = await getRound(roundIds[currentRoundIndex]);
    console.log(`Runda ${currentRoundIndex + 1}/5`, round.data);
    renderGameButtons("buttons", roundIds[currentRoundIndex], round.data);    
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
    controls.innerHTML = "";

    const btn = document.createElement("button");
    btn.innerText = "Next round ➜";

    btn.addEventListener("click", async ()=>{
        const currentRoundIndex = Number(localStorage.getItem("currentRoundIndex") || "0");
        const nextIndex = currentRoundIndex + 1;
        if(nextIndex >= 5){
            controls.innerHTML = "";
            const reviewBtn = document.createElement("button");
            reviewBtn.id = "review";
            reviewBtn.textContent = "Review game";
          
            reviewBtn.addEventListener("click", async()=>{
                const roundIds = JSON.parse(localStorage.getItem("lastRoundIds") || "[]");
                const rounds = await Promise.all(roundIds.map(getRound));
                console.log("REVIEW:", rounds.map(r => r.data));
            });
            controls.appendChild(reviewBtn);
            console.log("Kraj igre");
            return;
        }
        localStorage.setItem("currentRoundIndex", String(nextIndex));
        await loadCurrentRound();
    });

    controls.appendChild(btn);
}
