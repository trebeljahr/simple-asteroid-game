class Game {
  async start() {
    await this.startCountdown();

    this.running = true;
    const waveSystem = this.waveSystem = new WaveSystem();

    waveSystem.start();
  }

  async startCountdown(seconds = 3) {
    console.log(seconds);

    return new Promise(resolve => {
      const interval = setInterval(() => {
        seconds--;

        if (!seconds) {
          clearInterval(interval);

          console.log('start');

          resolve();
        } else {
          console.log(seconds);
        }
      }, 1000);
    });
  }

  pause() {
    this.running = false;
  }

  stop() {
    this.running = false;
  }
}