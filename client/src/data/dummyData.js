// Static placeholder data so the UI has something real-looking to render.
// Swap this out for live socket.io data later — the shape mirrors what
// the existing server events ("newMessage" etc.) would realistically send.

export const AVATAR_PALETTE = [
  "#3454D1", "#1F9D63", "#B5502E", "#7A4FD1",
  "#C0862B", "#2E8FA6", "#C13F63", "#4B7A2F",
];

function colorFor(seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

function initials(name) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const people = [
  { id: "u1", name: "Meera Kapoor", online: true, role: "Product design" },
  { id: "u2", name: "Arjun Sethi", online: true, role: "Backend" },
  { id: "u3", name: "Priya Nair", online: false, lastSeen: "2h ago", role: "QA lead" },
  { id: "u4", name: "Devansh Rao", online: true, role: "Frontend" },
  { id: "u5", name: "Kabir Malhotra", online: false, lastSeen: "yesterday", role: "DevOps" },
  { id: "u6", name: "Ishita Verma", online: false, lastSeen: "5m ago", role: "Marketing" },
  { id: "u7", name: "Rohan Bhatt", online: true, role: "Founder" },
  {
    id: "design-team",
    name: "Design Team",
    online: false,
    isGroup: true,
    members: 6,
    memberIds: ["u1", "u4", "u2", "u3", "u5", "u6"],
  },
];

export const contacts = people.map((p) => ({
  ...p,
  initials: initials(p.name),
  color: colorFor(p.id),
}));

// id -> ordered message list (oldest first)
export const conversations = {
  u1: [
    { id: "m1", from: "them", text: "Hey! Did you get a chance to look at the onboarding flow?", time: "09:12", status: "read" },
    { id: "m2", from: "me", text: "Just opened it now, the empty state looks much cleaner", time: "09:14", status: "read" },
    { id: "m3", from: "them", text: "Good, I also tightened up the spacing on step 2", time: "09:15", status: "read" },
    { id: "m4", from: "me", text: "Nice. One thing — can the progress dots be a bit smaller on mobile?", time: "09:17", status: "read" },
    { id: "m5", from: "them", text: "Yeah, they're 8px right now, I'll drop to 6px", time: "09:18", status: "read" },
    { id: "m6", from: "them", text: "Sending you the updated frame in a bit", time: "09:19", status: "read" },
    { id: "m7", from: "me", text: "Sounds good, no rush", time: "09:20", status: "read" },
    { id: "m8", from: "them", text: "Here's the updated version — let me know what you think", time: "11:02", status: "read" },
    { id: "m9", from: "me", text: "This looks great, love the tighter rhythm", time: "11:05", status: "read" },
    { id: "m10", from: "them", text: "Can you review the onboarding flow before EOD?", time: "11:41", status: "delivered" },
  ],
  u2: [
    { id: "m1", from: "them", text: "The staging deploy finished, all green", time: "08:02", status: "read" },
    { id: "m2", from: "me", text: "Nice, I'll run through the checkout flow now", time: "08:05", status: "read" },
    { id: "m3", from: "me", text: "Found one thing — retry on the payments webhook is throwing a 502", time: "08:22", status: "read" },
    { id: "m4", from: "them", text: "Looking into it, might be the timeout on the gateway side", time: "08:24", status: "read" },
    { id: "m5", from: "them", text: "Bumped the timeout to 15s, can you retry?", time: "08:41", status: "read" },
    { id: "m6", from: "me", text: "That fixed it, thank you", time: "08:43", status: "read" },
    { id: "m7", from: "them", text: "Pushed the fix to main, should be live in ~10 min", time: "10:10", status: "delivered" },
  ],
  u3: [
    { id: "m1", from: "them", text: "Regression suite is passing on the release branch", time: "Mon", status: "read" },
    { id: "m2", from: "me", text: "Great, I'll cut the release candidate tonight", time: "Mon", status: "read" },
    { id: "m3", from: "them", text: "One flaky test on Safari, re-ran it and it's fine now", time: "Mon", status: "read" },
    { id: "m4", from: "them", text: "Sounds good, thanks for confirming", time: "Yesterday", status: "read" },
  ],
  u4: [
    { id: "m1", from: "me", text: "Can you take a look at the sidebar collapse animation?", time: "07:40", status: "read" },
    { id: "m2", from: "them", text: "On it, the easing feels a bit stiff right now", time: "07:44", status: "read" },
    { id: "m3", from: "them", text: "Trying cubic-bezier(0.22, 1, 0.36, 1) instead", time: "07:50", status: "read" },
    { id: "m4", from: "me", text: "That's much smoother", time: "07:58", status: "read" },
    { id: "m5", from: "them", text: "Pushed 🎉", time: "08:01", status: "delivered" },
  ],
  u5: [
    { id: "m1", from: "them", text: "Rotated the prod credentials, new ones are in the vault", time: "Yesterday", status: "read" },
    { id: "m2", from: "me", text: "Got it, updating the CI secrets now", time: "Yesterday", status: "read" },
    { id: "m3", from: "me", text: "All pipelines are green again", time: "Yesterday", status: "read" },
  ],
  u6: [
    { id: "m1", from: "them", text: "Draft for the launch email is ready for review", time: "10:30", status: "read" },
    { id: "m2", from: "me", text: "Reading through it now", time: "10:35", status: "read" },
    { id: "m3", from: "them", text: "No rush, end of day works", time: "10:36", status: "read" },
  ],
  u7: [
    { id: "m1", from: "them", text: "How did the demo go this morning?", time: "09:00", status: "read" },
    { id: "m2", from: "me", text: "Went well, two follow-up questions on pricing", time: "09:03", status: "read" },
    { id: "m3", from: "them", text: "Let's sync after lunch to go through those", time: "09:04", status: "read" },
  ],
  "design-team": [
    { id: "m1", from: "them", author: "Meera", text: "New icon set is up in the shared folder", time: "Mon", status: "read" },
    { id: "m2", from: "them", author: "Devansh", text: "These look great, importing them now", time: "Mon", status: "read" },
    { id: "m3", from: "me", text: "Can we standardize on 20px stroke width going forward?", time: "Mon", status: "read" },
    { id: "m4", from: "them", author: "Meera", text: "Agreed, updating the library", time: "Tue", status: "read" },
  ],
};

// Older history returned by the "scroll to top → refresh" gesture.
export const olderMessagesByChat = {
  u1: [
    { id: "o1", from: "them", text: "Morning! Standup notes are in the doc", time: "Yesterday", status: "read" },
    { id: "o2", from: "me", text: "Thanks, I'll add my updates before 10", time: "Yesterday", status: "read" },
    { id: "o3", from: "them", text: "Also — great work on the empty states last week", time: "Yesterday", status: "read" },
  ],
  u2: [
    { id: "o1", from: "them", text: "Migrated the queue worker to the new cluster", time: "Yesterday", status: "read" },
    { id: "o2", from: "me", text: "Any downtime during the switch?", time: "Yesterday", status: "read" },
    { id: "o3", from: "them", text: "None, it was a rolling deploy", time: "Yesterday", status: "read" },
  ],
};

export function lastMessageFor(chatId) {
  const list = conversations[chatId];
  return list && list.length ? list[list.length - 1] : null;
}

export const unreadCounts = { u1: 1, u2: 0, u3: 0, u4: 0, u5: 0, u6: 2, u7: 0, "design-team": 3 };

export const currentUser = {
  id: "me",
  name: "You",
  role: "Product Designer",
  initials: "YO",
  color: "#3454D1",
  email: "you@example.com",
  bio: "Designing calm, focused tools for how teams actually talk. Coffee-powered, dark-mode by default.",
  joined: "21 Jan 2024",
};

export const profileDashboard = {
  paymentsNew: 2,
  notificationsNew: 5,
  privacyActionNeeded: true,
};

const autoReplies = [
  "Got it, taking a look now.",
  "Makes sense, let's go with that.",
  "I'll follow up after the meeting.",
  "Can you share a bit more context?",
  "Sounds good to me 👍",
  "Let me check and get back to you.",
];

export function pickAutoReply() {
  return autoReplies[Math.floor(Math.random() * autoReplies.length)];
}
