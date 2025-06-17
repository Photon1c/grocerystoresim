import * as THREE from 'three';
import { createGroceryMap } from './assets/maps/grocery/grocerymap.js';
import { addWorkerAgents } from './assets/agents/worker_agents.js';
import { createCustomerAgents } from './assets/agents/customer_agents.js';
import { updateAllAgents } from './assets/logic/agentController.js';
import { getRandomItems } from './assets/logic/inventory.js';
import { initCustomerStats, updateCustomerStats, renderStatsOverlay, enableCustomerClickStats, updateStatsCardRealtime } from './assets/gui/stats.js';
import { INSTRUCTIONS_HTML } from './assets/gui/instructions.js';

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0f0f0);

// Camera
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 40, 40); // Above and behind, centered
camera.lookAt(0, 0, 0);
let cameraRotation = { x: -Math.atan(40/40), y: 0 };

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 7.5);
scene.add(light);

// Load grocery map
createGroceryMap(scene);
const workers = addWorkerAgents(scene, 3);
const customers = createCustomerAgents(scene, 8);

// Initialize stats for each customer with a random shopping list
customers.forEach((agent, i) => {
  const items = getRandomItems(2 + Math.floor(Math.random() * 6)); // 2–7 items
  initCustomerStats(agent, i, items);
});

// Enable click-to-show-stats logic
enableCustomerClickStats(customers, camera, renderer);

// --- Navigation Controls ---
const keys = {};
window.addEventListener('keydown', (e) => { keys[e.code] = true; });
window.addEventListener('keyup', (e) => { keys[e.code] = false; });

function updateCameraControls(delta) {
  // Movement
  let speed = keys['ShiftLeft'] || keys['ShiftRight'] ? 12 : 4; // units per second
  let moveX = 0, moveY = 0, moveZ = 0;
  if (keys['KeyW']) moveZ -= 1;
  if (keys['KeyS']) moveZ += 1;
  if (keys['KeyA']) moveX -= 1;
  if (keys['KeyD']) moveX += 1;
  if (keys['KeyQ']) moveY -= 1;
  if (keys['KeyE']) moveY += 1;

  // Normalize movement
  const len = Math.hypot(moveX, moveY, moveZ);
  if (len > 0) {
    moveX /= len; moveY /= len; moveZ /= len;
  }

  // Camera rotation (arrow keys)
  const lookSpeed = 1.5 * delta;
  if (keys['ArrowLeft']) cameraRotation.y += lookSpeed;
  if (keys['ArrowRight']) cameraRotation.y -= lookSpeed;
  if (keys['ArrowUp']) cameraRotation.x += lookSpeed;
  if (keys['ArrowDown']) cameraRotation.x -= lookSpeed;
  cameraRotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, cameraRotation.x));

  // Apply rotation
  camera.rotation.order = 'YXZ';
  camera.rotation.y = cameraRotation.y;
  camera.rotation.x = cameraRotation.x;

  // Move in the direction the camera is facing
  const forward = new THREE.Vector3(0, 0, -1).applyEuler(camera.rotation);
  const right = new THREE.Vector3(1, 0, 0).applyEuler(camera.rotation);
  camera.position.addScaledVector(forward, moveZ * speed * delta);
  camera.position.addScaledVector(right, moveX * speed * delta);
  camera.position.y += moveY * speed * delta;
}

let lastTime = performance.now();
let frameCount = 0;
let fps = 0;
let lastFpsUpdate = performance.now();

// --- MB Stats Panel ---
let mbStatsDiv = null;
function updateMbStatsPanel(fps, agentCount) {
  if (!mbStatsDiv) {
    mbStatsDiv = document.createElement('div');
    mbStatsDiv.style.position = 'fixed';
    mbStatsDiv.style.left = '10px';
    mbStatsDiv.style.bottom = '10px';
    mbStatsDiv.style.background = 'rgba(30,30,40,0.92)';
    mbStatsDiv.style.color = '#fff';
    mbStatsDiv.style.padding = '10px 18px';
    mbStatsDiv.style.fontFamily = 'monospace';
    mbStatsDiv.style.fontSize = '1.1em';
    mbStatsDiv.style.borderRadius = '10px';
    mbStatsDiv.style.boxShadow = '0 2px 12px rgba(0,0,0,0.18)';
    mbStatsDiv.style.zIndex = 1001;
    document.body.appendChild(mbStatsDiv);
  }
  let mem = '';
  if (performance && performance.memory) {
    const used = performance.memory.usedJSHeapSize / 1048576;
    const total = performance.memory.totalJSHeapSize / 1048576;
    mem = ` | Mem: ${used.toFixed(1)} / ${total.toFixed(1)} MB`;
  }
  mbStatsDiv.innerHTML = `FPS: <b>${fps}</b> | Agents: <b>${agentCount}</b>${mem}`;
}

function animate() {
  requestAnimationFrame(animate);
  const now = performance.now();
  const delta = (now - lastTime) / 1000;
  lastTime = now;
  frameCount++;
  if (now - lastFpsUpdate > 1000) {
    fps = frameCount;
    frameCount = 0;
    lastFpsUpdate = now;
    console.log(`FPS: ${fps} | Active: ${customers.length}`);
    updateMbStatsPanel(fps, customers.length);
  }
  updateCameraControls(delta);
  updateAllAgents({ customers, workers }, delta, scene, now / 1000);
  customers.forEach((agent, i) => {
    updateCustomerStats(i, delta, agent.mood);
  });
  renderStatsOverlay(customers);
  updateStatsCardRealtime();
  renderer.render(scene, camera);
}
animate();

// Session logging placeholder
function saveSessionLog() {
  // Calculate stats
  const agentsServed = customers.length;
  const avgTime = (customers.reduce((sum, a, i) => sum + (window.getCustomerStats ? getCustomerStats(i).timeInStore : 0), 0) / customers.length) || 0;
  const avgMood = (customers.reduce((sum, a, i) => sum + (window.getCustomerStats ? getCustomerStats(i).mood : 0), 0) / customers.length) || 0;
  const timestamp = new Date().toISOString();
  const log = {
    agents_served: agentsServed,
    average_time: `${Math.floor(avgTime/60)}m ${Math.round(avgTime%60)}s`,
    avg_mood: `${Math.round(avgMood)}%`,
    timestamp
  };
  // TODO: Save log to /logs/session_TIMESTAMP.json (requires backend or download)
  console.log('Session log:', log);
}
window.saveSessionLog = saveSessionLog;

// --- Title and Info Banner ---
function showTitleAndInfo() {
  // Title
  const titleDiv = document.createElement('div');
  titleDiv.id = 'gsim-title';
  titleDiv.style.position = 'fixed';
  titleDiv.style.top = '18px';
  titleDiv.style.left = '50%';
  titleDiv.style.transform = 'translateX(-50%)';
  titleDiv.style.fontFamily = 'system-ui,sans-serif';
  titleDiv.style.fontSize = '2.1em';
  titleDiv.style.fontWeight = 'bold';
  titleDiv.style.letterSpacing = '0.04em';
  titleDiv.style.color = '#222';
  titleDiv.style.background = 'rgba(255,255,255,0.92)';
  titleDiv.style.padding = '10px 32px 10px 24px';
  titleDiv.style.borderRadius = '16px';
  titleDiv.style.boxShadow = '0 2px 16px rgba(0,0,0,0.10)';
  titleDiv.style.zIndex = 3000;
  titleDiv.style.display = 'flex';
  titleDiv.style.alignItems = 'center';
  titleDiv.innerHTML = `Grocery Store Sim <span id="gsim-info-blink" style="margin-left:24px;font-size:0.6em;font-weight:normal;color:#1976d2;animation: gsim-blink 1s steps(2, start) infinite;cursor:pointer;">press i for info</span>`;
  document.body.appendChild(titleDiv);
  // Blinking animation
  const style = document.createElement('style');
  style.innerHTML = `@keyframes gsim-blink { 0% { opacity: 1; } 50% { opacity: 0.2; } 100% { opacity: 1; } }`;
  document.head.appendChild(style);
  // Hide after 10 seconds
  setTimeout(() => { titleDiv.style.display = 'none'; }, 10000);
}
showTitleAndInfo();

// --- Instructions Modal ---
let infoModal = null;
let infoVisible = false;
function showInfoModal() {
  if (!infoModal) {
    infoModal = document.createElement('div');
    infoModal.id = 'gsim-info-modal';
    infoModal.style.position = 'fixed';
    infoModal.style.top = '50%';
    infoModal.style.left = '50%';
    infoModal.style.transform = 'translate(-50%,-50%)';
    infoModal.style.background = 'rgba(255,255,255,0.98)';
    infoModal.style.color = '#222';
    infoModal.style.padding = '32px 36px 28px 36px';
    infoModal.style.borderRadius = '18px';
    infoModal.style.boxShadow = '0 8px 48px rgba(0,0,0,0.18)';
    infoModal.style.zIndex = 4000;
    infoModal.style.maxWidth = '90vw';
    infoModal.style.maxHeight = '80vh';
    infoModal.style.overflowY = 'auto';
    infoModal.innerHTML = INSTRUCTIONS_HTML + '<div style="text-align:center;margin-top:18px;"><button id="gsim-info-close" style="padding:8px 24px;font-size:1em;border-radius:8px;border:none;background:#1976d2;color:#fff;cursor:pointer;">Close</button></div>';
    document.body.appendChild(infoModal);
    document.getElementById('gsim-info-close').onclick = () => { infoModal.style.display = 'none'; infoVisible = false; };
  }
  infoModal.style.display = 'block';
  infoVisible = true;
}
function hideInfoModal() {
  if (infoModal) infoModal.style.display = 'none';
  infoVisible = false;
}
window.addEventListener('keydown', (e) => {
  if (e.key === 'i' || e.key === 'I') {
    if (infoVisible) {
      hideInfoModal();
    } else {
      showInfoModal();
    }
  }
});
// Also allow clicking the blinking text to show info
setTimeout(() => {
  const blink = document.getElementById('gsim-info-blink');
  if (blink) blink.onclick = showInfoModal;
}, 100);
