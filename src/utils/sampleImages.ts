export interface TestScenario {
  id: string;
  name: string;
  category: 'valid' | 'spoof_screen' | 'spoof_indoor' | 'spoof_fake' | 'wrong_target';
  assignedTarget: string;
  expectedResult: 'valid' | 'reject';
  description: string;
  generateDataUrl: () => string;
}

export const TEST_SCENARIOS: TestScenario[] = [
  {
    id: 'sample-outdoor-leaf',
    name: 'Green Leaf Outside',
    category: 'valid',
    assignedTarget: 'green leaf',
    expectedResult: 'valid',
    description: 'Fresh green leaf on an outdoor tree in daylight.',
    generateDataUrl: () => generateCanvasImage('outdoor-leaf'),
  },
  {
    id: 'sample-outdoor-pinecone',
    name: 'Pinecone on Ground',
    category: 'valid',
    assignedTarget: 'pinecone',
    expectedResult: 'valid',
    description: 'Real pinecone on outdoor soil and pine needles.',
    generateDataUrl: () => generateCanvasImage('outdoor-pinecone'),
  },
  {
    id: 'sample-spoof-screen',
    name: 'Phone / Tablet Screen',
    category: 'spoof_screen',
    assignedTarget: 'green leaf',
    expectedResult: 'reject',
    description: 'Photo of a screen showing a picture of a leaf.',
    generateDataUrl: () => generateCanvasImage('spoof-screen'),
  },
  {
    id: 'sample-spoof-plastic',
    name: 'Plastic Fake Plant',
    category: 'spoof_fake',
    assignedTarget: 'green leaf',
    expectedResult: 'reject',
    description: 'Artificial plastic fake plant indoors.',
    generateDataUrl: () => generateCanvasImage('spoof-plastic'),
  },
];

function generateCanvasImage(type: string): string {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  if (type === 'outdoor-pinecone') {
    // Forest ground background
    const bgGrad = ctx.createLinearGradient(0, 0, 640, 480);
    bgGrad.addColorStop(0, '#3b2f21');
    bgGrad.addColorStop(0.5, '#4a3b2c');
    bgGrad.addColorStop(1, '#2c2217');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 640, 480);

    // Natural soil texture & scattered pine needles
    ctx.strokeStyle = '#8b5a2b';
    ctx.lineWidth = 2;
    for (let i = 0; i < 90; i++) {
      ctx.beginPath();
      const x = Math.random() * 640;
      const y = Math.random() * 480;
      ctx.moveTo(x, y);
      ctx.lineTo(x + (Math.random() - 0.5) * 45, y + (Math.random() - 0.5) * 35);
      ctx.stroke();
    }

    // Moss patches
    ctx.fillStyle = '#4d7c0f';
    for (let i = 0; i < 15; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * 640, Math.random() * 480, 20 + Math.random() * 30, 0, Math.PI * 2);
      ctx.globalAlpha = 0.35;
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // Pinecone body
    const cx = 320;
    const cy = 240;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(0.3);

    // Pinecone scales
    for (let row = -5; row <= 5; row++) {
      const rowY = row * 18;
      const rowW = (1 - Math.abs(row) / 7) * 90;
      for (let s = -rowW / 2; s <= rowW / 2; s += 22) {
        ctx.fillStyle = '#653a1a';
        ctx.beginPath();
        ctx.ellipse(s, rowY, 14, 9, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#43230e';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // Scale tip highlight
        ctx.fillStyle = '#9e6231';
        ctx.beginPath();
        ctx.arc(s, rowY - 2, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();

    // Outdoor sunlight beam
    const sunGrad = ctx.createRadialGradient(500, 50, 20, 320, 240, 400);
    sunGrad.addColorStop(0, 'rgba(255, 248, 220, 0.35)');
    sunGrad.addColorStop(1, 'rgba(255, 248, 220, 0)');
    ctx.fillStyle = sunGrad;
    ctx.fillRect(0, 0, 640, 480);
  } else if (type === 'outdoor-leaf') {
    // Outdoor nature foliage background
    const bgGrad = ctx.createLinearGradient(0, 0, 640, 480);
    bgGrad.addColorStop(0, '#14532d');
    bgGrad.addColorStop(0.5, '#166534');
    bgGrad.addColorStop(1, '#052e16');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 640, 480);

    // Natural outdoor twigs & branches
    ctx.strokeStyle = '#5c3a21';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(0, 380);
    ctx.quadraticCurveTo(240, 260, 450, 160);
    ctx.stroke();

    // Live leaf stem
    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(340, 210);
    ctx.lineTo(390, 230);
    ctx.stroke();

    // Prominent fresh wild green leaf with sunlight glow
    ctx.save();
    ctx.translate(390, 230);
    ctx.rotate(0.35);

    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(80, -90, 190, -70, 230, 0);
    ctx.bezierCurveTo(190, 70, 80, 90, 0, 0);
    ctx.fill();

    // Leaf main vein & secondary veins
    ctx.strokeStyle = '#86efac';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(220, 0);
    ctx.stroke();

    ctx.lineWidth = 1.5;
    for (let v = 30; v < 200; v += 25) {
      ctx.beginPath();
      ctx.moveTo(v, 0);
      ctx.lineTo(v + 20, -25);
      ctx.moveTo(v, 0);
      ctx.lineTo(v + 20, 25);
      ctx.stroke();
    }

    // Natural outdoor water droplet on leaf
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.arc(130, -18, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Natural outdoor sky glow in corner
    const skyGlow = ctx.createRadialGradient(80, 60, 10, 80, 60, 260);
    skyGlow.addColorStop(0, 'rgba(219, 234, 254, 0.45)');
    skyGlow.addColorStop(1, 'rgba(219, 234, 254, 0)');
    ctx.fillStyle = skyGlow;
    ctx.fillRect(0, 0, 640, 480);
  } else if (type === 'outdoor-bark') {
    // Tree bark texture
    const barkGrad = ctx.createLinearGradient(0, 0, 640, 0);
    barkGrad.addColorStop(0, '#3e2723');
    barkGrad.addColorStop(0.3, '#4e342e');
    barkGrad.addColorStop(0.7, '#2e1c14');
    barkGrad.addColorStop(1, '#3e2723');
    ctx.fillStyle = barkGrad;
    ctx.fillRect(0, 0, 640, 480);

    // Deep vertical bark fissures & ridges
    for (let x = 30; x < 610; x += 18) {
      ctx.strokeStyle = Math.random() > 0.5 ? '#1a0f0a' : '#27170e';
      ctx.lineWidth = 4 + Math.random() * 6;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      let currX = x;
      for (let y = 30; y <= 480; y += 40) {
        currX += (Math.random() - 0.5) * 16;
        ctx.lineTo(currX, y);
      }
      ctx.stroke();

      // Ridge highlight in outdoor light
      ctx.strokeStyle = '#6d4c41';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 5, 0);
      ctx.lineTo(x + 5, 480);
      ctx.stroke();
    }

    // Lichen patches (real outdoor indicator)
    ctx.fillStyle = '#84cc16';
    for (let i = 0; i < 20; i++) {
      ctx.globalAlpha = 0.45;
      ctx.beginPath();
      ctx.arc(Math.random() * 640, Math.random() * 480, 12 + Math.random() * 25, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;
  } else if (type === 'outdoor-sky') {
    // Genuine outdoor sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, 480);
    sky.addColorStop(0, '#0284c7');
    sky.addColorStop(0.6, '#38bdf8');
    sky.addColorStop(1, '#bae6fd');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 640, 480);

    // Natural outdoor cumulus cloud shapes
    ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
    const drawCloud = (cx: number, cy: number, scale: number) => {
      ctx.beginPath();
      ctx.arc(cx, cy, 35 * scale, 0, Math.PI * 2);
      ctx.arc(cx + 35 * scale, cy - 10 * scale, 45 * scale, 0, Math.PI * 2);
      ctx.arc(cx + 80 * scale, cy, 35 * scale, 0, Math.PI * 2);
      ctx.arc(cx + 40 * scale, cy + 15 * scale, 30 * scale, 0, Math.PI * 2);
      ctx.fill();
    };
    drawCloud(180, 160, 1.3);
    drawCloud(420, 240, 1.1);
    drawCloud(90, 310, 0.8);

    // Distant outdoor treetop silhouette at very bottom edge
    ctx.fillStyle = '#14532d';
    ctx.beginPath();
    ctx.moveTo(0, 480);
    for (let x = 0; x <= 640; x += 30) {
      ctx.lineTo(x, 440 + Math.sin(x * 0.05) * 15);
    }
    ctx.lineTo(640, 480);
    ctx.closePath();
    ctx.fill();
  } else if (type === 'spoof-screen') {
    // Anti-spoof test: Photo of iPad/Tablet displaying a picture of nature
    // Desk background
    ctx.fillStyle = '#d4d4d8';
    ctx.fillRect(0, 0, 640, 480);

    // iPad / Tablet metallic body
    ctx.fillStyle = '#18181b';
    ctx.roundRect(80, 40, 480, 380, 24);
    ctx.fill();

    // iPad Screen Glass Bezel
    ctx.fillStyle = '#09090b';
    ctx.fillRect(100, 60, 440, 340);

    // Front Camera punch hole
    ctx.fillStyle = '#27272a';
    ctx.beginPath();
    ctx.arc(320, 50, 4, 0, Math.PI * 2);
    ctx.fill();

    // Digital Wallpaper on Screen
    ctx.fillStyle = '#15803d';
    ctx.fillRect(110, 70, 420, 320);

    // Digital Leaf picture inside screen
    ctx.fillStyle = '#4ade80';
    ctx.beginPath();
    ctx.ellipse(320, 220, 90, 50, 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Clear digital screen scanlines / pixel grid simulation
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let y = 70; y < 390; y += 4) {
      ctx.beginPath();
      ctx.moveTo(110, y);
      ctx.lineTo(530, y);
      ctx.stroke();
    }

    // Glass glare reflection across screen
    const glare = ctx.createLinearGradient(100, 60, 300, 300);
    glare.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
    glare.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)');
    glare.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = glare;
    ctx.beginPath();
    ctx.moveTo(110, 70);
    ctx.lineTo(340, 70);
    ctx.lineTo(110, 300);
    ctx.closePath();
    ctx.fill();

    // iPad Home bar indicator
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(290, 380, 60, 4);
  } else if (type === 'spoof-indoor') {
    // Indoor houseplant in living room / apartment
    // Indoor wallpaper wall
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, 0, 640, 300);

    // Indoor wooden shelf/table
    const wood = ctx.createLinearGradient(0, 300, 0, 480);
    wood.addColorStop(0, '#b45309');
    wood.addColorStop(1, '#78350f');
    ctx.fillStyle = wood;
    ctx.fillRect(0, 300, 640, 180);

    // Indoor accessories: ceramic coffee mug, book
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(80, 290, 70, 60); // Mug
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(470, 320, 110, 25); // Book

    // Ceramic white flower pot
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(270, 240);
    ctx.lineTo(370, 240);
    ctx.lineTo(355, 340);
    ctx.lineTo(285, 340);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.stroke();

    // Indoor snake plant leaves (indoor houseplant)
    ctx.fillStyle = '#16a34a';
    const drawIndoorLeaf = (x: number, h: number, angle: number) => {
      ctx.save();
      ctx.translate(x, 240);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(-10, 0);
      ctx.lineTo(-6, -h);
      ctx.lineTo(0, -h - 15);
      ctx.lineTo(6, -h);
      ctx.lineTo(10, 0);
      ctx.closePath();
      ctx.fill();
      // yellow border of snake plant
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();
    };
    drawIndoorLeaf(300, 110, -0.15);
    drawIndoorLeaf(320, 140, 0.05);
    drawIndoorLeaf(340, 115, 0.18);
  } else if (type === 'spoof-plastic') {
    // Fake plastic plant on white office desk
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(0, 0, 640, 480);

    // Office computer mouse & keyboard corner
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(60, 360, 90, 60);

    // Tiny faux geometric plastic pot
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.moveTo(280, 280);
    ctx.lineTo(360, 280);
    ctx.lineTo(350, 360);
    ctx.lineTo(290, 360);
    ctx.closePath();
    ctx.fill();

    // Plastic succulent with unnatural shiny gloss and molding line
    ctx.fillStyle = '#22c55e';
    for (let r = 0; r < 8; r++) {
      const angle = (r / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.ellipse(320 + Math.cos(angle) * 25, 270 + Math.sin(angle) * 15, 18, 10, angle, 0, Math.PI * 2);
      ctx.fill();
      // Plastic gloss highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(320 + Math.cos(angle) * 25, 270 + Math.sin(angle) * 15, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#22c55e';
    }
  } else if (type === 'wrong-target') {
    // Asphalt road & gravel (Wrong target when quest is sky and clouds)
    ctx.fillStyle = '#374151';
    ctx.fillRect(0, 0, 640, 480);

    // Asphalt pebbles & cracked line
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(100, 0);
    ctx.lineTo(150, 200);
    ctx.lineTo(220, 480);
    ctx.stroke();

    for (let i = 0; i < 200; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#6b7280' : '#4b5563';
      ctx.beginPath();
      ctx.arc(Math.random() * 640, Math.random() * 480, 1 + Math.random() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  return canvas.toDataURL('image/jpeg', 0.85);
}
