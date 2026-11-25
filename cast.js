// The cast: Sam, Ade and Tom, drawn in code so they look the same everywhere (site and film).
// person(who, face) returns an SVG string. Faces: neutral, happy, relieved, frustrated, surprised, thinking.
// Style: flat cut paper, a 3px ink outline, halftone shading on the shadow side.

const INK = "#141210";
let uid = 0;

const CAST = {
  sam: { skin: "#d9a07c", shade: "#b97d5c", hair: "#1f1a17", top: "#ff5a1f", topShade: "#d9431a", kind: "curly" },
  ade: { skin: "#8a5638", shade: "#6c3f27", hair: "#141210", top: "#2f5bd3", topShade: "#2347a8", kind: "short", glasses: "round" },
  tom: { skin: "#efc29f", shade: "#d4a07c", hair: "#c9c3b8", top: "#f2c230", topShade: "#d4a31a", kind: "bald", glasses: "reading", beard: true },
};

function hair(c, id) {
  if (c.kind === "curly") {
    const blobs = [[72, 92, 26], [96, 66, 28], [128, 60, 30], [158, 74, 27], [176, 104, 22], [66, 124, 18], [178, 134, 16], [112, 76, 22], [146, 88, 20]];
    return blobs.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c.hair}" stroke="${INK}" stroke-width="3"/>`).join("") +
      blobs.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r - 3}" fill="${c.hair}"/>`).join("");
  }
  if (c.kind === "short") {
    return `<path d="M64 118 C60 70 92 52 122 52 C156 52 182 72 176 118 C170 98 156 86 122 86 C92 86 72 96 64 118Z" fill="${c.hair}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`;
  }
  // bald top, hair at the sides and back
  return `<path d="M64 132 C60 112 64 96 72 92 L76 128Z" fill="${c.hair}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M176 132 C180 112 176 96 168 92 L164 128Z" fill="${c.hair}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`;
}

function eyes(face) {
  if (face === "happy" || face === "relieved") {
    return `<path d="M92 124 q8 -9 16 0 M132 124 q8 -9 16 0" fill="none" stroke="${INK}" stroke-width="4.5" stroke-linecap="round"/>`;
  }
  const ry = face === "surprised" ? 8 : 6.5;
  const lookY = face === "thinking" ? -3 : 0, lookX = face === "thinking" ? 3 : 0;
  return `<ellipse cx="${100 + lookX}" cy="${123 + lookY}" rx="5" ry="${ry}" fill="${INK}"/><ellipse cx="${140 + lookX}" cy="${123 + lookY}" rx="5" ry="${ry}" fill="${INK}"/>`;
}

function brows(face) {
  const B = {
    neutral: "M88 106 l20 -2 M132 104 l20 2",
    happy: "M88 102 q10 -6 20 -2 M132 100 q10 -4 20 2",
    relieved: "M88 104 q10 -5 20 0 M132 104 q10 -5 20 0",
    frustrated: "M88 100 l20 8 M132 108 l20 -8",
    surprised: "M88 96 q10 -8 20 -2 M132 94 q10 -6 20 2",
    thinking: "M88 104 l20 -1 M132 98 l20 -4",
  };
  return `<path d="${B[face] || B.neutral}" fill="none" stroke="${INK}" stroke-width="4.5" stroke-linecap="round"/>`;
}

function mouth(face) {
  const M = {
    neutral: `<path d="M108 156 h24" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`,
    happy: `<path d="M102 150 q18 20 36 0 Z" fill="${INK}"/><path d="M110 156 q10 6 20 0" fill="#e4685c"/>`,
    relieved: `<path d="M106 152 q14 12 28 0" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`,
    frustrated: `<path d="M104 160 q6 -6 12 0 t12 0 t8 -2" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`,
    surprised: `<ellipse cx="120" cy="158" rx="8" ry="10" fill="${INK}"/>`,
    thinking: `<path d="M110 158 q10 -4 22 2" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`,
  };
  return M[face] || M.neutral;
}

function glasses(kind) {
  if (kind === "round") return `<g fill="none" stroke="${INK}" stroke-width="3.5"><circle cx="100" cy="123" r="15"/><circle cx="140" cy="123" r="15"/><path d="M115 121 q5 -4 10 0 M85 120 l-17 -4 M155 120 l17 -4"/></g>`;
  if (kind === "reading") return `<g fill="#ffffff22" stroke="${INK}" stroke-width="3.5"><rect x="86" y="128" width="26" height="15" rx="4"/><rect x="128" y="128" width="26" height="15" rx="4"/><path d="M112 134 h16 M86 132 l-18 -8 M154 132 l18 -8" fill="none"/></g>`;
  return "";
}

export function person(who, face = "neutral") {
  const c = CAST[who];
  const id = `p${++uid}`;
  return `<svg class="person person--${who}" data-face="${face}" viewBox="0 0 240 260" role="img" aria-label="${who[0].toUpperCase() + who.slice(1)}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="${id}h" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="3.5" cy="3.5" r="1.6" fill="${INK}" opacity=".28"/></pattern>
    <clipPath id="${id}f"><ellipse cx="120" cy="124" rx="54" ry="62"/></clipPath>
    <clipPath id="${id}b"><path d="M22 262 C26 214 60 196 120 196 C180 196 214 214 218 262Z"/></clipPath>
  </defs>
  ${c.kind === "curly" ? hair(c, id) : ""}
  <path d="M22 262 C26 214 60 196 120 196 C180 196 214 214 218 262Z" fill="${c.top}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
  <rect x="138" y="196" width="90" height="70" fill="url(#${id}h)" clip-path="url(#${id}b)"/>
  ${who === "ade" ? `<path d="M74 204 C84 222 156 222 166 204" fill="none" stroke="${INK}" stroke-width="3"/><path d="M106 214 v26 M134 214 v26" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>` : ""}
  ${who === "tom" ? `<path d="M100 198 l20 26 l20 -26" fill="#fff" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><circle cx="120" cy="238" r="3" fill="${INK}"/>` : ""}
  ${who === "sam" ? `<path d="M92 200 q28 18 56 0" fill="none" stroke="${INK}" stroke-width="3"/>` : ""}
  <rect x="104" y="166" width="32" height="40" fill="${c.skin}" stroke="${INK}" stroke-width="3"/>
  <ellipse cx="66" cy="128" rx="9" ry="13" fill="${c.skin}" stroke="${INK}" stroke-width="3"/>
  <ellipse cx="174" cy="128" rx="9" ry="13" fill="${c.skin}" stroke="${INK}" stroke-width="3"/>
  <ellipse cx="120" cy="124" rx="54" ry="62" fill="${c.skin}" stroke="${INK}" stroke-width="3"/>
  <g clip-path="url(#${id}f)"><rect x="134" y="56" width="48" height="140" fill="url(#${id}h)"/></g>
  ${c.beard ? `<path d="M74 140 C78 186 104 196 120 196 C136 196 162 186 166 140 C156 160 140 166 120 166 C100 166 84 160 74 140Z" fill="${c.hair}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>` : ""}
  ${c.kind !== "curly" ? hair(c, id) : ""}
  <ellipse cx="94" cy="146" rx="9" ry="5" fill="#e4685c" opacity=".35"/><ellipse cx="146" cy="146" rx="9" ry="5" fill="#e4685c" opacity=".35"/>
  ${brows(face)}${eyes(face)}
  <path d="M120 128 q-6 14 2 16" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
  ${c.beard && face !== "surprised" ? mouth(face).replaceAll(INK, "#5a4a3c") : mouth(face)}
  ${glasses(c.glasses)}
</svg>`;
}

export const CAST_NAMES = Object.keys(CAST);
