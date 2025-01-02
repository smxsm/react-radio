/* global currentFrame, sampleRate */
// Audio worklet processor for Safari
class SafariAudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 2048; // Match analyzer FFT size
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (!input || !input.length) return true;

    // Average all channels if we have multiple
    const numChannels = input.length;
    const samples = input[0];
    
    // Process samples
    for (let i = 0; i < samples.length; i++) {
      let sample = samples[i];
      
      // If we have multiple channels, average them
      if (numChannels > 1) {
        sample = 0;
        for (let channel = 0; channel < numChannels; channel++) {
          sample += input[channel][i];
        }
        sample /= numChannels;
      }

      this.buffer[this.bufferIndex++] = sample;
      
      // Send data when buffer is full
      if (this.bufferIndex >= this.bufferSize) {
        // Process the buffer to create waveform data
        const byteData = new Uint8Array(this.bufferSize);
        
        // Find peak for normalization
        let peak = 0;
        for (let j = 0; j < this.bufferSize; j++) {
          peak = Math.max(peak, Math.abs(this.buffer[j]));
        }
        
        // Normalize and convert to bytes, preserving waveform shape
        const scale = peak > 0 ? 1 / peak : 1;
        for (let j = 0; j < this.bufferSize; j++) {
          // Scale the sample to [-1, 1]
          const sample = this.buffer[j] * scale;
          
          // Convert to byte range [0, 255] with enhanced dynamics
          // Using a curve (0.7) to boost quieter signals while preserving peaks
          const curved = Math.sign(sample) * Math.pow(Math.abs(sample), 0.7);
          
          // Map to byte range, centered at 128
          byteData[j] = Math.max(0, Math.min(255, ((curved * 127) + 128) | 0));
        }

        // Send the processed data
        const clonedData = new Uint8Array(byteData);
        this.port.postMessage({ samples: clonedData }, [clonedData.buffer]);
        this.buffer = new Float32Array(this.bufferSize);
        this.bufferIndex = 0;
      }
    }

    // Pass through audio unchanged
    for (let channel = 0; channel < outputs[0].length; channel++) {
      outputs[0][channel].set(input[channel]);
    }

    return true;
  }
}

registerProcessor('safari-audio-processor', SafariAudioProcessor);
