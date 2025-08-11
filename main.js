import * as THREE from 'three';
import { getTime } from './setTime';

/* ========================================================================== */
/*                             Configs & Constants                            */
/* ========================================================================== */
const PI = Math.PI;
const GMTOffset = -PI; // Distance between map left edge and 0 longitude in radian
const RadPerMinute = 2 * PI / 1440; // Radian per minute
const UpdateInterval = 60; // Time interval between rotation updates in seconds
const MapDir = '2k_earth_daymap.jpg';

const MarkerWidth = 0.003;
const PoleRadius = 0.0015;
const SunlightDistance = 5;
const SunlightIntensity = 4;
const DefaultCameraDistance = isMobileDevice() ? 2.5 : 1.5;

/* ========================================================================== */
/*                                    Utils                                   */
/* ========================================================================== */

function getSunlightAngle(time) {
    const startOfYear = new Date(time.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((time - startOfYear) / (1000 * 60 * 60 * 24));
    return Math.asin(0.398 * Math.cos(2 * PI * (dayOfYear - 173) / 365.242));
}

function isMobileDevice() {
    const UA = navigator.userAgent;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(UA);
}

if (isMobileDevice()) {
    document.getElementById("control").remove();
    document.getElementById("control-mobile").style.display = "";
}

/* ========================================================================== */
/*                                 Scene Setup                                */
/* ========================================================================== */
const scene = new THREE.Scene();
const aspect = window.innerWidth / window.innerHeight;
const camera = new THREE.OrthographicCamera(
    -DefaultCameraDistance * aspect, DefaultCameraDistance * aspect,
    DefaultCameraDistance, -DefaultCameraDistance,
    0, 1000
);
camera.position.z = DefaultCameraDistance;
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Create ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambientLight);

// Create root object
const root = new THREE.Object3D();
scene.add(root);

// Create the Earth
const earth = new THREE.Mesh(
    new THREE.SphereGeometry(1, 32, 32),
    new THREE.MeshStandardMaterial(
        { map: new THREE.TextureLoader().load(MapDir) }
    )
);
earth.position.set(0, 0, 0);
root.add(earth);

// Create sunlight
const directionalLight = new THREE.DirectionalLight(0xffffff, SunlightIntensity);
directionalLight.position.set(0, 0, SunlightDistance);
directionalLight.target = earth;
root.add(directionalLight);

// Noon Marker
const semiCircle = new THREE.CylinderGeometry(1 + 0.001, 1 + 0.001, MarkerWidth, 64, 1, true, 0, PI)
const noonMarker = new THREE.Mesh(
    semiCircle,
    new THREE.MeshBasicMaterial({ color: 0xff0000 })
);
noonMarker.position.set(0, 0, 0);
noonMarker.rotation.set(PI / 2, 0, PI / 2);
noonMarker.visible = false;
root.add(noonMarker);

// Midnight Marker
const midnightMarker = new THREE.Mesh(
    semiCircle,
    new THREE.MeshBasicMaterial({ color: 0x0000ff })
);
midnightMarker.position.set(0, 0, 0);
midnightMarker.rotation.set(PI / 2, 0, -PI / 2);
midnightMarker.visible = false;
root.add(midnightMarker);

// Earth pole
const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(PoleRadius, PoleRadius, 1.3 * 2, 16, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
);
pole.position.set(0, 0, 0);
pole.visible = false;
root.add(pole);

/* ========================================================================== */
/*                            Control & Interaction                           */
/* ========================================================================== */
let isDragging = false;
let dragStartX, dragStartY;
let cameraTheta = PI / 2, cameraPhi = PI / 2;

let cameraDistance = DefaultCameraDistance;

function moveSphericCamera(deltaX, deltaY) {
    // Calculate new camera angle based on mouse movement
    cameraTheta += deltaX * 0.01;
    cameraPhi -= deltaY * 0.01;

    // Limit camera angle to prevent it from going below the horizon
    cameraPhi = Math.max(Math.min(cameraPhi, PI), 0.001);

    // Calculate new camera position based on new angle
    const x = cameraDistance * Math.sin(cameraPhi) * Math.cos(cameraTheta);
    const z = cameraDistance * Math.sin(cameraPhi) * Math.sin(cameraTheta);
    const y = cameraDistance * Math.cos(cameraPhi);

    // Update camera position and fix on the sphere
    camera.position.set(x, y, z);
    camera.lookAt(earth.position);
}

function resetCamera() {
    cameraDistance = DefaultCameraDistance;
    camera.position.set(0, 0, cameraDistance);
    camera.lookAt(earth.position);
    cameraTheta = PI / 2;
    cameraPhi = PI / 2;
}

function tiltScene(deltaZ) {
    let tilt = root.rotation.x;
    tilt += deltaZ * 0.01;
    tilt = Math.max(Math.min(tilt, PI / 2), -PI / 2);
    root.rotation.x = tilt;
}

function handleMouseDown(event) {
    isDragging = true;
    dragStartX = event.clientX;
    dragStartY = event.clientY;
}

function handleTouchStart(event) {
    // event.preventDefault();
    const touch = event.touches[0];
    handleMouseDown(touch);
}

function handleMouseUp(event) {
    isDragging = false;
}

function handleTouchEnd(event) {
    // event.preventDefault();
    handleMouseUp(event);
}

function handleMouseMove(event) {
    if (!isDragging) return;
    // Calculate mouse movement
    const deltaX = event.clientX - dragStartX;
    const deltaY = event.clientY - dragStartY;
    dragStartX = event.clientX;
    dragStartY = event.clientY;

    moveSphericCamera(deltaX, deltaY);
}

function handleTouchMove(event) {
    event.preventDefault();
    const touch = event.touches[0];
    handleMouseMove(touch);
}

function handleResize() {
    const aspect = window.innerWidth / window.innerHeight;
    camera.left = -cameraDistance * aspect;
    camera.right = cameraDistance * aspect;
    camera.top = cameraDistance;
    camera.bottom = -cameraDistance;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function handleKeyDown(event) {
    switch (event.key) {
        case 'q': case 'Q':
            tiltScene(-1);
            break;
        case 'e': case 'E':
            tiltScene(1);
            break;
        case 'w': case 'W': case 'ArrowUp':
            moveSphericCamera(0, 1);
            break;
        case 's': case 'S': case 'ArrowDown':
            moveSphericCamera(0, -1);
            break;
        case 'a': case 'A': case 'ArrowLeft':
            moveSphericCamera(1, 0);
            break;
        case 'd': case 'D': case 'ArrowRight':
            moveSphericCamera(-1, 0);
            break;
        case 'z': case 'Z': // Zoom out
            cameraDistance *= 1.1;
            cameraDistance = Math.min(cameraDistance, 10);
            handleResize();
            break;
        case 'c': case 'C': // Zoom in
            cameraDistance *= 0.9;
            cameraDistance = Math.max(cameraDistance, 1);
            handleResize();
            break;
        default:
            return;
    }
}

function handleKeyUp(event) {
    switch (event.key) {
        case 'r': case 'R': // Reset camera
            resetCamera();
            handleResize();
            break;
        case 'f': case 'F': // Align with equator
            root.rotation.x = 0;
            break;
        case 'v': case 'V': // Align with ecliptic
            root.rotation.x = getSunlightAngle(getTime());
            break;
        case 't': case 'T': // Toggle markers
            noonMarker.visible = !noonMarker.visible;
            midnightMarker.visible = !midnightMarker.visible;
            break;
        case 'g': case 'G': // Toggle pole
            pole.visible = !pole.visible;
            break;
        default:
            return;
    }
}

window.addEventListener('resize', handleResize, false);
window.addEventListener('mousedown', handleMouseDown, false);
window.addEventListener('mouseup', handleMouseUp, false);
window.addEventListener('mousemove', handleMouseMove, false);
window.addEventListener('keydown', handleKeyDown, false);
window.addEventListener('keyup', handleKeyUp, false);
// Add mobile touch support
window.addEventListener('touchstart', handleTouchStart, false);
window.addEventListener('touchend', handleTouchEnd, false);
window.addEventListener('touchmove', handleTouchMove, false);


/* ========================================================================== */
/*                                  Animation                                 */
/* ========================================================================== */
// Adjust sphere rotation position y
function updateEarthRotation() {
    const now = getTime();
    const UTCMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
    earth.rotation.y = UTCMinutes * RadPerMinute + GMTOffset - PI / 2;
}
updateEarthRotation();

// Adjust rotation x of light source
function updateSunlightAngle() {
    const sunlightAngle = getSunlightAngle(getTime());
    directionalLight.position.set(0, SunlightDistance * Math.tan(sunlightAngle), SunlightDistance)
}
updateSunlightAngle();

// Signal from setTime button
document.getElementById("set-time-btn").addEventListener("click", updateEarthRotation);
document.getElementById("set-time-btn").addEventListener("click", updateSunlightAngle);
document.getElementById("set-now-btn").addEventListener("click", updateEarthRotation);
document.getElementById("set-now-btn").addEventListener("click", updateSunlightAngle);

// Signal from mobile zoom button
document.getElementById("minus").addEventListener("click", () => {
    cameraDistance *= 1.1;
    cameraDistance = Math.min(cameraDistance, 10);
    handleResize();
})
document.getElementById("plus").addEventListener("click", () => {
    cameraDistance *= 0.9;
    cameraDistance = Math.max(cameraDistance, 1);
    handleResize();
})

// Animation loop
let lastEarthUpdate = 0;
let lastSunlightUpdate = 0;

function animate(time) {
    if (time - lastEarthUpdate > 1000 * UpdateInterval) {
        updateEarthRotation();
        lastEarthUpdate = time;
    }
    if (time - lastSunlightUpdate > 1000 * 3600) {
        updateSunlightAngle();
        lastSunlightUpdate = time;
    }
    renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);

