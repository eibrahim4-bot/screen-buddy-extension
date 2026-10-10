// Settings shared by background.js and content.js. Tweak these!
const CFG = { POINTS_PER_MINUTE: 2, PENALTY: 5, DEATH_PENALTY: 0.5 }; // 0.5 = lose half on death, 1 = lose all
const MOODS = [ // index = strikes
  { key: "happy", emoji: "😄", face: "^ᴗ^" },
  { key: "meh",   emoji: "😐", face: "•_•" },
  { key: "sad",   emoji: "😢", face: "T_T" },
  { key: "upset", emoji: "😡", face: ">_<" },
  { key: "dead",  emoji: "💀", face: "x_x" }
];
const SHOP = [
  { id: "bow",    emoji: "🎀", name: "Bow",      cost: 15 },
  { id: "tophat", emoji: "🎩", name: "Top hat",  cost: 20 },
  { id: "shades", emoji: "🕶️", name: "Shades",   cost: 25 },
  { id: "grad",   emoji: "🎓", name: "Grad cap", cost: 30 },
  { id: "wizard", emoji: "🧙", name: "Wizard",   cost: 40 },
  { id: "crown",  emoji: "👑", name: "Crown",    cost: 60 }
];
const FLAGGED = ["tiktok.com", "instagram.com", "facebook.com", "x.com", "twitter.com", "reddit.com",
  "youtube.com", "twitch.tv", "netflix.com", "disneyplus.com", "kick.com"];

// Cute catchphrases! Add or change any of these.
const PHRASES = {
  start:  ["Let's do this! ✨", "Focus mode: on! 🌟", "You've got this, I believe in you! 💪", "Ooh, study time! 📚"],
  win:    ["Yay!! You did it! 🎉", "I'm so proud of you! 🥹", "Snack time, you earned it 🍪", "Best. Human. Ever. 💛"],
  warn:   [["Hey... where are you going? 👀", "Psst, that's not studying~", "Just one tab, they said... 🙄"],   // 1st strike
           ["I'm getting sad... 🥺", "Please come back to me 💔", "My heart can't take this 😢"],               // 2nd strike
           ["I'm SO upset right now 😤", "One more and I'm gone!! 😡", "Last chance, bestie... 🫠"]],           // 3rd strike
  dead:   ["x_x tell my story... 💀", "I have left the chat 👻", "Revive me, please... 🥲"],
  revive: ["I'm back! Miss me? ✨", "Back from the dead! 😎", "Second chances are my favorite 🌈"],
  giveUp: ["Aw... it's okay, we'll try again 🫶", "Rest up, tomorrow's a new day 🌙"],
  item:   ["Ooh, so fancy! ✨", "I feel like a star 🌟", "How do I look? 😎"],
  idle:   ["Still here with you! 💛", "You're doing amazing! 🌸", "Sip some water 💧", "Stretch your shoulders! 🧘", "Almost there! 🔥"]
};
const pick = a => a[Math.floor(Math.random() * a.length)];

// Animal buddies. The first one is free and is the default. Swap the emoji for real art later!
const ANIMALS = [
  { id: "retriever", emoji: "🐶", name: "Golden retriever", cost: 0,   sound: "Woof" },
  { id: "cat",       emoji: "🐱", name: "Cat",              cost: 80,  sound: "Meow" },
  { id: "bunny",     emoji: "🐰", name: "Bunny",            cost: 100, sound: "Squeak" },
  { id: "fox",       emoji: "🦊", name: "Fox",              cost: 120, sound: "Yip" },
  { id: "panda",     emoji: "🐼", name: "Panda",            cost: 150, sound: "Munch" },
  { id: "penguin",   emoji: "🐧", name: "Penguin",          cost: 180, sound: "Honk" }
];
