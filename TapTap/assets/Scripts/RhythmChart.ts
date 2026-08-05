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
