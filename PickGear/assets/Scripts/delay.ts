export class delayMS {
    public delay(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

export class delaySeconds {
    public delay(seconds: number) {
        return new Promise(resolve => setTimeout(resolve, seconds * 1000));
    }
}