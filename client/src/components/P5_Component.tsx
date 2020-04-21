import React, { useRef, useState, useEffect } from "react";
import p5 from "p5";
import { Asteroid, createNewAsteroid } from "../utils/asteroid";

export const P5_Component = () => {
  const [_, setMyP5] = useState<p5>();
  const [asteroid, setAsteroid] = useState<Asteroid>();
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
      setAsteroid(createNewAsteroid(p));
    };

    p.draw = () => {
      asteroid?.draw();
    };
  };

  useEffect(() => {
    const container = (myRef.current as unknown) as HTMLElement;
    setMyP5(new p5(Sketch, container));
  }, []);

  return <div ref={myRef}></div>;
};
