import * as THREE from 'three';

export const ENTRANCE_POS = { x: 0, y: 0.5, z: 15.1 };
export const EXIT_POS = ENTRANCE_POS;
export const CHECKOUT_POSITIONS = [
  { x: -10, y: 0.5, z: 12 },
  { x: -3, y: 0.5, z: 12 },
  { x: 3, y: 0.5, z: 12 },
  { x: 10, y: 0.5, z: 12 }
];

export const BASKET_POSITIONS = [
  { x: ENTRANCE_POS.x, y: 0.25, z: ENTRANCE_POS.z + 2 },
  { x: ENTRANCE_POS.x, y: 0.55, z: ENTRANCE_POS.z + 2 },
  { x: ENTRANCE_POS.x, y: 0.85, z: ENTRANCE_POS.z + 2 },
  { x: ENTRANCE_POS.x, y: 1.15, z: ENTRANCE_POS.z + 2 },
  { x: ENTRANCE_POS.x, y: 1.45, z: ENTRANCE_POS.z + 2 }
];

export let OBSTACLES = [];
export let BASKET_MESHES = [];

export function createGroceryMap(scene) {
  OBSTACLES = [];
  // Store dimensions
  const storeWidth = 40;
  const storeDepth = 30;
  const wallHeight = 4;
  const wallThickness = 0.3;

  // 1. Floor
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(storeWidth, storeDepth),
    new THREE.MeshStandardMaterial({ color: 0xdcdcdc })
  );
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  // After floor and before agents, add baskets
  BASKET_MESHES = [];
  const basketMaterial = new THREE.MeshStandardMaterial({ color: 0xff7043 });
  for (const pos of BASKET_POSITIONS) {
    const basket = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.5, 0.5),
      basketMaterial
    );
    basket.position.set(pos.x, pos.y, pos.z);
    scene.add(basket);
    BASKET_MESHES.push(basket);
  }

  // 2. Perimeter Walls (no roof, with entrance gap in front wall)
  const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });
  // Back wall
  addObstacle(createWall(storeWidth, wallHeight, wallThickness, 0, wallHeight/2, -storeDepth/2 + wallThickness/2, wallMaterial), scene);
  // Front wall (split for entrance gap)
  const entranceGap = 6;
  // Left front wall
  addObstacle(createWall((storeWidth-entranceGap)/2, wallHeight, wallThickness, -((storeWidth-entranceGap)/4 + entranceGap/2), wallHeight/2, storeDepth/2 - wallThickness/2, wallMaterial), scene);
  // Right front wall
  addObstacle(createWall((storeWidth-entranceGap)/2, wallHeight, wallThickness, ((storeWidth-entranceGap)/4 + entranceGap/2), wallHeight/2, storeDepth/2 - wallThickness/2, wallMaterial), scene);
  // Left wall
  addObstacle(createWall(wallThickness, wallHeight, storeDepth, -storeWidth/2 + wallThickness/2, wallHeight/2, 0, wallMaterial), scene);
  // Right wall
  addObstacle(createWall(wallThickness, wallHeight, storeDepth, storeWidth/2 - wallThickness/2, wallHeight/2, 0, wallMaterial), scene);

  // 3. Aisles (5 aisles, each with 2 shelves)
  const aisleCount = 5;
  const aisleSpacing = 4;
  const shelfLength = 8;
  const shelfHeight = 2;
  const shelfWidth = 1;
  const shelfMaterial = new THREE.MeshStandardMaterial({ color: 0x8d5524 });
  for (let i = 0; i < aisleCount; i++) {
    const x = -storeWidth/2 + 6 + i * aisleSpacing;
    // Two shelves per aisle (facing each other)
    addObstacle(createShelf(shelfWidth, shelfHeight, shelfLength, x, shelfHeight/2, -5, shelfMaterial), scene);
    addObstacle(createShelf(shelfWidth, shelfHeight, shelfLength, x, shelfHeight/2, 5, shelfMaterial), scene);
  }

  // 4. Self-Checkout Counters (hybrid, near entrance)
  const checkoutMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
  for (const pos of CHECKOUT_POSITIONS) {
    addObstacle(createCheckoutCounter(2, 1, 1, pos.x, pos.y, pos.z, checkoutMaterial), scene);
  }

  // 5. Bakery, Deli, Restrooms (sections at the back)
  addObstacle(createSection(4, 2, 4, -storeWidth/2 + 2, 1, -storeDepth/2 + 3, 0xffe0b2), scene); // Bakery
  addObstacle(createSection(4, 2, 4, 0, 1, -storeDepth/2 + 3, 0xffcc80), scene); // Deli
  addObstacle(createSection(4, 2, 4, storeWidth/2 - 2 - 4, 1, -storeDepth/2 + 3, 0x90caf9), scene); // Restrooms

  // 6. Warehouse (back right)
  addObstacle(createSection(8, 3, 6, storeWidth/2 - 4, 1.5, -storeDepth/2 + 7, 0xbdbdbd), scene);
}

function addObstacle(mesh, scene) {
  scene.add(mesh);
  mesh.updateMatrixWorld();
  const box = new THREE.Box3().setFromObject(mesh);
  OBSTACLES.push(box);
}

function createWall(width, height, depth, x, y, z, material) {
  const wall = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    material
  );
  wall.position.set(x, y, z);
  wall.castShadow = true;
  wall.receiveShadow = true;
  return wall;
}

function createShelf(width, height, length, x, y, z, material) {
  const shelf = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, length),
    material
  );
  shelf.position.set(x, y, z);
  shelf.castShadow = true;
  shelf.receiveShadow = true;
  return shelf;
}

function createCheckoutCounter(width, height, depth, x, y, z, material) {
  const counter = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    material
  );
  counter.position.set(x, y, z);
  counter.castShadow = true;
  counter.receiveShadow = true;
  return counter;
}

function createSection(width, height, depth, x, y, z, color) {
  const section = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    new THREE.MeshStandardMaterial({ color })
  );
  section.position.set(x, y, z);
  section.castShadow = true;
  section.receiveShadow = true;
  return section;
}
