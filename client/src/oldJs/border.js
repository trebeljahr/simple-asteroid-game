let boardSizeX;
let boardSizeY;

class Border {
    constructor() {
      this.x = -boardSizeX;
      this.y = -boardSizeY;
      this.sizeX = 2*boardSizeX;
      this.sizeY = 2*boardSizeY;
    }
  
    show() {
      fill('rgba(0,0,0,0)');
      stroke(255);
      rect(this.x, this.y, this.sizeX, this.sizeY);
    }
}