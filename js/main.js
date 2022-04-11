let scene, camera, renderer, skyboxGeo, skybox, elements = [], controls, toggleRun, currentAction, play;


const fbxLoader = new THREE.FBXLoader();
const animationActions = []
const gui = new dat.gui.GUI();
const clock = new THREE.Clock()

let isClick = false;
let mouseBefore = {
  x: 0,
  y: 0
};

const keys = {
  'W': false,
  'S': false,
  'F': false,
}

let activeAction
let modelReady = false
let mixer;

scene = new THREE.Scene();

const setAction = (toAction) => {
  if (toAction != activeAction) {
    lastAction = activeAction

    activeAction = toAction
    activeAction.reset()

    lastAction.stop()
    lastAction.fadeOut(1)

    activeAction.fadeIn(1)
    activeAction.play()
  }
}

const animations = {
  idle: () => {
    setAction(animationActions[0])
  },
  back: () => {
    setAction(animationActions[1])
  },
  forward: () => {
    setAction(animationActions[2])
  },
  forwardStop: () => {
    setAction(animationActions[3])
  },
  dancing: () => {
    setAction(animationActions[4])
  },
  hiphopdancing: () => {
    setAction(animationActions[5])
  }

}

function loadSky() {
  const sky = new THREE.TextureLoader().load('/assets/nublado.png')
  scene.background = sky;
}

function setCamera() {
  camera = new THREE.PerspectiveCamera(
    120,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 1, 1.0)
}

function createGUI() {
  params = {
    scala: 1,
  }

  const scala = gui.add(params, 'scala')
    .min(0.1)
    .max(2)
    .step(0.1)
    .name("Sol Densidade");


  scala.onChange(element => {
    elements.light.intensity = element;
  })

}

function loadObjects() {
  const animationsFolder = gui.addFolder('Animações');
  animationsFolder.open()

  fbxLoader.load('assets/archer/archer.fbx',
    (object) => {
      mixer = new THREE.AnimationMixer(object);
      object.scale.set(0.01, 0.01, 0.01)
      const animationAction = mixer.clipAction(object.animations[0]);
      animationAction.play()
      animationActions.push(animationAction)
      animationsFolder.add(animations, 'idle')
      activeAction = animationAction


      fbxLoader.load(
        'assets/archer/back.fbx',
        (object) => {
          console.log("Loaded walk back");
          const animationAction = mixer.clipAction(object.animations[0]);
          animationActions.push(animationAction);
          animationsFolder.add(animations, 'back');

          fbxLoader.load(
            'assets/archer/forward.fbx',
            (object) => {
              console.log("Loaded walk forward");
              const animationAction = mixer.clipAction(object.animations[0]);
              animationActions.push(animationAction);
              animationsFolder.add(animations, 'forward')

              fbxLoader.load(
                'assets/archer/forward-stop.fbx',
                (object) => {
                  console.log("Loaded forward-stop");
                  const animationAction = mixer.clipAction(object.animations[0]);
                  animationActions.push(animationAction);
                  animationsFolder.add(animations, 'forwardStop');
                  
                  fbxLoader.load(
                    'assets/archer/dancing.fbx',
                    (object) => {
                      console.log("Loaded dancing");
                      const animationAction = mixer.clipAction(object.animations[0]);
                      animationActions.push(animationAction);
                      animationsFolder.add(animations, 'dancing');

                      fbxLoader.load(
                        'assets/archer/hiphopdancing.fbx',
                        (object) => {
                          console.log("Loaded hiphopdancing");
                          const animationAction = mixer.clipAction(object.animations[0]);
                          animationActions.push(animationAction);
                          animationsFolder.add(animations, 'hiphopdancing'); // hiphopdancing
                        }
                      )
                    }
                  )
                }
              )
            }
          )
        }
      ),
        xhr => {
          console.log(`${(xhr.loaded / xhr.total) * 100}% loaded`)
        },
        error => {
          console.log(error)
        }

      modelReady = true

      charGroup = new THREE.Group();
      charGroup.add(object);
      charGroup.add(camera);
      object.position.z = camera.position.z - 1.5;
      object.rotation.y += Math.PI;

      scene.add(charGroup);
      elements.character = object;
    }
  )

  fbxLoader.load(
    'assets/house.fbx',
    object => {
      object.traverse(
        function (child) {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;

          }
        }
      );

      object.castShadow = true;
      object.scale.x = 0.45;
      object.scale.y = 0.45;
      object.scale.z = 0.45;

      object.position.x = 0;
      object.position.y = 0;
      object.position.z = -500;

      scene.add(object);
      elements.house = object;
    },
    xhr => {
      console.log(`${(xhr.loaded / xhr.total) * 100}% loaded`)
    },
    error => {
      console.log(error)
    }
  );

  animationsFolder.close()
}

function locomationCamera() {
  if (camera) {
    direction = camera.getWorldDirection(new THREE.Vector3());
    vel = 0.1
    if (keys.W) {
      charGroup.position.z += vel * direction.z;
      charGroup.position.x += vel * direction.x;
    } else if (keys.S) {
      charGroup.position.z -= vel * direction.z;
    }
  }
}

function animate() {
  const dt = clock.getDelta();

  locomationCamera();

  if (modelReady) mixer.update(dt)

  renderer.render(scene, camera);

  requestAnimationFrame(animate);
}

function createIllumination() {
  const light = new THREE.DirectionalLight(0XFFFAAD, 1.5);
  const ambientLight = new THREE.AmbientLight(0x404040);

  light.position.set(200, 500, 600);

  light.target = elements.ground;

  scene.add(light);
  scene.add(ambientLight);

  elements.light = light;
  elements.ambientLight = ambientLight;
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function init() {
  loadSky();

  setCamera();

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.shadowMap.enabled = true;
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  createGUI();
  loadObjects();


  const textLoader = new THREE.TextureLoader().load('assets/grass.png');
  textLoader.wrapS = textLoader.wrapT = THREE.RepeatWrapping;
  textLoader.repeat.set(250, 250);
  textLoader.anisotropy = 16;
  textLoader.encoding = THREE.sRGBEncoding;
  const materialGround = new THREE.MeshLambertMaterial({ map: textLoader });
  const ground = new THREE.Mesh(new THREE.PlaneBufferGeometry(10000, 10000), materialGround);
  elements.ground = ground;

  ground.rotation.x = -Math.PI / 2;
  ground.position.y -= 6;
  ground.receiveShadow = true;
  scene.add(ground);

  createIllumination()


  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);

  // window.addEventListener('resize', onWindowResize);
  document.addEventListener('mousemove', (event) => {
    const diffMouser = {
      x: event.offsetX - mouseBefore.x,
      y: event.offsetY - mouseBefore.y
    }

    if (isClick) {
      const element = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ((-diffMouser.x) * Math.PI / 180) * 0.1, 0, 'XYZ'));
      charGroup.quaternion.multiplyQuaternions(element, charGroup.quaternion);
    }

    mouseBefore = {
      x: event.offsetX,
      y: event.offsetY
    };
  });

  document.addEventListener('mouseup', () => {
    isClick = false
  });

  document.addEventListener('mousedown', () => {
    isClick = true
  });
}

function onKeyDown(event) {
  if (event.keyCode == 87) { // W
    keys.W = true;
    setAction(animationActions[2])
  }
  if (event.keyCode == 83) { // S
    keys.S = true;
    setAction(animationActions[1])
  }
  if (event.keyCode == 70) { // F
    keys.F = true;
    setAction(animationActions[4])
  }
  if (event.keyCode == 71) { // G
    keys.F = true;
    setAction(animationActions[5])
  }
}

function onKeyUp(event) {
  if (event.keyCode == 87) { // W
    keys.W = false;
    setAction(animationActions[0])
  }
  if (event.keyCode == 83) { // S
    keys.S = false;
    setAction(animationActions[0])
  }
  if (event.keyCode == 70) { // F
    keys.F = false;
    setAction(animationActions[4])
  }
  if (event.keyCode == 71) { // G
    keys.F = false;
    setAction(animationActions[5])
  }
}

window.onload = init(), animate();
