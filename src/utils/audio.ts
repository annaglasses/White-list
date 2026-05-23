/**
 * Web Audio Synthesizer for offline-capable, cozy background soundscapes.
 * No network required, synthesized in real-time.
 */

let audioCtx: AudioContext | null = null;
let waveNode: BiquadFilterNode | null = null;
let noiseNode: AudioWorkletNode | ScriptProcessorNode | null = null;
let gainNode: GainNode | null = null;

// LFO oscillator to modulate volume for ocean waves
let lfoNode: OscillatorNode | null = null;

function initCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
}

/**
 * Creates pinkish noise modulated by an LFO to simulate the breathing rhythm of ocean waves.
 */
export function startOceanSynth() {
  try {
    initCtx();
    if (!audioCtx) return;

    // Stop existing nodes
    stopOceanSynth();

    // Create a ScriptProcessorNode to generate pinkish/brownish noise (relaxing sound)
    const bufferSize = 4 * 1024;
    let lastOut = 0.0;
    
    // We use createScriptProcessor as fallback because standard paint/nature noise is easy to calculate
    noiseNode = audioCtx.createScriptProcessor(bufferSize, 1, 1);
    noiseNode.onaudioprocess = (e) => {
      const output = e.outputBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Brown noise filter approximation for deep, cozy ocean wave sounds
        output[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = output[i];
        output[i] *= 4.5; // Gain adjustment
      }
    };

    // Filter to make the noise warm and deep (removes annoying high pitches)
    waveNode = audioCtx.createBiquadFilter();
    waveNode.type = "lowpass";
    waveNode.frequency.setValueAtTime(400, audioCtx.currentTime);
    waveNode.Q.setValueAtTime(1, audioCtx.currentTime);

    // Dynamic gain node to modulate the breath
    gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);

    // LFO Oscillator to shape the rhythmic rise and fall of waves (breath cycle: ~10 seconds)
    lfoNode = audioCtx.createOscillator();
    lfoNode.type = "sine";
    lfoNode.frequency.setValueAtTime(0.12, audioCtx.currentTime); // 0.12 Hz is a beautiful, slow 8-second wave

    // Modulate wave pass filter frequency along with amplitude for authentic ocean surf matching
    const lfoGainFilter = audioCtx.createGain();
    lfoGainFilter.gain.setValueAtTime(250, audioCtx.currentTime);
    lfoNode.connect(lfoGainFilter);
    lfoGainFilter.connect(waveNode.frequency);

    // Modulate volume scale
    const lfoGainAmp = audioCtx.createGain();
    lfoGainAmp.gain.setValueAtTime(0.05, audioCtx.currentTime);
    lfoNode.connect(lfoGainAmp);
    lfoGainAmp.connect(gainNode.gain);

    // Connect the chain
    noiseNode.connect(waveNode);
    waveNode.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    // Start LFO
    lfoNode.start();
  } catch (error) {
    console.error("Failed to start program audio synthesis:", error);
  }
}

export function stopOceanSynth() {
  try {
    if (lfoNode) {
      lfoNode.stop();
      lfoNode.disconnect();
      lfoNode = null;
    }
    if (noiseNode) {
      noiseNode.disconnect();
      noiseNode = null;
    }
    if (waveNode) {
      waveNode.disconnect();
      waveNode = null;
    }
    if (gainNode) {
      gainNode.disconnect();
      gainNode = null;
    }
  } catch (e) {
    // Already disconnected
  }
}

/**
 * Triggers a soothing chime representing a singing bowl drop.
 */
export function playCoseyBell() {
  try {
    initCtx();
    if (!audioCtx) return;

    const now = audioCtx.currentTime;
    
    // Low bell root oscillator
    const osc1 = audioCtx.createOscillator();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(146.83, now); // D3 node - extremely grounded and calming

    // Overtone oscillator to make it sound like a beautiful bronze metal bowl
    const osc2 = audioCtx.createOscillator();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(146.83 * 2.5 + 2, now); // Sweet harmonic

    const bellGain = audioCtx.createGain();
    bellGain.gain.setValueAtTime(0, now);
    bellGain.gain.linearRampToValueAtTime(0.15, now + 0.05);
    bellGain.gain.exponentialRampToValueAtTime(0.0001, now + 4.0); // Long, clean decay

    // Filter to warm it up
    const filter = audioCtx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(450, now);

    osc1.connect(bellGain);
    osc2.connect(bellGain);
    bellGain.connect(filter);
    filter.connect(audioCtx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 4.5);
    osc2.stop(now + 4.5);
  } catch (error) {
    console.log("Audio not allowed yet or failed to play:", error);
  }
}
