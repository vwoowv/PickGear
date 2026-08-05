export interface MidiNote {
    time: number;
    duration: number;
    midi: number;
    name: string;
    velocity: number;
}

export interface MidiTrack {
    notes?: MidiNote[];
}

export interface MidiChart {
    header?: {
        tempos?: Array<{ bpm: number; ticks: number }>;
    };
    tracks?: MidiTrack[];
}

export interface BeatEvent {
    id: number;
    hitTime: number;
    isDanger: boolean;
    characterIndex: number;
}

/**
 * The source MIDI is denser than a one-tap prototype needs. Keep the musical
 * timing while enforcing enough space for readable mobile input.
 */
export function buildPrototypeChart(chart: MidiChart): BeatEvent[] {
    const sourceNotes: MidiNote[] = [];
    for (const track of chart.tracks ?? []) {
        for (const note of track.notes ?? []) {
            if (Number.isFinite(note.time)) {
                sourceNotes.push(note);
            }
        }
    }
    sourceNotes.sort((a, b) => a.time - b.time);

    const events: BeatEvent[] = [];
    const minimumSpacing = 0.5;
    let previousTime = Number.NEGATIVE_INFINITY;

    for (const note of sourceNotes) {
        if (note.time < 1.4 || note.time > 50.5) {
            continue;
        }
        if (note.time - previousTime < minimumSpacing) {
            continue;
        }

        const id = events.length;
        events.push({
            id,
            hitTime: note.time,
            isDanger: id >= 8 && id % 13 === 0,
            characterIndex: Math.abs(note.midi) % 5,
        });
        previousTime = note.time;
    }

    return events;
}
