<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import * as THREE from 'three';

const props = defineProps<{ length: number; width: number; height: number }>();
const host = ref<HTMLDivElement | null>(null);

let renderer: THREE.WebGLRenderer | undefined;
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let beam: THREE.Mesh;
let supports: THREE.Mesh[] = [];
let floor: THREE.Mesh;
let frame = 0;
let observer: ResizeObserver | undefined;
let dragging = false;
let pointerX = 0;
let pointerY = 0;
let orbitX = 0;
let orbitY = 0;
let cameraRadius = 8;

function resize(): void {
  if (!host.value || !renderer) return;
  const { width, height } = host.value.getBoundingClientRect();
  if (width < 1 || height < 1) return;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function updateBeam(): void {
  if (!beam || ![props.length, props.width, props.height].every((value) => Number.isFinite(value) && value > 0)) return;
  const beamLength = THREE.MathUtils.clamp((props.length / 6) * 4.6, 2.4, 8);
  const scale = beamLength / props.length;
  const beamHeight = THREE.MathUtils.clamp(props.height * scale, 0.08, 0.8);
  const beamWidth = THREE.MathUtils.clamp(props.width * scale, 0.08, 0.8);
  const old = beam.geometry;
  beam.geometry = new THREE.BoxGeometry(beamLength, beamHeight, beamWidth);
  old.dispose();
  for (const [index, support] of supports.entries()) {
    support.position.set(index === 0 ? -1 : 1, -(beamHeight / 2 + 0.175), 0);
    support.position.x *= beamLength / 2 - 0.22;
  }
  floor.position.y = -(beamHeight / 2 + 0.42);
}

function updateCamera(): void {
  camera.position.set(
    Math.sin(orbitX) * cameraRadius,
    3.2 + orbitY * cameraRadius,
    Math.cos(orbitX) * cameraRadius
  );
  camera.lookAt(0, 0, 0);
}

function startDrag(event: PointerEvent): void {
  dragging = true;
  pointerX = event.clientX;
  pointerY = event.clientY;
  (event.currentTarget as HTMLCanvasElement).setPointerCapture(event.pointerId);
}

function stopDrag(): void {
  dragging = false;
}

function drag(event: PointerEvent): void {
  if (!dragging) return;
  orbitX += (event.clientX - pointerX) * 0.008;
  orbitY = THREE.MathUtils.clamp(orbitY + (event.clientY - pointerY) * 0.006, -0.5, 0.65);
  pointerX = event.clientX;
  pointerY = event.clientY;
  updateCamera();
}

function zoom(event: WheelEvent): void {
  cameraRadius = THREE.MathUtils.clamp(cameraRadius + event.deltaY * 0.01, 5, 14);
  updateCamera();
}

onMounted(() => {
  if (!host.value) return;
  scene = new THREE.Scene();
  scene.background = new THREE.Color('#f5f4ef');
  camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  camera.position.set(6, 4.3, 7);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.domElement.addEventListener('pointerdown', startDrag);
  renderer.domElement.addEventListener('pointermove', drag);
  renderer.domElement.addEventListener('pointerup', stopDrag);
  renderer.domElement.addEventListener('pointercancel', stopDrag);
  renderer.domElement.addEventListener('wheel', zoom, { passive: true });
  host.value.appendChild(renderer.domElement);

  scene.add(new THREE.HemisphereLight('#fffaf0', '#8e9b86', 2.2));
  const keyLight = new THREE.DirectionalLight('#ffffff', 3);
  keyLight.position.set(-3, 7, 5);
  keyLight.castShadow = true;
  scene.add(keyLight);

  beam = new THREE.Mesh(
    new THREE.BoxGeometry(4.6, 0.3, 0.24),
    new THREE.MeshStandardMaterial({ color: '#b87943', roughness: 0.72, metalness: 0.02 })
  );
  beam.castShadow = true;
  scene.add(beam);
  const supportGeometry = new THREE.ConeGeometry(0.22, 0.35, 4);
  const supportMaterial = new THREE.MeshStandardMaterial({ color: '#315b4c', roughness: 0.85 });
  for (const x of [-1, 1]) {
    const support = new THREE.Mesh(supportGeometry, supportMaterial);
    support.position.set(x, -0.37, 0);
    support.rotation.x = Math.PI;
    scene.add(support);
    supports.push(support);
  }
  floor = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.ShadowMaterial({ opacity: 0.12 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.58;
  floor.receiveShadow = true;
  scene.add(floor);
  updateBeam();

  const render = () => {
    frame = requestAnimationFrame(render);
    beam.rotation.y += 0.0025;
    renderer?.render(scene, camera);
  };
  resize();
  render();
  observer = new ResizeObserver(resize);
  observer.observe(host.value);
});

watch(() => [props.length, props.width, props.height], updateBeam);

onBeforeUnmount(() => {
  cancelAnimationFrame(frame);
  observer?.disconnect();
  if (renderer) {
    renderer.domElement.removeEventListener('pointerdown', startDrag);
    renderer.domElement.removeEventListener('pointermove', drag);
    renderer.domElement.removeEventListener('pointerup', stopDrag);
    renderer.domElement.removeEventListener('pointercancel', stopDrag);
    renderer.dispose();
    renderer.domElement.remove();
  }
  scene?.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.geometry.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => material.dispose());
    }
  });
});
</script>

<template>
  <div ref="host" class="beam-scene" role="img" aria-label="Interaktīvs koka sijas trīsdimensiju attēlojums">
    <div class="scene-caption"><span class="scene-dot"></span> Sijas modelis · pagrieziet ar peli, tuviniet ar ritenīti</div>
  </div>
</template>
