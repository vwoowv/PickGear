export interface AnalyzedAudioEvent {
    time: number;
    strength: number;
    danger: boolean;
    characterIndex: number;
}

export interface AudioAnalysisChart {
    version: number;
    sourceAudio: string;
    duration: number;
    analysis: {
        method: string;
        sampleRate: number;
        channels: number;
        bitsPerSample: number;
        windowSize: number;
        hopSize: number;
        minimumEventSpacing: number;
        estimatedBpm: number;
    };
    events: AnalyzedAudioEvent[];
}

export interface BeatEvent {
    id: number;
    hitTime: number;
    strength: number;
    isDanger: boolean;
    characterIndex: number;
}

export interface GuideCue {
    time: number;
    accent: boolean;
}

export function buildAudioEvents(chart: AudioAnalysisChart): BeatEvent[] {
    if (chart.version !== 1 || !Array.isArray(chart.events)) {
        throw new Error('Unsupported audio analysis chart.');
    }

    return chart.events
        .filter((event) => Number.isFinite(event.time) && event.time >= 0 && event.time <= chart.duration)
        .sort((a, b) => a.time - b.time)
        .map((event, id) => ({
            id,
            hitTime: event.time,
            strength: Math.max(0, Math.min(1, event.strength)),
            isDanger: event.danger,
            characterIndex: Math.max(0, Math.min(4, Math.floor(event.characterIndex))),
        }));
}

export function buildGuideCues(chart: AudioAnalysisChart, events: BeatEvent[]): GuideCue[] {
    const bpm = Number.isFinite(chart.analysis.estimatedBpm) && chart.analysis.estimatedBpm > 0
        ? chart.analysis.estimatedBpm
        : 120;
    const halfBeat = 30 / bpm;
    const phraseGap = halfBeat * 5;
    const cues: GuideCue[] = [];

    for (let index = 0; index < events.length; index++) {
        const event = events[index];
        if (event.isDanger) {
            continue;
        }

        const previousEvent = index > 0 ? events[index - 1] : null;
        const beginsPhrase = !previousEvent || event.hitTime - previousEvent.hitTime >= phraseGap;
        if (beginsPhrase) {
            for (let step = 4; step >= 2; step--) {
                const time = event.hitTime - halfBeat * step;
                if (time >= 0.05) {
                    cues.push({ time, accent: false });
                }
            }
        }

        const accentTime = event.hitTime - halfBeat;
        if (accentTime >= 0.05) {
            cues.push({ time: accentTime, accent: true });
        }
    }

    cues.sort((a, b) => a.time - b.time || Number(a.accent) - Number(b.accent));
    const merged: GuideCue[] = [];
    for (const cue of cues) {
        const previousCue = merged[merged.length - 1];
        if (previousCue && Math.abs(previousCue.time - cue.time) < 0.035) {
            previousCue.accent = previousCue.accent || cue.accent;
            continue;
        }
        merged.push({ ...cue });
    }

    return merged;
}
