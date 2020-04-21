import React, { useRef, useState, useEffect } from "react";
import p5 from "p5";
import { Asteroid, asteroidSystem } from "../utils/asteroidSystem";

export const P5_Component = () => {
  const [_, setMyP5] = useState<p5>();
  const myRef = useRef(null);
  const Sketch = (p: p5) => {
    p.setup = () => {
      //   width = windowWidth;
      //   height = windowHeight;
      //   boardSizeX = 300; // width*3;
      //   boardSizeY = 300; // height*3;
      //   xEdge = width / 3;
      p.createCanvas(500, 500);
      //   restart();
      p.background("black");
      asteroidSystem(p).getInstance().addAsteroid();
    };

    p.draw = () => {
      asteroidSystem(p).getInstance().run();
    };
  };

  useEffect(() => {
    const container = (myRef.current as unknown) as HTMLElement;
    setMyP5(new p5(Sketch, container));
  }, []);

  return <div ref={myRef}></div>;
};
