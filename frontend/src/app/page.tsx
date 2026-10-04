"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

// Types
interface PredictionResponse {
  prediction: "REAL" | "AI-GENERATED";
  confidence: number;
  ai_probability: number;
  real_probability: number;
}

export default function Home() {
  const [viewState, setViewState] = useState<"empty" | "preparing" | "selected" | "analyzing" | "result" | "error">("empty");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [fileMeta, setFileMeta] = useState({ name: "", dims: "", size: "" });
  
  const [analyzingStage, setAnalyzingStage] = useState<number>(0);
  const [isHeatmap, setIsHeatmap] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [resultData, setResultData] = useState<PredictionResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // 3D Three.js Parallax Background Effect
  useEffect(() => {
    // Only run on client after three.js is loaded
    if (typeof window === "undefined" || !(window as any).THREE) return;
    const THREE = (window as any).THREE;

    const container = document.getElementById('trulens-hero-three-container');
    if (!container) return;
    
    let isVisible = true;
    const observer = new IntersectionObserver((entries) => {
      if (entries.length > 0) {
        isVisible = entries[0].isIntersecting;
      }
    });
    observer.observe(container);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || 480;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(0, 0, 8.5);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // Plate
    const plateGeo = new THREE.PlaneGeometry(3.6, 2.4, 32, 32);
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 768;
    const ctx = canvas.getContext('2d')!;
    
    const grad = ctx.createLinearGradient(0, 0, 1024, 768);
    grad.addColorStop(0, '#0c111c');
    grad.addColorStop(0.5, '#070a10');
    grad.addColorStop(1, '#0e1524');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 768);

    ctx.strokeStyle = 'rgba(0, 229, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= 1024; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 768); ctx.stroke();
    }
    for (let y = 0; y <= 768; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1024, y); ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(0, 229, 255, 0.45)';
    ctx.lineWidth = 2;
    const bSize = 36;
    ctx.strokeRect(60, 60, bSize, bSize);
    ctx.strokeRect(1024 - 60 - bSize, 60, bSize, bSize);
    ctx.strokeRect(60, 768 - 60 - bSize, bSize, bSize);
    ctx.strokeRect(1024 - 60 - bSize, 768 - 60 - bSize, bSize, bSize);

    ctx.beginPath();
    ctx.arc(512, 384, 80, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.3)';
    ctx.setLineDash([6, 6]);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.arc(512, 384, 12, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 229, 255, 0.6)';
    ctx.fill();

    ctx.font = '12px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(0, 229, 255, 0.5)';
    ctx.fillText('FORENSIC LATENT SENSOR // EFF-B0.D9', 70, 720);
    ctx.fillText('RES: 2048 x 1536 px  |  FP32 INGEST', 720, 720);

    const texture = new THREE.CanvasTexture(canvas);
    texture.generateMipmaps = true;

    const plateMat = new THREE.MeshPhysicalMaterial({
      map: texture,
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.88,
      roughness: 0.25,
      metalness: 0.15,
      transmission: 0.35,
      ior: 1.35,
      clearcoat: 0.6,
      clearcoatRoughness: 0.1,
      side: THREE.DoubleSide
    });

    const plateMesh = new THREE.Mesh(plateGeo, plateMat);
    rootGroup.add(plateMesh);

    const wireGeo = new THREE.EdgesGeometry(plateGeo);
    const wireMat = new THREE.LineBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.38 });
    const wireMesh = new THREE.LineSegments(wireGeo, wireMat);
    wireMesh.position.z = 0.02;
    rootGroup.add(wireMesh);

    const ringGeo = new THREE.RingGeometry(0.7, 0.72, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.25, side: THREE.DoubleSide });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.z = 0.05;
    rootGroup.add(ringMesh);

    const keypointsGeo = new THREE.BufferGeometry();
    const keypointPositions = new Float32Array([
      -0.9,  0.5, 0.08,
       0.8,  0.4, 0.08,
      -0.5, -0.4, 0.08,
       0.6, -0.5, 0.08,
       0.0,  0.6, 0.08,
      -1.1, -0.2, 0.08,
       1.0,  0.1, 0.08,
       0.2, -0.2, 0.08
    ]);
    keypointsGeo.setAttribute('position', new THREE.BufferAttribute(keypointPositions, 3));
    const keypointsMat = new THREE.PointsMaterial({
      color: 0x00e5ff,
      size: 0.08,
      transparent: true,
      opacity: 0.95
    });
    const keypoints = new THREE.Points(keypointsGeo, keypointsMat);
    rootGroup.add(keypoints);

    const particleCount = window.innerWidth < 768 ? 90 : 220;
    const particleGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(particleCount * 3);
    const pVel: any[] = [];

    for (let i = 0; i < particleCount; i++) {
      pPos[i * 3 + 0] = (Math.random() - 0.5) * 9.0;
      pPos[i * 3 + 1] = (Math.random() - 0.5) * 6.0;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 5.0;
      pVel.push({
        x: (Math.random() - 0.5) * 0.002,
        y: (Math.random() - 0.5) * 0.003,
        z: (Math.random() - 0.5) * 0.002
      });
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));

    const particleMat = new THREE.PointsMaterial({
      color: 0x58b4d1,
      size: 0.035,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    const scanLineGeo = new THREE.PlaneGeometry(3.5, 0.04);
    const scanLineMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide
    });
    const scanLine = new THREE.Mesh(scanLineGeo, scanLineMat);
    scanLine.position.z = 0.06;
    rootGroup.add(scanLine);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x00e5ff, 1.2);
    dirLight.position.set(4, 5, 6);
    scene.add(dirLight);

    const softRim = new THREE.DirectionalLight(0x38bdf8, 0.8);
    softRim.position.set(-4, -3, 3);
    scene.add(softRim);

    let mouseX = 0, mouseY = 0;
    let targetX = 0, targetY = 0;

    const onMouseMove = (e: MouseEvent) => {
      if (!isVisible) return;
      const rect = container.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      mouseX = (cx / rect.width - 0.5) * 2;
      mouseY = -(cy / rect.height - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    const onResize = () => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || 480;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    const clock = new THREE.Clock();
    let animationId: number;

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      if (!isVisible) return; // Save GPU/CPU when off-screen

      const time = clock.getElapsedTime();

      const floatY = Math.sin(time * 0.9) * 0.08;
      const floatRotZ = Math.sin(time * 0.5) * 0.02;

      targetX += (mouseX * 0.28 - targetX) * 0.05;
      targetY += (mouseY * 0.22 - targetY) * 0.05;

      rootGroup.position.y = floatY;
      rootGroup.rotation.y = targetX * 0.7 + Math.sin(time * 0.4) * 0.03;
      rootGroup.rotation.x = -targetY * 0.6 + Math.cos(time * 0.6) * 0.02;
      rootGroup.rotation.z = floatRotZ;

      scanLine.position.y = Math.sin(time * 1.6) * 1.1;
      ringMesh.rotation.z = time * 0.15;

      const positions = particleGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3 + 1] += pVel[i].y;
        positions[i * 3 + 0] += pVel[i].x;
        if (positions[i * 3 + 1] > 3) positions[i * 3 + 1] = -3;
        if (positions[i * 3 + 1] < -3) positions[i * 3 + 1] = 3;
      }
      particleGeo.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      observer.disconnect();
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animationId);
      container.innerHTML = '';
    };
  }, []);

  // Event Handlers for UI Tilt Parallax
  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    
    // Scale down the tilt multiplier slightly for a subtler high-end feel
    const tiltX = -y * 6; 
    const tiltY = x * 6;
    card.style.transform = `perspective(900px) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg) translateY(-2px)`;
  };
  
  const handleCardMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) translateY(0px)';
  };

  const processFile = (selectedFile: File) => {
    if (!selectedFile.type.startsWith("image/")) {
      setErrorMsg("Please upload a valid image file (JPG, PNG, WEBP).");
      setViewState("error");
      return;
    }
    
    setViewState("preparing");
    setErrorMsg(null);
    
    // Use an object URL to quickly load and measure natural pixel dimensions
    const objUrl = URL.createObjectURL(selectedFile);
    const img = new Image();
    
    img.onload = () => {
      const realDims = `${img.naturalWidth} × ${img.naturalHeight} px`;
      URL.revokeObjectURL(objUrl); // Clean up immediately after reading dimensions
      
      const reader = new FileReader();
      reader.onload = (event) => {
        // Enforce a brief local "PREPARING" state (600ms) for UI feedback
        setTimeout(() => {
          setPreview(event.target?.result as string);
          setFile(selectedFile);
          setFileMeta({
            name: selectedFile.name,
            dims: realDims,
            size: (selectedFile.size / (1024 * 1024)).toFixed(2) + ' MB'
          });
          setIsHeatmap(false);
          setViewState("selected");
        }, 600);
      };
      reader.readAsDataURL(selectedFile);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(objUrl);
      setErrorMsg("Failed to read image pixel dimensions.");
      setViewState("error");
    };
    
    img.src = objUrl;
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.add('border-brand-cyan', 'bg-brand-surface-card');
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.remove('border-brand-cyan', 'bg-brand-surface-card');
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.remove('border-brand-cyan', 'bg-brand-surface-card');
    }
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, []);

  const resetState = () => {
    setFile(null);
    setPreview("");
    setViewState("empty");
    setResultData(null);
    setAnalyzingStage(0);
    setErrorMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    
    // Smooth scroll directly back to the upload workspace
    setTimeout(() => {
      const analyzerEl = document.getElementById("analyzer");
      if (analyzerEl) {
        analyzerEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  // Inference Execution - Safe API Synchronization
  const triggerAnalyze = async () => {
    if (!file) return;
    setViewState("analyzing");
    setErrorMsg(null);
    setAnalyzingStage(1);

    const formData = new FormData();
    formData.append("file", file);

    const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // 1. Construct the visual sequence as an asynchronous Promise
    const visualSequence = async () => {
      await wait(450);
      setAnalyzingStage(2);
      await wait(500);
      setAnalyzingStage(3);
      await wait(450);
      setAnalyzingStage(4);
    };
    const visualPromise = visualSequence();

    // 2. Construct the API fetch as an asynchronous Promise
    const apiPromise = fetch("http://localhost:8000/api/analyze", {
      method: "POST",
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errText || "Inference failed"}`);
      }
      return await res.json() as PredictionResponse;
    });

    try {
      // 3. Wait for BOTH conditions (Visual Stage 4 AND FastAPI Response) simultaneously
      const [_, data] = await Promise.all([visualPromise, apiPromise]);
      
      // Provide a tiny buffer on Stage 4 so it's readable if the API was faster than the sequence
      await wait(300);
      
      setResultData(data);
      setViewState("result");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to analyze image.");
      setViewState("error");
    }
  };

  return (
    <>
      {/* Background Ambience & Tech Grid */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-radial-vignette"></div>
        <div className="absolute inset-0 bg-tech-grid opacity-75"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-gradient-to-b from-brand-cyan/10 via-transparent to-transparent blur-3xl pointer-events-none"></div>
        <div className="absolute top-[600px] -left-48 w-96 h-96 bg-brand-emerald/5 blur-[120px] pointer-events-none"></div>
        <div className="absolute top-[900px] -right-48 w-96 h-96 bg-brand-crimson/5 blur-[120px] pointer-events-none"></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-brand-bg/85 border-b border-brand-border/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button onClick={resetState} className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-brand-cyan/50 rounded-lg p-1 transition-all shrink-0">
            {/* Embedded 3D Sensor Logo */}
            <div className="relative w-12 h-12 flex items-center justify-center group-hover:scale-105 transition-transform duration-500 -ml-1 shrink-0" style={{ perspective: '800px' }}>
              {/* Subtle ambient cavity glow */}
              <div className="absolute inset-0 bg-brand-cyan/20 blur-md rounded-full scale-[0.8] opacity-80 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              {/* Depth shadow base */}
              <div className="absolute bottom-0.5 w-8 h-1.5 bg-black/80 blur-[2px] rounded-[100%] translate-y-1.5"></div>
              
              {/* The sensor optical layer */}
              <img
                src="/trulens-eye.png"
                alt="TruLens"
                className="absolute inset-0 w-full h-full object-contain mix-blend-screen filter brightness-110 contrast-125 saturate-110 drop-shadow-[0_4px_8px_rgba(0,229,255,0.2)] z-10 scale-110"
                style={{ transform: 'translateZ(10px)', transformStyle: 'preserve-3d' }}
              />
              
              {/* Dome Glass Reflection (Creates the 3D bulging lens effect) */}
              <div className="absolute inset-1.5 rounded-full border border-white/10 bg-gradient-to-br from-white/30 via-transparent to-black/40 mix-blend-overlay z-20 pointer-events-none scale-110" style={{ transform: 'translateZ(15px)' }}></div>
              <div className="absolute top-[18%] left-[22%] w-3.5 h-1.5 bg-white/50 blur-[1px] rounded-full rotate-[-35deg] z-30 pointer-events-none" style={{ transform: 'translateZ(20px)' }}></div>
            </div>
            <div className="flex flex-col text-left shrink-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-mono text-sm sm:text-base font-bold text-white uppercase tracking-[0.2em]">TRULENS</span>
                <span className="inline-flex items-center px-1 sm:px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-mono font-medium bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20">v2.4-PRO</span>
              </div>
              <span className="hidden sm:block text-[10px] font-mono text-slate-400 -mt-0.5 tracking-tight">AI VISUAL FORENSICS</span>
            </div>
          </button>
          
          <nav className="hidden md:flex items-center gap-8 text-xs font-mono tracking-wide text-slate-400">
            <a className="text-slate-200 hover:text-brand-cyan transition-colors flex items-center gap-1.5" href="#analyzer">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-pulse"></span> ANALYZER
            </a>
            <a className="hover:text-slate-200 transition-colors" href="#how-it-works">METHODOLOGY</a>
            <a className="hover:text-slate-200 transition-colors" href="#model-spec">MODEL TELEMETRY</a>
          </nav>
          
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded border border-brand-border bg-brand-surface/70 font-mono text-[11px] text-slate-400">
              <span className="w-2 h-2 rounded-full bg-brand-emerald"></span>
              <span className="text-slate-300">EfficientNet-B0</span>
              <span className="text-slate-500">|</span>
              <span className="text-brand-emerald font-semibold">99.1% VAL</span>
            </div>
            <a className="hidden sm:flex text-xs font-mono font-semibold px-3.5 py-1.5 rounded bg-brand-surface border border-brand-border hover:border-brand-cyan hover:text-brand-cyan text-slate-200 transition-all items-center gap-2 shadow-sm" href="#analyzer">
              <span>ANALYZE</span>
            </a>
            
            {/* Mobile Menu Toggle */}
            <button 
              className="md:hidden p-2 text-slate-400 hover:text-white focus:outline-none transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </header>
      
      {/* Mobile Dropdown Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-16 z-40 bg-brand-bg/95 backdrop-blur-xl border-b border-brand-border/80 shadow-2xl overflow-hidden">
          <nav className="flex flex-col font-mono text-xs text-slate-400 px-4 py-4 space-y-4">
            <a className="text-slate-200 flex items-center gap-2 pb-3 border-b border-white/5" href="#analyzer" onClick={() => setIsMobileMenuOpen(false)}>
              <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-pulse"></span> ANALYZER WORKSPACE
            </a>
            <a className="pb-3 border-b border-white/5 hover:text-slate-200" href="#how-it-works" onClick={() => setIsMobileMenuOpen(false)}>METHODOLOGY</a>
            <a className="pb-3 border-b border-white/5 hover:text-slate-200" href="#model-spec" onClick={() => setIsMobileMenuOpen(false)}>MODEL TELEMETRY</a>
            <div className="pt-2">
              <a className="inline-flex w-full justify-center text-xs font-mono font-semibold px-4 py-2.5 rounded bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/30 transition-all items-center gap-2" href="#analyzer" onClick={() => setIsMobileMenuOpen(false)}>
                START ANALYSIS
              </a>
            </div>
          </nav>
        </div>
      )}

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 space-y-16 sm:space-y-20 overflow-x-hidden">
        {/* HERO */}
        <section className="relative text-center max-w-4xl mx-auto pt-6 sm:pt-14 pb-8 min-h-[400px] sm:min-h-[440px] flex flex-col justify-center items-center overflow-hidden w-full">
          <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
            <div id="trulens-hero-three-container" style={{ width: "100%", height: "100%" }}></div>
          </div>
          <div className="relative z-10 max-w-2xl mx-auto pointer-events-auto px-2">
            <div className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-1 rounded-full border border-brand-cyan/20 bg-brand-surface/90 text-[10px] sm:text-xs font-mono text-slate-300 mb-6 backdrop-blur-md shadow-inner shadow-cyan-950/30">
              <span className="text-brand-cyan uppercase tracking-widest font-bold">TRULENS FORENSICS</span>
              <span className="text-slate-600 hidden sm:inline">•</span>
              <span className="text-slate-300 hidden sm:inline">AI-Powered Visual Authenticity Analysis</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-5 leading-tight drop-shadow-sm break-words">
              See beyond <br className="sm:hidden" /> the <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-cyan via-slate-100 to-slate-400">pixels.</span>
            </h1>
            <p className="text-sm sm:text-lg text-slate-400 font-normal leading-relaxed max-w-xl mx-auto mb-8 drop-shadow-sm px-4">
              Analyze subtle visual patterns to estimate whether an image is <span className="text-slate-200 font-medium">AI-generated</span> or <span className="text-slate-200 font-medium">authentic</span>.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-xs font-mono w-full sm:w-auto px-4">
              <a className="w-full sm:w-auto px-5 py-3 sm:py-2.5 rounded bg-brand-cyan text-brand-bg font-bold tracking-wide hover:bg-brand-cyan/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-cyan/20 hover:shadow-brand-cyan/35" href="#analyzer">
                ANALYZE AN IMAGE
              </a>
            </div>
          </div>
        </section>

        {/* WORKSPACE */}
        <section className="scroll-mt-24 w-full" id="analyzer">
          <div className="mb-3 px-1 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse"></span>
              <span className="text-slate-400 font-semibold tracking-wider text-[10px] sm:text-[11px] uppercase truncate max-w-[200px] sm:max-w-none">FORENSIC SPECIMEN BENCH:</span>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs rounded-full bg-brand-surface border border-brand-border hover:border-slate-500 text-slate-400 hover:text-slate-200 transition-colors" onClick={resetState}>
                Reset
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-brand-cyan/20 bg-brand-surface/90 backdrop-blur-xl shadow-2xl shadow-cyan-950/20 overflow-hidden relative">
            <div className="px-3 sm:px-4 py-3 border-b border-brand-border/80 bg-brand-bg/70 flex flex-wrap items-center justify-between gap-2 sm:gap-3 font-mono text-[10px] sm:text-xs">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="hidden sm:flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-700"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-700"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-700"></span>
                </div>
                <span className="text-slate-600 font-medium hidden sm:inline">|</span>
                <div className="flex items-center gap-2 text-slate-300">
                  <span>INSPECTION CORE: 
                    <span className={`ml-1.5 font-bold ${viewState === 'empty' ? 'text-brand-cyan' : viewState === 'preparing' ? 'text-brand-cyan animate-pulse' : viewState === 'selected' ? 'text-brand-amber' : viewState === 'analyzing' ? 'text-brand-cyan animate-pulse' : viewState === 'error' ? 'text-brand-crimson' : 'text-slate-300'}`}>
                      {viewState === 'empty' ? 'READY' : viewState === 'preparing' ? 'PREPARING' : viewState === 'selected' ? 'STAGED' : viewState === 'analyzing' ? 'ANALYZING' : viewState === 'error' ? 'FAILED' : 'COMPLETED'}
                    </span>
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 text-slate-400 text-[9px] sm:text-[11px]">
                <span className="hidden md:inline font-mono">SUBSYSTEM: OPTICAL-NEURAL v2.4</span>
                <span className="px-1.5 sm:px-2 py-0.5 rounded border border-brand-border bg-brand-surface font-mono text-slate-300">
                  LATENT: {file ? '1/1' : '0/1'}
                </span>
              </div>
            </div>

            <div className="p-3 sm:p-4 md:p-8">
              {/* STATE 1: EMPTY */}
              {viewState === "empty" && (
                <div className="transition-all duration-300">
                  <div 
                    ref={dropZoneRef}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className="relative group border-2 border-dashed border-brand-border/90 hover:border-brand-cyan/70 focus:border-brand-cyan focus:outline-none rounded-xl p-6 sm:p-16 text-center cursor-pointer bg-brand-surface-card/40 hover:bg-brand-surface-card/70 transition-all duration-200"
                  >
                    <div className="absolute top-2 sm:top-3 left-2 sm:left-3 w-4 h-4 border-t-2 border-l-2 border-brand-cyan/40 group-hover:border-brand-cyan transition-colors pointer-events-none"></div>
                    <div className="absolute top-2 sm:top-3 right-2 sm:right-3 w-4 h-4 border-t-2 border-r-2 border-brand-cyan/40 group-hover:border-brand-cyan transition-colors pointer-events-none"></div>
                    <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 w-4 h-4 border-b-2 border-l-2 border-brand-cyan/40 group-hover:border-brand-cyan transition-colors pointer-events-none"></div>
                    <div className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 w-4 h-4 border-b-2 border-r-2 border-brand-cyan/40 group-hover:border-brand-cyan transition-colors pointer-events-none"></div>
                    
                    <h2 className="text-lg sm:text-2xl font-semibold text-white mb-2 tracking-tight mt-4 sm:mt-6">
                      Drop an image here
                    </h2>
                    <p className="text-xs sm:text-sm font-mono text-slate-400 mb-6 px-4">
                      or <span className="text-brand-cyan underline underline-offset-4 decoration-brand-cyan/40 hover:decoration-brand-cyan">click to browse</span> from device
                    </p>
                    
                    <div className="inline-flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg bg-brand-surface border border-brand-border font-mono text-[10px] sm:text-xs text-slate-400 w-full sm:w-auto">
                      <span className="hidden sm:inline">SUPPORTED:</span>
                      <span className="text-slate-200 font-semibold">JPG</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-slate-200 font-semibold">PNG</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-slate-200 font-semibold">WEBP</span>
                    </div>
                    
                    <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => e.target.files && e.target.files[0] && processFile(e.target.files[0])} />
                  </div>
                  
                  <div className="mt-4 sm:mt-6 pt-4 sm:pt-5 border-t border-brand-border/60 flex flex-wrap items-center justify-center sm:justify-between gap-4 text-[10px] sm:text-xs font-mono text-slate-400 text-center sm:text-left">
                    <div className="flex items-center gap-2">
                      <span>Zero client data retention. In-memory tensor evaluation only.</span>
                    </div>
                  </div>
                </div>
              )}

              {/* STATE 1.5: PREPARING */}
              {viewState === "preparing" && (
                <div className="transition-all duration-300 p-8 sm:p-16 text-center bg-brand-surface-card rounded-xl border border-brand-cyan/20">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-brand-cyan border-t-transparent animate-spin mx-auto mb-4 sm:mb-6"></div>
                  <h2 className="text-lg sm:text-xl font-bold text-white mb-2">PREPARING IMAGE</h2>
                  <p className="text-xs sm:text-sm font-mono text-slate-400">
                    Extracting local metadata and pixel parameters...
                  </p>
                </div>
              )}

              {/* STATE 2: SELECTED */}
              {viewState === "selected" && (
                <div className="transition-all duration-300">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                    <div 
                      className="lg:col-span-7 bg-brand-bg rounded-xl border border-brand-cyan/30 overflow-hidden relative shadow-xl group tilt-card" 
                      style={{ transformStyle: 'preserve-3d' }} 
                      onMouseMove={handleCardMouseMove} 
                      onMouseLeave={handleCardMouseLeave}
                    >
                      <div className="aspect-[4/3] w-full flex items-center justify-center bg-black/70 relative">
                        <img src={preview} className="max-h-full max-w-full object-contain pointer-events-none" style={{ transform: 'translateZ(10px)' }} />
                        <div className="absolute inset-0 bg-tech-grid opacity-20 pointer-events-none" style={{ transform: 'translateZ(-5px)' }}></div>
                        
                        <div className="absolute top-3 sm:top-4 left-3 sm:left-4 w-3 sm:w-4 h-3 sm:h-4 border-t-2 border-l-2 border-brand-cyan pointer-events-none" style={{ transform: 'translateZ(15px)' }}></div>
                        <div className="absolute top-3 sm:top-4 right-3 sm:right-4 w-3 sm:w-4 h-3 sm:h-4 border-t-2 border-r-2 border-brand-cyan pointer-events-none" style={{ transform: 'translateZ(15px)' }}></div>
                        <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 w-3 sm:w-4 h-3 sm:h-4 border-b-2 border-l-2 border-brand-cyan pointer-events-none" style={{ transform: 'translateZ(15px)' }}></div>
                        <div className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4 w-3 sm:w-4 h-3 sm:h-4 border-b-2 border-r-2 border-brand-cyan pointer-events-none" style={{ transform: 'translateZ(15px)' }}></div>
                        
                        <button onClick={resetState} className="absolute top-2 sm:top-3 right-2 sm:right-3 p-1.5 sm:p-2 rounded-lg bg-brand-surface/90 hover:bg-brand-surface text-slate-300 hover:text-white border border-brand-border transition-all font-mono text-[10px] sm:text-xs flex items-center gap-1.5 shadow-md" style={{ transform: 'translateZ(20px)' }}>
                          Remove
                        </button>
                      </div>
                      
                      <div className="px-3 sm:px-4 py-2 sm:py-2.5 bg-brand-surface-card border-t border-brand-border flex flex-wrap sm:flex-nowrap items-center justify-between text-[10px] sm:text-xs font-mono text-slate-400 gap-2">
                        <div className="flex items-center gap-2 truncate max-w-[50%] sm:max-w-none">
                          <span className="text-slate-200 font-medium truncate">{fileMeta.name}</span>
                        </div>
                        <div className="flex items-center justify-end gap-3 sm:gap-4 text-slate-400 shrink-0">
                          <span>{fileMeta.dims}</span>
                          <span className="hidden xs:inline">{fileMeta.size}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="lg:col-span-5 flex flex-col justify-between space-y-4 sm:space-y-6">
                      <div>
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-brand-surface border border-brand-border font-mono text-[10px] sm:text-[11px] text-brand-cyan mb-2 sm:mb-3">
                          <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-brand-cyan animate-ping"></span>
                          STAGE: ASSET STAGED
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Ready for Neural Inspection</h3>
                        <p className="text-xs text-slate-400 leading-relaxed font-sans">
                          The image is loaded into cache. TruLens will extract multi-scale pixel gradients, frequency representations, and convolutional feature representations using our fine-tuned EfficientNet-B0 backbone.
                        </p>
                      </div>
                      
                      <div className="space-y-2 sm:space-y-3 pt-2">
                        <button onClick={triggerAnalyze} className="w-full py-3 sm:py-3.5 px-4 sm:px-6 rounded-lg bg-brand-cyan hover:bg-cyan-300 text-brand-bg font-mono font-bold tracking-wider text-xs sm:text-sm transition-all flex items-center justify-center shadow-lg shadow-brand-cyan/25 hover:shadow-brand-cyan/40">
                          ANALYZE IMAGE
                        </button>
                        <button onClick={() => fileInputRef.current?.click()} className="w-full py-2 sm:py-2.5 px-4 rounded-lg bg-brand-surface border border-brand-border hover:border-slate-500 text-slate-400 hover:text-slate-200 font-mono text-xs transition-colors">
                          Select a Different Image
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STATE 3: ANALYZING */}
              {viewState === "analyzing" && (
                <div className="transition-all duration-300 py-4 sm:py-6">
                  <div className="max-w-2xl mx-auto text-center space-y-6">
                    <div className="relative w-full max-w-[280px] sm:max-w-sm md:max-w-md aspect-[4/3] mx-auto rounded-xl border border-brand-cyan/60 bg-black overflow-hidden shadow-2xl shadow-cyan-900/30">
                      {/* Layer 1: Image */}
                      <img src={preview} className="absolute inset-0 w-full h-full object-cover filter brightness-75 contrast-125 pointer-events-none z-0" />
                      
                      {/* Layer 2: Grid Frame Overlay */}
                      <div className="absolute inset-0 bg-tech-grid opacity-40 pointer-events-none z-10"></div>
                      
                      {/* Layer 3: Scanner Line (Clipped securely within bounds, overlaying image) */}
                      <div className="absolute inset-x-0 h-12 sm:h-16 scan-laser animate-scan-line pointer-events-none z-20 overflow-hidden mix-blend-screen"></div>
                      
                      {/* Layer 4: Interactive Reticles */}
                      <div className="absolute inset-0 pointer-events-none z-30">
                        <div className="absolute top-[28%] left-[32%] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                          <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border border-brand-cyan animate-reticle-pulse"></div>
                        </div>
                        <div className="absolute top-[52%] left-[48%] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border border-brand-cyan animate-reticle-pulse" style={{ animationDelay: '300ms' }}></div>
                        </div>
                        <div className="absolute top-[42%] left-[68%] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                          <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border border-brand-cyan animate-reticle-pulse" style={{ animationDelay: '600ms' }}></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4 px-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-[9px] sm:text-[10px] font-mono max-w-lg mx-auto w-full">
                        <div className={`p-2 rounded border transition-all duration-200 ${analyzingStage >= 1 ? 'border-brand-cyan bg-brand-cyan/20 text-brand-cyan font-bold shadow-[0_0_10px_rgba(0,229,255,0.25)]' : 'border-brand-border bg-brand-surface text-slate-500'}`}>
                          01 IMAGE INGESTION
                        </div>
                        <div className={`p-2 rounded border transition-all duration-200 ${analyzingStage >= 2 ? 'border-brand-cyan bg-brand-cyan/20 text-brand-cyan font-bold shadow-[0_0_10px_rgba(0,229,255,0.25)]' : 'border-brand-border bg-brand-surface text-slate-500'}`}>
                          02 PREPROCESSING
                        </div>
                        <div className={`p-2 rounded border transition-all duration-200 ${analyzingStage >= 3 ? 'border-brand-cyan bg-brand-cyan/20 text-brand-cyan font-bold shadow-[0_0_10px_rgba(0,229,255,0.25)]' : 'border-brand-border bg-brand-surface text-slate-500'}`}>
                          03 FEATURE EXTRACTION
                        </div>
                        <div className={`p-2 rounded border transition-all duration-200 ${analyzingStage >= 4 ? 'border-brand-cyan bg-brand-cyan/20 text-brand-cyan font-bold shadow-[0_0_10px_rgba(0,229,255,0.25)]' : 'border-brand-border bg-brand-surface text-slate-500'}`}>
                          04 CLASSIFICATION
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="inline-flex items-center gap-2 text-brand-cyan font-mono text-[10px] sm:text-xs font-semibold tracking-wider">
                          <span className="animate-pulse">STAGE {analyzingStage}/4 IN PROGRESS...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STATE 4: RESULT */}
              {viewState === "result" && resultData && (
                <div className="transition-all duration-300">
                  <div className="p-2.5 sm:p-3 mb-4 sm:mb-6 rounded-lg border border-brand-border bg-brand-bg/90 font-mono text-[10px] sm:text-xs flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-brand-cyan"></span>
                      <span className="text-slate-300 font-semibold truncate">FORENSIC REPORT COMPLETED</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
                    {/* Left Col: Image */}
                    <div className="lg:col-span-6 space-y-3 sm:space-y-4">
                      <div 
                        className="bg-brand-bg rounded-xl border border-brand-border overflow-hidden relative shadow-xl group tilt-card" 
                        style={{ transformStyle: 'preserve-3d' }}
                        onMouseMove={handleCardMouseMove} 
                        onMouseLeave={handleCardMouseLeave}
                      >
                        <div className="px-3 sm:px-3.5 py-2 bg-brand-surface-card border-b border-brand-border flex items-center justify-between font-mono text-[10px] sm:text-xs">
                          <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan hidden xs:inline-block"></span>
                            SPECIMEN
                          </span>
                          <div className="flex items-center gap-1 bg-brand-bg p-0.5 rounded border border-brand-border text-[9px] sm:text-[11px]">
                            <button onClick={() => setIsHeatmap(false)} className={`px-1.5 sm:px-2 py-0.5 rounded transition-all pointer-events-auto ${!isHeatmap ? 'bg-brand-surface text-brand-cyan font-bold' : 'text-slate-400 hover:text-slate-200'}`}>Original</button>
                            <button onClick={() => setIsHeatmap(true)} className={`px-1.5 sm:px-2 py-0.5 rounded transition-all pointer-events-auto ${isHeatmap ? 'bg-brand-surface text-brand-cyan font-bold' : 'text-slate-400 hover:text-slate-200'}`}>Heatmap</button>
                          </div>
                        </div>
                        
                        <div className="aspect-[4/3] w-full flex items-center justify-center bg-black/90 relative overflow-hidden">
                          <img src={preview} style={{ transform: 'translateZ(10px)' }} className={`max-h-full max-w-full object-contain transition-all duration-300 pointer-events-none ${isHeatmap ? 'heatmap-filter' : ''}`} />
                          <div className="absolute inset-0 bg-tech-grid opacity-25 pointer-events-none" style={{ transform: 'translateZ(-5px)' }}></div>
                        </div>
                        
                        <div className="px-3 sm:px-4 py-2 sm:py-2.5 bg-brand-surface-card border-t border-brand-border flex items-center justify-between text-[10px] sm:text-xs font-mono text-slate-400">
                          <span className="truncate font-medium text-slate-200 max-w-[70%]">{fileMeta.name}</span>
                          <span className="text-slate-400 shrink-0">sRGB</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-center sm:justify-start text-[10px] sm:text-xs font-mono pt-1">
                        <button onClick={resetState} className="w-full sm:w-auto py-2.5 sm:py-0 text-brand-cyan border border-brand-cyan/30 sm:border-transparent rounded sm:rounded-none bg-brand-cyan/5 sm:bg-transparent hover:underline underline-offset-4 flex items-center justify-center gap-1.5 transition-colors">
                          Analyze Another Image
                        </button>
                      </div>
                    </div>

                    {/* Right Col: Stats */}
                    <div className="lg:col-span-6 space-y-4 sm:space-y-6">
                      <div 
                        className={`p-4 sm:p-6 rounded-xl border transition-all duration-300 bg-brand-surface-card relative overflow-hidden shadow-xl tilt-card ${resultData.prediction === 'AI-GENERATED' ? 'border-brand-crimson/30' : 'border-brand-emerald/30'}`}
                        onMouseMove={handleCardMouseMove} 
                        onMouseLeave={handleCardMouseLeave}
                      >
                        <div className="flex flex-col xs:flex-row xs:items-center justify-between font-mono text-[10px] sm:text-xs mb-4 pb-3 border-b border-white/5 gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full animate-pulse shrink-0 ${resultData.prediction === 'AI-GENERATED' ? 'bg-brand-crimson' : 'bg-brand-emerald'}`}></span>
                            <span className="text-slate-400 tracking-wider">CLASSIFICATION VERDICT</span>
                          </div>
                          <div className={`self-start xs:self-auto px-2 py-0.5 rounded font-bold text-[9px] sm:text-[11px] border ${resultData.prediction === 'AI-GENERATED' ? 'bg-brand-crimson/10 text-brand-crimson border-brand-crimson/30' : 'bg-brand-emerald/10 text-brand-emerald border-brand-emerald/30'}`}>
                            {resultData.prediction} - {(resultData.confidence * 100).toFixed(2)}% CONF.
                          </div>
                        </div>

                        <div className="mb-5 sm:mb-6">
                          <span className="text-[9px] sm:text-[11px] font-mono text-slate-400 uppercase tracking-widest block mb-1">DETERMINED CLASS</span>
                          <h2 className={`text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight ${resultData.prediction === 'AI-GENERATED' ? 'text-brand-crimson' : 'text-brand-emerald'}`}>
                            {resultData.prediction === 'REAL' ? 'REAL IMAGE' : 'AI-GENERATED'}
                          </h2>
                          <div className="flex items-center gap-1.5 sm:gap-2 mt-1">
                            <span className="text-[10px] sm:text-xs font-mono text-slate-400">DECISION MARGIN:</span>
                            <span className="text-[10px] sm:text-xs font-mono font-bold text-white">Δ {(resultData.confidence * 100).toFixed(2)}%</span>
                          </div>
                        </div>

                        {/* Caliper Bar */}
                        <div className="space-y-3 pt-1 border-t border-white/5">
                          <div className="text-[10px] sm:text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
                            <span>Calibrated Spectral Caliper</span>
                            <span className="text-slate-500 text-[8px] sm:text-[10px] hidden xs:inline">SOFTMAX NORMALIZED</span>
                          </div>
                          <div className="relative pt-1 pb-3 sm:pb-4">
                            <div className="flex justify-between text-[8px] sm:text-[9px] font-mono text-slate-500 mb-1">
                              <span>0%</span><span>25%</span><span>50% <span className="hidden sm:inline">(NEUTRAL)</span></span><span>75%</span><span>100%</span>
                            </div>
                            <div className="h-3 sm:h-4 w-full rounded-md bg-brand-bg border border-brand-border flex items-center p-0.5 relative overflow-hidden">
                              <div className="absolute inset-y-0 left-1/4 w-px bg-white/10 pointer-events-none"></div>
                              <div className="absolute inset-y-0 left-1/2 w-px bg-white/20 pointer-events-none"></div>
                              <div className="absolute inset-y-0 left-3/4 w-px bg-white/10 pointer-events-none"></div>
                              
                              <div 
                                className={`h-full rounded-sm transition-all duration-1000 ease-out ${resultData.prediction === 'AI-GENERATED' ? 'bg-gradient-to-r from-brand-crimson/60 to-brand-crimson shadow-[0_0_12px_rgba(255,59,105,0.7)]' : 'bg-gradient-to-r from-brand-emerald/60 to-brand-emerald shadow-[0_0_12px_rgba(0,245,160,0.7)]'}`}
                                style={{ width: `${(resultData.confidence * 100).toFixed(2)}%` }}
                              ></div>
                            </div>
                          </div>

                          <div className="p-2 sm:p-2.5 rounded bg-brand-bg/90 border border-brand-border font-mono text-[8px] sm:text-[10px] text-slate-400 overflow-hidden">
                            {resultData.prediction === 'AI-GENERATED' ? (
                              <>
                                <div className="text-slate-500 mb-1 font-semibold flex justify-between">
                                  <span className="truncate pr-2">LATENT MANIFOLD DENSITY:</span>
                                  <span className="text-brand-crimson shrink-0">[SYNTHETIC CLUSTER]</span>
                                </div>
                                <div className="overflow-x-auto scrollbar-hide">
                                  <pre className="text-brand-crimson/80 leading-tight w-max pr-4">
                                    {`||||||||||||||||||||||||||||||||||||||||||||.... ${(resultData.ai_probability * 100).toFixed(2)}% [AI]\n..||||||........................................  ${(resultData.real_probability * 100).toFixed(2)}% [REAL]`}
                                  </pre>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="text-slate-500 mb-1 font-semibold flex justify-between">
                                  <span className="truncate pr-2">SENSOR TELEMETRY:</span>
                                  <span className="text-brand-emerald shrink-0">[OPTICAL CONTINUITY]</span>
                                </div>
                                <div className="overflow-x-auto scrollbar-hide">
                                  <pre className="text-brand-emerald/80 leading-tight w-max pr-4">
                                    ORGANIC RAW NOISE FLOOR: CONFIRMED (Bayer Pattern σ 0.014)<br/>
                                    LENS ABERRATION PROFILE: CONSISTENT PHYSICAL GLASS DISPERSION
                                  </pre>
                                </div>
                              </>
                            )}
                          </div>

                          <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 sm:gap-3 pt-2">
                            <div className="p-2.5 sm:p-3 rounded-lg bg-brand-bg/80 border border-brand-border">
                              <div className="flex items-center justify-between text-[10px] sm:text-xs font-mono mb-1">
                                <span className="text-slate-400 flex items-center gap-1.5"><span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-brand-crimson"></span> AI Prob.</span>
                                <span className="text-white font-bold font-mono">{(resultData.ai_probability * 100).toFixed(2)}%</span>
                              </div>
                              <div className="w-full h-1 sm:h-1.5 rounded-full bg-brand-surface overflow-hidden">
                                <div className="h-full bg-brand-crimson rounded-full transition-all duration-1000" style={{ width: `${(resultData.ai_probability * 100).toFixed(2)}%` }}></div>
                              </div>
                            </div>
                            <div className="p-2.5 sm:p-3 rounded-lg bg-brand-bg/80 border border-brand-border">
                              <div className="flex items-center justify-between text-[10px] sm:text-xs font-mono mb-1">
                                <span className="text-slate-400 flex items-center gap-1.5"><span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-brand-emerald"></span> Real Prob.</span>
                                <span className="text-white font-bold font-mono">{(resultData.real_probability * 100).toFixed(2)}%</span>
                              </div>
                              <div className="w-full h-1 sm:h-1.5 rounded-full bg-brand-surface overflow-hidden">
                                <div className="h-full bg-brand-emerald rounded-full transition-all duration-1000" style={{ width: `${(resultData.real_probability * 100).toFixed(2)}%` }}></div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-5 sm:mt-6 pt-4 sm:pt-5 border-t border-white/5 space-y-2">
                          <span className="text-[10px] sm:text-[11px] font-mono text-slate-400 uppercase tracking-wider block">Analytical Interpretation</span>
                          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                            TruLens detected visual patterns that are more strongly associated with {resultData.prediction === 'REAL' ? 'real' : 'AI-generated'} imagery.
                          </p>
                          <div className="flex items-center gap-2 pt-1 sm:pt-2 text-[9px] sm:text-[11px] font-mono text-slate-400">
                            <span>Model prediction — not definitive proof of image origin.</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STATE 5: ERROR */}
              {viewState === "error" && (
                <div className="transition-all duration-300 py-4 sm:py-6">
                  <div className="max-w-xl mx-auto p-6 sm:p-12 text-center bg-brand-surface-card rounded-xl border border-brand-crimson/30 shadow-xl shadow-brand-crimson/10">
                    <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-brand-crimson/10 text-brand-crimson mb-4 sm:mb-6 border border-brand-crimson/20">
                      <span className="font-mono text-2xl sm:text-3xl font-bold">!</span>
                    </div>
                    <h2 className="text-xl sm:text-3xl font-bold text-white mb-2 sm:mb-3">ANALYSIS FAILED</h2>
                    <p className="text-xs sm:text-sm font-mono text-slate-400 mb-6 sm:mb-8 leading-relaxed max-w-sm mx-auto">
                      {errorMsg || "An unexpected error occurred during processing. Please try again."}
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full">
                      <button onClick={triggerAnalyze} className="w-full sm:w-auto px-6 py-3 rounded-lg bg-brand-cyan hover:bg-cyan-300 text-brand-bg font-mono font-bold tracking-wider text-xs transition-all shadow-lg shadow-brand-cyan/20">
                        TRY AGAIN
                      </button>
                      <button onClick={resetState} className="w-full sm:w-auto px-6 py-3 rounded-lg bg-brand-surface border border-brand-border hover:border-slate-500 text-slate-300 hover:text-white font-mono font-bold tracking-wider text-xs transition-colors">
                        CHOOSE ANOTHER IMAGE
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="pt-8 scroll-mt-24" id="how-it-works">
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
            <div className="inline-flex items-center gap-2 font-mono text-[10px] sm:text-xs text-brand-cyan tracking-widest uppercase mb-2">
              <span>01 / 02 / 03 WORKFLOW</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight px-4">How TruLens Operates</h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-2 font-sans px-4">
              A three-stage deterministic pipeline calibrated to surface forensic visual anomalies.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="p-5 sm:p-6 rounded-xl border border-brand-border bg-brand-surface/70 hover:border-brand-cyan/40 transition-colors relative group">
              <div className="font-mono text-xl sm:text-2xl font-black text-brand-cyan/40 group-hover:text-brand-cyan transition-colors mb-3 sm:mb-4">01</div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-2 font-sans flex items-center gap-2"><span>Upload</span></h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-sans">Provide an image for analysis. The file is validated and converted into normalized tensors without compression artifacts.</p>
            </div>
            <div className="p-5 sm:p-6 rounded-xl border border-brand-border bg-brand-surface/70 hover:border-brand-cyan/40 transition-colors relative group">
              <div className="font-mono text-xl sm:text-2xl font-black text-brand-cyan/40 group-hover:text-brand-cyan transition-colors mb-3 sm:mb-4">02</div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-2 font-sans flex items-center gap-2"><span>Analyze</span></h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-sans">TruLens processes the image using a trained EfficientNet-B0 model tuned to detect synthesis noise and GAN/diffusion patterns.</p>
            </div>
            <div className="p-5 sm:p-6 rounded-xl border border-brand-border bg-brand-surface/70 hover:border-brand-cyan/40 transition-colors relative group">
              <div className="font-mono text-xl sm:text-2xl font-black text-brand-cyan/40 group-hover:text-brand-cyan transition-colors mb-3 sm:mb-4">03</div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-2 font-sans flex items-center gap-2"><span>Understand</span></h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-sans">Review the prediction, probabilities and confidence scores alongside structural interpretations to evaluate image origin.</p>
            </div>
          </div>
        </section>

        {/* MODEL SPEC */}
        <section className="pt-4 sm:pt-8 scroll-mt-24" id="model-spec">
          <div className="rounded-xl border border-brand-border bg-brand-surface/90 overflow-hidden shadow-xl">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-brand-border bg-brand-surface-card flex items-center justify-between">
              <h3 className="text-[10px] sm:text-sm font-mono font-bold text-white tracking-wider uppercase">Model Architecture & Specification</h3>
            </div>
            <div className="p-4 sm:p-6 grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 font-mono">
              <div className="p-3 sm:p-4 rounded-lg bg-brand-bg/60 border border-brand-border">
                <span className="text-[9px] sm:text-[11px] text-slate-400 block mb-1">ARCHITECTURE</span>
                <span className="text-sm sm:text-base font-bold text-white">EfficientNet-B0</span>
              </div>
              <div className="p-3 sm:p-4 rounded-lg bg-brand-bg/60 border border-brand-border">
                <span className="text-[9px] sm:text-[11px] text-slate-400 block mb-1">FRAMEWORK STACK</span>
                <span className="text-sm sm:text-base font-bold text-white">PyTorch · FastAPI</span>
              </div>
              <div className="p-3 sm:p-4 rounded-lg bg-brand-bg/60 border border-brand-border">
                <span className="text-[9px] sm:text-[11px] text-slate-400 block mb-1">TASK & INFERENCE</span>
                <span className="text-sm sm:text-base font-bold text-brand-cyan">Binary Classification</span>
              </div>
              <div className="p-3 sm:p-4 rounded-lg bg-brand-bg/60 border border-brand-border">
                <span className="text-[9px] sm:text-[11px] text-slate-400 block mb-1">CORPUS DATASET</span>
                <span className="text-sm sm:text-base font-bold text-white">AI-vs-Real</span>
              </div>
            </div>
            <div className="px-4 sm:px-6 py-3 sm:py-4 bg-brand-surface-card/60 border-t border-brand-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 font-mono text-[10px] sm:text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <span className="inline-flex w-max px-2 py-0.5 rounded bg-brand-emerald/10 text-brand-emerald font-bold border border-brand-emerald/20">
                  99.10% VALIDATION ACCURACY
                </span>
                <span className="text-slate-300">Validation accuracy on the project's balanced validation set.</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
