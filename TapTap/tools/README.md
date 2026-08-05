# Audio chart extraction

`audio_chart_stage1.json` is generated ahead of time from the exact WAV file used by
the game. The web build only loads the generated JSON and does not analyze
audio while the game is running.

Regenerate the chart after replacing or editing the music:

```sh
node tools/extract-audio-chart.mjs
```

The extractor reads PCM WAV data directly, calculates a spectral-flux onset
envelope, estimates tempo, removes events that are too close for a one-button
mobile game, and writes deterministic event times and strengths to
`assets/resources/audio_chart_stage1.json`.
