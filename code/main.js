const canvas = document.querySelector("#game");
const context = canvas.getContext("2d");
const status = document.querySelector("#status");

const WIDTH = 960;
const HEIGHT = 600;
const GRAVITY_INTERVAL = 6;
const GRAVITY_STRENGTH = 1150;
const MOVE_SPEED = 280;
const JUMP_SPEED = 570;
const ROBOT_SIZE = 42;
const directions = [
  { x: 0, y: 1, name: "down" },
  { x: -1, y: 0, name: "left" },
  { x: 0, y: -1, name: "up" },
  { x: 1, y: 0, name: "right" },
];
const keys = new Set();
const images = Object.fromEntries(
  ["robot", "sprout", "seed", "gate"].map((name) => {
    const image = new Image();
    image.src = `./images/${name}.svg`;
    return [name, image];
  }),
);
const seeds = [
  { x: 170, y: 145, collected: false },
  { x: 365, y: 470, collected: false },
  { x: 605, y: 170, collected: false },
  { x: 790, y: 390, collected: false },
  { x: 470, y: 305, collected: false },
];
const plants = [
  { x: 72, y: 510, size: 56 },
  { x: 275, y: 84, size: 42 },
  { x: 480, y: 520, size: 58 },
  { x: 725, y: 92, size: 48 },
  { x: 882, y: 258, size: 54 },
  { x: 85, y: 260, size: 42 },
  { x: 857, y: 510, size: 58 },
];

const robot = {
  x: WIDTH / 2,
  y: HEIGHT - 72,
  vx: 0,
  vy: 0,
  grounded: false,
};

let gravityIndex = 0;
let gravityTimer = 0;
let lastFrame = 0;
let won = false;

function resizeCanvas() {
  const bounds = canvas.getBoundingClientRect();
  const pixelRatio = window.devicePixelRatio || 1;
  canvas.width = Math.round(bounds.width * pixelRatio);
  canvas.height = Math.round(bounds.height * pixelRatio);
  context.setTransform(
    canvas.width / WIDTH,
    0,
    0,
    canvas.height / HEIGHT,
    0,
    0,
  );
}

function resetGame() {
  robot.x = WIDTH / 2;
  robot.y = HEIGHT - 72;
  robot.vx = 0;
  robot.vy = 0;
  robot.grounded = false;
  gravityIndex = 0;
  gravityTimer = 0;
  won = false;
  seeds.forEach((seed) => {
    seed.collected = false;
  });
  status.textContent = "Find the glowing seeds.";
}

function collectedCount() {
  return seeds.filter((seed) => seed.collected).length;
}

function jump() {
  if (!robot.grounded || won) return;
  const gravity = directions[gravityIndex];
  robot.vx = -gravity.x * JUMP_SPEED;
  robot.vy = -gravity.y * JUMP_SPEED;
  robot.grounded = false;
}

function update(delta) {
  if (won) return;

  gravityTimer += delta;
  if (gravityTimer >= GRAVITY_INTERVAL) {
    gravityTimer -= GRAVITY_INTERVAL;
    gravityIndex = (gravityIndex + 1) % directions.length;
    robot.grounded = false;
  }

  const gravity = directions[gravityIndex];
  const horizontal = Number(keys.has("ArrowRight") || keys.has("d")) -
    Number(keys.has("ArrowLeft") || keys.has("a"));
  const vertical = Number(keys.has("ArrowDown") || keys.has("s")) -
    Number(keys.has("ArrowUp") || keys.has("w"));
  const moveX = gravity.y !== 0 ? horizontal : 0;
  const moveY = gravity.x !== 0 ? vertical : 0;

  if (robot.grounded) {
    robot.vx = moveX * MOVE_SPEED;
    robot.vy = moveY * MOVE_SPEED;
  } else {
    robot.vx += gravity.x * GRAVITY_STRENGTH * delta;
    robot.vy += gravity.y * GRAVITY_STRENGTH * delta;
    robot.vx += moveX * MOVE_SPEED * delta * 2;
    robot.vy += moveY * MOVE_SPEED * delta * 2;
  }

  robot.x += robot.vx * delta;
  robot.y += robot.vy * delta;
  robot.grounded = false;

  const half = ROBOT_SIZE / 2;
  if (robot.x < half) {
    robot.x = half;
    robot.grounded = gravity.x < 0;
    if (robot.vx < 0) robot.vx = 0;
  } else if (robot.x > WIDTH - half) {
    robot.x = WIDTH - half;
    robot.grounded = gravity.x > 0;
    if (robot.vx > 0) robot.vx = 0;
  }
  if (robot.y < half) {
    robot.y = half;
    robot.grounded = gravity.y < 0;
    if (robot.vy < 0) robot.vy = 0;
  } else if (robot.y > HEIGHT - half) {
    robot.y = HEIGHT - half;
    robot.grounded = gravity.y > 0;
    if (robot.vy > 0) robot.vy = 0;
  }

  for (const seed of seeds) {
    if (seed.collected) continue;
    if (Math.hypot(robot.x - seed.x, robot.y - seed.y) < 34) {
      seed.collected = true;
      status.textContent = `${collectedCount()} of ${seeds.length} seeds found.`;
    }
  }

  const exitReached = robot.x > WIDTH - 86 && robot.y > HEIGHT / 2 - 68 &&
    robot.y < HEIGHT / 2 + 68;
  if (exitReached && collectedCount() === seeds.length) {
    won = true;
    status.textContent = "Garden restored! Press R to play again.";
  } else if (exitReached) {
    status.textContent = `The garden gate needs ${seeds.length - collectedCount()} more seeds.`;
  } else {
    status.textContent = `${collectedCount()} of ${seeds.length} seeds · Gravity ${gravity.name}`;
  }
}

function drawBackground() {
  const gradient = context.createLinearGradient(0, 0, WIDTH, HEIGHT);
  gradient.addColorStop(0, "#294437");
  gradient.addColorStop(1, "#1c3028");
  context.fillStyle = gradient;
  context.fillRect(0, 0, WIDTH, HEIGHT);

  context.save();
  context.strokeStyle = "#9bb18b12";
  context.lineWidth = 1;
  for (let x = 30; x < WIDTH; x += 48) {
    for (let y = 28; y < HEIGHT; y += 48) {
      context.beginPath();
      context.arc(x, y, 1.5, 0, Math.PI * 2);
      context.stroke();
    }
  }
  context.restore();

  for (const plant of plants) {
    if (images.sprout.complete && images.sprout.naturalWidth) {
      context.globalAlpha = 0.74;
      context.drawImage(
        images.sprout,
        plant.x - plant.size / 2,
        plant.y - plant.size / 2,
        plant.size,
        plant.size,
      );
      context.globalAlpha = 1;
    }
  }
}

function drawGate() {
  const ready = collectedCount() === seeds.length;
  if (images.gate.complete && images.gate.naturalWidth) {
    context.globalAlpha = ready ? 1 : 0.52;
    context.drawImage(images.gate, WIDTH - 102, HEIGHT / 2 - 54, 72, 86);
    context.globalAlpha = 1;
  }
  if (!ready) {
    context.fillStyle = "#f2f2d9";
    context.font = "14px ui-rounded, sans-serif";
    context.textAlign = "center";
    context.fillText(`${collectedCount()}/${seeds.length}`, WIDTH - 66, HEIGHT / 2 + 48);
  }
}

function drawSeeds(time) {
  for (const seed of seeds) {
    if (seed.collected) continue;
    const bob = Math.sin(time / 300 + seed.x) * 5;
    if (images.seed.complete && images.seed.naturalWidth) {
      context.drawImage(images.seed, seed.x - 22, seed.y - 22 + bob, 44, 44);
    } else {
      context.fillStyle = "#f4d66f";
      context.beginPath();
      context.arc(seed.x, seed.y + bob, 12, 0, Math.PI * 2);
      context.fill();
    }
  }
}

function drawRobot() {
  const angle = [0, Math.PI / 2, Math.PI, -Math.PI / 2][gravityIndex];
  context.save();
  context.translate(robot.x, robot.y);
  context.rotate(angle);
  if (images.robot.complete && images.robot.naturalWidth) {
    context.drawImage(images.robot, -ROBOT_SIZE / 2, -ROBOT_SIZE / 2, ROBOT_SIZE, ROBOT_SIZE);
  } else {
    context.fillStyle = "#e2dfc2";
    context.fillRect(-16, -16, 32, 32);
  }
  context.restore();
}

function drawGravityIndicator() {
  const gravity = directions[gravityIndex];
  const x = WIDTH / 2;
  const y = 30;
  context.save();
  context.translate(x, y);
  context.rotate(Math.atan2(gravity.y, gravity.x));
  context.fillStyle = "#f1d88a";
  context.beginPath();
  context.moveTo(12, 0);
  context.lineTo(-7, -7);
  context.lineTo(-7, 7);
  context.closePath();
  context.fill();
  context.restore();
  context.fillStyle = "#d4dfcb";
  context.font = "13px ui-rounded, sans-serif";
  context.textAlign = "left";
  context.fillText(`Gravity ${gravity.name} · next shift in ${Math.ceil(GRAVITY_INTERVAL - gravityTimer)}s`, x + 24, y + 5);
}

function draw(time) {
  drawBackground();
  drawGate();
  drawSeeds(time);
  drawRobot();
  drawGravityIndicator();
  if (won) {
    context.fillStyle = "#101b15a8";
    context.fillRect(0, 0, WIDTH, HEIGHT);
    context.fillStyle = "#f1d88a";
    context.font = "bold 42px ui-rounded, sans-serif";
    context.textAlign = "center";
    context.fillText("The garden is thriving!", WIDTH / 2, HEIGHT / 2 - 8);
    context.fillStyle = "#f2f2d9";
    context.font = "18px ui-rounded, sans-serif";
    context.fillText("Press R to explore again", WIDTH / 2, HEIGHT / 2 + 30);
  }
}

function frame(time) {
  const delta = Math.min((time - lastFrame) / 1000 || 0, 0.033);
  lastFrame = time;
  update(delta);
  draw(time);
  requestAnimationFrame(frame);
}

window.addEventListener("resize", resizeCanvas);
window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) {
    event.preventDefault();
  }
  if (key === "r") resetGame();
  if ((key === " " || key === "arrowup" || key === "w") && !event.repeat) jump();
  keys.add(key);
});
window.addEventListener("keyup", (event) => keys.delete(event.key.toLowerCase()));

resizeCanvas();
requestAnimationFrame(frame);
