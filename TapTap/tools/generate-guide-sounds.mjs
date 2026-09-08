#!/usr/bin/env node

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SAMPLE_RATE = 48000;

function createRandom(seed) {
    let state = seed >>> 0;
    return () => {
        state = (state * 1664525 + 1013904223) >>> 0;
        return state / 0xffffffff;
    };
}

function synthesizeWoodTick({ duration, frequency, gain, seed }) {
    const frameCount = Math.round(duration * SAMPLE_RATE);
    const samples = new Float64Array(frameCount);
    const random = createRandom(seed);

    for (let index = 0; index < frameCount; index += 1) {
        const time = index / SAMPLE_RATE;
        const attack = Math.min(1, time / 0.0015);
        const bodyEnvelope = Math.exp(-time / 0.018);
        const overtoneEnvelope = Math.exp(-time / 0.009);
        const noiseEnvelope = Math.exp(-time / 0.0045);
        const body = Math.sin(2 * Math.PI * frequency * time);
        const overtone = Math.sin(2 * Math.PI * frequency * 2.37 * time) * 0.38;
        const click = (random() * 2 - 1) * 0.18;
        const release = Math.min(1, (duration - time) / 0.006);

        samples[index] = gain * attack * Math.max(0, release) * (
            body * bodyEnvelope
            + overtone * overtoneEnvelope
            + click * noiseEnvelope
        );
    }

    return samples;
}

function encodePcm16Wave(samples) {
    const bytesPerSample = 2;
    const dataSize = samples.length * bytesPerSample;
    const buffer = Buffer.alloc(44 + dataSize);

    buffer.write('RIFF', 0, 'ascii');
    buffer.writeUInt32LE(36 + dataSize, 4);
    buffer.write('WAVE', 8, 'ascii');
    buffer.write('fmt ', 12, 'ascii');
    buffer.writeUInt32LE(16, 16);
    buffer.writeUInt16LE(1, 20);
    buffer.writeUInt16LE(1, 22);
    buffer.writeUInt32LE(SAMPLE_RATE, 24);
    buffer.writeUInt32LE(SAMPLE_RATE * bytesPerSample, 28);
    buffer.writeUInt16LE(bytesPerSample, 32);
    buffer.writeUInt16LE(16, 34);
    buffer.write('data', 36, 'ascii');
    buffer.writeUInt32LE(dataSize, 40);

    for (let index = 0; index < samples.length; index += 1) {
        const clamped = Math.max(-1, Math.min(1, samples[index]));
        buffer.writeInt16LE(Math.round(clamped * 32767), 44 + index * bytesPerSample);
    }

    return buffer;
}

function main() {
    const scriptDirectory = dirname(fileURLToPath(import.meta.url));
    const projectDirectory = resolve(scriptDirectory, '..');
    const audioDirectory = resolve(projectDirectory, 'assets/resources/guide_audio');
    const tickPath = resolve(audioDirectory, 'guide_tick.wav');
    const readyPath = resolve(audioDirectory, 'guide_ready.wav');

    mkdirSync(audioDirectory, { recursive: true });
    writeFileSync(tickPath, encodePcm16Wave(synthesizeWoodTick({
        duration: 0.055,
        frequency: 840,
        gain: 0.24,
        seed: 1403,
    })));
    writeFileSync(readyPath, encodePcm16Wave(synthesizeWoodTick({
        duration: 0.075,
        frequency: 1260,
        gain: 0.4,
        seed: 9173,
    })));

    console.log(`Wrote ${tickPath}`);
    console.log(`Wrote ${readyPath}`);
}

main();
