const url = "https://api.restful-api.dev/objects";

async function createRound(gameId, roundIndex){
    const moves = ["kamen", "škare", "papir"];
    const computerMove = moves[Math.floor(Math.random()) * moves.length];

    const payload = {
        name: "rps-round",
        data:{
            gameId,
            roundIndex,
            playerMove: "pending",
            computerMove,
            result: "pending",
        },
    };

    const response = await fetch(url,{
        method: "POST",
        headers: {
            "Content-type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    const created = await response.json();
    console.log("Created round: ", created.id, created.data);
}

createRound(1, 1);