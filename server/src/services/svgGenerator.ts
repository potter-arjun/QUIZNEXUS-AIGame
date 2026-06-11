/**
 * SVG Generator for Figure & Design Reasoning Questions
 * Generates valid SVG XML strings dynamically for the frontend.
 */

interface SVGQuestion {
  question: string;
  type: string;
  difficulty: string;
  questionSvg: string; // The main visual clue
  options: string[];   // Four options, each containing raw SVG content
  correctAnswer: string; // "A" | "B" | "C" | "D"
  explanation: string;
}

// Utility to create a wrapper SVG element
function wrapSvg(content: string, width = 200, height = 200): string {
  return `<svg viewBox="0 0 ${width} ${height}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="background:#1e1b4b;border-radius:12px;border:2px solid #4f46e5;">${content}</svg>`;
}

// Draw basic JNVST-like shapes
const drawArrow = (x: number, y: number, length: number, angle: number, color = "#fbbf24") => {
  const rad = (angle * Math.PI) / 180;
  const x2 = x + length * Math.cos(rad);
  const y2 = y + length * Math.sin(rad);
  const headLength = 12;
  const headAngle = 30; // degrees from arrow shaft
  
  const hrad1 = ((angle + 180 - headAngle) * Math.PI) / 180;
  const hrad2 = ((angle + 180 + headAngle) * Math.PI) / 180;
  
  const hx1 = x2 + headLength * Math.cos(hrad1);
  const hy1 = y2 + headLength * Math.sin(hrad1);
  const hx2 = x2 + headLength * Math.cos(hrad2);
  const hy2 = y2 + headLength * Math.sin(hrad2);

  return `
    <line x1="${x}" y1="${y}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="4" stroke-linecap="round" />
    <path d="M ${x2} ${y2} L ${hx1} ${hy1} M ${x2} ${y2} L ${hx2} ${hy2}" stroke="${color}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none" />
  `;
};

const drawChiralFlag = (x: number, y: number, mirrored = false, rotated = 0, color = "#ec4899") => {
  const transform = `translate(${x}, ${y}) rotate(${rotated}) scale(${mirrored ? -1 : 1}, 1)`;
  return `
    <g transform="${transform}">
      <line x1="0" y1="50" x2="0" y2="-50" stroke="#f43f5e" stroke-width="5" stroke-linecap="round" />
      <polygon points="0,-50 30,-30 0,-10" fill="${color}" stroke="#f43f5e" stroke-width="2" />
      <circle cx="15" cy="10" r="10" fill="#3b82f6" />
    </g>
  `;
};

export function generateFigureQuestion(type: string, difficulty: string): SVGQuestion {
  const questionTypes = [
    "Mirror Image",
    "Water Image",
    "Pattern Completion",
    "Shape Sequence",
    "Odd Figure Out",
    "Figure Matching"
  ];
  
  const selectedType = type && questionTypes.includes(type) ? type : questionTypes[Math.floor(Math.random() * questionTypes.length)];
  
  switch (selectedType) {
    case "Mirror Image": {
      // Mirror image question: An asymmetrical shape + a mirror line on right.
      // Option choices: One is correct mirrored (mirrored = true), three are wrong (e.g. rotated, original, water image)
      const mainSvg = wrapSvg(`
        <!-- Mirror Line -->
        <line x1="140" y1="20" x2="140" y2="180" stroke="#94a3b8" stroke-width="3" stroke-dasharray="6,4" />
        <text x="145" y="30" fill="#94a3b8" font-size="12" font-family="sans-serif">M</text>
        <text x="145" y="180" fill="#94a3b8" font-size="12" font-family="sans-serif">M'</text>
        <!-- Shape to reflect -->
        ${drawChiralFlag(70, 100, false, 0)}
      `);

      const options = [
        wrapSvg(drawChiralFlag(100, 100, true, 0)), // Mirrored (Correct) - Choice A
        wrapSvg(drawChiralFlag(100, 100, false, 0)), // Same as original - Choice B
        wrapSvg(drawChiralFlag(100, 100, false, 180)), // Rotated 180 - Choice C
        wrapSvg(drawChiralFlag(100, 100, true, 180)) // Mirrored and rotated - Choice D
      ];

      return {
        question: "Find the correct mirror image of the given figure with respect to the mirror MM'.",
        type: "Mirror Image",
        difficulty,
        questionSvg: mainSvg,
        options,
        correctAnswer: "A",
        explanation: "A mirror reflects an object laterally. The flag pointing to the right will appear to point to the left in the mirror, while the blue circle remains in the lower section."
      };
    }

    case "Water Image": {
      // Water reflection (mirrored vertically, i.e. flipped upside down)
      const mainSvg = wrapSvg(`
        <!-- Water reflection horizontal boundary -->
        <line x1="20" y1="140" x2="180" y2="140" stroke="#38bdf8" stroke-width="3" stroke-dasharray="6,4" />
        <!-- Shape to reflect -->
        <g transform="translate(100, 70)">
          <polygon points="0,-30 -30,20 30,20" fill="#8b5cf6" stroke="#c084fc" stroke-width="4" />
          <circle cx="0" cy="0" r="10" fill="#f59e0b" />
        </g>
      `);

      const optCorrect = wrapSvg(`
        <g transform="translate(100, 100) scale(1, -1)">
          <polygon points="0,-30 -30,20 30,20" fill="#8b5cf6" stroke="#c084fc" stroke-width="4" />
          <circle cx="0" cy="0" r="10" fill="#f59e0b" />
        </g>
      `); // Choice A (Correct)

      const optWrong1 = wrapSvg(`
        <g transform="translate(100, 100)">
          <polygon points="0,-30 -30,20 30,20" fill="#8b5cf6" stroke="#c084fc" stroke-width="4" />
          <circle cx="0" cy="0" r="10" fill="#f59e0b" />
        </g>
      `); // Original (Unchanged)

      const optWrong2 = wrapSvg(`
        <g transform="translate(100, 100) scale(-1, 1)">
          <polygon points="0,-30 -30,20 30,20" fill="#8b5cf6" stroke="#c084fc" stroke-width="4" />
          <circle cx="0" cy="0" r="10" fill="#f59e0b" />
        </g>
      `); // Horizontally mirrored only

      const optWrong3 = wrapSvg(`
        <g transform="translate(100, 100) rotate(90)">
          <polygon points="0,-30 -30,20 30,20" fill="#8b5cf6" stroke="#c084fc" stroke-width="4" />
          <circle cx="0" cy="0" r="10" fill="#f59e0b" />
        </g>
      `); // Rotated 90 degrees

      return {
        question: "Find the correct water image of the given figure.",
        type: "Water Image",
        difficulty,
        questionSvg: mainSvg,
        options: [optWrong1, optCorrect, optWrong2, optWrong3], // Correct answer is B (index 1)
        correctAnswer: "B",
        explanation: "A water image flips the figure vertically (upside down). The triangle pointing upward will point downward, and the central yellow circle will adjust its vertical position accordingly."
      };
    }

    case "Pattern Completion": {
      // 2x2 Grid with a missing 4th quadrant (bottom right)
      // The overall pattern is a circular arc connecting all quadrants, or lines crossing.
      // Let's draw a large central circle shape and diagonal lines.
      const mainSvg = wrapSvg(`
        <!-- Grid boundary -->
        <line x1="100" y1="20" x2="100" y2="180" stroke="#4f46e5" stroke-dasharray="4,4" />
        <line x1="20" y1="100" x2="180" y2="100" stroke="#4f46e5" stroke-dasharray="4,4" />
        
        <!-- Quadrant 1 (Top Left) -->
        <path d="M 100 60 A 40 40 0 0 0 60 100" fill="none" stroke="#10b981" stroke-width="5" />
        <line x1="100" y1="100" x2="40" y2="40" stroke="#e11d48" stroke-width="3" />
        
        <!-- Quadrant 2 (Top Right) -->
        <path d="M 140 100 A 40 40 0 0 0 100 60" fill="none" stroke="#10b981" stroke-width="5" />
        <line x1="100" y1="100" x2="160" y2="40" stroke="#e11d48" stroke-width="3" />
        
        <!-- Quadrant 3 (Bottom Left) -->
        <path d="M 60 100 A 40 40 0 0 0 100 140" fill="none" stroke="#10b981" stroke-width="5" />
        <line x1="100" y1="100" x2="40" y2="160" stroke="#e11d48" stroke-width="3" />
        
        <!-- Quadrant 4 (Bottom Right) is MISSING -->
        <rect x="110" y="110" width="60" height="60" fill="#312e81" rx="4" />
        <text x="135" y="148" fill="#a78bfa" font-size="28" font-weight="bold" font-family="sans-serif">?</text>
      `);

      // Options represent the bottom-right quadrant: it should contain:
      // - Arc from (100, 140) to (140, 100) (bottom-right quadrant of central circle)
      // - Diagonal line from (100, 100) to (160, 160) (bottom-right direction)
      const makeQuadrantSvg = (hasArc: boolean, hasLine: boolean, arcRot = 0, lineRot = 0) => {
        return wrapSvg(`
          <g transform="translate(100, 100)">
            <!-- Guides -->
            <line x1="-80" y1="0" x2="80" y2="0" stroke="#312e81" stroke-dasharray="2,2" />
            <line x1="0" y1="-80" x2="0" y2="80" stroke="#312e81" stroke-dasharray="2,2" />
            
            ${hasArc ? `<path d="M 0 40 A 40 40 0 0 0 40 0" fill="none" stroke="#10b981" stroke-width="5" transform="rotate(${arcRot})" />` : ''}
            ${hasLine ? `<line x1="0" y1="0" x2="60" y2="60" stroke="#e11d48" stroke-width="3" transform="rotate(${lineRot})" />` : ''}
          </g>
        `);
      };

      const options = [
        makeQuadrantSvg(true, true, 90, 0),    // Wrong arc rotation
        makeQuadrantSvg(true, false, 0, 0),   // Missing line
        makeQuadrantSvg(true, true, 0, 0),     // Correct! (Choice C)
        makeQuadrantSvg(false, true, 0, 90)    // Missing arc, wrong line
      ];

      return {
        question: "Select the option that completes the missing part of the given design pattern.",
        type: "Pattern Completion",
        difficulty,
        questionSvg: mainSvg,
        options,
        correctAnswer: "C",
        explanation: "To complete the pattern, we need a bottom-right circular arc segment (connecting bottom and right quadrants) and a diagonal line pointing towards the bottom-right corner."
      };
    }

    case "Shape Sequence": {
      // Shape Sequence: 3 frames showing progression, 4th is ?
      // Let's create a single horizontal strip SVG for the question.
      const mainSvg = wrapSvg(`
        <!-- 3 Boxes -->
        <g transform="translate(5, 5)">
          <rect x="0" y="40" width="55" height="110" fill="#1e1b4b" stroke="#4f46e5" stroke-width="2" rx="4" />
          <circle cx="27" cy="95" r="15" fill="none" stroke="#10b981" stroke-width="3" />
        </g>
        <g transform="translate(70, 5)">
          <rect x="0" y="40" width="55" height="110" fill="#1e1b4b" stroke="#4f46e5" stroke-width="2" rx="4" />
          <circle cx="27" cy="75" r="15" fill="none" stroke="#10b981" stroke-width="3" />
          <rect x="12" y="105" width="30" height="30" fill="none" stroke="#fbbf24" stroke-width="3" />
        </g>
        <g transform="translate(135, 5)">
          <rect x="0" y="40" width="55" height="110" fill="#1e1b4b" stroke="#4f46e5" stroke-width="2" rx="4" />
          <circle cx="27" cy="60" r="15" fill="none" stroke="#10b981" stroke-width="3" />
          <rect x="12" y="85" width="30" height="30" fill="none" stroke="#fbbf24" stroke-width="3" />
          <polygon points="27,120 12,140 42,140" fill="none" stroke="#f43f5e" stroke-width="3" />
        </g>
      `, 200, 200);

      // Sequence adds a shape and pushes everything up:
      // Box 1: Circle
      // Box 2: Circle, Square
      // Box 3: Circle, Square, Triangle
      // Box 4 (Correct Option): Circle, Square, Triangle, Hexagon/Star or another shape.
      const makeSequenceEnd = (success: boolean) => {
        if (success) {
          // Circle, Square, Triangle, Diamond (Correct)
          return wrapSvg(`
            <rect x="10" y="10" width="180" height="180" fill="none" stroke="#4f46e5" stroke-width="2" />
            <circle cx="100" cy="45" r="15" fill="none" stroke="#10b981" stroke-width="3" />
            <rect x="85" y="75" width="30" height="30" fill="none" stroke="#fbbf24" stroke-width="3" />
            <polygon points="100,120 85,140 115,140" fill="none" stroke="#f43f5e" stroke-width="3" />
            <polygon points="100,155 115,168 100,181 85,168" fill="none" stroke="#38bdf8" stroke-width="3" />
          `);
        } else {
          // Wrong sequence (wrong order or missing shapes)
          return wrapSvg(`
            <rect x="10" y="10" width="180" height="180" fill="none" stroke="#4f46e5" stroke-width="2" />
            <polygon points="100,45 85,65 115,65" fill="none" stroke="#f43f5e" stroke-width="3" />
            <circle cx="100" cy="95" r="15" fill="none" stroke="#10b981" stroke-width="3" />
            <rect x="85" y="135" width="30" height="30" fill="none" stroke="#fbbf24" stroke-width="3" />
          `);
        }
      };

      const options = [
        makeSequenceEnd(false),
        makeSequenceEnd(false),
        makeSequenceEnd(false),
        makeSequenceEnd(true) // Choice D (Correct)
      ];

      return {
        question: "What comes next in the sequence of figures?",
        type: "Shape Sequence",
        difficulty,
        questionSvg: mainSvg,
        options,
        correctAnswer: "D",
        explanation: "Each step in the sequence adds a new geometric shape at the bottom and shifts the existing shapes upward. The fourth frame should contain a Circle, Square, Triangle, and a Diamond."
      };
    }

    case "Odd Figure Out": {
      // 4 Options: Three share a configuration (e.g. arrows pointing clockwise), one does not (pointing counter-clockwise)
      const drawArrowCircle = (clockwise: boolean, color = "#a855f7") => {
        return wrapSvg(`
          <circle cx="100" cy="100" r="50" fill="none" stroke="#e2e8f0" stroke-width="2" stroke-dasharray="4,4" />
          ${drawArrow(100, 50, 40, clockwise ? 0 : 180, color)}
          ${drawArrow(150, 100, 40, clockwise ? 90 : 270, color)}
          ${drawArrow(100, 150, 40, clockwise ? 180 : 0, color)}
          ${drawArrow(50, 100, 40, clockwise ? 270 : 90, color)}
        `);
      };

      const options = [
        drawArrowCircle(true, "#22c55e"), // Clockwise
        drawArrowCircle(true, "#22c55e"), // Clockwise
        drawArrowCircle(false, "#ef4444"), // Counter-Clockwise (Odd one out!) - Choice C
        drawArrowCircle(true, "#22c55e")  // Clockwise
      ];

      return {
        question: "Identify the figure which is different from the other three figures.",
        type: "Odd Figure Out",
        difficulty,
        questionSvg: wrapSvg(`
          <text x="50" y="80" fill="#f8fafc" font-size="20" font-family="sans-serif">Which is the</text>
          <text x="35" y="120" fill="#ec4899" font-size="24" font-weight="bold" font-family="sans-serif">ODD FIGURE?</text>
        `),
        options,
        correctAnswer: "C",
        explanation: "Figures A, B, and D show arrows rotating in a clockwise direction. Figure C has arrows rotating in a counter-clockwise direction, making it the odd one out."
      };
    }

    case "Figure Matching":
    default: {
      // Find the exact matching figure.
      // Target figure is a complex star with a colored circle.
      // Options have minor alterations.
      const drawComplexFigure = (circlePos: "top" | "center" | "bottom" | "left", strokeColor = "#38bdf8") => {
        let cx = 100, cy = 100;
        if (circlePos === "top") { cy = 60; }
        else if (circlePos === "bottom") { cy = 140; }
        else if (circlePos === "left") { cx = 60; }

        return `
          <!-- Octagram Star -->
          <polygon points="100,40 115,85 160,85 125,110 140,155 100,130 60,155 75,110 40,85 85,85" fill="none" stroke="${strokeColor}" stroke-width="4" />
          <circle cx="${cx}" cy="${cy}" r="12" fill="#eab308" />
          <line x1="40" y1="40" x2="160" y2="160" stroke="#f43f5e" stroke-width="2" />
        `;
      };

      const mainSvg = wrapSvg(drawComplexFigure("top"));

      const options = [
        wrapSvg(drawComplexFigure("center")), // Wrong position
        wrapSvg(drawComplexFigure("top")),    // Correct MATCH! - Choice B
        wrapSvg(drawComplexFigure("bottom")), // Wrong position
        wrapSvg(drawComplexFigure("left"))    // Wrong position
      ];

      return {
        question: "Find the figure from the options which is exactly identical to the problem figure.",
        type: "Figure Matching",
        difficulty,
        questionSvg: mainSvg,
        options,
        correctAnswer: "B",
        explanation: "The problem figure has a yellow circle located near the top point of the star, and a diagonal red line running from top-left to bottom-right. Option B matches this layout perfectly."
      };
    }
  }
}
