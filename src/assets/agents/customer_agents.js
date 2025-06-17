import * as THREE from 'three';
import { ENTRANCE_POS, CHECKOUT_POSITIONS, EXIT_POS, BASKET_POSITIONS, OBSTACLES, BASKET_MESHES } from '../maps/grocery/grocerymap.js';
import { checkCollision } from '../logic/pathfinding.js';
import { getRandomItems } from '../logic/inventory.js';

// Track queues for each checkout
const checkoutQueues = CHECKOUT_POSITIONS.map(() => []);
const checkoutBusy = CHECKOUT_POSITIONS.map(() => false);
const QUEUE_SPACING = 1.2;
const CHECKOUT_TIME = 2.5; // seconds per customer

export function createCustomerAgents(scene, count = 8) {
  const customers = [];
  for (let i = 0; i < count; i++) {
    // Assign shopping list with aisle info
    const shoppingList = getRandomItems(2 + Math.floor(Math.random() * 6));
    // Generate waypoints: basket, entry, then one per item (spread across aisles), then checkout, exit
    const basketPosRaw = BASKET_POSITIONS[i % BASKET_POSITIONS.length];
    const basketWaypoint = { x: basketPosRaw.x, y: 0.5, z: basketPosRaw.z };
    const entryWaypoint = { x: 0, y: 0.5, z: 8 };
    // For each item, create a waypoint in its aisle
    const aisleWaypoints = shoppingList.map((item, idx) => {
      // Spread z from -8 to 8, x from -10 to 10 based on aisle
      const aisleIdx = item.aisle - 1;
      const x = -14 + 6 + aisleIdx * 4; // match shelf x in grocerymap.js
      const z = -8 + (16 * (idx / (shoppingList.length - 1 || 1))); // spread along z
      return { x, y: 0.5, z };
    });
    const chosenCheckout = Math.floor(Math.random() * CHECKOUT_POSITIONS.length);
    const waypoints = [
      basketWaypoint,
      entryWaypoint,
      ...aisleWaypoints,
      { ...CHECKOUT_POSITIONS[chosenCheckout] },
      { ...EXIT_POS, z: ENTRANCE_POS.z + 4 }
    ];
    const customer = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0x4caf50 })
    );
    scene.add(customer);
    customer.position.set(ENTRANCE_POS.x, ENTRANCE_POS.y, ENTRANCE_POS.z + 4 + Math.random() * 2);
    customer.userData.type = 'customer';
    customers.push({
      mesh: customer,
      basket: null,
      basketPickedUp: false,
      basketAttached: false,
      waypoints,
      current: 0,
      state: 'get_basket',
      checkout: chosenCheckout,
      queueIndex: -1,
      checkoutTimer: 0,
      stuckTimer: 0,
      lastWaypointIndex: null,
      mood: 100,
      patience: 0,
      speed: 1.5 + Math.random() * 1.0,
      bounciness: 0.15 + Math.random() * 0.1,
      nudgeCount: 0,
      browsingTimer: 0,
      browsingAt: -1,
      shoppingList,
      itemsCollected: [],
      clueLevel: 0 // increases as time spent at aisle
    });
  }
  return customers;
}

function randomAisleWaypoints() {
  // Generate 6–10 random (x, z) points within the store's walkable area
  // Avoid entrance (z > 12) and checkout (z > 10)
  const waypoints = [];
  const count = 6 + Math.floor(Math.random() * 5); // 6–10
  for (let i = 0; i < count; i++) {
    let x, z;
    let tries = 0;
    do {
      x = -14 + Math.random() * 28; // Store width: -14 to 14 (leave margin from walls)
      z = -12 + Math.random() * 22; // Store depth: -12 to 10
      tries++;
    } while ((z > 10 || z > 12) && tries < 10); // Avoid entrance/checkout
    waypoints.push({ x, y: 0.5, z });
  }
  return waypoints;
}

export function updateCustomerAgents(customers, delta, scene) {
  const speed = 2; // units per second
  // 1. Build queues for each checkout
  for (let i = 0; i < checkoutQueues.length; i++) checkoutQueues[i] = [];
  for (const agent of customers) {
    if (agent.state === 'queueing' || agent.state === 'checking_out') {
      checkoutQueues[agent.checkout].push(agent);
    }
  }
  // 2. Update each customer
  for (const agent of customers) {
    if (agent.current >= agent.waypoints.length) {
      // Infinite loop: reset agent to entrance and restart journey
      agent.mesh.position.set(ENTRANCE_POS.x, ENTRANCE_POS.y, ENTRANCE_POS.z + 4 + Math.random() * 2);
      agent.state = 'get_basket';
      agent.basketPickedUp = false;
      agent.basketAttached = false;
      agent.basket = null;
      // Assign new waypoints for a new journey
      const basketPosRaw = BASKET_POSITIONS[Math.floor(Math.random() * BASKET_POSITIONS.length)];
      const basketWaypoint = { x: basketPosRaw.x, y: 0.5, z: basketPosRaw.z };
      const chosenCheckout = Math.floor(Math.random() * CHECKOUT_POSITIONS.length);
      agent.waypoints = [
        basketWaypoint,
        ...randomAisleWaypoints(),
        { ...CHECKOUT_POSITIONS[chosenCheckout] },
        { ...EXIT_POS, z: ENTRANCE_POS.z + 4 }
      ];
      agent.current = 0;
      agent.stuckTimer = 0;
      agent.mood = 100;
      agent.patience = 0;
      agent.speed = 1.5 + Math.random() * 1.0;
      agent.bounciness = 0.15 + Math.random() * 0.1;
      agent.nudgeCount = 0;
      agent.browsingTimer = 0;
      agent.browsingAt = -1;
      continue;
    }
    const mesh = agent.mesh;
    let basket = agent.basket;
    const target = agent.waypoints[agent.current];
    // Browsing state: if at an aisle waypoint, pause for 1–2 seconds
    // Aisle waypoints are from index 1 to waypoints.length-3
    const isAisle = agent.current > 0 && agent.current < agent.waypoints.length - 2;
    const isCheckout = agent.current === agent.waypoints.length - 2;
    const isExit = agent.current === agent.waypoints.length - 1;
    if (isAisle) {
      const dist = Math.hypot(mesh.position.x - target.x, mesh.position.z - target.z);
      if (dist < 0.1) {
        if (agent.browsingAt !== agent.current) {
          agent.browsingAt = agent.current;
          agent.browsingTimer = 1 + Math.random();
          agent.clueLevel = 0;
        }
        agent.browsingTimer -= delta;
        agent.clueLevel += delta; // clue increases with time
        // Chance to find item increases with clueLevel
        const clueChance = Math.min(1, 0.3 + agent.clueLevel * 0.5); // 30% + 50% per second
        if (agent.itemsCollected.length < agent.shoppingList.length && Math.random() < clueChance * delta) {
          const nextItem = agent.shoppingList[agent.itemsCollected.length];
          agent.itemsCollected.push(nextItem);
        }
        if (agent.browsingTimer > 0) {
          continue;
        } else {
          agent.browsingAt = -1;
          agent.browsingTimer = 0;
          if (agent.itemsCollected.length >= agent.shoppingList.length) {
            agent.current = agent.waypoints.length - 2;
            continue;
          }
          agent.current++;
          continue;
        }
      }
    }
    // Pause at checkout for 1 second (when entering)
    if (isCheckout) {
      const dist = Math.hypot(mesh.position.x - target.x, mesh.position.z - target.z);
      if (dist < 0.1) {
        if (agent.browsingAt !== agent.current) {
          agent.browsingAt = agent.current;
          agent.browsingTimer = 1; // 1 second
        }
        agent.browsingTimer -= delta;
        if (agent.browsingTimer > 0) {
          continue; // Pause at checkout
        } else {
          agent.browsingAt = -1;
          agent.browsingTimer = 0;
          agent.current++;
          continue;
        }
      }
    }
    // Pause at exit for 3 seconds (when leaving)
    if (isExit) {
      const dist = Math.hypot(mesh.position.x - target.x, mesh.position.z - target.z);
      if (dist < 0.1) {
        if (agent.browsingAt !== agent.current) {
          agent.browsingAt = agent.current;
          agent.browsingTimer = 3; // 3 seconds
        }
        agent.browsingTimer -= delta;
        if (agent.browsingTimer > 0) {
          continue; // Pause at exit
        } else {
          agent.browsingAt = -1;
          agent.browsingTimer = 0;
          agent.current++;
          continue;
        }
      }
    }
    // Stuck timer: if agent doesn't reach waypoint in 8 seconds, try a bounce or skip
    if (!agent.lastWaypointIndex || agent.lastWaypointIndex !== agent.current) {
      agent.stuckTimer = 0;
      agent.lastWaypointIndex = agent.current;
      agent.patience = 0;
      agent.nudgeCount = 0;
    } else {
      agent.stuckTimer += delta;
      agent.patience += delta;
      if (agent.stuckTimer > 3 && agent.nudgeCount < 1) {
        // Try a gentle nudge left or right (perpendicular to direction to waypoint)
        const dx = target.x - mesh.position.x;
        const dz = target.z - mesh.position.z;
        const dir = new THREE.Vector3(dx, 0, dz).normalize();
        // Perpendicular left or right
        const perp = Math.random() < 0.5
          ? new THREE.Vector3(-dir.z, 0, dir.x)
          : new THREE.Vector3(dir.z, 0, -dir.x);
        let next = {
          x: mesh.position.x + perp.x * agent.bounciness,
          y: mesh.position.y,
          z: mesh.position.z + perp.z * agent.bounciness
        };
        if (!checkCollision(next, OBSTACLES)) {
          mesh.position.x = next.x;
          mesh.position.z = next.z;
        }
        agent.nudgeCount++;
      }
      if (agent.stuckTimer > 8) {
        agent.current++;
        agent.stuckTimer = 0;
        agent.patience = 0;
        agent.mood -= 10; // Mood drops if stuck too long
        agent.nudgeCount = 0;
        continue;
      }
    }
    // Mood drops if waiting in queue or checking out too long
    if ((agent.state === 'queueing' || agent.state === 'checking_out') && agent.patience > 3) {
      agent.mood -= delta * 5;
      if (agent.mood < 0) agent.mood = 0;
    }
    // If getting basket, as soon as agent reaches the basket, attach a real basket mesh from the stack
    if (agent.state === 'get_basket' && !agent.basketAttached) {
      // Use only x/z distance for pickup
      const dx = target.x - mesh.position.x;
      const dz = target.z - mesh.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 0.1 && BASKET_MESHES.length > 0) {
        basket = BASKET_MESHES.shift();
        scene.remove(basket);
        basket.position.set(0, -0.25, -0.5); // offset relative to agent
        mesh.add(basket);
        agent.basket = basket;
        agent.basketAttached = true;
        agent.current++;
        agent.state = 'shopping';
        agent.basketPickedUp = true;
        continue;
      }
    }
    // Move basket with agent (if agent is shopping, queueing, checking out, or exiting)
    if (basket && agent.basketAttached) {
      // basket is now a child of mesh, so no need to manually update position
    }
    // If heading to checkout, switch to queueing when close
    if (agent.state === 'shopping' && agent.current === agent.waypoints.length - 2) {
      const dist = Math.hypot(mesh.position.x - target.x, mesh.position.z - target.z);
      if (dist < 0.5) {
        agent.state = 'queueing';
        agent.queueIndex = 0;
      }
    }
    // If queueing, move to queue position
    if (agent.state === 'queueing') {
      agent.queueIndex = checkoutQueues[agent.checkout].indexOf(agent);
      const base = CHECKOUT_POSITIONS[agent.checkout];
      const qpos = {
        x: base.x,
        y: 0.5,
        z: base.z + 2 + agent.queueIndex * QUEUE_SPACING
      };
      const dir = new THREE.Vector3(qpos.x - mesh.position.x, 0, qpos.z - mesh.position.z);
      const dist = dir.length();
      if (dist > 0.05) {
        dir.normalize();
        let next = { x: mesh.position.x + dir.x * agent.speed * delta, y: mesh.position.y, z: mesh.position.z + dir.z * agent.speed * delta };
        if (!checkCollision(next, OBSTACLES)) {
          mesh.position.x = next.x;
          mesh.position.z = next.z;
        }
      } else {
        // If at front of queue and not busy, start checkout
        if (agent.queueIndex === 0 && !checkoutBusy[agent.checkout]) {
          agent.state = 'checking_out';
          agent.checkoutTimer = CHECKOUT_TIME;
          checkoutBusy[agent.checkout] = true;
        }
      }
      continue;
    }
    // If checking out, wait, then proceed to exit
    if (agent.state === 'checking_out') {
      agent.checkoutTimer -= delta;
      if (agent.checkoutTimer <= 0) {
        // Basket return logic
        if (agent.basket && agent.basketAttached) {
          mesh.remove(agent.basket);
          agent.basketAttached = false;
          agent.basket = null;
        }
        agent.itemsCollected = [];
        agent.state = 'exiting';
        agent.current++;
        checkoutBusy[agent.checkout] = false;
      }
      continue;
    }
    // If exiting, proceed to exit
    if (agent.state === 'exiting') {
      const dir = new THREE.Vector3(target.x - mesh.position.x, 0, target.z - mesh.position.z);
      const dist = dir.length();
      if (dist < 0.1) {
        agent.current++;
        continue;
      }
      dir.normalize();
      let next = { x: mesh.position.x + dir.x * agent.speed * delta, y: mesh.position.y, z: mesh.position.z + dir.z * agent.speed * delta };
      if (!checkCollision(next, OBSTACLES)) {
        mesh.position.x = next.x;
        mesh.position.z = next.z;
      }
      continue;
    }
    // Default: shopping or moving
    const dir = new THREE.Vector3(target.x - mesh.position.x, 0, target.z - mesh.position.z);
    const dist = dir.length();
    if (dist < 0.1) {
      agent.current++;
      continue;
    }
    dir.normalize();
    let next = { x: mesh.position.x + dir.x * agent.speed * delta, y: mesh.position.y, z: mesh.position.z + dir.z * agent.speed * delta };
    if (!checkCollision(next, OBSTACLES)) {
      mesh.position.x = next.x;
      mesh.position.z = next.z;
    }
  }
} 