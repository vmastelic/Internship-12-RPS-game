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
    if (!response.ok) throw new Error("GET failed: " + res.status);
    return await response.json();
}

async function startGame() {

    const roundIds = JSON.parse(localStorage.getItem("lastRoundIds") || "[]");
    if(roundIds.length !== 5){
        console.log("Ne možeš započeti ako nisi ni kreirao igru.");
        return;
    }

    const currentRoundIndex = Number(localStorage.getItem("currentRoundIndex") || "0");
    const round = await getRound(roundIds[currentRoundIndex]);
    console.log("Current round: ", currentRoundIndex + 1, round.data);
}

const startGameButton = document.getElementById("start-game");
startGameButton.addEventListener("click", () => {
    startGame().catch(console.error);
    renderGameButtons("buttons");
});



