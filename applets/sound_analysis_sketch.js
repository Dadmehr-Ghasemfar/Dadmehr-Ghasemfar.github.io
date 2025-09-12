        let audioContext, analyser, dataArray;
        let unfilteredAnalyser = null;
        let volume = 0;
        let smoothedVolume = 0;
        let alpha = 0.8;
        let volume_peak_thresh = 1;
        let micStarted = false;
        let SoundBTN;
        let showGraph = false;
        let sound_log = [];
        let volume_plot_color;
        const log_length_time = 5;
        const max_volume = 40;
        let peak_log = [];
        let frequencyData;
        let sampling_rate;

        let meydaAnalyzer;
        let currentPitch = 0;
        let currentNote = "--";
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        let currentClarity = 0;

        // CREPE (AI) pitch detection
        let crepePitchDetector = null;
        let currentFrequency = 0;
        const CREPE_MODEL_URL = 'https://cdn.jsdelivr.net/gh/ml5js/ml5-data-and-models/models/pitch-detection/crepe/';

        let low_filter = 400;
        let high_filter = 6000;
        let low_filter_spectral_flux = 100;
        let high_filter_spectral_flux = 25000;

        let useAIModel = false;

        let audioNodes = {
            source: null,
            highPass: null,
            lowPass: null,
            analyser: null,
            unfilteredAnalyser: null
        };

        /* --------- SPECTRAL FLUX STATE --------- */
        let prevSpectrum = null; // previous normalized magnitude spectrum
        let fluxLog = []; // [timeMs, flux] for last few seconds
        let onsetLog = []; // times (ms) where onsets were detected
        let currentFlux = 0;
        let currentFluxThreshold = 0;
        const FLUX_WINDOW_MS = 6000; // compute adaptive threshold over last 4s
        const ONSET_REFRACTORY_MS = 75; // min gap between onsets (ms)
        const THRESH_STD_MULT = 2.3; // threshold = mean + k*std
        let lastOnsetTime = -Infinity;
        let spectral_flux_thresh_min = 0.1;
        /* --------------------------------------- */

        /* --------- ESSENTIA STATE --------- */
        let essentia = null;
        let essentiaOnsets = []; // times (ms) where Essentia detected onsets
        const ESSENTIA_FRAME_SIZE = 1024;
        const ESSENTIA_HOP_SIZE = 512;
        let essentiaBuffer = [];
        let essentiaInitialized = false;
        /* ---------------------------------- */

        let fft_history = []; // Array to store previous FFTs
        const num_fft_history = 6; // How many previous FFTs to keep
        const num_fft_separation = 2; // Frames between saved FFTs
        let fft_frame_counter = 0; // Counter to track frames for saving FFTs



        function setup() {
            createCanvas(windowWidth, windowHeight);
            textAlign(CENTER, CENTER);
            textSize(18);
            volume_plot_color = color(0);

            SoundBTN = document.getElementById("SoundBTN");
            SoundBTN.addEventListener("click", () => {
                showGraph = true;
                startTest();
            });

            document.getElementById('modelToggle').addEventListener('change', function () {
                useAIModel = this.checked;
                console.log(`Model changed to: ${useAIModel ? 'AI Model' : 'Standard Model'}`);

                // Clean up the appropriate model
                if (useAIModel && meydaAnalyzer) {
                    meydaAnalyzer.stop();
                    meydaAnalyzer = null;
                } else if (!useAIModel && crepePitchDetector) {
                    crepePitchDetector = null;
                }

                // Reset flux state when switching models
                resetFluxState();

                if (micStarted) startTest();
            });

            setupFilterControls();

            // Initialize Essentia.js
            initEssentia();
        }

        // Update your initEssentia function
        async function initEssentia() {
            try {
                const EssentiaWasmModule = await EssentiaWASM(); // load WASM backend
                essentia = new Essentia(EssentiaWasmModule); // create Essentia instance

                console.log("Essentia.js version:", essentia.version);
                console.log("Available algorithms:", essentia.algorithmNames);

                // Set the flag to indicate Essentia is initialized
                essentiaInitialized = true;

                return true; // signal success
            } catch (err) {
                console.error("Error initializing Essentia:", err);
                return false; // signal failure
            }
        }

        function draw() {
            background(255);

            if (!micStarted) {
                fill(255);
                return;
            }

            const horizontalMode = width > height;

            // Define safe drawing areas based on your margins
            let topMargin, bottomMargin;
            if (horizontalMode) {
                topMargin = height * 3 / 8 - height / 16; // move up a bit
                bottomMargin = height * 1 / 6 + height / 16;
            } else {
                topMargin = height * 5 / 16; // move down a bit
                bottomMargin = height * 2 / 8;
            }

            const safeHeight = height - topMargin - bottomMargin;

            // Graph dimensions
            const graphWidth = horizontalMode ? (width / 2 - 100) : (width - 100);
            const graphHeight = safeHeight * (horizontalMode ? 0.9 : 0.45);

            // Horizontal offset to center plots with text in vertical mode
            const hOffset = horizontalMode ? 0 : 0; // adjust if needed (currently graphs span full width minus padding)

            // Graph positions
            const graph1X = horizontalMode ? width / 4 : width / 2 + hOffset;
            const graph2X = horizontalMode ? 3 * width / 4 : width / 2 + hOffset;
            const graph1Y = horizontalMode ? topMargin + safeHeight / 2 : topMargin + graphHeight / 2;
            const graph2Y = horizontalMode ? topMargin + safeHeight / 2 : topMargin + 3 * graphHeight / 2 + 20;

            if (showGraph) {
                computeSpectralFluxFromFFT();
                audioNodes.analyser.getByteTimeDomainData(dataArray);
                volume = calculate_volume();
                smoothedVolume = alpha * volume + (1 - alpha) * smoothedVolume;

                sound_log.push([millis(), smoothedVolume]);
                if ((sound_log[sound_log.length - 1][0] - sound_log[0][0]) > log_length_time * 1000) {
                    sound_log.shift();
                }
                //console.log(sound_log);

                let new_peaks = findLocalMaxima(sound_log, 5, 100);
                if (new_peaks.length > 0) {
                    for (let i = 0; i < new_peaks.length; i++) {
                        let [newTime, newVal] = new_peaks[i];
                        if (peak_log.length === 0 || newTime - peak_log[peak_log.length - 1][0] > 100) {
                            peak_log.push([newTime, newVal]);
                        }
                    }
                }

                for (let i = peak_log.length - 1; i >= 0; i--) {
                    if (millis() - peak_log[i][0] > log_length_time * 1000) {
                        peak_log.splice(i, 1);
                    }
                }

                let avgPeakIntervalMs = computeAveragePeakInterval(peak_log);

                if (useAIModel && crepePitchDetector) {
                    updateCREPEPitch();
                }

                if (essentiaInitialized) {
                    processEssentiaOnsetDetection();
                }
                vertical_screen_offsetY_gap = !horizontalMode ? height/32 : 0;
                // Draw first graph
                draw_graph(
                    sound_log,
                    graph1X - graphWidth / 2, graph1Y - graphHeight / 2 - vertical_screen_offsetY_gap, graphWidth, graphHeight,
                    volume_plot_color,
                    "Volume vs Time Plot",
                    "Time (s)",
                    "Volume (RMS)",
                    "Now", "T-5", max_volume.toString(), "0",
                    peak_log,
                    avgPeakIntervalMs,
                    horizontalMode);

                // Draw second graph (FFT)
                if (audioNodes.unfilteredAnalyser) {
                    let frequencyData = new Float32Array(audioNodes.unfilteredAnalyser.frequencyBinCount);
                    audioNodes.unfilteredAnalyser.getFloatFrequencyData(frequencyData);
                    let max_x_title = (sampling_rate / 2).toFixed(0) + " Hz";
                    draw_fft_plot(
                        frequencyData, fft_history,
                        graph2X - graphWidth / 2, graph2Y - graphHeight / 2, graphWidth, graphHeight,
                        color(0),
                        "Live Frequency Spectrum",
                        "Frequency", "Magnitude",
                        max_x_title, "0 Hz", "max dB", "min dB", horizontalMode
                    );
                }

                // Overlay onsets
                draw_onsets(sound_log, onsetLog, graph1X - graphWidth / 2, graph1Y - graphHeight / 2 - vertical_screen_offsetY_gap, graphWidth, graphHeight, color(0, 255, 0));
                draw_onsets(sound_log, essentiaOnsets, graph1X - graphWidth / 2, graph1Y - graphHeight / 2 - vertical_screen_offsetY_gap, graphWidth, graphHeight, color(255, 105, 180));
            }

            // Display text
            fill(0);
            noStroke();
            textAlign(CENTER, CENTER);

            const bpm = computeTempo(onsetLog);

            if (horizontalMode) {
                textSize(16);
                const infoLine = `Pitch: ${currentPitch.toFixed(2)} Hz | Note: ${currentNote} | Clarity: ${currentClarity.toFixed(1)}% | Flux: ${currentFlux.toFixed(3)} (thr: ${currentFluxThreshold.toFixed(3)}) | Onset BPM: ${bpm > 0 ? bpm.toFixed(1) : '--'}`;
                const textY = topMargin + safeHeight + 30;
                text(infoLine, width / 2, textY);
            } else {
                textSize(16);
                const leftX = width * 0.45;
                const rightX = width * 0.55;
                let startY = topMargin / 2;
                const lineSpacing = 30;

                textAlign(RIGHT, CENTER);
                text(`Pitch: ${currentPitch.toFixed(2)} Hz`, leftX, startY);
                text(`Note: ${currentNote}`, leftX, startY + lineSpacing);
                text(`Clarity: ${currentClarity.toFixed(1)}%`, leftX, startY + 2 * lineSpacing);

                textAlign(LEFT, CENTER);
                text(`Flux: ${currentFlux.toFixed(3)} (thr: ${currentFluxThreshold.toFixed(3)})`, rightX, startY);
                text(`Onset BPM: ${bpm > 0 ? bpm.toFixed(1) : '--'}`, rightX, startY + lineSpacing);
            }

            fft_frame_counter++;
            if (fft_frame_counter >= num_fft_separation) {
                if (audioNodes.unfilteredAnalyser) {
                    const currentFFT = new Float32Array(audioNodes.unfilteredAnalyser.frequencyBinCount);
                    audioNodes.unfilteredAnalyser.getFloatFrequencyData(currentFFT);

                    // Add to history
                    fft_history.push(currentFFT);

                    // Keep only the last num_fft_history FFTs
                    if (fft_history.length > num_fft_history) {
                        fft_history.shift();
                    }
                }
                fft_frame_counter = 0;
            }
        }



        async function startTest() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: true
                });
                audioContext = new(window.AudioContext || window.webkitAudioContext)();
                await audioContext.resume();
                sampling_rate = audioContext.sampleRate;

                // Set up audio nodes (same for both modes)
                audioNodes.source = audioContext.createMediaStreamSource(stream);
                audioNodes.highPass = audioContext.createBiquadFilter();
                audioNodes.lowPass = audioContext.createBiquadFilter();
                audioNodes.analyser = audioContext.createAnalyser();
                audioNodes.unfilteredAnalyser = audioContext.createAnalyser();

                audioNodes.highPass.type = "highpass";
                audioNodes.highPass.frequency.value = low_filter;
                audioNodes.lowPass.type = "lowpass";
                audioNodes.lowPass.frequency.value = high_filter;

                audioNodes.analyser.fftSize = 2048;
                audioNodes.unfilteredAnalyser.fftSize = 2048;

                audioNodes.source.connect(audioNodes.highPass);
                audioNodes.highPass.connect(audioNodes.lowPass);
                audioNodes.lowPass.connect(audioNodes.analyser);
                audioNodes.source.connect(audioNodes.unfilteredAnalyser);

                const bufferLength = audioNodes.analyser.frequencyBinCount;
                dataArray = new Uint8Array(bufferLength);
                frequencyData = new Uint8Array(bufferLength);

                // Reset flux state when (re)starting audio graph
                resetFluxState();

                // Reset Essentia onsets
                essentiaOnsets = [];
                essentiaBuffer = [];

                // Model-specific initialization
                if (useAIModel) {
                    if (meydaAnalyzer) {
                        meydaAnalyzer.stop();
                        meydaAnalyzer = null;
                    }

                    try {
                        crepePitchDetector = await ml5.pitchDetection(
                            CREPE_MODEL_URL,
                            audioContext,
                            audioNodes.source.mediaStream,
                            () => {
                                console.log('CREPE model loaded via ml5.js');
                                updateCREPEPitch();
                            }
                        );

                        currentPitch = 0;
                        currentNote = "--";
                        currentClarity = 0;
                    } catch (error) {
                        console.error('CREPE initialization failed:', error);
                        alert('Failed to load AI model. Falling back to standard mode.');
                        document.getElementById('modelToggle').checked = false;
                        useAIModel = false;
                        startTest();
                        return;
                    }
                } else {
                    // Standard mode - initialize MEYDA for spectrum (we compute flux ourselves)
                    if (meydaAnalyzer) {
                        meydaAnalyzer.stop();
                    }

                    meydaAnalyzer = Meyda.createMeydaAnalyzer({
                        audioContext: audioContext,
                        source: audioNodes.lowPass, // use filtered signal for pitch & flux
                        bufferSize: 8192,
                        featureExtractors: ["amplitudeSpectrum"],
                        callback: features => {
                            if (!micStarted || useAIModel) return;
                            const spec = features.amplitudeSpectrum;
                            if (!spec || spec.length === 0) return;

                            // ----- Pitch from spectral peak (your existing approach) -----
                            let maxAmp = 0;
                            let peakFreq = 0;
                            let totalEnergy = 0;

                            const minBin = Math.floor(low_filter * spec.length / (audioContext.sampleRate / 2));
                            const maxBin = Math.ceil(high_filter * spec.length / (audioContext.sampleRate / 2));

                            for (let i = Math.max(0, minBin); i < Math.min(spec.length, maxBin); i++) {
                                totalEnergy += spec[i];
                                if (spec[i] > maxAmp) {
                                    maxAmp = spec[i];
                                    peakFreq = i * (audioContext.sampleRate / 2) / spec.length;
                                }
                            }

                            currentClarity = totalEnergy > 0 ? (maxAmp / totalEnergy) * 100 : 0;
                            currentPitch = peakFreq > 0 ? peakFreq : 0;
                            currentNote = peakFreq > 0 ? frequencyToNote(peakFreq) : "--";

                        }
                    });
                    meydaAnalyzer.start();
                }

                micStarted = true;
                showGraph = true;

            } catch (err) {
                console.error("Error accessing microphone:", err);
                alert("Could not access microphone. Please ensure you've granted permission.");
            }
        }

        function processEssentiaOnsetDetection() {
            if (!essentiaInitialized || !audioNodes.analyser) return;

            // Get time domain data
            const timeData = new Float32Array(audioNodes.analyser.fftSize);
            audioNodes.analyser.getFloatTimeDomainData(timeData);

            try {
                // Convert to regular array
                const audioArray = Array.from(timeData);

                // Extract features that could indicate onsets
                let onsetStrength = 0;
                let featureCount = 0;

                // Try multiple features and combine them
                try {
                    const energy = essentia.Energy(audioArray);
                    onsetStrength += energy.energy * 0.5;
                    featureCount++;
                } catch (e) {}

                try {
                    const rms = essentia.RMS(audioArray);
                    onsetStrength += rms.rms * 0.3;
                    featureCount++;
                } catch (e) {}

                try {
                    const zcr = essentia.ZeroCrossingRate(audioArray);
                    // ZCR tends to increase during onsets
                    onsetStrength += zcr.zeroCrossingRate * 0.2;
                    featureCount++;
                } catch (e) {}

                // Normalize if we have multiple features
                if (featureCount > 1) {
                    onsetStrength /= featureCount;
                }

                const nowMs = millis();

                // Detect onset based on combined strength
                // Adjust threshold based on your audio characteristics
                if (onsetStrength > 0.4) {
                    if (essentiaOnsets.length === 0 || (nowMs - essentiaOnsets[essentiaOnsets.length - 1] > 120)) {
                        essentiaOnsets.push(nowMs);
                        console.log("Essentia onset detected with strength:", onsetStrength);
                    }
                }

                // Clean up old onsets
                while (essentiaOnsets.length > 0 && (nowMs - essentiaOnsets[0] > 10000)) {
                    essentiaOnsets.shift();
                }

            } catch (error) {
                console.error("Error in Essentia processing:", error);
            }
        }

        function processEssentiaOnsetDetectionFallback() {
            if (!essentiaInitialized || !audioNodes.analyser) return;

            try {
                // Get time domain data
                const timeData = new Float32Array(audioNodes.analyser.fftSize);
                audioNodes.analyser.getFloatTimeDomainData(timeData);

                // Convert to array
                const audioArray = Array.from(timeData);

                // Simple energy-based onset detection as fallback
                const energy = essentia.Energy(audioArray).energy;
                const nowMs = millis();

                // Higher threshold for energy-based detection
                if (energy > 0.5) {
                    if (essentiaOnsets.length === 0 || (nowMs - essentiaOnsets[essentiaOnsets.length - 1] > 120)) {
                        essentiaOnsets.push(nowMs);
                    }
                }

                // Clean up old onsets
                while (essentiaOnsets.length > 0 && (nowMs - essentiaOnsets[0] > 10000)) {
                    essentiaOnsets.shift();
                }

            } catch (error) {
                console.error("Error in Essentia fallback processing:", error);
            }
        }


        function computeSpectralFluxFromFFT() {
            if (!audioNodes || !audioNodes.analyser) return;

            const freqData = new Float32Array(audioNodes.analyser.frequencyBinCount);
            audioNodes.analyser.getFloatFrequencyData(freqData); // dB values

            // Convert from dB to magnitude (linear)
            const magnitudes = freqData.map(v => Math.pow(10, v / 20));

            // Figure out which bins correspond to low_filter and high_filter
            const nyquist = audioContext.sampleRate / 2;
            const binSize = nyquist / freqData.length;
            const minBin = Math.floor(low_filter_spectral_flux / binSize);
            const maxBin = Math.min(freqData.length - 1, Math.ceil(high_filter_spectral_flux / binSize));

            // Slice spectrum into the filtered range only
            const filteredMagnitudes = magnitudes.slice(minBin, maxBin + 1);

            // Normalize spectrum
            const sum = filteredMagnitudes.reduce((a, b) => a + b, 0) || 1;
            const S = filteredMagnitudes.map(v => v / sum);

            if (prevSpectrum && prevSpectrum.length === S.length) {
                let flux = 0;
                for (let i = 0; i < S.length; i++) {
                    const diff = S[i] - prevSpectrum[i];
                    if (diff > 0) flux += diff; // only count increases
                }
                currentFlux = flux;

                const nowMs = (typeof millis === 'function') ? millis() : performance.now();
                fluxLog.push([nowMs, flux]);

                // keep window
                while (fluxLog.length && (nowMs - fluxLog[0][0] > FLUX_WINDOW_MS)) fluxLog.shift();

                // adaptive threshold
                const vals = fluxLog.map(d => d[1]);
                const mean = vals.reduce((a, b) => a + b, 0) / Math.max(1, vals.length);
                const std = Math.sqrt(vals.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, vals.length - 1));
                currentFluxThreshold = mean + THRESH_STD_MULT * std;
                currentFluxThreshold = Math.max(mean + THRESH_STD_MULT * std, spectral_flux_thresh_min);


                // onset detection with refractory
                if (flux > currentFluxThreshold && (nowMs - lastOnsetTime) > ONSET_REFRACTORY_MS) {
                    onsetLog.push(nowMs);
                    lastOnsetTime = nowMs;
                    while (onsetLog.length && (nowMs - onsetLog[0] > 10000)) onsetLog.shift();
                }
            }

            prevSpectrum = S;
        }

        function resetFluxState() {
            prevSpectrum = null;
            fluxLog.length = 0;
            onsetLog.length = 0;
            currentFlux = 0;
            currentFluxThreshold = 0;
            lastOnsetTime = -Infinity;
        }

        // Compute a quick BPM from recent onsets (median IOI -> BPM)
        function computeTempo(onsets) {
            if (!onsets || onsets.length < 2) return 0;
            const intervals = [];
            for (let i = 1; i < onsets.length; i++) intervals.push(onsets[i] - onsets[i - 1]);
            intervals.sort((a, b) => a - b);
            const mid = Math.floor(intervals.length / 2);
            const med = intervals.length % 2 ? intervals[mid] : (intervals[mid - 1] + intervals[mid]) / 2;
            return med > 0 ? 60000 / med : 0;
        }

        /* ------------------------------------------------ */

        function calculate_volume() {
            let sumSquares = 0;
            for (let i = 0; i < dataArray.length; i++) {
                const val = dataArray[i] - 128;
                sumSquares += val * val;
            }
            return Math.sqrt(sumSquares / dataArray.length);
        }

        function frequencyToNote(freq) {
            if (!freq || freq <= 0) return null;
            const noteNum = 12 * (Math.log2(freq / 440)) + 69;
            const noteIndex = Math.round(noteNum) % 12;
            const octave = Math.floor(noteNum / 12) - 1;
            return noteNames[noteIndex] + octave;
        }

        function findLocalMaxima(data, threshold = volume_peak_thresh, minSeparation = 100) {
            const rawPeaks = [];
            for (let i = 1; i < data.length - 1; i++) {
                if (data[i][1] > data[i - 1][1] && data[i][1] > data[i + 1][1] && data[i][1] > threshold) {
                    rawPeaks.push(data[i]);
                }
            }

            const filteredPeaks = [];
            let lastPeakTime = -Infinity;
            for (let i = 0; i < rawPeaks.length; i++) {
                let [time, val] = rawPeaks[i];
                if (time - lastPeakTime >= minSeparation) {
                    filteredPeaks.push([time, val]);
                    lastPeakTime = time;
                }
            }
            return filteredPeaks;
        }

        function computeAveragePeakInterval(peaks) {
            if (peaks.length < 2) return 0;
            let totalInterval = 0;
            for (let i = 1; i < peaks.length; i++) {
                totalInterval += (peaks[i][0] - peaks[i - 1][0]);
            }
            return (totalInterval / (peaks.length - 1));
        }

        async function setupCREPE() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: true
                });
                audioContext = new(window.AudioContext || window.webkitAudioContext)();
                await audioContext.resume();

                audioNodes.source = audioContext.createMediaStreamSource(stream);
                audioNodes.analyser = audioContext.createAnalyser();
                audioNodes.source.connect(audioNodes.analyser);

                crepePitchDetector = await ml5.pitchDetection(
                    CREPE_MODEL_URL,
                    audioContext,
                    audioNodes.source.mediaStream,
                    () => console.log('CREPE model loaded')
                );

                return true;
            } catch (error) {
                console.error('CREPE setup failed:', error);
                return false;
            }
        }

        function updateCREPEPitch() {
            if (!crepePitchDetector || !useAIModel) return;

            crepePitchDetector.getPitch((err, frequency) => {
                if (err) {
                    console.error('Pitch detection error:', err);
                    return;
                }

                if (frequency) {
                    currentPitch = frequency;
                    currentNote = frequencyToNote(frequency);
                    currentClarity = 0.9; // CREPE doesn't provide confidence
                    setTimeout(updateCREPEPitch, 100);
                } else {
                    setTimeout(updateCREPEPitch, 50);
                }
            });
        }

        // Overlay onset markers on the volume graph
        function draw_onsets(data, onsets, x_pos, y_pos, width, height, lineColor) {
            if (!data || data.length < 2 || !onsets || onsets.length === 0) return;

            const padding = 40;
            const xVals = data.map(d => d[0]);
            const minX = Math.min(...xVals);
            const maxX = Math.max(...xVals);

            stroke(lineColor);
            strokeWeight(2);
            for (const t of onsets) {
                const x = map(t, minX, maxX, x_pos + padding, x_pos + width - padding);
                if (x >= x_pos + padding && x <= x_pos + width - padding) {
                    line(x, y_pos + padding, x, y_pos + height - padding);
                }
            }
        }

        function draw_graph(data, x_pos, y_pos, width, height, line_color, title, x_axis_title, y_axis_title, max_x_title, min_x_title, max_y_title, min_y_title, peaks = [], avgInterval = 0, horizontalMode) {
            let padding = 40;
            let boxPadding = 25; // extra width for grey box
            let contentOffsetX = 15; // shift everything right
            let titleOffsetY = horizontalMode ? -40 : -20; // move titles higher in vertical mode
            textSize(24);
            fill(0);
            noStroke();
            //text(title, x_pos + width / 2, y_pos + titleOffsetY + 10);
            let verticalLabelOffsetX = 50; // extra left padding for vertical axis label
            textAlign(CENTER, CENTER);
            textSize(12);
            strokeWeight(2);

            // Grey background box
            fill(245);
            stroke(0);
            strokeWeight(2);
            rect(x_pos - boxPadding, y_pos, width + 2 * boxPadding, height, 10);

            let xVals = data.map(d => d[0]);
            let yVals = data.map(d => d[1]);
            let minX = Math.min(...xVals);
            let maxX = Math.max(...xVals);
            let minY = Math.min(...yVals);
            let maxY = max_volume;

            // Axes
            stroke(0);
            line(x_pos + padding + contentOffsetX, y_pos + height - padding, x_pos + width - padding, y_pos + height - padding);
            line(x_pos + padding + contentOffsetX, y_pos + height - padding, x_pos + padding + contentOffsetX, y_pos + padding);

            // Plot line
            noFill();
            stroke(line_color);
            beginShape();
            for (let i = 0; i < data.length; i++) {
                let x = map(data[i][0], minX, maxX, x_pos + padding + contentOffsetX, x_pos + width - padding);
                let y = map(data[i][1], minY, maxY, y_pos + height - padding, y_pos + padding);
                vertex(x, y);
            }
            endShape();

            // Peaks
            fill(255, 0, 0);
            noStroke();
            for (let i = 0; i < peaks.length; i++) {
                let x = map(peaks[i][0], minX, maxX, x_pos + padding + contentOffsetX, x_pos + width - padding);
                let y = map(peaks[i][1], minY, maxY, y_pos + height - padding, y_pos + padding);
                ellipse(x, y, 8, 8);
            }

            // Titles
            textSize(24);
            fill(0);
            noStroke();
            text(title, x_pos + width / 2, y_pos + titleOffsetY + 10); // slightly lower

            textSize(16);
            text(x_axis_title, x_pos + width / 2, y_pos + height - padding + 25);

            push();
            translate(x_pos + padding - verticalLabelOffsetX, y_pos + height / 2); // move vertical axis label further left
            rotate(-HALF_PI);
            text(y_axis_title, 0, 0);
            pop();

            // Axis labels
            textSize(12);
            text(min_x_title, x_pos + padding + contentOffsetX, y_pos + height - padding + 15);
            text(max_x_title, x_pos + width - padding, y_pos + height - padding + 15);
            text(max_y_title, x_pos + padding - 25, y_pos + padding);
            text(min_y_title, x_pos + padding - 25, y_pos + height - padding);

            if (peaks.length > 1) {
                fill(255);
                textSize(14);
                let seconds = (avgInterval / 1000).toFixed(2);
                text(`Avg Peak Interval: ${seconds}s`, x_pos + width / 2, y_pos + height + 40);
            }
        }

        function draw_fft_plot(frequencyData, fft_history, x_pos, y_pos, width, height, bar_color,
            title, x_axis_title, y_axis_title, max_x_title, min_x_title, max_y_title, min_y_title, horizontalMode) {

            let padding = 40;
            let boxPadding = 25;
            let contentOffsetX = 15;
            let titleOffsetY = horizontalMode ? -40 : -20;
            let verticalLabelOffsetX = 50;

            // Grey background box
            fill(245);
            stroke(0);
            strokeWeight(2);
            rect(x_pos - boxPadding, y_pos, width + 2 * boxPadding, height, 10);

            textAlign(CENTER, CENTER);
            textSize(12);
            strokeWeight(2);

            // Axes
            stroke(0);
            line(x_pos + padding + contentOffsetX, y_pos + height - padding, x_pos + width - padding, y_pos + height - padding);
            line(x_pos + padding + contentOffsetX, y_pos + height - padding, x_pos + padding + contentOffsetX, y_pos + padding);

            const numBars = frequencyData.length;
            const barWidth = (width - 2 * padding) / numBars;

            // Draw FFT history (older = lighter grey, newer = darker grey)
            for (let h = 0; h < fft_history.length; h++) {
                const histFFT = fft_history[h];
                const shade = map(h, 0, fft_history.length, 180, 60); // older = lighter
                fill(shade);
                noStroke();
                for (let i = 0; i < numBars; i++) {
                    let db = histFFT[i];
                    let scaledHeight = map(db, audioNodes.analyser.minDecibels, audioNodes.analyser.maxDecibels, 0, height - 2 * padding);
                    scaledHeight = max(scaledHeight, 0);
                    rect(
                        x_pos + padding + contentOffsetX + i * barWidth,
                        y_pos + height - padding - scaledHeight,
                        barWidth,
                        scaledHeight
                    );
                }
            }

            // Draw current FFT on top in black
            fill(0);
            noStroke();
            for (let i = 0; i < numBars; i++) {
                let db = frequencyData[i];
                let scaledHeight = map(db, audioNodes.analyser.minDecibels, audioNodes.analyser.maxDecibels, 0, height - 2 * padding);
                scaledHeight = max(scaledHeight, 0);
                rect(
                    x_pos + padding + contentOffsetX + i * barWidth,
                    y_pos + height - padding - scaledHeight,
                    barWidth,
                    scaledHeight
                );
            }

            // Filter lines
            let maxFreq = sampling_rate / 2;
            let lowFilterX = map(low_filter, 0, maxFreq, x_pos + padding + contentOffsetX, x_pos + width - padding);
            let highFilterX = map(high_filter, 0, maxFreq, x_pos + padding + contentOffsetX, x_pos + width - padding);

            stroke(255, 0, 0, 150);
            strokeWeight(2);
            line(lowFilterX, y_pos + padding, lowFilterX, y_pos + height - padding);

            stroke(0, 255, 0, 150);
            strokeWeight(2);
            line(highFilterX, y_pos + padding, highFilterX, y_pos + height - padding);

            fill(255, 0, 0);
            noStroke();
            text(`${low_filter}Hz`, lowFilterX, y_pos + height - padding + 20);

            fill(0, 255, 0);
            text(`${high_filter}Hz`, highFilterX, y_pos + height - padding + 20);

            // Titles
            fill(0);
            noStroke();
            textSize(24);
            text(title, x_pos + width / 2, y_pos + titleOffsetY + 10);

            textSize(16);
            text(x_axis_title, x_pos + width / 2, y_pos + height - padding + 25);

            push();
            translate(x_pos + padding - verticalLabelOffsetX, y_pos + height / 2);
            rotate(-HALF_PI);
            text(y_axis_title, 0, 0);
            pop();

            // Axis labels
            textSize(12);
            fill(0);
            text(min_x_title, x_pos + padding + contentOffsetX, y_pos + height - padding + 15);
            text(max_x_title, x_pos + width - padding, y_pos + height - padding + 15);
            text(min_y_title, x_pos + padding - 25, y_pos + height - padding);
            text(max_y_title, x_pos + padding - 25, y_pos + padding);
        }

        function setupFilterControls() {
            const lowFilterInput = document.getElementById('lowFilter');
            const highFilterInput = document.getElementById('highFilter');
            const applyBtn = document.getElementById('applyFilters');

            applyBtn.addEventListener('click', () => {
                updateFilters(
                    parseInt(lowFilterInput.value),
                    parseInt(highFilterInput.value)
                );
            });

            lowFilterInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') applyBtn.click();
            });
            highFilterInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') applyBtn.click();
            });
        }

        function updateFilters(low, high) {
            low_filter = low;
            high_filter = high;

            if (audioNodes.highPass) audioNodes.highPass.frequency.value = low_filter;
            if (audioNodes.lowPass) audioNodes.lowPass.frequency.value = high_filter;

            console.log(`Filters updated: low = ${low_filter} Hz, high = ${high_filter} Hz`);
        }


        function windowResized() {
            resizeCanvas(windowWidth, windowHeight);
        }
