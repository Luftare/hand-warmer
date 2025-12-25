// Web Worker for CPU-intensive heating
// Runs expensive computations in a loop based on power level

let isRunning = false;
let currentPower = 0;

// Listen for messages from main thread
self.addEventListener('message', (e) => {
    const { power } = e.data;
    
    if (power === 0) {
        isRunning = false;
        return;
    }
    
    currentPower = power;
    
    if (!isRunning) {
        isRunning = true;
        startHeating();
    }
});

function startHeating() {
    // Perform expensive math operations in a loop
    // Linear scaling: power 0-100 maps to iteration count
    
    function heatingLoop() {
        if (!isRunning || currentPower === 0) {
            return;
        }
        
        // Calculate iterations based on current power (linear scaling)
        const iterations = Math.floor((currentPower / 100) * 1000000) + 10000;
        
        // Perform expensive computations
        let result = 0;
        for (let i = 0; i < iterations; i++) {
            // Multiple expensive operations
            result += Math.sin(i) * Math.cos(i);
            result += Math.sqrt(i);
            result += Math.pow(i, 0.5);
            result += Math.log(i + 1);
        }
        
        // Prevent the loop from being optimized away
        if (result === Infinity) {
            // This should never happen, but prevents dead code elimination
        }
        
        // Use setTimeout to yield control and allow message processing
        // This ensures the loop can respond to power changes
        setTimeout(heatingLoop, 0);
    }
    
    heatingLoop();
}

