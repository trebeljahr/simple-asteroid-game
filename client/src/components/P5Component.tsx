import React, { useRef, useState, useEffect } from "react";
import p5 from "p5";
import { restart } from "../utils/menu";
import { asteroidSystem } from "../utils/asteroidSystem";
import { width, height } from "../utils";

export const P5Component = () => {
  const [_, setMyP5] = useState<p5>();
  const myRef = useRef(null);
  const Sketch = (p: p5) => {
    p.setup = () => {
      p.createCanvas(width, height);
      restart(p);
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
