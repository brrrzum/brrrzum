import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/controls/OrbitControls.js";

const sceneContainer = document.getElementById("scene-container");
const imageInput = document.getElementById("image-input");
const resetButton = document.getElementById("reset-camera");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x070b17);

const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
camera.position.set(2.8, 2.2, 3.4);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
sceneContainer.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.maxPolarAngle = Math.PI * 0.92;
controls.minDistance = 1.25;
controls.maxDistance = 8;

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight(0xfff2d8, 1.05);
keyLight.position.set(-4, 6, 3);
keyLight.castShadow = true;
keyLight.shadow.radius = 4;
keyLight.shadow.mapSize.set(2048, 2048);
scene.add(keyLight);

const rimLight = new THREE.PointLight(0x75c2ff, 1.25, 15, 2);
rimLight.position.set(3.5, 2.2, -2.5);
scene.add(rimLight);

const ground = new THREE.Mesh(
  new THREE.CircleGeometry(6, 64),
  new THREE.ShadowMaterial({ opacity: 0.22 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.75;
ground.receiveShadow = true;
scene.add(ground);

const haloGeometry = new THREE.RingGeometry(1.75, 2.05, 64);
const haloMaterial = new THREE.MeshBasicMaterial({
  color: 0x74c0fc,
  transparent: true,
  opacity: 0.2,
  side: THREE.DoubleSide,
});
const halo = new THREE.Mesh(haloGeometry, haloMaterial);
halo.rotation.x = -Math.PI / 2;
halo.position.y = -0.35;
scene.add(halo);

const placeholderTexture = new THREE.CanvasTexture(generatePlaceholderCanvas());
placeholderTexture.colorSpace = THREE.SRGBColorSpace;
placeholderTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

const placeholderHeightTexture = new THREE.CanvasTexture(
  generatePlaceholderHeightMap()
);
placeholderHeightTexture.colorSpace = THREE.LinearSRGBColorSpace;
placeholderHeightTexture.minFilter = THREE.LinearFilter;
placeholderHeightTexture.magFilter = THREE.LinearFilter;
placeholderHeightTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

const dioramaMaterial = new THREE.MeshPhysicalMaterial({
  map: placeholderTexture,
  displacementMap: placeholderHeightTexture,
  displacementScale: 0.28,
  displacementBias: -0.12,
  transparent: true,
  roughness: 0.45,
  metalness: 0.05,
  clearcoat: 0.35,
  clearcoatRoughness: 0.65,
  side: THREE.DoubleSide,
});

const diorama = new THREE.Mesh(
  new THREE.PlaneGeometry(2.4, 2.4, 200, 200),
  dioramaMaterial
);
diorama.position.y = 0.2;
diorama.castShadow = true;
scene.add(diorama);

const frameGeometry = new THREE.TorusGeometry(1.3, 0.06, 32, 128);
const frameMaterial = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  metalness: 0.8,
  roughness: 0.2,
  envMapIntensity: 1.3,
});
const frame = new THREE.Mesh(frameGeometry, frameMaterial);
frame.rotation.x = Math.PI / 2;
frame.position.y = 0.18;
frame.castShadow = true;
scene.add(frame);

const gentleFloat = new THREE.Group();
gentleFloat.add(diorama);
gentleFloat.add(frame);
scene.add(gentleFloat);

let floatDirection = 1;
let elapsed = 0;
let previousTime = 0;

function generatePlaceholderCanvas() {
  const size = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, "#81f6d7");
  gradient.addColorStop(1, "#3685f9");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = "rgba(7, 13, 37, 0.12)";
  for (let i = 0; i < 220; i += 1) {
    const radius = Math.random() * 12 + 4;
    const x = Math.random() * size;
    const y = Math.random() * size;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "rgba(6, 12, 36, 0.65)";
  ctx.font = "bold 92px 'Inter', 'Segoe UI', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Sculpt depth", size / 2, size / 2 - 30);

  ctx.fillStyle = "rgba(6, 12, 36, 0.45)";
  ctx.font = "500 42px 'Inter', 'Segoe UI', sans-serif";
  ctx.fillText("Drop an image to begin", size / 2, size / 2 + 80);

  return canvas;
}

function generatePlaceholderHeightMap() {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  const gradient = ctx.createRadialGradient(
    size / 2,
    size / 2,
    size * 0.2,
    size / 2,
    size / 2,
    size * 0.55
  );
  gradient.addColorStop(0, "rgb(235, 235, 235)");
  gradient.addColorStop(1, "rgb(48, 48, 48)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  return canvas;
}

function createDisplacementTexture(image) {
  const maxDimension = 1024;
  const largestSide = Math.max(image.width, image.height);
  const scale = largestSide > maxDimension ? maxDimension / largestSide : 1;
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0, width, height);

  const imageData = ctx.getImageData(0, 0, width, height);
  const { data } = imageData;
  const grayscale = new Float32Array(width * height);

  let min = 1;
  let max = 0;

  for (let i = 0, j = 0; i < data.length; i += 4, j += 1) {
    const r = data[i] / 255;
    const g = data[i + 1] / 255;
    const b = data[i + 2] / 255;
    const luminance = Math.sqrt(
      0.299 * r * r + 0.587 * g * g + 0.114 * b * b
    );
    const elevated = Math.pow(luminance, 0.75);
    grayscale[j] = elevated;
    if (elevated < min) min = elevated;
    if (elevated > max) max = elevated;
  }

  const range = Math.max(0.0001, max - min);
  for (let i = 0, j = 0; i < data.length; i += 4, j += 1) {
    const normalized = (grayscale[j] - min) / range;
    const value = Math.round(normalized * 255);
    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
    data[i + 3] = 255;
  }

  ctx.putImageData(imageData, 0, 0);

  const displacementTexture = new THREE.CanvasTexture(canvas);
  displacementTexture.colorSpace = THREE.LinearSRGBColorSpace;
  displacementTexture.minFilter = THREE.LinearFilter;
  displacementTexture.magFilter = THREE.LinearFilter;
  displacementTexture.wrapS = THREE.ClampToEdgeWrapping;
  displacementTexture.wrapT = THREE.ClampToEdgeWrapping;

  return displacementTexture;
}

function onWindowResize() {
  const { clientWidth, clientHeight } = sceneContainer;
  if (!clientWidth || !clientHeight) return;
  camera.aspect = clientWidth / clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(clientWidth, clientHeight, false);
}

function animate(time) {
  requestAnimationFrame(animate);
  const delta = time - previousTime;
  previousTime = time;

  controls.update();
  elapsed += delta;

  const floatSpeed = 0.00055;
  gentleFloat.position.y = 0.2 + Math.sin(elapsed * floatSpeed) * 0.15;
  gentleFloat.rotation.y += 0.0007 * floatDirection;

  if (Math.abs(gentleFloat.rotation.y) > Math.PI / 6) {
    floatDirection *= -1;
  }

  halo.rotation.z += 0.0005;

  renderer.render(scene, camera);
}

function loadTextureFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const colorTexture = new THREE.Texture(image);
        colorTexture.colorSpace = THREE.SRGBColorSpace;
        colorTexture.needsUpdate = true;

        const displacementTexture = createDisplacementTexture(image);

        resolve({
          colorTexture,
          displacementTexture,
          aspect: image.width / image.height,
        });
      };
      image.onerror = reject;
      image.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function updateDioramaTexture({ colorTexture, displacementTexture, aspect }) {
  const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
  colorTexture.anisotropy = maxAnisotropy;
  colorTexture.generateMipmaps = true;
  colorTexture.needsUpdate = true;

  if (displacementTexture) {
    displacementTexture.anisotropy = maxAnisotropy;
    displacementTexture.needsUpdate = true;
  }

  const height = 2.4;
  const width = height * aspect;
  const segmentsX = Math.max(64, Math.round(240 * aspect));
  const segmentsY = 240;

  diorama.geometry.dispose();
  diorama.geometry = new THREE.PlaneGeometry(width, height, segmentsX, segmentsY);

  frame.geometry.dispose();
  const frameRadius = Math.max(width, height) * 0.5 + 0.06;
  frame.geometry = new THREE.TorusGeometry(frameRadius * 0.74, 0.06, 32, 160);

  dioramaMaterial.map = colorTexture;
  dioramaMaterial.displacementMap = displacementTexture;

  const displacementScale = 0.32;
  dioramaMaterial.displacementScale = displacementScale;
  dioramaMaterial.displacementBias = -displacementScale * 0.45;
  dioramaMaterial.needsUpdate = true;
}

imageInput.addEventListener("change", async (event) => {
  const [file] = event.target.files;
  if (!file) return;

  try {
    const textureData = await loadTextureFromFile(file);
    updateDioramaTexture(textureData);
  } catch (error) {
    console.error("Failed to load texture", error);
    alert("We couldn't load that image. Please try a different file.");
  }
});

resetButton.addEventListener("click", () => {
  controls.reset();
  camera.position.set(2.8, 2.2, 3.4);
});

const observer = new ResizeObserver(onWindowResize);
observer.observe(sceneContainer);

onWindowResize();
requestAnimationFrame(animate);
