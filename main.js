import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';

import {OrbitControls} from 'https://cdn.jsdelivr.net/npm/three@0.118/examples/jsm/controls/OrbitControls.js';
const particles = [];
const upper = [500, 500, 500];
const lower = [-upper[0], 0, -upper[2]];
var Paused = false;

function vectorAdd(a, b){
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
} 

function getAbs(velocity) {
  return Math.sqrt(velocity.reduce((sum, value) => sum + Math.pow(value, 2), 0));
}

function coloumbs(a, b){
  const threshold = a.radius * 3/2;
  let mag = 1;
  const x = a.pos[0] - b.pos[0];
  const y = a.pos[1] - b.pos[1];
  const z = a.pos[2] - b.pos[2];
  const r = Math.sqrt(x*x + y*y + z*z);
  if (r <= threshold) mag = -2;
  const theta = Math.atan2(y, x);
  const phi = Math.atan2(z, r);
  mag *= (5 * (a.q * b.q) / (r*r));
  return [mag * Math.cos(theta), mag * Math.sin(theta), mag * phi];
}

const makeParticle = () => {
  particles.push({
    pos: [(2 * upper[0]) * Math.random() - upper[0], 10 + 50 * Math.random(), (2 *upper[2]) * Math.random() - upper[2]],
    velocity: [0, 0, 0],
    radius: 10,
    q: Math.random() > 0.5 ? 1 : -1,
    update() {
      for(let i = 0; i < this.pos.length; i++){
        if (this.pos[i] > upper[i] - this.radius || this.pos[i] - this.radius < lower[i]) this.velocity[i] *= -1;
        this.pos[i] += this.velocity[i];
      }
    },
  });
}







class BasicWorldDemo {
  constructor() {
    this._Initialize();
  }

  _Initialize() {
    this._threejs = new THREE.WebGLRenderer({
      antialias: true,
    });
    this._threejs.shadowMap.enabled = true;
    this._threejs.shadowMap.type = THREE.PCFSoftShadowMap;
    this._threejs.setPixelRatio(window.devicePixelRatio);
    this._threejs.setSize(window.innerWidth, window.innerHeight);

    document.body.appendChild(this._threejs.domElement);

    window.addEventListener('resize', () => {
      this._OnWindowResize();
    }, false);

    const fov = 60;
    const aspect = 1920 / 1080;
    const near = 1.0;
    const far = 1000.0;
    this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this._camera.position.set(75, 20, 0);

    this._scene = new THREE.Scene();

    let light = new THREE.DirectionalLight(0xFFFFFF, 1.0);
    light.position.set(20, 100, 10);
    light.target.position.set(0, 0, 0);
    light.castShadow = true;
    light.shadow.bias = -0.001;
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;
    light.shadow.camera.near = 0.1;
    light.shadow.camera.far = 500.0;
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 500.0;
    light.shadow.camera.left = 100;
    light.shadow.camera.right = -100;
    light.shadow.camera.top = 100;
    light.shadow.camera.bottom = -100;
    this._scene.add(light);

    light = new THREE.AmbientLight(0x101010);
    this._scene.add(light);

    const controls = new OrbitControls(
      this._camera, this._threejs.domElement);
    controls.target.set(0, 20, 0);
    controls.update();

    const loader = new THREE.CubeTextureLoader();
    const texture = loader.load([
        './resources/posx.jpg',
        './resources/negx.jpg',
        './resources/posy.jpg',
        './resources/negy.jpg',
        './resources/posz.jpg',
        './resources/negz.jpg',
    ]);
    this._scene.background = texture;

    const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(2 * upper[0], 2 * upper[2], 10, 10),
        new THREE.MeshStandardMaterial({
            color: 0xFFFFFF,
          }));
    plane.castShadow = false;
    plane.receiveShadow = true;
    plane.rotation.x = -Math.PI / 2;
    this._scene.add(plane);

    for(let i = 0; i <80; i++){
      makeParticle();
    }
    

    particles.forEach((particle, i) => {
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(particle.radius, 100, 100),
        new THREE.MeshStandardMaterial({
            color: particle.q === 1 ? 0xFF00FF : 0x0000FF,
        }));
      sphere.position.set(particle.pos[0], particle.pos[1], particle.pos[2]);
      sphere.castShadow = true;
      sphere.receiveShadow = true;
      sphere.name = `particle${i}`;
      this._scene.add(sphere);
    })

    this._RAF();
  }

  _OnWindowResize() {
    this._camera.aspect = window.innerWidth / window.innerHeight;
    this._camera.updateProjectionMatrix();
    this._threejs.setSize(window.innerWidth, window.innerHeight);
  }

  _RAF() {
    requestAnimationFrame(() => {
      particles.forEach((particle, i) => {
        particles.forEach(function(e) {
          if (e != particle && !Paused) particle.velocity = vectorAdd(particle.velocity, coloumbs(particle, e));
        })
        if (!Paused ) particle.update();
        let sphere = this._scene.getObjectByName(`particle${i}`);
        if (sphere) sphere.position.set(particle.pos[0], particle.pos[1], particle.pos[2])
      })
      
      this._threejs.render(this._scene, this._camera);

      this._RAF();
    });
  }
}

// Retrieve the button element
const stopButton = document.getElementById("stop");

// Add an event listener to the button
stopButton.addEventListener("click", function() {
  // Code to execute when the button is clicked
  Paused = !Paused
  // Add your desired functionality here
});

let _APP = null;

window.addEventListener('DOMContentLoaded', () => {
  _APP = new BasicWorldDemo();
});
