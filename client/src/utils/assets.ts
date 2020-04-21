import p5, { Image } from "p5";

export interface Assets {
  asteroids: Image[];
  heart: Image;
  space: Image;
  rocket: Image;
  ammoAsset: Image;
}
export const assets = (p: p5) => {
  let instance: Assets;

  const createInstance = () => {
    const asteroid1 = p.loadImage("assets/asteroid1.svg");
    const asteroid2 = p.loadImage("assets/asteroid2.svg");
    const asteroid3 = p.loadImage("assets/asteroid3.svg");
    const heart = p.loadImage("assets/heart.svg");
    const space = p.loadImage("assets/background.jpg");
    const rocket = p.loadImage("assets/rocket.svg");
    const ammoAsset = p.loadImage("assets/bullets.svg");
    return {
      asteroids: [asteroid1, asteroid2, asteroid3],
      heart,
      space,
      rocket,
      ammoAsset,
    };
  };

  return {
    getInstance: () => {
      if (!instance) {
        instance = createInstance();
      }
      return instance;
    },
  };
};
