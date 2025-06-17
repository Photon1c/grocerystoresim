import * as THREE from 'three';
import { CHECKOUT_POSITIONS } from '../maps/grocery/grocerymap.js';

const WORKER_HOVER_RADIUS = 1.2;
const WORKER_HOVER_SPEED = 0.7;

export function addWorkerAgents(scene, count = 3) {
  const workers = [];
  for (let i = 0; i < count; i++) {
    const worker = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0x2196f3 }) // blue
    );
    // Place near checkout counters
    const pos = CHECKOUT_POSITIONS[i % CHECKOUT_POSITIONS.length];
    worker.userData.baseX = pos.x + 1.5;
    worker.userData.baseZ = pos.z + 1.5;
    worker.userData.baseY = 0.5;
    worker.position.set(worker.userData.baseX, worker.userData.baseY, worker.userData.baseZ);
    worker.userData.type = 'worker';
    worker.userData.hoverPhase = Math.random() * Math.PI * 2;
    scene.add(worker);
    workers.push(worker);
  }
  return workers;
}

export function updateWorkerAgents(workers, delta, time) {
  for (const worker of workers) {
    // Animate in a small circle
    const phase = worker.userData.hoverPhase + time * WORKER_HOVER_SPEED;
    worker.position.x = worker.userData.baseX + Math.cos(phase) * WORKER_HOVER_RADIUS * 0.5;
    worker.position.z = worker.userData.baseZ + Math.sin(phase) * WORKER_HOVER_RADIUS * 0.5;
  }
} 