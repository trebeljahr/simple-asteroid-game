import React, { useRef, useState, useEffect } from "react";
import p5 from "p5";

export const P5_Component = () => {
  const [_, setMyP5] = useState<p5>();
  const myRef = useRef(null);
  const Sketch = (p: any) => {
    p.setup = () => {
      p.canvas(500, 500);
      p.background("black");
    };

    p.draw = () => {};
  };

  useEffect(() => {
    const container = (myRef.current as unknown) as HTMLElement;
    setMyP5(new p5(Sketch, container));
  }, []);

  return <div ref={myRef}></div>;
};
