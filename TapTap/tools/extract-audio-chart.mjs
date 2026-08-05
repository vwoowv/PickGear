#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const WINDOW_SIZE = 2048;
const HOP_SIZE = 512;
const MIN_EVENT_SPACING_SECONDS = 0.42;
const START_PADDING_SECONDS = 1.0;
const END_PADDING_SECONDS = 3.5;

function parsePcmWave(path) {
    const buffer = readFileSync(path);
    if (buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WAVE') {
        throw new Error('Only RIFF/WAVE files are supported.');
    }

    let format = null;
    let dataOffset = -1;
    let dataSize = 0;

    for (let offset = 12; offset + 8 <= buffer.length;) {
        const chunkId = buffer.toString('ascii', offset, offset + 4);
        const chunkSize = buffer.readUInt32LE(offset + 4);
        const chunkDataOffset = offset + 8;

        if (chunkId === 'fmt ') {
            format = {
                audioFormat: buffer.readUInt16LE(chunkDataOffset),
                channels: buffer.readUInt16LE(chunkDataOffset + 2),
                sampleRate: buffer.readUInt32LE(chunkDataOffset + 4),
                blockAlign: buffer.readUInt16LE(chunkDataOffset + 12),
                bitsPerSample: buffer.readUInt16LE(chunkDataOffset + 14),
            };
        } else if (chunkId === 'data') {
            dataOffset = chunkDataOffset;
            dataSize = chunkSize;
        }

        offset = chunkDataOffset + chunkSize + (chunkSize % 2);
    }

    if (!format || dataOffset < 0) {
        throw new Error('The WAV file does not contain both fmt and data chunks.');
    }
    if (format.audioFormat !== 1) {
        throw new Error(`Unsupported WAV encoding ${format.audioFormat}; PCM is required.`);
    }
    if (![16, 24, 32].includes(format.bitsPerSample)) {
        throw new Error(`Unsupported PCM bit depth ${format.bitsPerSample}.`);
    }

    const bytesPerSample = format.bitsPerSample / 8;
    const frameCount = Math.floor(dataSize / format.blockAlign);
    const mono = new Float64Array(frameCount);
    const divisor = 2 ** (format.bitsPerSample - 1);

    for (let frame = 0; frame < frameCount; frame += 1) {
        const frameOffset = dataOffset + frame * format.blockAlign;
        let sum = 0;
        for (let channel = 0; channel < format.channels; channel += 1) {
            const sampleOffset = frameOffset + channel * bytesPerSample;
            sum += buffer.readIntLE(sampleOffset, bytesPerSample) / divisor;
        }
        mono[frame] = sum / format.channels;
    }

    return {
        samples: mono,
        sampleRate: format.sampleRate,
        channels: format.channels,
        bitsPerSample: format.bitsPerSample,
        duration: frameCount / format.sampleRate,
    };
}

function createHannWindow(size) {
    const window = new Float64Array(size);
    for (let index = 0; index < size; index += 1) {
        window[index] = 0.5 - 0.5 * Math.cos((2 * Math.PI * index) / (size - 1));
    }
    return window;
}

function fft(real, imaginary) {
    const size = real.length;
    for (let index = 1, reversed = 0; index < size; index += 1) {
        let bit = size >> 1;
        for (; reversed & bit; bit >>= 1) {
            reversed ^= bit;
        }
        reversed ^= bit;
        if (index < reversed) {
            [real[index], real[reversed]] = [real[reversed], real[index]];
            [imaginary[index], imaginary[reversed]] = [imaginary[reversed], imaginary[index]];
        }
    }

    for (let length = 2; length <= size; length <<= 1) {
        const angle = (-2 * Math.PI) / length;
        const stepReal = Math.cos(angle);
        const stepImaginary = Math.sin(angle);
        const half = length >> 1;

        for (let start = 0; start < size; start += length) {
            let rotationReal = 1;
            let rotationImaginary = 0;
            for (let offset = 0; offset < half; offset += 1) {
                const evenIndex = start + offset;
                const oddIndex = evenIndex + half;
                const oddReal = real[oddIndex] * rotationReal - imaginary[oddIndex] * rotationImaginary;
                const oddImaginary = real[oddIndex] * rotationImaginary + imaginary[oddIndex] * rotationReal;
                const evenReal = real[evenIndex];
                const evenImaginary = imaginary[evenIndex];

                real[evenIndex] = evenReal + oddReal;
                imaginary[evenIndex] = evenImaginary + oddImaginary;
                real[oddIndex] = evenReal - oddReal;
                imaginary[oddIndex] = evenImaginary - oddImaginary;

                const nextRotationReal = rotationReal * stepReal - rotationImaginary * stepImaginary;
                rotationImaginary = rotationReal * stepImaginary + rotationImaginary * stepReal;
                rotationReal = nextRotationReal;
            }
        }
    }
}

function smooth(values, radius) {
    const result = new Float64Array(values.length);
    const prefix = new Float64Array(values.length + 1);
    for (let index = 0; index < values.length; index += 1) {
        prefix[index + 1] = prefix[index] + values[index];
    }
    for (let index = 0; index < values.length; index += 1) {
        const start = Math.max(0, index - radius);
        const end = Math.min(values.length, index + radius + 1);
        result[index] = (prefix[end] - prefix[start]) / (end - start);
    }
    return result;
}

function analyzeSpectralFlux(samples, sampleRate) {
    const frameCount = Math.floor((samples.length - WINDOW_SIZE) / HOP_SIZE) + 1;
    const window = createHannWindow(WINDOW_SIZE);
    const previousMagnitude = new Float64Array(WINDOW_SIZE / 2);
    const flux = new Float64Array(frameCount);
    const real = new Float64Array(WINDOW_SIZE);
    const imaginary = new Float64Array(WINDOW_SIZE);

    for (let frame = 0; frame < frameCount; frame += 1) {
        const sampleOffset = frame * HOP_SIZE;
        for (let index = 0; index < WINDOW_SIZE; index += 1) {
            const current = samples[sampleOffset + index];
            const previous = index === 0 ? samples[Math.max(0, sampleOffset - 1)] : samples[sampleOffset + index - 1];
            real[index] = (current - previous * 0.97) * window[index];
            imaginary[index] = 0;
        }

        fft(real, imaginary);
        let frameFlux = 0;
        for (let bin = 2; bin < WINDOW_SIZE / 2; bin += 1) {
            const frequency = (bin * sampleRate) / WINDOW_SIZE;
            if (frequency > 12000) {
                break;
            }
            const magnitude = Math.log1p(Math.hypot(real[bin], imaginary[bin]) * 20);
            const difference = magnitude - previousMagnitude[bin];
            if (difference > 0) {
                const weight = frequency < 220 ? 1.35 : frequency < 2500 ? 1 : 0.72;
                frameFlux += difference * weight;
            }
            previousMagnitude[bin] = magnitude;
        }
        flux[frame] = frameFlux;
    }

    return smooth(flux, 1);
}

function calculateAdaptiveThreshold(envelope, radius = 32) {
    const threshold = new Float64Array(envelope.length);
    const prefix = new Float64Array(envelope.length + 1);
    const squaredPrefix = new Float64Array(envelope.length + 1);

    for (let index = 0; index < envelope.length; index += 1) {
        prefix[index + 1] = prefix[index] + envelope[index];
        squaredPrefix[index + 1] = squaredPrefix[index] + envelope[index] ** 2;
    }

    for (let index = 0; index < envelope.length; index += 1) {
        const start = Math.max(0, index - radius);
        const end = Math.min(envelope.length, index + radius + 1);
        const count = end - start;
        const mean = (prefix[end] - prefix[start]) / count;
        const meanSquare = (squaredPrefix[end] - squaredPrefix[start]) / count;
        const deviation = Math.sqrt(Math.max(0, meanSquare - mean ** 2));
        threshold[index] = mean + deviation * 0.72;
    }

    return threshold;
}

function estimateTempo(envelope, threshold, sampleRate) {
    const pulse = new Float64Array(envelope.length);
    for (let index = 0; index < envelope.length; index += 1) {
        pulse[index] = Math.max(0, envelope[index] - threshold[index]);
    }

    const hopSeconds = HOP_SIZE / sampleRate;
    const minimumLag = Math.round(60 / 180 / hopSeconds);
    const maximumLag = Math.round(60 / 70 / hopSeconds);
    let bestLag = minimumLag;
    let bestScore = Number.NEGATIVE_INFINITY;

    for (let lag = minimumLag; lag <= maximumLag; lag += 1) {
        let score = 0;
        let leftEnergy = 0;
        let rightEnergy = 0;
        for (let index = lag; index < pulse.length; index += 1) {
            const left = pulse[index];
            const right = pulse[index - lag];
            score += left * right;
            leftEnergy += left * left;
            rightEnergy += right * right;
        }
        const normalized = score / Math.sqrt(Math.max(1e-12, leftEnergy * rightEnergy));
        if (normalized > bestScore) {
            bestScore = normalized;
            bestLag = lag;
        }
    }

    return 60 / (bestLag * hopSeconds);
}

function pickEvents(envelope, threshold, sampleRate, duration) {
    const candidates = [];
    const hopSeconds = HOP_SIZE / sampleRate;
    const halfWindowSeconds = WINDOW_SIZE / sampleRate / 2;

    for (let index = 2; index < envelope.length - 2; index += 1) {
        const value = envelope[index];
        const time = index * hopSeconds + halfWindowSeconds;
        if (time < START_PADDING_SECONDS || time > duration - END_PADDING_SECONDS) {
            continue;
        }
        if (value <= threshold[index] || value < envelope[index - 1] || value <= envelope[index + 1]) {
            continue;
        }
        candidates.push({
            time,
            prominence: value - threshold[index],
            value,
        });
    }

    const sortedByStrength = [...candidates].sort((a, b) => b.prominence - a.prominence);
    const maximumEvents = Math.round(duration * 1.35);
    const selected = [];
    for (const candidate of sortedByStrength) {
        if (selected.some((event) => Math.abs(event.time - candidate.time) < MIN_EVENT_SPACING_SECONDS)) {
            continue;
        }
        selected.push(candidate);
        if (selected.length >= maximumEvents) {
            break;
        }
    }
    selected.sort((a, b) => a.time - b.time);

    const strengths = selected.map((event) => event.prominence).sort((a, b) => a - b);
    const highReference = strengths[Math.max(0, Math.floor(strengths.length * 0.9))] || 1;
    return selected.map((event) => ({
        time: Number(event.time.toFixed(4)),
        strength: Number(Math.min(1, event.prominence / highReference).toFixed(4)),
    }));
}

function assignDangerEvents(events) {
    const strongest = [...events]
        .map((event, index) => ({ ...event, index }))
        .filter((event) => event.time >= 8)
        .sort((a, b) => b.strength - a.strength);
    const dangerIndexes = [];

    for (const candidate of strongest) {
        if (dangerIndexes.some((index) => Math.abs(events[index].time - candidate.time) < 6)) {
            continue;
        }
        dangerIndexes.push(candidate.index);
        if (dangerIndexes.length >= 5) {
            break;
        }
    }

    const dangerSet = new Set(dangerIndexes);
    const strengthOrder = [...events]
        .map((event, index) => ({ strength: event.strength, index }))
        .sort((a, b) => a.strength - b.strength);
    const characterByIndex = new Map();
    for (let rank = 0; rank < strengthOrder.length; rank += 1) {
        characterByIndex.set(
            strengthOrder[rank].index,
            Math.min(4, Math.floor((rank * 5) / Math.max(1, strengthOrder.length))),
        );
    }

    return events.map((event, index) => ({
        ...event,
        danger: dangerSet.has(index),
        characterIndex: characterByIndex.get(index) ?? 0,
    }));
}

function main() {
    const scriptDirectory = dirname(fileURLToPath(import.meta.url));
    const projectDirectory = resolve(scriptDirectory, '..');
    const inputPath = resolve(process.argv[2] ?? resolve(projectDirectory, 'assets/resources/audio/music_stage1.wav'));
    const outputPath = resolve(process.argv[3] ?? resolve(projectDirectory, 'assets/resources/audio_chart_stage1.json'));
    const wave = parsePcmWave(inputPath);
    const envelope = analyzeSpectralFlux(wave.samples, wave.sampleRate);
    const threshold = calculateAdaptiveThreshold(envelope);
    const events = assignDangerEvents(pickEvents(envelope, threshold, wave.sampleRate, wave.duration));
    const estimatedBpm = estimateTempo(envelope, threshold, wave.sampleRate);

    const chart = {
        version: 1,
        sourceAudio: 'audio/music_stage1.wav',
        duration: Number(wave.duration.toFixed(4)),
        analysis: {
            method: 'spectral-flux-onset',
            sampleRate: wave.sampleRate,
            channels: wave.channels,
            bitsPerSample: wave.bitsPerSample,
            windowSize: WINDOW_SIZE,
            hopSize: HOP_SIZE,
            minimumEventSpacing: MIN_EVENT_SPACING_SECONDS,
            estimatedBpm: Number(estimatedBpm.toFixed(2)),
        },
        events,
    };

    writeFileSync(outputPath, `${JSON.stringify(chart, null, 2)}\n`);
    console.log(`Analyzed ${wave.duration.toFixed(2)}s WAV: ${events.length} events, ${events.filter((event) => event.danger).length} danger events, estimated ${chart.analysis.estimatedBpm} BPM.`);
    console.log(`Wrote ${outputPath}`);
}

main();
