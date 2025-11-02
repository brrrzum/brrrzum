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

const dioramaMaterial = new THREE.MeshStandardMaterial({
  map: placeholderTexture,
  transparent: true,
  roughness: 0.5,
  metalness: 0.1,
  side: THREE.DoubleSide,
});

const diorama = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.4), dioramaMaterial);
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
  ctx.fillText("Load your diorama", size / 2, size / 2 - 30);

  ctx.fillStyle = "rgba(6, 12, 36, 0.45)";
  ctx.font = "500 42px 'Inter', 'Segoe UI', sans-serif";
  ctx.fillText("PNG • JPG • WebP", size / 2, size / 2 + 80);

  return canvas;
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
      new THREE.TextureLoader().load(
        reader.result,
        (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          resolve(texture);
        },
        undefined,
        reject
      );
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function updateDioramaTexture(texture) {
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  texture.generateMipmaps = true;
  texture.needsUpdate = true;

  const { image } = texture;
  if (image && image.width && image.height) {
    const aspect = image.width / image.height;
    const size = 2.4;
    diorama.geometry.dispose();
    diorama.geometry = new THREE.PlaneGeometry(size * aspect, size);
    frame.geometry.dispose();
    const radius = Math.max(size * aspect, size) / 2;
    frame.geometry = new THREE.TorusGeometry(radius * 0.72, 0.06, 32, 128);
  }

  dioramaMaterial.map = texture;
  dioramaMaterial.needsUpdate = true;
}

imageInput.addEventListener("change", async (event) => {
  const [file] = event.target.files;
  if (!file) return;

  try {
    const texture = await loadTextureFromFile(file);
    updateDioramaTexture(texture);
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
