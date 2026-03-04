let teamScores = [
  { name: "Team A", runs: 0, wickets: 0, balls: 0, deliveries: [] },
  { name: "Team B", runs: 0, wickets: 0, balls: 0, deliveries: [] }
];
let currentTeam = 0;
let oversLimit = 0;
let maxWickets = 10;
let matchEnded = false;
let multiMode = false;

function startMatch() {
  teamScores[0] = { name: "Team A", runs: 0, wickets: 0, balls: 0, deliveries: [] };
  teamScores[1] = { name: "Team B", runs: 0, wickets: 0, balls: 0, deliveries: [] };
  currentTeam = 0;
  oversLimit = parseInt(document.getElementById("overs").value) * 6;
  maxWickets = parseInt(document.getElementById("wickets").value);
  matchEnded = false;
  document.getElementById("controls").style.display = "block";
  document.getElementById("ballGrid").innerHTML = "";
  updateScoreboard();
}

function addRun(runs) {
  if (isInningsOver() || matchEnded) return;
  let team = teamScores[currentTeam];
  team.runs += runs;
  team.balls++;
  team.deliveries.push({ runs: runs, wide: false, noBall: false, wicket: false });
  updateScoreboard(runs + " runs");
  updateBallGrid();
  if (currentTeam === 1) checkChaseEnd();
}

function extra(type, runs=0, wicket=false) {
  if (isInningsOver() || matchEnded) return;
  let team = teamScores[currentTeam];
  let delivery = { runs: runs, wide: type==="Wide", noBall: type==="No Ball", wicket: wicket };

  let label = type;
  team.runs += 1; // base extra run
  if (runs > 0) { team.runs += runs; label += ` +${runs}`; }
  if (wicket) { team.wickets++; team.balls++; label += " +W"; }
  if (!delivery.wide && !delivery.noBall) team.balls++;

  team.deliveries.push(delivery);
  updateScoreboard(label);
  updateBallGrid();
  if (currentTeam === 1) checkChaseEnd();
}

function addWicket() {
  if (isInningsOver() || matchEnded) return;
  let team = teamScores[currentTeam];
  team.wickets++;
  team.balls++;
  team.deliveries.push({ runs: 0, wide: false, noBall: false, wicket: true });
  updateScoreboard("Wicket");
  updateBallGrid();
  if (currentTeam === 1) checkChaseEnd();
}

function isInningsOver() {
  let team = teamScores[currentTeam];
  return team.balls >= oversLimit || team.wickets >= maxWickets;
}

function switchInnings() {
  if (matchEnded) return;
  if (currentTeam === 0 && isInningsOver()) {
    currentTeam = 1;
    document.getElementById("ballGrid").innerHTML = "";
    updateScoreboard("Second Innings Started");
  } else if (currentTeam === 1 && isInningsOver()) {
    declareWinner();
  }
}

function endInnings() {
  if (matchEnded) return;
  updateScoreboard("Innings Ended Manually");
  if (currentTeam === 0) {
    currentTeam = 1;
    document.getElementById("ballGrid").innerHTML = "";
    updateScoreboard("Second Innings Started");
  } else {
    declareWinner();
  }
}

function updateScoreboard(lastEvent="") {
  let team = teamScores[currentTeam];
  let oversBowled = Math.floor(team.balls / 6);
  let ballsInOver = team.balls % 6;
  let status = isInningsOver() ? "Innings Complete" : "Ongoing";

  let crr = team.balls > 0 ? (team.runs / (team.balls/6)).toFixed(2) : "0.00";

  let targetInfo = "";
  if (currentTeam === 1) {
    let target = teamScores[0].runs + 1;
    let ballsRemaining = oversLimit - team.balls;
    let rrr = ballsRemaining > 0 ? ((target - team.runs) / (ballsRemaining/6)).toFixed(2) : "—";
    targetInfo = `<br><strong>Target:</strong> ${target}
                  <br><strong>Required Run Rate:</strong> ${rrr}`;
  }

  document.getElementById("scoreboard").innerHTML = `
    <strong>${team.name}:</strong> ${team.runs}/${team.wickets}<br>
    <strong>Overs:</strong> ${oversBowled}.${ballsInOver} / ${oversLimit/6}<br>
    <strong>Status:</strong> ${status}<br>
    <strong>Current Run Rate:</strong> ${crr}${targetInfo}<br>
    ${lastEvent ? "Last Ball: " + lastEvent : ""}
  `;
}

function updateBallGrid() {
  let grid = document.getElementById("ballGrid");
  grid.innerHTML = "";

  let deliveries = teamScores[currentTeam].deliveries;
  let overCount = 0;
  let validBalls = 0;

  let overRow = document.createElement("div");
  overRow.className = "over-row";
  overRow.innerHTML = `<strong>${overCount + 1} Over:</strong> `;

  deliveries.forEach((d, i) => {
    let ballLabel = "";

    if (d.wide) ballLabel += "Wd ";
    if (d.noBall) ballLabel += "Nb ";
    if (d.runs > 0) ballLabel += d.runs;
    if (d.wicket) ballLabel += " W";

    // Add ball to current over row
    let span = document.createElement("span");
    span.className = "ball";
    span.textContent = ballLabel.trim() || "0";
    overRow.appendChild(span);

    // ✅ Count only valid balls
    if (!d.wide && !d.noBall) {
      validBalls++;
    }

    // If 6 valid balls → finish over
    if (validBalls === 6) {
      grid.appendChild(overRow);
      overCount++;
      validBalls = 0;

      // Start new over row if more deliveries remain
      if (i < deliveries.length - 1) {
        overRow = document.createElement("div");
        overRow.className = "over-row";
        overRow.innerHTML = `<strong>${overCount + 1}st Over:</strong> `;
      }
    }
  });

  // Append last incomplete over row
  if (validBalls > 0 || deliveries.length > 0) {
    grid.appendChild(overRow);
  }
}

function checkChaseEnd() {
  if (matchEnded) return;
  let teamA = teamScores[0];
  let teamB = teamScores[1];

  if (teamB.runs >= teamA.runs + 1) { declareWinner(); return; }
  if (teamB.wickets >= maxWickets) { declareWinner(); return; }
  if (teamB.balls >= oversLimit && teamB.runs < teamA.runs + 1) { declareWinner(); return; }
}

function declareWinner() {
  if (matchEnded) return;
  matchEnded = true;

  let teamA = teamScores[0];
  let teamB = teamScores[1];
  let result = "";

  if (teamB.runs >= teamA.runs + 1) {
    result = `🏆 ${teamB.name} wins by ${maxWickets - teamB.wickets} wickets!`;
  } else if (teamB.runs < teamA.runs) {
    let margin = teamA.runs - teamB.runs;
    result = `🏆 ${teamA.name} wins by ${margin} runs!`;
  } else {
    result = "Match Tied!";
  }

  document.getElementById("scoreboard").innerHTML += `<div class="winner">${result}</div>`;
  document.getElementById("controls").style.display = "none";
  saveGame(teamA, teamB, result);
}

function undoLastDelivery() {
  if (matchEnded) return;
  let team = teamScores[currentTeam];
  if (team.deliveries.length === 0) return;

  let last = team.deliveries.pop();

  if (typeof last === "object") {
    if (last.wide) team.runs--;
    if (last.noBall) team.runs--;
    if (last.runs > 0) team.runs -= last.runs;
    if (last.wicket) { team.wickets--; team.balls--; }
    if (!last.wide && !last.noBall) team.balls--;
  }

  updateScoreboard("Undid last delivery");
  updateBallGrid();
}

function toggleMultiMode() {
  multiMode = !multiMode;
  document.getElementById("multiOptions").style.display = multiMode ? "block" : "none";
}

function confirmMultiDelivery() {
  if (isInningsOver() || matchEnded) return;
  let team = teamScores[currentTeam];

  let runs = parseInt(document.getElementById("optRuns").value) || 0;
  let wide = document.getElementById("optWide").checked;
  let noBall = document.getElementById("optNoBall").checked;
  let wicket = document.getElementById("optWicket").checked;

  let delivery = { runs: runs, wide: wide, noBall: noBall, wicket: wicket };

  let label = "";
  if (wide) { team.runs += 1; label += "Wide "; }
  if (noBall) { team.runs += 1; label += "NoBall "; }
  if (runs > 0) { team.runs += runs; label += `+${runs} `; }
  if (wicket) { team.wickets++; label += "W "; }

  // ✅ Ball consumption: only if NOT wide and NOT no-ball
  if (!wide && !noBall) {
    team.balls++;
  }

  team.deliveries.push(delivery);

  updateScoreboard(label.trim());
  updateBallGrid();
  if (currentTeam === 1) checkChaseEnd();

  // Reset options for next use
  document.getElementById("optWide").checked = false;
  document.getElementById("optNoBall").checked = false;
  document.getElementById("optWicket").checked = false;
  document.getElementById("optRuns").value = "";
}
function saveGame(teamA, teamB, result) {
  let history = JSON.parse(localStorage.getItem("gameHistory")) || [];

  history.push({
    teamA: `${teamA.runs}/${teamA.wickets}`,
    teamB: `${teamB.runs}/${teamB.wickets}`,
    result: result,
    timestamp: new Date().toLocaleString(),
    deliveriesA: [...teamA.deliveries],
    deliveriesB: [...teamB.deliveries]
  });

  if (history.length > 3) { history.shift(); }

  localStorage.setItem("gameHistory", JSON.stringify(history));
  displayHistory();
}

function displayHistory() {
  let history = JSON.parse(localStorage.getItem("gameHistory")) || [];
  let historyDiv = document.getElementById("history");
  historyDiv.innerHTML = "";

  history.forEach((game, i) => {
    let gridA = "<div class='ball-grid'>";
    if (game.deliveriesA) {
      game.deliveriesA.forEach((d, idx) => {
        if (idx > 0 && idx % 6 === 0) gridA += "<div class='over-break'></div>";
        let label = "";
        if (typeof d === "object") {
          if (d.wide) label += "Wide ";
          if (d.noBall) label += "NoBall ";
          if (d.runs > 0) label += `+${d.runs} `;
          if (d.wicket) label += "W";
        }
        gridA += `<div>${label.trim() || d.runs}</div>`;
      });
    }
    gridA += "</div>";

    let gridB = "<div class='ball-grid'>";
    if (game.deliveriesB) {
      game.deliveriesB.forEach((d, idx) => {
        if (idx > 0 && idx % 6 === 0) gridB += "<div class='over-break'></div>";
        let label = "";
        if (typeof d === "object") {
          if (d.wide) label += "Wide ";
          if (d.noBall) label += "NoBall ";
          if (d.runs > 0) label += `+${d.runs} `;
          if (d.wicket) label += "W";
        }
        gridB += `<div>${label.trim() || d.runs}</div>`;
      });
    }
    gridB += "</div>";

    historyDiv.innerHTML += `
      <div>
        <strong>Game ${i+1}:</strong><br>
        Team A: ${game.teamA}<br>
        Team B: ${game.teamB}<br>
        Result: ${game.result}<br>
        Played on: ${game.timestamp}<br>
        <strong>Team A Deliveries:</strong><br>${gridA}<br>
        <strong>Team B Deliveries:</strong><br>${gridB}<br><br>
      </div>
    `;
  });
}

// Warn user if they try to refresh or close the page during a match
window.addEventListener("beforeunload", function (e) {
  if (!matchEnded && (teamScores[0].balls > 0 || teamScores[1].balls > 0)) {
    e.preventDefault();
    e.returnValue = "A match is in progress. Are you sure you want to leave?";
    return e.returnValue;
  }
});

function toggleHistory() {
  let section = document.getElementById("historySection");
  section.style.display = section.style.display === "none" ? "block" : "none";
}


