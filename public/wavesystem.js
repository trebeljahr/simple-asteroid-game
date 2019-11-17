class WaveSystem {
  constructor() {
    this.interval = null;
  }

  start() {
    this.interval = setInterval(this._update, 1000);
  }

  _update = () => {
    if (enemies.length) {
      return;
    }

    if (chance(0.1)) {
      console.log('create wave');

      this.createWave();
    }
  };

  createWave() {
    let enemy = new TemporaryEnemy(width, height, 8);
    enemies.push(enemy);
  }

  stop() {
    clearInterval(this.interval);
  }
}