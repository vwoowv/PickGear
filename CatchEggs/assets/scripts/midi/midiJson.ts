// Note 객체 타입 정의
interface NoteInfo {
    time: number;
    duration: number;
    name: string;
    midi: number;
    velocity: number;
}

// Track 객체 타입 정의
interface TrackInfo {
    notes: NoteInfo[];
}

// JSON 데이터 전체 구조 타입 정의
interface MidiJson {
    header: object;
    tracks: TrackInfo[];
}