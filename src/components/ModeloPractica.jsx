import React, { useRef, useEffect, useState } from "react";
import { useLoader, useFrame } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import {
    TextureLoader,
    Sprite,
    SpriteMaterial,
    VideoTexture,
    Vector3,
} from "three";

export default function ModeloPractica() {
    // 🔹 Cargar el modelo GLB
    const gltf = useLoader(GLTFLoader, "/assets/model.glb");
    const texture = useLoader(TextureLoader, "/assets/baked.jpg");
    const screenTexture = useLoader(TextureLoader, "/assets/publicidad.jpg");
    const [targetChairPosition, setTargetChairPosition] = useState(null);
    const chairAudioRef = useRef(new Audio("/assets/chair-move.mp3")); // 🔹 Sonido de la silla
    const audioRef = useRef(new Audio("/assets/ambiente.mp3")); // 🔊 Sonido ambiente
    const noteTextures = [
        useLoader(TextureLoader, "/assets/note1.png"),
        useLoader(TextureLoader, "/assets/note2.png"),
        useLoader(TextureLoader, "/assets/note3.png"),
    ];

    const [chairInitialPos, setChairInitialPos] = useState(null);
    const plantRef = useRef();
    const modelRef = useRef();
    const chairRef = useRef();
    const speakerRef = useRef();
    const notesRef = useRef([]);
    const screenRef = useRef();
    const noteIntervalRef = useRef(null);
    // 🔹 Crear referencia para la pantalla y el video
    const screenRef1 = useRef();
    const videoRef = useRef(document.createElement("video"));

    useEffect(() => {
        if (!gltf) return;
        chairRef.current = gltf.scene.getObjectByName("chair");
        speakerRef.current = gltf.scene.getObjectByName("speaker");
        plantRef.current = gltf.scene.getObjectByName("plant");

        texture.flipY = false;
        //texture2.flipY = false;
        //texture3.flipY = true;

        // 📌 Crear video y cargarlo como textura
        videoRef.current.src = "/assets/video.mp4"; // Cambia esto por un video real
        videoRef.current.crossOrigin = "anonymous";
        videoRef.current.loop = true;
        videoRef.current.muted = true;
        videoRef.current.play(); // 🔹 Autoplay
        const videoTexture = new VideoTexture(videoRef.current);

        if (chairRef.current) {
            setChairInitialPos(chairRef.current.position.clone());
        }

        // Configurar audio en loop
        audioRef.current.loop = true;

        gltf.scene.traverse((child) => {
            if (child.isMesh) {
                if (child.name === "desktop-plane-0") {
                    child.material = child.material.clone();
                    child.material.map = videoTexture;
                    console.log("Entro y asigno!");
                } else if (child.name === "desktop-plane-1") {
                    child.material = child.material.clone();
                    child.material.map = screenTexture;
                } else {
                    child.material.map = texture;
                }
                child.material.needsUpdate = true;
                console.log("🔹 Objeto encontrado:", child.name);
            }
        });

        // Buscar la pantalla y asignar la textura
        screenRef.current = gltf.scene.getObjectByName("desktop-plane-1");
        // Obtener referencias específicas
        chairRef.current = gltf.scene.getObjectByName("chair");
        speakerRef.current = gltf.scene.getObjectByName("speaker");

        if (!chairRef.current) console.warn("No se encontró la silla");
        if (!speakerRef.current) console.warn("No se encontró el parlante");
        // 📌 Guardar la posición inicial de la silla
        if (chairRef.current) {
            setChairInitialPos(chairRef.current.position.clone());
        }

        // Configurar audio en loop
        audioRef.current.loop = true;
    }, [gltf, screenTexture]);

    // 🔹 Control de animaciones en cada frame
    useFrame(() => {
        if (chairRef.current && targetChairPosition) {
            chairRef.current.position.lerp(targetChairPosition, 0.1);
            if (chairRef.current.position.distanceTo(targetChairPosition) < 0.01) {
                setTargetChairPosition(null);
            }
        }

        // 📌 Animar las notas musicales
        notesRef.current.forEach((note, index) => {
            note.position.y += 0.02; // Subir
            note.material.opacity -= 0.005; // Desvanecerse

            if (note.material.opacity <= 0) {
                gltf.scene.remove(note);
                notesRef.current.splice(index, 1);
            }
        });
    });
    const handleChairClick = () => {
        if (chairRef.current) {
            setTargetChairPosition(
                new Vector3(
                    chairRef.current.position.x + 1.5,
                    chairRef.current.position.y,
                    chairRef.current.position.z
                )
            );
            // 🔊 Reproducir sonido al mover la silla
            chairAudioRef.current
                .play()
                .catch((error) =>
                    console.error("❌ Error al reproducir audio:", error)
                );
        }
    };
    const handleSpeakerClick = () => {
        if (audioRef.current.paused) {
            audioRef.current.play();
            console.log("🎵 Música activada");
            startNotes();
        } else {
            audioRef.current.pause();
            console.log("🔇 Música pausada");
            stopNotes();
        }
    };

    // 🎶 Función para crear notas musicales que flotan
    const startNotes = () => {
        stopNotes(); // Limpiar intervalos previos
        noteIntervalRef.current = setInterval(() => {
            if (!speakerRef.current) return;

            const texture = noteTextures[Math.floor(Math.random() * 3)];
            const material = new SpriteMaterial({
                map: texture,
                transparent: true,
                opacity: 1,
            });
            const note = new Sprite(material);

            const speakerPos = speakerRef.current.position.clone();
            note.position.set(speakerPos.x, speakerPos.y + 0.2, speakerPos.z);
            note.scale.set(0.3, 0.3, 0.3);

            gltf.scene.add(note);
            notesRef.current.push(note);
        }, 500);
    };

    const stopNotes = () => {
        clearInterval(noteIntervalRef.current);
    };

    const handlePlantClick = () => {
        if (!chairRef.current || !chairInitialPos) return;

        console.log("🌿 Click en planta: restaurando silla");
        setTargetChairPosition(chairInitialPos.clone());
    };

    // 📌 Función para manejar clic en la pantalla y reproducir/pausar video
    const handleScreenClick = () => {
        if (videoRef.current.paused) {
            videoRef.current.play();
            console.log("▶️ Video reproduciéndose");
        } else {
            videoRef.current.pause();
            console.log("⏸️ Video pausado");
        }
    };

    // 📌 Detectar clic en los objetos del modelo
    const handleObjectClick = (event) => {
        event.stopPropagation();
        const clickedObject = event.object.name;
        console.log(clickedObject);
        if (clickedObject === "chair") {
            handleChairClick();
            console.log("🌿 Click en silla");
        } else if (clickedObject === "speaker") {
            handleSpeakerClick();
            console.log("🌿 Click en Speaker");
        } else if (clickedObject === "plant") {
            console.log("🌿 Click en planta: restaurando silla");
            handlePlantClick();
        } else if (clickedObject === "desktop-plane-1") {
            console.log("🖥️ Click en monitor 1");
        } else if (clickedObject === "desktop-plane-0") {
            console.log("🖥️ Click en mause");
            handleScreenClick();
        } else if (clickedObject === "mouse") {
            console.log("🖥️ Click en mause");
            handleScreenClick();
        }
    };

    return (
        <primitive
            object={gltf.scene}
            scale={1}
            position={[0, -1, 0]}
            onPointerDown={handleObjectClick}
        //onPointerDown={(event) => {
        //    if (event.object.name === "chair") handleChairClick();
        //    if (event.object.name === "speaker") handleSpeakerClick();
        //    if (event.object.name === "plant") handlePlantClick();
        //}}
        />
    );
}
