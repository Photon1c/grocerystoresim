import * as THREE from 'three';

// Stub: load a fixture (GLB or primitive)
export function loadShelf(position, scene) {
  // In the future, load a GLB model
  // For now, add a simple box
  const shelf = new THREE.Mesh(
    new THREE.BoxGeometry(1, 2, 4),
    new THREE.MeshStandardMaterial({ color: 0x8d5524 })
  );
  shelf.position.copy(position);
  scene.add(shelf);
  return shelf;
}

export function loadCheckoutCounter(position, scene) {
  const counter = new THREE.Mesh(
    new THREE.BoxGeometry(2, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0x555555 })
  );
  counter.position.copy(position);
  scene.add(counter);
  return counter;
} 