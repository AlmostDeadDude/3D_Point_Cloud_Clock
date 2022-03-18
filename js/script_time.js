let scene, camera, renderer, controls, hoursGroup, minutesGroup, secondsGroup, dotsGroup;
const container = document.querySelector('#container');
const shuffleBtn = document.getElementById('shuffleBtn');

const clock = new THREE.Clock();
let stats;

// const sprite = createCircleTexture();
// const sprite = new THREE.TextureLoader().load("img/disc_cat.png");
// const sprite = new THREE.TextureLoader().load("img/disc_big_white.png");
// const sprite = new THREE.TextureLoader().load("img/disc_thicc.png");
const sprite = new THREE.TextureLoader().load("img/clock_face.svg");
const pMat = new THREE.PointsMaterial()

// sprite.anisotropy = 8;
// sprite.magFilter = THREE.NearestFilter;
// sprite.minFilter = THREE.NearestFilter;

const letterLookUp = {};

let LOADED = false;

let firstStage = undefined;
let secondStage = {
    sec: undefined,
    tenSec: undefined,
    min: undefined,
    tenMin: undefined,
    hr: undefined,
    tenHr: undefined
};

const message = '0123456789'
const withoutSpace = message.replace(/ /g, "");

let tempTime = new Date();
const c = {
    now: tempTime,
    timeText: tempTime.getTime(),
    hr: tempTime.getHours(),
    min: tempTime.getMinutes(),
    sec: tempTime.getSeconds()
}

init()
animate()

function init() {

    var w = container.offsetWidth;
    var h = container.offsetHeight;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xfaebd7);

    camera = new THREE.PerspectiveCamera(45, w / h, 1, 50000);
    camera.position.set(0, 0, 15000);
    camera.lookAt(scene.position);

    // const light = new THREE.AmbientLight(0xFFFFFF, 1);
    // scene.add(light);

    hoursGroup = new THREE.Group();
    minutesGroup = new THREE.Group();
    secondsGroup = new THREE.Group();
    dotsGroup = new THREE.Group();

    // pMat.color = new THREE.Color(0xf0ff1a)
    pMat.size = 50
    pMat.map = sprite
    pMat.alphaTest = 0.3;
    pMat.transparent = true;

    loadPCs(message)

    addSemicolons()

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(w, h);
    renderer.autoClear = false;
    container.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);

    const grid = new THREE.GridHelper(30000, 30);
    grid.rotation.x = -Math.PI / 2;
    scene.add(grid);

    // const grid2 = new THREE.GridHelper(30000, 30);
    // scene.add(grid2);

    // const grid3 = new THREE.GridHelper(30000, 30);
    // grid3.rotation.z = -Math.PI / 2;
    // scene.add(grid3)

    stats = new Stats();
    container.appendChild(stats.dom);

    window.addEventListener('resize', onWindowResize);
    shuffleBtn.addEventListener('click', updateClock)
}

function onWindowResize() {

    camera.aspect = container.offsetWidth / container.offsetHeight;
    camera.updateProjectionMatrix();

    camera.lookAt(scene.position);

    renderer.setSize(container.offsetWidth, container.offsetHeight);

}

function animate() {

    requestAnimationFrame(animate);
    render();
    stats.update();
}

function render() {
    // let delta = 10 * clock.getDelta();
    // scene.rotation.y += -0.02 * delta;
    updateClock()
    controls.update();
    renderer.render(scene, camera);
}

function createCircleTexture() {
    var matCanvas = document.createElement('canvas');
    matCanvas.width = matCanvas.height = 256;
    var matContext = matCanvas.getContext('2d');
    // create texture object from canvas.
    var texture = new THREE.Texture(matCanvas);
    // Draw a circle
    var center = 256 / 2;
    matContext.beginPath();
    matContext.arc(center, center, 256 / 2, 0, 2 * Math.PI, false);
    matContext.closePath();
    matContext.fillStyle = '#ffffff';
    matContext.fill();
    // need to set needsUpdate
    texture.needsUpdate = true;
    texture.anisotropy = 0;
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    // return a texture made from the canvas
    return texture;
}



function updateClock() {
    if (LOADED) {
        //the problem is that we update the entire clock but we only need to do it to some digits. So we probably want to take a look at a current timer and decide what digits need to be changed, like if seconds end with a 9 we want to change both last digits and so on. This can be hardcoded since we know exactly what to expect, maybe the first step is problematic, but then we just check the current time right here and decide what digits are to be changed or something like this
        let timeDelta = (new Date().getTime() - c.timeText)
        //we can define as many stages with various durations as we want by just repeating following basic idea (which is 50/50)
        if (timeDelta < 500) {
            let stageProgress = timeDelta / 500
            //console.log(`%c${(stageProgress*100).toFixed(2)}%`, 'color:red');

            //first stage - random movement for each point
            if (!firstStage) {
                firstStage = []
                //if movement was not yet defined - define it
                //take output positions number and create the vector like [dx dy dz dx dy dz...] with matching length where deltas are all random numbers in certain interval. Those are the directions we then apply to the input. Input's length can be matched to the output's here or in the second stage. 
                let spreadDist = 250
                for (let i = 0; i < secondsGroup.children[1].geometry.attributes.position.array.length; i++) {
                    firstStage.push(spreadDist * Math.random() - spreadDist / 2)
                }
            } else {
                //Each point position is then the inputPosition + stageProgress * deltas so it moves in a random direction more and more each frame
                //set seconds
                setPointsPositions(secondsGroup.children[1], firstStage, stageProgress)

                //set tens of seconds
                if ((c.sec % 10) === 9) {
                    setPointsPositions(secondsGroup.children[0], firstStage, stageProgress)

                    //set minutes
                    if (c.sec === 59) {
                        setPointsPositions(minutesGroup.children[1], firstStage, stageProgress)

                        //set tens of minutes
                        if ((c.min % 10) === 9) {
                            setPointsPositions(minutesGroup.children[0], firstStage, stageProgress)

                            //set hours
                            if (c.min === 59) {
                                setPointsPositions(hoursGroup.children[1], firstStage, stageProgress)

                                //set tens of hours
                                if ((c.hr % 10) === 9 || c.hr === 23) {
                                    setPointsPositions(hoursGroup.children[0], firstStage, stageProgress)
                                }
                            }
                        }
                    }
                }
            }

        } else if (timeDelta < 1000) {
            let stageProgress = (timeDelta - 500) / 500
            //console.log(`%c${(stageProgress * 100).toFixed(2)}%`, 'color:green');
            firstStage = undefined
            dotsFirstStage = undefined

            //second stage - correction movement for each point
            if (!secondStage.sec) {
                computeMovementToNextStage('sec', (+pad(c.sec)[1] + 1) % 10, secondsGroup.children[1])

                if ((c.sec % 10) === 9) {
                    computeMovementToNextStage('tenSec', (+pad(c.sec)[0] + 1) % 6, secondsGroup.children[0])

                    if (c.sec === 59) {
                        computeMovementToNextStage('min', (+pad(c.min)[1] + 1) % 10, minutesGroup.children[1])

                        if ((c.min % 10) === 9) {
                            computeMovementToNextStage('tenMin', (+pad(c.min)[0] + 1) % 6, minutesGroup.children[0])

                            if (c.min === 59) {
                                //slight problem with 24 hour format here... 
                                if (c.hr === 23) {
                                    computeMovementToNextStage('hr', 0, hoursGroup.children[1])
                                    computeMovementToNextStage('tenHr', 0, hoursGroup.children[0])
                                } else {
                                    computeMovementToNextStage('hr', (+pad(c.hr)[1] + 1) % 10, hoursGroup.children[1])

                                    if ((c.hr % 10) === 9) {
                                        computeMovementToNextStage('tenHr', (+pad(c.hr)[0] + 1) % 10, hoursGroup.children[0])
                                    }
                                }
                            }
                        }
                    }
                }
                //there is also that thing with NaNs since the length of point cloud before and after are always different... it seems to work though, i guess such points are just ignored, so i'll keep it even though it doesn't feel clean
            } else {
                setPointsPositions(secondsGroup.children[1], secondStage.sec, stageProgress)

                if ((c.sec % 10) === 9) {
                    setPointsPositions(secondsGroup.children[0], secondStage.tenSec, stageProgress)

                    if (c.sec === 59) {
                        setPointsPositions(minutesGroup.children[1], secondStage.min, stageProgress)

                        if ((c.min % 10) === 9) {
                            setPointsPositions(minutesGroup.children[0], secondStage.tenMin, stageProgress)

                            if (c.min === 59) {
                                setPointsPositions(hoursGroup.children[1], secondStage.hr, stageProgress)

                                if ((c.hr % 10) === 9 || c.hr === 23) {
                                    setPointsPositions(hoursGroup.children[0], secondStage.tenHr, stageProgress)
                                }
                            }
                        }
                    }
                }
            }

        } else {
            // console.log(clock.getDelta())

            //here we create a new time object after 1 second passes
            c.now = new Date()
            c.timeText = c.now.getTime()
            c.sec = c.now.getSeconds()
            c.min = c.now.getMinutes()
            c.hr = c.now.getHours()

            //making sure the positions are correct and animation is finished
            hardSetClock()

            //clearing the movement vectors of previous stages to prepare it for fresh new random movement in the next clock update
            firstStage = undefined
            secondStage.sec = undefined
            //no need to clear others, since it always starts with the sec check
        }
    }
}

function setPointsPositions(object, movement, progress) {
    let tempPos = []
    //deltas were defined previously, so we keep using them
    for (let j = 0; j < object.geometry.attributes.position.array.length; j++) {
        tempPos.push(object.geometry.attributes.InitialPosition.array[j] + movement[j] * progress)
    }
    object.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(tempPos), 3))
}

function computeMovementToNextStage(stage, nextlookUp, object) {
    secondStage[stage] = []
    //after the first stage the points are in a somewhat random position so we need to compute the directions for them to reach the output's positions. We find those deltas as targetPos - currentPos and apply them to the actual positions vector in a same way as in the first stage, using the stageProgress. At the end the points should be very close to the target positions, but if not we just set the positions to the target positions in the following else
    for (let k = 0; k < letterLookUp[nextlookUp].geometry.attributes.position.array.length; k++) {
        secondStage[stage].push(letterLookUp[nextlookUp].geometry.attributes.position.array[k] - object.geometry.attributes.position.array[k])
    }
    //update the initial position attribute so it is basically the initial position after the first stage instead of initial position before the first stage
    object.geometry.setAttribute('InitialPosition', object.geometry.attributes.position)
}

function pad(n) {
    return n < 10 ? '0' + n : n.toString()
}

function loadPCs(string) {
    //get rid of whitespaces
    string = string.trim();
    let arrStr = string.split("")
    arrStr.forEach((letter, ind) => {
        //for now only constant offset, later can be computed dynamically through bounding box and stuff
        //also height of some letters might be fixable through txt-pcd conversion, by not reducing coordinates
        addLetter(letter, ind)
    })

}

function addLetter(letter, ind) {

    const loader = new THREE.PCDLoader();
    loader.load(`pc/numbers/${letter}.pcd`, function (points) {

        letterLookUp[letter] = points //.geometry.boundingBox.max.x

        if (letter === '1') {
            for (let i = 0; i < points.geometry.attributes.position.count; i++) {
                points.geometry.attributes.position.array[3 * i] += 300;
            }
        }

        if (ind + 1 == withoutSpace.length) {
            hoursGroup.add(new THREE.Points(new THREE.BufferGeometry(), pMat))
            hoursGroup.add(new THREE.Points(new THREE.BufferGeometry(), pMat))
            hoursGroup.traverse(function (object) {
                object.frustumCulled = false;
            });
            hoursGroup.children[1].position.setX(1300)
            minutesGroup.add(new THREE.Points(new THREE.BufferGeometry(), pMat))
            minutesGroup.add(new THREE.Points(new THREE.BufferGeometry(), pMat))
            minutesGroup.traverse(function (object) {
                object.frustumCulled = false;
            });
            minutesGroup.children[1].position.setX(1300)
            secondsGroup.add(new THREE.Points(new THREE.BufferGeometry(), pMat))
            secondsGroup.add(new THREE.Points(new THREE.BufferGeometry(), pMat))
            secondsGroup.traverse(function (object) {
                object.frustumCulled = false;
            });
            secondsGroup.children[1].position.setX(1300)

            hoursGroup.position.setX(-4500)
            minutesGroup.position.setX(-1000)
            secondsGroup.position.setX(2500)

            hardSetClock()

            scene.add(hoursGroup)
            scene.add(minutesGroup)
            scene.add(secondsGroup)

            LOADED = true
        }
    });
}

function addSemicolons() {
    let len = 300
    let positions = []
    let mesh_size = 300
    for (let i = 0; i < len; i++) {
        let x = Math.random() * mesh_size - mesh_size / 2
        let y = Math.random() * mesh_size - mesh_size / 2
        let z = Math.random() * mesh_size - mesh_size / 2

        positions.push(x)
        positions.push(y)
        positions.push(z)

    }

    let dotsGeo = new THREE.BufferGeometry()
    dotsGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3))
    dotsGeo.setAttribute('InitialPosition', new THREE.BufferAttribute(new Float32Array(positions), 3))

    let cubePoints = new THREE.Points(dotsGeo, pMat)
    cubePoints.position.set(-1500, 1000, mesh_size / 2)
    let cubePoints2 = cubePoints.clone()
    cubePoints.position.set(-1500, 500, mesh_size / 2)
    let cubePoints3 = cubePoints.clone()
    cubePoints.position.set(2000, 1000, mesh_size / 2)
    let cubePoints4 = cubePoints.clone()
    cubePoints.position.set(2000, 500, mesh_size / 2)

    dotsGroup.add(cubePoints)
    dotsGroup.add(cubePoints2)
    dotsGroup.add(cubePoints3)
    dotsGroup.add(cubePoints4)

    scene.add(dotsGroup)
}

function hardSetClock() {
    hoursGroup.children[0].geometry.setAttribute('position', letterLookUp[pad(c.hr)[0]].geometry.attributes.position)
    hoursGroup.children[0].geometry.setAttribute('InitialPosition', letterLookUp[pad(c.hr)[0]].geometry.attributes.position)
    hoursGroup.children[1].geometry.setAttribute('position', letterLookUp[pad(c.hr)[1]].geometry.attributes.position)
    hoursGroup.children[1].geometry.setAttribute('InitialPosition', letterLookUp[pad(c.hr)[1]].geometry.attributes.position)
    minutesGroup.children[0].geometry.setAttribute('position', letterLookUp[pad(c.min)[0]].geometry.attributes.position)
    minutesGroup.children[0].geometry.setAttribute('InitialPosition', letterLookUp[pad(c.min)[0]].geometry.attributes.position)
    minutesGroup.children[1].geometry.setAttribute('position', letterLookUp[pad(c.min)[1]].geometry.attributes.position)
    minutesGroup.children[1].geometry.setAttribute('InitialPosition', letterLookUp[pad(c.min)[1]].geometry.attributes.position)
    secondsGroup.children[0].geometry.setAttribute('position', letterLookUp[pad(c.sec)[0]].geometry.attributes.position)
    secondsGroup.children[0].geometry.setAttribute('InitialPosition', letterLookUp[pad(c.sec)[0]].geometry.attributes.position)
    secondsGroup.children[1].geometry.setAttribute('position', letterLookUp[pad(c.sec)[1]].geometry.attributes.position)
    secondsGroup.children[1].geometry.setAttribute('InitialPosition', letterLookUp[pad(c.sec)[1]].geometry.attributes.position)
}