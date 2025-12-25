// Main application logic
// Manages UI state, Web Worker, WebGL, and screen wake lock

class HandWarmerApp {
    constructor() {
        this.isHeating = false;
        this.power = 30; // Default 30%
        this.mechanism = 'both'; // 'both', 'cpu', 'gpu'
        this.worker = null;
        this.gpuContext = null;
        this.gpuProgram = null;
        this.animationFrame = null;
        this.wakeLock = null;
        
        this.init();
    }
    
    init() {
        // Initialize Web Worker
        // Note: Web Workers require http:// or https:// protocol, not file://
        try {
            this.worker = new Worker('worker.js');
            this.worker.addEventListener('message', (e) => {
                // Worker can send status updates if needed
            });
            this.worker.addEventListener('error', (error) => {
                console.warn('Web Worker error (may need http:// server):', error);
            });
        } catch (error) {
            console.warn('Web Worker not available (use http:// server for full functionality):', error.message);
        }
        
        // Initialize WebGL
        this.initWebGL();
        
        // Setup UI event listeners
        this.setupEventListeners();
        
        // Setup visibility change handler
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.stopHeating();
            }
        });
        
        // Setup beforeunload handler
        window.addEventListener('beforeunload', () => {
            this.stopHeating();
        });
    }
    
    initWebGL() {
        const canvas = document.getElementById('gpuCanvas');
        if (!canvas) return;
        
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) {
            console.warn('WebGL not supported');
            return;
        }
        
        this.gpuContext = gl;
        
        // Set canvas size (small but sufficient for GPU load)
        canvas.width = 256;
        canvas.height = 256;
        gl.viewport(0, 0, canvas.width, canvas.height);
        
        // Create shader program
        const vertexShader = this.createShader(gl, gl.VERTEX_SHADER, `
            attribute vec2 a_position;
            void main() {
                gl_Position = vec4(a_position, 0.0, 1.0);
            }
        `);
        
        const fragmentShader = this.createShader(gl, gl.FRAGMENT_SHADER, `
            precision highp float;
            uniform float u_power;
            uniform float u_time;
            
            void main() {
                vec2 uv = gl_FragCoord.xy / 256.0;
                vec3 color = vec3(0.0);
                
                // Use constant loop bounds (GLSL requirement)
                // Scale work intensity based on power (linear scaling)
                const float MAX_ITERATIONS = 200.0;
                float activeIterations = u_power * MAX_ITERATIONS;
                
                // First loop: expensive computations
                for (float i = 0.0; i < MAX_ITERATIONS; i += 1.0) {
                    // Only perform work if within active range (linear scaling)
                    if (i < activeIterations) {
                        vec2 p = uv + vec2(sin(i * 0.1 + u_time), cos(i * 0.1 + u_time));
                        color += vec3(
                            sin(p.x * 10.0) * 0.1,
                            cos(p.y * 10.0) * 0.1,
                            sin(p.x * p.y * 5.0) * 0.1
                        );
                    }
                }
                
                // Second loop: more expensive operations
                const float MAX_ITERATIONS_2 = 100.0;
                float activeIterations2 = u_power * MAX_ITERATIONS_2;
                
                for (float i = 0.0; i < MAX_ITERATIONS_2; i += 1.0) {
                    if (i < activeIterations2) {
                        color = vec3(
                            sqrt(color.r + i * 0.001),
                            pow(color.g + i * 0.001, 0.5),
                            log(color.b + i * 0.001 + 1.0)
                        );
                    }
                }
                
                // Additional expensive operations that always run but scale with power
                for (float i = 0.0; i < 50.0; i += 1.0) {
                    float intensity = u_power;
                    color += vec3(
                        sin(uv.x * i * intensity) * 0.01,
                        cos(uv.y * i * intensity) * 0.01,
                        sin(uv.x * uv.y * i * intensity) * 0.01
                    );
                }
                
                gl_FragColor = vec4(color, 1.0);
            }
        `);
        
        if (!vertexShader || !fragmentShader) {
            console.error('Failed to create shaders');
            return;
        }
        
        this.gpuProgram = this.createProgram(gl, vertexShader, fragmentShader);
        
        // Setup quad geometry
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1, -1,
             1, -1,
            -1,  1,
            -1,  1,
             1, -1,
             1,  1,
        ]), gl.STATIC_DRAW);
        
        this.positionBuffer = positionBuffer;
        this.startTime = Date.now();
    }
    
    createShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        
        return shader;
    }
    
    createProgram(gl, vertexShader, fragmentShader) {
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Program linking error:', gl.getProgramInfoLog(program));
            gl.deleteProgram(program);
            return null;
        }
        
        return program;
    }
    
    setupEventListeners() {
        // Toggle switch
        const toggle = document.getElementById('toggle');
        toggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                this.startHeating();
            } else {
                this.stopHeating();
            }
        });
        
        // Power slider
        const powerSlider = document.getElementById('power');
        const powerValue = document.getElementById('powerValue');
        
        powerSlider.addEventListener('input', (e) => {
            this.power = parseInt(e.target.value);
            powerValue.textContent = `${this.power}%`;
            
            if (this.isHeating) {
                this.updateHeating();
            }
        });
        
        // Mechanism selector
        const mechanismSelect = document.getElementById('mechanism');
        mechanismSelect.addEventListener('change', (e) => {
            this.mechanism = e.target.value;
            
            if (this.isHeating) {
                this.updateHeating();
            }
        });
        
        // Disclaimer toggle
        const disclaimerToggle = document.getElementById('disclaimerToggle');
        const disclaimerContent = document.getElementById('disclaimerContent');
        
        disclaimerToggle.addEventListener('click', () => {
            disclaimerContent.classList.toggle('expanded');
        });
    }
    
    async startHeating() {
        if (this.isHeating) return;
        
        this.isHeating = true;
        
        // Update UI
        document.getElementById('radiator').classList.add('active');
        document.getElementById('heatwaves').classList.add('active');
        document.getElementById('toggle').checked = true;
        const toggleText = document.querySelector('.toggle-text');
        if (toggleText) toggleText.textContent = 'On';
        
        // Request wake lock
        await this.requestWakeLock();
        
        // Start heating based on mechanism
        this.updateHeating();
    }
    
    stopHeating() {
        if (!this.isHeating) return;
        
        this.isHeating = false;
        
        // Update UI
        document.getElementById('radiator').classList.remove('active');
        document.getElementById('heatwaves').classList.remove('active');
        document.getElementById('toggle').checked = false;
        const toggleText = document.querySelector('.toggle-text');
        if (toggleText) toggleText.textContent = 'Off';
        
        // Release wake lock
        this.releaseWakeLock();
        
        // Stop CPU worker
        if (this.worker) {
            this.worker.postMessage({ power: 0 });
        }
        
        // Stop GPU rendering
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }
    
    updateHeating() {
        if (!this.isHeating) return;
        
        const shouldUseCPU = this.mechanism === 'both' || this.mechanism === 'cpu';
        const shouldUseGPU = this.mechanism === 'both' || this.mechanism === 'gpu';
        
        // Update CPU worker
        if (this.worker) {
            try {
                if (shouldUseCPU && this.power > 0) {
                    this.worker.postMessage({ power: this.power });
                } else {
                    this.worker.postMessage({ power: 0 });
                }
            } catch (error) {
                console.warn('Failed to communicate with Web Worker:', error);
            }
        }
        
        // Update GPU rendering
        if (this.gpuContext && this.gpuProgram) {
            if (shouldUseGPU && this.power > 0) {
                if (!this.animationFrame) {
                    this.renderGPU();
                }
            } else {
                if (this.animationFrame) {
                    cancelAnimationFrame(this.animationFrame);
                    this.animationFrame = null;
                }
            }
        }
    }
    
    renderGPU() {
        if (!this.gpuContext || !this.gpuProgram || !this.isHeating) return;
        
        const gl = this.gpuContext;
        const power = this.power;
        const mechanism = this.mechanism;
        
        if (mechanism !== 'both' && mechanism !== 'gpu') {
            return;
        }
        
        if (power === 0) {
            return;
        }
        
        gl.useProgram(this.gpuProgram);
        
        // Set up geometry
        const positionLocation = gl.getAttribLocation(this.gpuProgram, 'a_position');
        gl.enableVertexAttribArray(positionLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
        
        // Set uniforms
        const powerLocation = gl.getUniformLocation(this.gpuProgram, 'u_power');
        const timeLocation = gl.getUniformLocation(this.gpuProgram, 'u_time');
        
        gl.uniform1f(powerLocation, power / 100.0); // Normalize to 0-1
        gl.uniform1f(timeLocation, (Date.now() - this.startTime) / 1000.0);
        
        // Draw
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        
        // Continue rendering
        this.animationFrame = requestAnimationFrame(() => this.renderGPU());
    }
    
    async requestWakeLock() {
        if ('wakeLock' in navigator) {
            try {
                this.wakeLock = await navigator.wakeLock.request('screen');
                this.wakeLock.addEventListener('release', () => {
                    // Wake lock was released (e.g., user switched tabs)
                });
            } catch (error) {
                console.warn('Wake lock request failed:', error);
            }
        }
    }
    
    releaseWakeLock() {
        if (this.wakeLock) {
            this.wakeLock.release();
            this.wakeLock = null;
        }
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new HandWarmerApp();
    });
} else {
    new HandWarmerApp();
}

// Register service worker for PWA installability
// Note: Service Workers require http:// or https:// protocol, not file://
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Check if we're on a supported protocol
        if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
            navigator.serviceWorker.register('sw.js')
                .then(registration => {
                    console.log('Service Worker registered:', registration);
                })
                .catch(error => {
                    console.warn('Service Worker registration failed:', error);
                });
        } else {
            console.info('Service Worker requires http:// or https:// protocol. Use a local server for PWA features.');
        }
    });
}

