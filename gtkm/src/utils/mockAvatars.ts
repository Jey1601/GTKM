/**
 * Procedural cute hand-drawn avatars encoded as Data URLs
 * Used for pre-generated bots and initial templates
 */

export function createCuteAvatarSvg(color: string, emoji: string, faceType: number = 0): string {
  const faces = [
    // Happy
    `<circle cx="65" cy="90" r="8" fill="#120e28"/><circle cx="135" cy="90" r="8" fill="#120e28"/><path d="M 75 125 Q 100 155 125 125" stroke="#120e28" stroke-width="8" stroke-linecap="round" fill="none"/><circle cx="50" cy="110" r="10" fill="#ff4081" opacity="0.4"/><circle cx="150" cy="110" r="10" fill="#ff4081" opacity="0.4"/>`,
    // Wink
    `<path d="M 55 90 Q 65 75 75 90" stroke="#120e28" stroke-width="8" stroke-linecap="round" fill="none"/><circle cx="135" cy="90" r="8" fill="#120e28"/><path d="M 80 130 Q 100 150 120 130" stroke="#120e28" stroke-width="8" stroke-linecap="round" fill="none"/><circle cx="50" cy="105" r="10" fill="#ff4081" opacity="0.4"/><circle cx="150" cy="105" r="10" fill="#ff4081" opacity="0.4"/>`,
    // Silly Tongue
    `<circle cx="65" cy="85" r="9" fill="#120e28"/><circle cx="135" cy="85" r="9" fill="#120e28"/><path d="M 75 120 Q 100 145 125 120" stroke="#120e28" stroke-width="7" stroke-linecap="round" fill="none"/><path d="M 92 125 Q 100 155 108 125 Z" fill="#ff3366"/>`,
    // Cool sunglasses
    `<path d="M 45 80 L 90 80 L 85 105 L 50 105 Z" fill="#120e28"/><path d="M 110 80 L 155 80 L 150 105 L 115 105 Z" fill="#120e28"/><line x1="90" y1="88" x2="110" y2="88" stroke="#120e28" stroke-width="6"/><path d="M 85 130 Q 100 145 115 130" stroke="#120e28" stroke-width="7" stroke-linecap="round" fill="none"/>`
  ];

  const face = faces[faceType % faces.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
    <rect width="200" height="200" rx="40" fill="${color}"/>
    <circle cx="100" cy="105" r="70" fill="#ffffff" opacity="0.9"/>
    ${face}
    <text x="100" y="45" font-size="28" text-anchor="middle" dominant-baseline="central">${emoji}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const SAMPLE_BOT_PLAYERS = [
  {
    name: "Sofi Ruiz",
    nickname: "sofi_party",
    color: "#ff007a",
    emoji: "🦄",
    faceType: 0,
    answers: {
      0: "Traté de cantar en un karaoke y se me cayó el micrófono en la bebida del DJ.",
      1: "Un tobogán inflable gigante de 3 pisos para la sala.",
      2: "El aguacate/palta, no soporto su textura babosa.",
      3: "Robarme un perrito de la calle para darle cariños infinitos.",
      4: "Puedo adivinar la canción en 1 segundo con solo el primer acorde.",
    }
  },
  {
    name: "Mateo Gómez",
    nickname: "mateito99",
    color: "#00d2ff",
    emoji: "🍕",
    faceType: 1,
    answers: {
      0: "Saludé con un abrazo muy efusivo a un maniquí en una tienda pensando que era mi primo.",
      1: "Comprar una estatua dorada de tamaño real de mi gato con ojos de rubí.",
      2: "El sushi... jamás entenderé el pescado frío con algas.",
      3: "Hackear las luces de la ciudad para ponerlas todas en verde.",
      4: "Puedo hacer el sonido exacto de una trompeta con mi boca.",
    }
  },
  {
    name: "Camila Torres",
    nickname: "cami_vibes",
    color: "#ffc107",
    emoji: "🚀",
    faceType: 2,
    answers: {
      0: "Entré al baño de hombres en el cine y salí corriendo gritando perdón.",
      1: "Un jetpack personal para saltarme todo el tráfico matutino.",
      2: "El chocolate amargo al 90%, sabe a tierra pura.",
      3: "Haber organizado una fiesta clandestina en la biblioteca.",
      4: "Puedo mover las orejas y doblar la lengua en forma de flor de loto.",
    }
  }
];
