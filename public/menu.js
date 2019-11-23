let menuIsOpen, button, div, gameOver = false;

function toggleDeathScreen() {
    toggleMenu('Game Over', 'Press T to Start Again')
    gameOver = true
  }
  
function pauseGame() {
    toggleMenu('Pause', 'Press T to Continue');
  }
  
function toggleMenu(buttonText, divText) {
    if (gameOver) return
    menuIsOpen = !menuIsOpen
    if (button) {
      button.remove();
      button = false;
      div.remove();
      div = false;
      return
    }
    button = createButton(buttonText);
    button.class("resumeButton")
    button.parent("menu")
    button.mouseClicked(pauseGame);
  
    div = createDiv(divText)
    div.parent('menu')
}

function keyPressed() {
      switch(keyCode) {
          case T_KEYCODE:
            if (gameOver) {
                restart()
                return
            }
            pauseGame();
            break;
        }
}
  