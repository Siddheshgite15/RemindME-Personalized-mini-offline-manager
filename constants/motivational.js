// 50+ motivational message templates
// {name} = user's name, {task} = task name
export const MOTIVATIONAL_MESSAGES = [
    "🏆 Champions don't wait, {name}! Time for {task}.",
    "💪 {name}, {task} won't finish itself. Let's crush it!",
    "🚀 Just a few more steps to success! Do {task} now, {name}.",
    "✨ Don't give up, {name}! Start {task} and watch magic happen.",
    "🌟 Believe you can, and you're halfway there. Time for {task}, {name}!",
    "🔥 Your future self will thank you. Start {task}, {name}!",
    "⭐ {name}, every expert was once a beginner. Begin {task} now!",
    "💎 Discipline is the bridge between goals and accomplishment. Do {task}, {name}!",
    "🎯 Focus on {task}, {name}. Small steps lead to big wins!",
    "⚡ You've got this, {name}! Time to nail {task}.",
    "🌈 {name}, today is the perfect day to do {task}. Make it count!",
    "💫 Great things never come from comfort zones. Go do {task}, {name}!",
    "🏅 {name}, winners take action. {task} is calling you!",
    "🦁 Be fearless, {name}. {task} is just another mountain to conquer!",
    "🌻 Rise and shine, {name}! {task} awaits your greatness.",
    "🎸 Rock on, {name}! Let's make {task} happen right now.",
    "💥 Boom! Time for {task}, {name}. You're unstoppable!",
    "🧗 One step at a time, {name}. Start with {task} and climb higher!",
    "🌊 Ride the wave, {name}! {task} is your next big move.",
    "🎯 Stay locked in, {name}. {task} needs your full power!",
    "🔑 The key to success? Action. Do {task} now, {name}!",
    "🏋️ Train your mind like a muscle, {name}. {task} is your next rep!",
    "🌅 New moment, new energy. Let's tackle {task}, {name}!",
    "💡 Brilliant minds act. {name}, it's time for {task}!",
    "🦅 Soar high, {name}! {task} is your runway.",
    "🎯 Eyes on the prize, {name}. Finish {task} and feel amazing!",
    "⏰ No better time than now, {name}. {task} is waiting!",
    "🔥 {name}, you're built for this. Crush {task} like a pro!",
    "🌟 Your potential is limitless, {name}. Prove it with {task}!",
    "💪 Excuses don't build dreams, {name}. {task} does!",
    "🎉 Make yourself proud, {name}. Complete {task} today!",
    "🏔️ Every mountain top is within reach. Start {task}, {name}!",
    "⚡ Energize your day with action. {task} first, {name}!",
    "🌟 {name}, success is a series of small wins. Win {task} now!",
    "🦸 You're a hero, {name}. Heroes do {task} without hesitation!",
    "🔥 Passion fuels progress. Let {task} fire you up, {name}!",
    "💎 Diamonds are made under pressure. Tackle {task}, {name}!",
    "🚀 Launch yourself into action, {name}! {task} is your mission.",
    "🌈 After every effort comes reward. Start {task}, {name}!",
    "⭐ {name}, the world rewards those who act. Act on {task}!",
    "🎯 Precision + action = results. Focus on {task}, {name}!",
    "💫 You're closer than you think, {name}. {task} gets you there!",
    "🏆 Legends are built daily. {task} is your legend moment, {name}!",
    "🌊 Let momentum carry you, {name}. Start with {task}!",
    "🔑 Unlock your best day, {name}. The key is {task}!",
    "💥 Impact starts with one action. {task} is yours, {name}!",
    "🧠 Smart people prioritize. {task} is your priority, {name}!",
    "🦁 Courage isn't the absence of fear. Face {task} head on, {name}!",
    "🌻 Plant the seed now, harvest later. Do {task}, {name}!",
    "🎸 Life is your stage, {name}. Perform {task} like a rockstar!",
    "💡 Ideas without action are just dreams. Execute {task}, {name}!",
    "🏗️ Build your empire one task at a time. Start with {task}, {name}!",
];

// Timed task deadline messages
export const DEADLINE_MESSAGES = {
    today: [
        "⏰ TODAY is the day, {name}! {task} is due. Finish strong! 💪",
        "🔴 {task} deadline is TODAY, {name}! You've got this. Let's go!",
        "🏁 The finish line is here, {name}! Complete {task} today!",
    ],
    tomorrow: [
        "⏳ {task} is due TOMORROW, {name}! Almost there, keep pushing! 🚀",
        "📅 Heads up {name}! {task} is due tomorrow. Time to wrap it up! ✨",
        "🔔 Just 1 day left for {task}, {name}! Stay focused and finish!",
    ],
    twoDays: [
        "📋 2 days until {task} is due, {name}. Plan your final push! 🎯",
        "⚡ {name}, {task} deadline is in 2 days. You're in the home stretch!",
        "🗓️ Quick reminder: {task} is due in 2 days, {name}. Keep going! 💫",
    ],
};

// Completion celebration messages (sent when user marks a timed task as done)
export const COMPLETION_MESSAGES = [
    "🎉 {name}, you CRUSHED {task}! One step closer to greatness!",
    "🏆 VICTORY! {name} has conquered {task}! You're unstoppable!",
    "🌟 {name}, you did it! {task} is DONE! Feel that power!",
    "💪 {task} didn't stand a chance against you, {name}! Champion move!",
    "🚀 {name} just leveled up by completing {task}! Keep soaring!",
    "⭐ Another win for {name}! {task} — COMPLETE! You're on fire!",
    "🎯 Bullseye, {name}! {task} is finished. You're a finisher!",
    "💎 {name}, completing {task} proves you're made of diamonds!",
    "🦁 {name}, you roared through {task}! The lion never sleeps!",
    "🔥 BOOM! {task} is history, {name}! You're blazing trails!",
    "🏅 Gold medal performance, {name}! {task} complete like a pro!",
    "🌈 {name}, you turned {task} into a masterpiece! Beautiful work!",
];

// Missed deadline follow-up messages (sent for 4 days after missing a deadline)
export const MISSED_DEADLINE_MESSAGES = {
    day1: [
        "⚠️ {name}, you missed the deadline for {task}. But today is a NEW day — finish it NOW!",
        "❌ {task} was due yesterday, {name}. Don't let it slide. Rise up and CRUSH it today!",
        "🔴 {name}, {task} is overdue! Champions don't quit. Get back on track TODAY!",
    ],
    day2: [
        "⏰ Day 2 past deadline, {name}. {task} is still waiting. Don't let procrastination win!",
        "💥 {name}, {task} has been overdue for 2 days. Your future self is counting on you. ACT NOW!",
        "🚨 {name}, {task} won't complete itself! 2 days overdue — make TODAY the day you finish!",
    ],
    day3: [
        "🔥 3 days past deadline, {name}! {task} NEEDS your attention. Prove everyone wrong — DO IT NOW!",
        "⚡ {name}, {task} is 3 days overdue! Remember WHY you started. Finish what you began!",
        "🦁 {name}, missing {task} for 3 days? The lion inside you is ROARING to finish! Let it out!",
    ],
    day4: [
        "🏔️ {name}, 4 days past the deadline for {task}. This is your LAST chance moment. FINISH IT!",
        "💪 {name}, {task} has haunted you for 4 days. Today you END this. No more excuses!",
        "🎯 FINAL PUSH, {name}! {task} has been overdue 4 days. Commit NOW and never look back!",
    ],
};
