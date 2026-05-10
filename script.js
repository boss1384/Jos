// ================== API KEY ==================
const API_KEY = "da01d7158a60be461c607c6d31470b4e";
// ============================================

let allMatches = [];

async function loadMatches() {
    document.querySelectorAll('.section').forEach(sec => {
        sec.innerHTML = `<div class="loading">🔄 Loading matches...</div>`;
    });

    try {
        // Get Today's Date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];

        // Fetch Live + Today's Upcoming Matches
        const [liveRes, todayRes] = await Promise.all([
            fetch("https://v3.football.api-sports.io/fixtures?live=all", {
                headers: { "x-apisports-key": API_KEY }
            }),
            fetch(`https://v3.football.api-sports.io/fixtures?date=${today}`, {
                headers: { "x-apisports-key": API_KEY }
            })
        ]);

        const liveData = await liveRes.json();
        const todayData = await todayRes.json();

        const liveMatches = liveData.response || [];
        const todayMatches = todayData.response || [];

        // Combine and remove duplicates
        allMatches = [...liveMatches, ...todayMatches];
        allMatches = allMatches.filter((match, index, self) => 
            index === self.findIndex(m => m.fixture.id === match.fixture.id)
        );

        if (allMatches.length === 0) {
            showNoMatches();
        } else {
            renderMatches(allMatches);
        }
    } catch (e) {
        console.error(e);
        document.getElementById("europe").innerHTML = `<div class="loading">❌ Error loading matches</div>`;
    }
}

function renderMatches(matches) {
    let eu = "", af = "", as = "", au = "";

    matches.forEach(m => {
        const elapsed = m.fixture.status.elapsed || 0;
        const status = m.fixture.status.short;
        const isLive = status === "1H" || status === "HT" || status === "2H" || status === "ET" || status === "P";

        const html = `
            <div class="match" onclick="changeVideo('${m.teams.home.name} vs \( {m.teams.away.name}', ' \){m.league.name}')">
                <div class="league">${m.league.name} • ${m.league.country}</div>
                <div class="teams">
                    <span>${m.teams.home.name}</span>
                    <span class="score">${m.goals.home ?? 0} - ${m.goals.away ?? 0}</span>
                    <span>${m.teams.away.name}</span>
                </div>
                <div class="info">
                    <span>${isLive ? `⏱ ${elapsed}' • LIVE` : `🕒 ${m.fixture.status.long}`}</span>
                    <span>${m.fixture.venue?.name || ''}</span>
                </div>
            </div>
        `;

        const country = (m.league.country || "").toLowerCase();
        const leagueName = (m.league.name || "").toLowerCase();

        if (["england","spain","italy","france","germany","portugal","netherlands"].some(c => country.includes(c))) {
            eu += html;
        } else if (["nigeria","egypt","morocco","ghana","south africa","algeria","tunisia","senegal"].some(c => country.includes(c)) || leagueName.includes("africa")) {
            af += html;
        } else if (["japan","china","saudi","korea","india","iran","uae"].some(c => country.includes(c))) {
            as += html;
        } else {
            au += html;
        }
    });

    document.getElementById("europe").innerHTML = eu || `<div class="loading">No European matches today</div>`;
    document.getElementById("africa").innerHTML = af || `<div class="loading">No African matches today</div>`;
    document.getElementById("asia").innerHTML = as || `<div class="loading">No Asian matches today</div>`;
    document.getElementById("aus").innerHTML = au || `<div class="loading">No other matches today</div>`;
}

function showNoMatches() {
    const msg = `<div class="loading">No matches found today.<br>Try again later!</div>`;
    document.querySelectorAll('.section').forEach(sec => sec.innerHTML = msg);
}

function changeVideo(matchName, league) {
    const query = encodeURIComponent(`${matchName} ${league} highlights OR live`);
    document.getElementById("mainVideo").src = `https://www.youtube.com/embed/results?search_query=${query}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetVideo() {
    document.getElementById("mainVideo").src = "https://www.youtube.com/embed/ScMzIvxBSi4?autoplay=1&mute=1";
}

function showSection(id) {
    document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(id).classList.add('active');

    document.querySelectorAll('.nav button').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('onclick').includes(`'${id}'`));
    });
}

// Start the App
loadMatches();
setInterval(loadMatches, 90000);   // Refresh every 1.5 minutes
