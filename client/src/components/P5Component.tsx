import React, { useRef, useState, useEffect } from "react";
import p5 from "p5";
import { restart } from "../utils/menu";
import { width, height } from "../utils";
import { draw } from "../utils/draw";
import { assets, Assets } from "../utils/assets";

export const P5Component = () => {
  const [_, setMyP5] = useState<p5>();
  const [actualAssets, setAssets] = useState<Assets>();
  const myRef = useRef(null);
  const Sketch = (p: p5) => {
    p.preload = () => {
      setAssets(assets(p).getInstance());
    };
    p.setup = () => {
      p.createCanvas(width, height);
      restart(p);
    };
    p.draw = () => {
      if (actualAssets) {
        draw(p, actualAssets);
      }
    };
  };

  useEffect(() => {
    const container = (myRef.current as unknown) as HTMLElement;
    setMyP5(new p5(Sketch, container));
  }, []);

  return <div ref={myRef}></div>;
};
