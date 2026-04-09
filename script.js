const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);
let scene;

function createScene() {

    const scene = new BABYLON.Scene(engine);

// 🔥 LOADING UI

    const loadingUI = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("loadingUI");

    const container = new BABYLON.GUI.StackPanel();
    container.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;

    loadingUI.addControl(container);

    // ROTATING ICON
    const loaderIcon = new BABYLON.GUI.Image(
      "loaderIcon",
        "https://raw.githubusercontent.com/dezz46/WebGl-assets/main/Qrotate.png"
    );
    loaderIcon.width = "300px";
    loaderIcon.height = "243px";
    loaderIcon.alpha = 0;

    container.addControl(loaderIcon);
    container.isVertical = true;
    container.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;

    // TEXT
    const loaderText = new BABYLON.GUI.Image(
        "loaderText",
        "https://raw.githubusercontent.com/dezz46/WebGl-assets/main/loading.png"
    );
    loaderText.width = "300px";
    loaderText.height = "220px";
    loaderText.alpha = 0;

    container.addControl(loaderText);
    container.isVertical = true;
    container.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;

    //intro loading
    function introLoadingAnim() {

    [loaderIcon, loaderText].forEach(el => {

        el.scaleX = 1;
        el.scaleY = 1;

        BABYLON.Animation.CreateAndStartAnimation(
            "fadeIn",
            el,
            "alpha",
            60,
            30,
            0,
            1
        );

        BABYLON.Animation.CreateAndStartAnimation(
            "scaleIn",
            el,
            "scaleX",
            60,
            30,
            0.8,
            1
        );

        BABYLON.Animation.CreateAndStartAnimation(
            "scaleInY",
            el,
            "scaleY",
            60,
            30,
            0.8,
            1
        );
    });
    }

    loaderIcon.alpha = 1;
    loaderText.alpha = 1;

    loadingUI.isForeground = true;

    //rotationloop
    scene.registerBeforeRender(() => {
    loaderIcon.rotation += 0.05;
    });

    //exitanim
    function exitLoadingAnim(callback) {

    [loaderIcon, loaderText].forEach(el => {

        BABYLON.Animation.CreateAndStartAnimation(
            "fadeOut",
            el,
            "alpha",
            60,
            30,
            1,
            0
        );

        BABYLON.Animation.CreateAndStartAnimation(
            "scaleOut",
            el,
            "scaleX",
            60,
            30,
            1,
            1.3
        );

        BABYLON.Animation.CreateAndStartAnimation(
            "scaleOutY",
            el,
            "scaleY",
            60,
            30,
            1,
            1.3
        );
    });

    setTimeout(() => {
        loadingUI.dispose();
        callback();
    }, 500);
    }

    


// STATE
    let modelIndex = 0;
    let currentModel = null;
    
    const MODELS = [
        "https://raw.githubusercontent.com/dezz46/WebGl-assets/main/LOU_model_babylon.glb",
        "https://raw.githubusercontent.com/dezz46/WebGl-assets/main/TT_Sofa_model.glb",
        "https://raw.githubusercontent.com/dezz46/WebGl-assets/main/TT_Shelf.glb",
        "https://raw.githubusercontent.com/dezz46/WebGl-assets/main/KitchenSink.glb"
    ];

    // UI BUTTON

    function createArrow(direction = "left") {

    const arrow = new BABYLON.GUI.Image(
        "arrow",
        "https://raw.githubusercontent.com/dezz46/WebGl-assets/main/rightArrow.png"
    );

    arrow.width = "120px";
    arrow.height = "300px";

    // flip for left
    if (direction === "left") {
        arrow.rotation = Math.PI; //  flip
    }

    arrow.alpha = 0.5; // 👈 key for "behind feel"

    // hover
    arrow.onPointerEnterObservable.add(() => {
        arrow.scaleX = 1.2;
        arrow.scaleY = 1; // only horizontal stretch
        arrow.alpha = 1;
    });

    arrow.onPointerOutObservable.add(() => {
        arrow.scaleX = 1;
        arrow.scaleY = 1;
        arrow.alpha = 0.5;
    });

    arrow.isPointerBlocker = true;

    return arrow;
    }
    

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

    // Prevent page scroll
    let isHovering = false;
    canvas.addEventListener("pointerenter", () => isHovering = true);
    canvas.addEventListener("pointerleave", () => isHovering = false);
    canvas.addEventListener("wheel", (e) => {
        if (isHovering) {
            e.preventDefault();   
        }
    }, { passive: false });

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

// =======================
// 🔥 PRELOAD SYSTEM
// =======================

const loadedModels = [];
let loadedCount = 0;

introLoadingAnim();

setTimeout(() => {

    MODELS.forEach((url, index) => {

        BABYLON.SceneLoader.ImportMesh("", "", url, scene, function(meshes) {

            const root = new BABYLON.TransformNode("model_" + index, scene);

            meshes.forEach(m => {
                if (m.name !== "__root__") {
                    m.parent = root;
                }
            });

            root.setEnabled(false);
            loadedModels[index] = root;

            loadedCount++;

            if (loadedCount === MODELS.length) {
                onAllModelsLoaded();
            }
        });
    });
}, 100);


// =======================
// 🔥 FIRST MODEL AFTER LOAD
// =======================

function onAllModelsLoaded() {

    exitLoadingAnim(() => {


        // --- GUI ROOT ---
    const gui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
    gui.isForeground = true; // keep UI active

    // LEFT
    const leftArrow = createArrow("left");
    leftArrow.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    leftArrow.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    leftArrow.left = "40px";

    gui.addControl(leftArrow);

    // RIGHT
    const rightArrow = createArrow("right");
    rightArrow.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    rightArrow.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    rightArrow.left = "-40px";

    gui.addControl(rightArrow);

    // --- CLICK EVENTS ---
    leftArrow.onPointerUpObservable.add(() => morphModel(-1));
    rightArrow.onPointerUpObservable.add(() => morphModel(1));
    
// FONT

    const font = new FontFace(
        "Bauhaus",
        "url(https://static.wfonts.com/data/2016/05/19/bauhaus-bold/bauhaub.ttf)"
    );

    font.load().then(() => document.fonts.add(font));

        currentModel = loadedModels[0];
        currentModel.setEnabled(true);

        const bounds = currentModel.getHierarchyBoundingVectors(true);
        const center = bounds.min.add(bounds.max).scale(0.5);
        const size = bounds.max.subtract(bounds.min).length();

        currentModel.position.copyFrom(center);

        camera.target = center.add(new BABYLON.Vector3(0, size * 0.4, 0));
        camera.radius = size * 1.5;

        camera.lowerRadiusLimit = size * 0.8;
        camera.upperRadiusLimit = size * 3;
        camera.wheelPrecision = 100 / size;
        camera.minZ = size * 0.01;

    });
}


// =======================
// 🔥 MORPH MODEL (PRELOADED)
// =======================

let isMorphing = false;

function morphModel(direction = 1) {

    if (!currentModel || isMorphing) return;
    isMorphing = true;

    const oldModel = currentModel;

    // 🔁 LOOP INDEX
    modelIndex += direction;
    if (modelIndex >= loadedModels.length) modelIndex = 0;
    if (modelIndex < 0) modelIndex = loadedModels.length - 1;

    const newModel = loadedModels[modelIndex];

    // -----------------------
    // 🔧 EASING
    // -----------------------
    const easeIn = new BABYLON.CubicEase();
    easeIn.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEIN);

    const easeOut = new BABYLON.CubicEase();
    easeOut.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEOUT);

    // -----------------------
    // 🔥 ROTATE OUT
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
        { frame: 20, value: oldModel.rotation.y + Math.PI * 2 }
    ]);

    animOut.setEasingFunction(easeIn);

    oldModel.animations = [animOut];

    scene.beginAnimation(oldModel, 0, 20, false, 1, () => {

        oldModel.setEnabled(false);

        // 🔥 ACTIVATE NEW MODEL
        currentModel = newModel;
        currentModel.setEnabled(true);

        // 🔥 RECENTER CAMERA (important)
        const bounds = currentModel.getHierarchyBoundingVectors(true);
        const center = bounds.min.add(bounds.max).scale(0.5);
        const size = bounds.max.subtract(bounds.min).length();

        currentModel.position.copyFrom(center);

        camera.target = center.add(new BABYLON.Vector3(0, size * 0.4, 0));
        camera.radius = size * 1.5;

        // -----------------------
        // 🔥 ROTATE IN
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
    }

return scene;
}

scene = createScene();

engine.runRenderLoop(() => {
    scene.render();
});

window.addEventListener("resize", () => {
    engine.resize();
});
