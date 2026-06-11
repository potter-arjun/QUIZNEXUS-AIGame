/**
 * Programmatic Animal Avatars for Navodaya Quiz Battle
 * Returns high quality inline SVGs for user profiles.
 */

export const AVATAR_LIST = [
  { id: "avatar_1", name: "Cute Panda", color: "#6b7280" },
  { id: "avatar_2", name: "Vibrant Fox", color: "#f97316" },
  { id: "avatar_3", name: "Wise Owl", color: "#a855f7" },
  { id: "avatar_4", name: "Cheerful Rabbit", color: "#ec4899" },
  { id: "avatar_5", name: "Cool Koala", color: "#64748b" },
  { id: "avatar_6", name: "Brave Lion", color: "#eab308" },
  { id: "avatar_7", name: "Sleek Tiger", color: "#fb923c" },
  { id: "avatar_8", name: "Happy Bear", color: "#854d0e" }
];

export function getAvatarSvg(id: string, size = 60): string {
  const avatarId = id && id.startsWith("avatar_") ? id : "avatar_1";
  
  // Basic structures
  const faceBase = `<circle cx="50" cy="50" r="38" fill="{COLOR}" stroke="#1e1b4b" stroke-width="4" />`;
  const defaultEyes = `
    <circle cx="36" cy="45" r="5" fill="#1e1b4b" />
    <circle cx="64" cy="45" r="5" fill="#1e1b4b" />
    <circle cx="38" cy="43" r="1.5" fill="#ffffff" />
    <circle cx="66" cy="43" r="1.5" fill="#ffffff" />
  `;
  const defaultCheeks = `
    <circle cx="28" cy="55" r="4" fill="#f43f5e" opacity="0.6" />
    <circle cx="72" cy="55" r="4" fill="#f43f5e" opacity="0.6" />
  `;

  let innerContent = "";

  switch (avatarId) {
    case "avatar_1": // Panda
      innerContent = `
        <circle cx="24" cy="22" r="12" fill="#1f2937" stroke="#111827" stroke-width="3" />
        <circle cx="76" cy="22" r="12" fill="#1f2937" stroke="#111827" stroke-width="3" />
        ${faceBase.replace("{COLOR}", "#f8fafc")}
        <ellipse cx="34" cy="46" rx="8" ry="10" fill="#1f2937" transform="rotate(-15 34 46)" />
        <ellipse cx="66" cy="46" rx="8" ry="10" fill="#1f2937" transform="rotate(15 66 46)" />
        <circle cx="34" cy="44" r="3.5" fill="#ffffff" />
        <circle cx="66" cy="44" r="3.5" fill="#ffffff" />
        <circle cx="50" cy="56" r="3" fill="#111827" />
        <path d="M 45 62 Q 50 66 55 62" stroke="#111827" stroke-width="2.5" stroke-linecap="round" fill="none" />
      `;
      break;
    
    case "avatar_2": // Fox
      innerContent = `
        <polygon points="12,12 32,32 18,45" fill="#ea580c" />
        <polygon points="88,12 68,32 82,45" fill="#ea580c" />
        ${faceBase.replace("{COLOR}", "#f97316")}
        <path d="M 16 55 Q 36 60 50 82 Q 64 60 84 55 Z" fill="#ffffff" />
        <circle cx="36" cy="45" r="4.5" fill="#111827" />
        <circle cx="64" cy="45" r="4.5" fill="#111827" />
        <circle cx="50" cy="74" r="4.5" fill="#111827" />
      `;
      break;

    case "avatar_3": // Owl
      innerContent = `
        <polygon points="20,15 35,28 15,35" fill="#7c3aed" />
        <polygon points="80,15 65,28 85,35" fill="#7c3aed" />
        ${faceBase.replace("{COLOR}", "#a855f7")}
        <circle cx="35" cy="45" r="11" fill="#ffffff" stroke="#7c3aed" stroke-width="2.5" />
        <circle cx="65" cy="45" r="11" fill="#ffffff" stroke="#7c3aed" stroke-width="2.5" />
        <circle cx="35" cy="45" r="5" fill="#111827" />
        <circle cx="65" cy="45" r="5" fill="#111827" />
        <circle cx="37" cy="43" r="1.5" fill="#ffffff" />
        <circle cx="67" cy="43" r="1.5" fill="#ffffff" />
        <polygon points="50,48 45,60 55,60" fill="#f59e0b" />
      `;
      break;

    case "avatar_4": // Rabbit
      innerContent = `
        <ellipse cx="32" cy="18" rx="8" ry="18" fill="#f472b6" stroke="#db2777" stroke-width="3" />
        <ellipse cx="68" cy="18" rx="8" ry="18" fill="#f472b6" stroke="#db2777" stroke-width="3" />
        ${faceBase.replace("{COLOR}", "#f472b6")}
        ${defaultEyes}
        ${defaultCheeks}
        <ellipse cx="50" cy="54" rx="4.5" ry="3" fill="#db2777" />
        <path d="M 46 61 Q 50 64 54 61" stroke="#db2777" stroke-width="2.5" stroke-linecap="round" fill="none" />
      `;
      break;

    case "avatar_5": // Koala
      innerContent = `
        <circle cx="20" cy="30" r="16" fill="#475569" stroke="#334155" stroke-width="3" />
        <circle cx="80" cy="30" r="16" fill="#475569" stroke="#334155" stroke-width="3" />
        <circle cx="20" cy="30" r="9" fill="#cbd5e1" />
        <circle cx="80" cy="30" r="9" fill="#cbd5e1" />
        ${faceBase.replace("{COLOR}", "#64748b")}
        ${defaultEyes}
        <ellipse cx="50" cy="52" rx="7" ry="11" fill="#1e293b" />
        ${defaultCheeks}
      `;
      break;

    case "avatar_6": // Lion
      innerContent = `
        <!-- Mane -->
        <circle cx="50" cy="50" r="46" fill="#b45309" stroke="#78350f" stroke-width="3" />
        ${faceBase.replace("{COLOR}", "#eab308")}
        ${defaultEyes}
        <polygon points="50,54 44,62 56,62" fill="#78350f" />
        <path d="M 45 68 Q 50 72 55 68" stroke="#78350f" stroke-width="2.5" stroke-linecap="round" fill="none" />
      `;
      break;

    case "avatar_7": // Tiger
      innerContent = `
        ${faceBase.replace("{COLOR}", "#fb923c")}
        <!-- Stripes -->
        <polygon points="12,45 25,48 12,52" fill="#1e293b" />
        <polygon points="88,45 75,48 88,52" fill="#1e293b" />
        <polygon points="50,12 47,24 53,24" fill="#1e293b" />
        ${defaultEyes}
        <polygon points="50,54 44,62 56,62" fill="#1e293b" />
        <path d="M 45 68 Q 50 72 55 68" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round" fill="none" />
      `;
      break;

    case "avatar_8": // Bear
      innerContent = `
        <circle cx="22" cy="22" r="10" fill="#713f12" stroke="#451a03" stroke-width="3" />
        <circle cx="78" cy="22" r="10" fill="#713f12" stroke="#451a03" stroke-width="3" />
        ${faceBase.replace("{COLOR}", "#854d0e")}
        ${defaultEyes}
        <ellipse cx="50" cy="58" rx="9" ry="7" fill="#a16207" />
        <circle cx="50" cy="55" r="3" fill="#451a03" />
        <path d="M 46 61 Q 50 64 54 61" stroke="#451a03" stroke-width="2" stroke-linecap="round" fill="none" />
      `;
      break;

    default:
      innerContent = faceBase.replace("{COLOR}", "#3b82f6");
  }

  return `<svg viewBox="0 0 100 100" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:middle;">${innerContent}</svg>`;
}
