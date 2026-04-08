const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);
let scene;

function createScene() {

    const scene = new BABYLON.Scene(engine);

// STATE
    let modelIndex = 0;
    let currentModel = null;
    
    const MODELS = [
        "https://raw.githubusercontent.com/dezz46/WebGl-assets/main/LOU_model_babylon.glb",
        "https://raw.githubusercontent.com/dezz46/WebGl-assets/main/TT_Sofa_model.glb",
        "https://raw.githubusercontent.com/dezz46/WebGl-assets/main/duck.glb",
        "https://raw.githubusercontent.com/dezz46/WebGl-assets/main/rolex.glb"
    ];

// UI BUTTON

    const gui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
    gui.isPointerBlocker = false;

    const button = new BABYLON.GUI.Ellipse();
    button.width = "100px";
    button.height = "100px";
    button.background = "black";
    button.thickness = 0;
    button.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    button.top = "60px";
    button.isPointerBlocker = true;

    gui.addControl(button);

    const icon = new BABYLON.GUI.Image(
        "icon",
        "https://img.icons8.com/ios-filled/100/ffffff/change.png"
    );
    icon.width = "50px";
    icon.height = "60px";

    button.addControl(icon);

    button.onPointerEnterObservable.add(() => {
        button.scaleX = 1.1;
        button.scaleY = 1.1;
    });

    button.onPointerOutObservable.add(() => {
        button.scaleX = 1;
        button.scaleY = 1;
    });

    button.onPointerUpObservable.add(() => {

    if (!currentModel) return;

    // 🔥 morph
    morphModel();


    });

// FONT

    const font = new FontFace(
        "Bauhaus",
        "url(https://static.wfonts.com/data/2016/05/19/bauhaus-bold/bauhaub.ttf)"
    );

    font.load().then(() => document.fonts.add(font));

// SCENE + CAMERA

    scene.clearColor = new BABYLON.Color3(1, 0.784, 0);

    const camera = new BABYLON.ArcRotateCamera(
        "camera",
        Math.PI / 2,
        Math.PI / 3,
        3,
        BABYLON.Vector3.Zero(),
        scene
    );

    camera.attachControl(canvas, true);

    camera.inertia = 0.8;
    camera.panningSensibility = 1000;
    camera.panningInertia = 0.2;
    camera.angularSensibilityX = 500;
    camera.angularSensibilityY = 500;

    camera.lowerBetaLimit = 0.01;
    camera.upperBetaLimit = Math.PI - 0.01;

// TEXT SYSTEM

    const TEXT_ITEMS = [
        "3d product","archviz","VR","digital twins","AR",
        "3d render","3d modeling","ad creatives","hero shots",
        "commercial ads","social media ads","configurator",
        "cgi","animation","virtual showroom","interactive"
    ];

    const textMeshes = [];

    function createTextMesh(text) {

        const texture = new BABYLON.DynamicTexture("dt", { width: 1024, height: 256 }, scene);
        const ctx = texture.getContext();

        function draw(highlight = false) {
            ctx.clearRect(0, 0, 1024, 256);

            ctx.font = "bold 120px Bauhaus";
            ctx.lineWidth = 1;

            if (highlight) {
                ctx.fillStyle = "black";
                ctx.fillText(text, 50, 150);
            } else {
                ctx.strokeStyle = "black";
                ctx.strokeText(text, 50, 150);
            }

            texture.update();
        }

        draw(false);

        const mat = new BABYLON.StandardMaterial("mat", scene);
        mat.diffuseTexture = texture;
        mat.emissiveTexture = texture;
        mat.opacityTexture = texture;
        mat.backFaceCulling = false;

        const plane = BABYLON.MeshBuilder.CreatePlane("text", {
            width: 3,
            height: 0.8
        }, scene);

        plane.material = mat;

        plane.metadata = {
            isText: true,
            draw: draw,
            highlighted: false,
            baseY: 0,
            floatOffset: Math.random() * 10
        };

        return plane;
    }

    // DISTRIBUTION
    const COLS = 15;
    const ROWS = 8;
    const RADIUS = 8;
    const HEIGHT = 6;

    let positions = [];

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const offset = (r % 2 === 0) ? 0 : (0.5 / COLS);
            const angle = ((c / COLS) + offset) * Math.PI * 2;
            const y = (r / (ROWS - 1) - 0.5) * HEIGHT;

            positions.push({ angle, y });
        }
    }

    positions.sort(() => Math.random() - 0.5);

    positions.forEach((pos, i) => {

        const mesh = createTextMesh(TEXT_ITEMS[i % TEXT_ITEMS.length]);

        mesh.position.x = Math.cos(pos.angle) * RADIUS;
        mesh.position.z = Math.sin(pos.angle) * RADIUS;
        mesh.position.y = pos.y;

        mesh.metadata.baseY = mesh.position.y;

        textMeshes.push(mesh);
    });

    scene.registerBeforeRender(() => {

        const time = performance.now() * 0.0003;

        textMeshes.forEach(m => {
            m.lookAt(camera.position);
            m.rotate(BABYLON.Axis.Y, Math.PI);

            m.position.y = m.metadata.baseY +
                Math.sin(time + m.metadata.floatOffset) * 0.05;
        });
    });

    // 🔥 FIXED HIGHLIGHT SYSTEM
    setInterval(() => {

        textMeshes.forEach(m => m.metadata.draw(false));

        for (let i = 0; i < 5; i++) {
            const m = textMeshes[Math.floor(Math.random() * textMeshes.length)];
            m.metadata.draw(true);
        }

    }, 5000);

// LIGHTING

    scene.environmentTexture = BABYLON.CubeTexture.CreateFromPrefilteredData(
        "https://assets.babylonjs.com/environments/studio.env",
        scene
    );

    scene.environmentIntensity = 1.5;

    scene.imageProcessingConfiguration.toneMappingEnabled = true;
    scene.imageProcessingConfiguration.toneMappingType =
        BABYLON.ImageProcessingConfiguration.TONEMAPPING_ACES;

    scene.imageProcessingConfiguration.exposure = 1.2;
    scene.imageProcessingConfiguration.contrast = 1.2;

// MODEL LOAD

    BABYLON.SceneLoader.ImportMesh("", "", MODELS[0], scene, function(meshes) {

    currentModel = new BABYLON.TransformNode("modelRoot", scene);

    meshes.forEach(m => {
        if (m.name !== "__root__") {
            m.parent = currentModel;
        }
    });

    // 🔥 NORMALIZE POSITION
    const bounds = currentModel.getHierarchyBoundingVectors(true);
    const center = bounds.min.add(bounds.max).scale(0.5);
    const size = bounds.max.subtract(bounds.min).length();

    currentModel.position.copyFrom(center);

    // camera setup
    camera.target = center.add(new BABYLON.Vector3(0,size * 0.4, 0));
    camera.radius = size * 1.5;

    camera.lowerRadiusLimit = size * 0.8;
    camera.upperRadiusLimit = size * 3;
    camera.wheelPrecision = 100 / size;
    camera.minZ = size * 0.01;
    });

    let isMorphing = false;

    function morphModel() {

    if (!currentModel || isMorphing) return;
    isMorphing = true;

    const oldModel = currentModel;

    // 🔁 next model FIRST
    modelIndex = (modelIndex + 1) % MODELS.length;

    // -----------------------
    // 🔧 EASING FUNCTIONS
    // -----------------------
    const easeIn = new BABYLON.CubicEase();
    easeIn.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEIN);

    const easeOut = new BABYLON.CubicEase();
    easeOut.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEOUT);

    // -----------------------
    // 🔥 PHASE 1 — ACCELERATE OUT
    // -----------------------
    const animOut = new BABYLON.Animation(
        "rotateOut",
        "rotation.y",
        60,
        BABYLON.Animation.ANIMATIONTYPE_FLOAT,
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    animOut.setKeys([
        { frame: 0, value: oldModel.rotation.y },
        { frame: 20, value: oldModel.rotation.y + Math.PI * 2 } // fast spin
    ]);

    animOut.setEasingFunction(easeIn);

    oldModel.animations = [animOut];

    scene.beginAnimation(oldModel, 0, 20, false, 1, () => {

        // -----------------------
        // 🔥 SWITCH MODEL
        // -----------------------
        oldModel.getChildMeshes().forEach(m => m.dispose());
        oldModel.dispose();

        BABYLON.SceneLoader.ImportMesh("", "", MODELS[modelIndex], scene, function(meshes) {

            currentModel = new BABYLON.TransformNode("modelRoot", scene);

            meshes.forEach(m => {
                if (m.name !== "__root__") {
                    m.parent = currentModel;
                }
            });

            // center
            const bounds = currentModel.getHierarchyBoundingVectors(true);
            const center = bounds.min.add(bounds.max).scale(0.5);
            currentModel.position.copyFrom(center);

            // -----------------------
            // 🔥 PHASE 2 — FAST ROTATION IN
            // -----------------------
            const fastSpin = new BABYLON.Animation(
                "spinIn",
                "rotation.y",
                60,
                BABYLON.Animation.ANIMATIONTYPE_FLOAT,
                BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
            );

            fastSpin.setKeys([
                { frame: 0, value: currentModel.rotation.y },
                { frame: 15, value: currentModel.rotation.y + Math.PI * 2 }
            ]);

            // -----------------------
            // 🔥 PHASE 3 — EASE OUT
            // -----------------------
            const slowStop = new BABYLON.Animation(
                "easeOut",
                "rotation.y",
                60,
                BABYLON.Animation.ANIMATIONTYPE_FLOAT,
                BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
            );

            slowStop.setKeys([
                { frame: 15, value: currentModel.rotation.y + Math.PI * 2 },
                { frame: 40, value: currentModel.rotation.y + Math.PI * 2.2 }
            ]);

            slowStop.setEasingFunction(easeOut);

            currentModel.animations = [fastSpin, slowStop];

            scene.beginAnimation(currentModel, 0, 40, false, 1, () => {
                isMorphing = false;
            });

        });

    });}

return scene;
};

scene = createScene();

engine.runRenderLoop(() => {
    scene.render();
});

window.addEventListener("resize", () => {
    engine.resize();
});


