(function () {
  if (document.getElementById('screen-buddy-container')) return;

  const buddyContainer = document.createElement('div');
  buddyContainer.id = 'screen-buddy-container';

  buddyContainer.innerHTML = `
    <div id="screen-buddy-character">
      <div class="buddy-face" id="buddy-face">(=^･ω･^=)</div>
      <div class="buddy-status" id="buddy-status">Hi there!</div>
    </div>
  `;

  document.body.appendChild(buddyContainer);

  const character = document.getElementById('screen-buddy-character');
  const face = document.getElementById('buddy-face');
  const status = document.getElementById('buddy-status');

  const moods = [
    { face: "(=^･ω･^=)", status: "Coding time!" },
    { face: "( •̀ ω •́ )✧", status: "You got this!" },
    { face: "( > ᴗ < )", status: "Super cute!" },
    { face: "( ˘ ³˘)♥", status: "Keep going!" },
    { face: "ʕ •ᴥ• ʔ", status: "Hackathon mode!" }
  ];

  buddyContainer.addEventListener('click', () => {
    character.classList.add('buddy-happy');

    const randomMood = moods[Math.floor(Math.random() * moods.length)];
    face.textContent = randomMood.face;
    status.textContent = randomMood.status;

    setTimeout(() => {
      character.classList.remove('buddy-happy');
    }, 400);
  });
})();
