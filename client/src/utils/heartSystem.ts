import p5 from "p5";

export const asteroidSystem = (p: p5) => {
  let instance: AsteroidSystem;

  const createInstance = () => {
    return new AsteroidSystem(p);
  };

  return {
    getInstance: () => {
      if (!instance) {
        instance = createInstance();
      }
      return instance;
    },
    reset: () => {
      instance = createInstance();
      return instance;
    },
  };
};
