const flaggedKeywords = [
  "raid",
  "exploit",
  "nsfw",
  "spam",
  "scam"
];

async function searchUser() {
  const username = document.getElementById("username").value.trim();
  const resultDiv = document.getElementById("result");

  if (!username) {
    resultDiv.innerHTML = "<p>Please enter a username.</p>";
    return;
  }

  resultDiv.innerHTML = "<p>Loading...</p>";

  try {
    // Get user ID
    const userRes = await fetch("https://users.roblox.com/v1/usernames/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        usernames: [username],
        excludeBannedUsers: false
      })
    });

    const userData = await userRes.json();

    if (!userData.data.length) {
      resultDiv.innerHTML = "<p>User not found.</p>";
      return;
    }

    const userId = userData.data[0].id;
    const userInfo = await getUserInfo(userId);
const accountAge = calculateAccountAge(userInfo.created);

    // Get avatar
    const avatarRes = await fetch(
      `https://thumbnails.roblox.com/v1/users/avatar?userIds=${userId}&size=150x150&format=Png`
    );
    const avatarData = await avatarRes.json();
    const avatarUrl = avatarData.data[0].imageUrl;

    // Get groups
    const groups = await getGroups(userId);

    // Analyze groups
    const flags = analyzeGroups(groups);

    // Render
    resultDiv.innerHTML = `
      <div class="card">
        <h2>${username}</h2>
        <img src="${avatarUrl}" alt="avatar">
<p><strong>User ID:</strong> ${userId}</p>
<p><strong>Created:</strong> ${accountAge.created}</p>
<p><strong>Account Age:</strong> ${accountAge.ageText}</p>
<p><strong>Groups:</strong> ${groups.length}</p>

        ${renderFlags(flags)}
      </div>
    `;

  } catch (err) {
    resultDiv.innerHTML = "<p>Error loading data.</p>";
    console.error(err);
  }
}

async function getGroups(userId) {
  const res = await fetch(
    `https://groups.roblox.com/v1/users/${userId}/groups/roles`
  );
  const data = await res.json();
  return data.data || [];
}

function analyzeGroups(groups) {
  let flagged = [];

  groups.forEach(g => {
    const name = g.group.name.toLowerCase();

    // Keyword detection
    flaggedKeywords.forEach(keyword => {
      if (name.includes(keyword)) {
        flagged.push({
          groupName: g.group.name,
          reason: `Contains keyword "${keyword}"`
        });
      }
    });

    // Small group detection
    if (g.group.memberCount < 10) {
      flagged.push({
        groupName: g.group.name,
        reason: "Very small group"
      });
    }
  });

  return flagged;
}

function renderFlags(flags) {
  if (flags.length === 0) {
    return `<p class="safe">No risk indicators found.</p>`;
  }

  let html = `<div class="flags"><h3>⚠️ Risk Indicators</h3>`;

  flags.forEach(f => {
    html += `<div class="flag">${f.groupName} — ${f.reason}</div>`;
  });

  html += `</div>`;
  return html;
}
async function getUserInfo(userId) {
  const res = await fetch(`https://users.roblox.com/v1/users/${userId}`);
  return await res.json();
}

function calculateAccountAge(createdDate) {
  const created = new Date(createdDate);
  const now = new Date();

  const diffTime = now - created;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  const years = Math.floor(diffDays / 365);
  const months = Math.floor((diffDays % 365) / 30);

  return {
    created: created.toDateString(),
    ageText: `${years} year(s), ${months} month(s)`
  };
}
