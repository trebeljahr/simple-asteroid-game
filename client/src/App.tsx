import React, { useEffect, useState } from "react";
import { GameMode, GameState, gameStateMachine } from "./gameState";
import {
  closeOptionsMenu,
  openOptionsMenu,
  resumeGameplay,
  returnToMainMenu,
  toggleCollisionDebug,
  toggleSoundEnabled,
} from "./gameUiActions";
import {
  activateGameMode,
  restartCurrentMode,
} from "./gameModeActions";
import { isCollisionDebugAvailable } from "./collisionDebug";
import { MULTIPLAYER_SHIP_VARIANTS, ShipVariant } from "../../shared/src";

const capitalizeWords = (str: string) => {
  return str.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
};

const ActionButton: React.FC<{
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary" | "ghost";
}> = ({ label, onClick, variant = "primary" }) => (
  <button className={`menuButton menuButton--${variant}`} onClick={onClick} type="button">
    {label}
  </button>
);

const PanelCloseButton: React.FC<{ label: string; onClick: () => void }> = ({ label, onClick }) => (
  <button className="menuPanelClose" onClick={onClick} type="button" aria-label={label}>
    X
  </button>
);

const ShipSelection: React.FC<{ currentVariant: ShipVariant }> = ({ currentVariant }) => (
  <div className="shipSelection">
    <h2 className="shipSelectionLabel">Choose Your Ship</h2>
    <div className="shipGrid">
      {MULTIPLAYER_SHIP_VARIANTS.map((variant) => (
        <button
          key={variant}
          type="button"
          className={`shipItem ${variant === currentVariant ? "is-selected" : ""}`}
          onClick={() => gameStateMachine.send({ type: "SELECT_SHIP", shipVariant: variant })}
        >
          <img
            className="shipImage"
            src={`/assets/alternatives/ship-alt-${variant}.svg`}
            alt={capitalizeWords(variant)}
          />
          <span className="shipName">{capitalizeWords(variant)}</span>
        </button>
      ))}
    </div>
  </div>
);

const OptionsPanel: React.FC<{ state: GameState }> = ({ state }) => (
  <section className="menuPanel">
    <h1 className="menuTitle">Options</h1>
    
    <div className="menuActions">
      <ActionButton
        label={state.settings.soundEnabled ? "Sound: On" : "Sound: Off"}
        onClick={toggleSoundEnabled}
      />
      {isCollisionDebugAvailable() && (
        <ActionButton
          label={state.settings.collisionDebugEnabled ? "Collision Debug: On" : "Collision Debug: Off"}
          onClick={toggleCollisionDebug}
        />
      )}
      <ActionButton label="Back" onClick={closeOptionsMenu} variant="secondary" />
    </div>
  </section>
);

const MainMenuPanel: React.FC<{ state: GameState }> = ({ state }) => (
  <section className="menuPanel">
    <h1 className="menuTitle menuTitle--main-menu">Asteroids</h1>
    
    <ShipSelection currentVariant={state.settings.shipVariant} />

    <div className="menuActions">
      <ActionButton label="Singleplayer Mode" onClick={() => activateGameMode("singleplayer")} />
      <ActionButton
        label="Multiplayer Battle"
        onClick={() => activateGameMode("multiplayer")}
        variant="secondary"
      />
      <ActionButton label="Options" onClick={openOptionsMenu} variant="ghost" />
    </div>
  </section>
);

const PausePanel: React.FC<{ state: GameState }> = ({ state }) => {
  const modeLabel = state.scene.type === "mode" 
    ? (state.scene.mode === "singleplayer" ? "Singleplayer" : capitalizeWords(state.scene.mode)) 
    : "Game";
  return (
    <section className="menuPanel menuPanel--pause">
      <h1 className="menuTitle menuTitle--compact">{modeLabel} Paused</h1>
      <PanelCloseButton label="Close pause menu" onClick={resumeGameplay} />
      <div className="menuActions menuActions--pause">
        <ActionButton label="Resume" onClick={resumeGameplay} />
        <ActionButton label="Options" onClick={openOptionsMenu} variant="secondary" />
        <ActionButton label="Main Menu" onClick={returnToMainMenu} variant="ghost" />
      </div>
    </section>
  );
};

const ResultPanel: React.FC<{ state: GameState; title: string; subtitle: string }> = ({
  state,
  title,
  subtitle,
}) => (
  <section className="menuPanel">
    <h1 className="menuTitle">{title}</h1>
    <p className="menuSubtitle">{subtitle}</p>
    
    <div className="menuActions">
      <ActionButton label="Try Again" onClick={restartCurrentMode} />
      <ActionButton label="Options" onClick={openOptionsMenu} variant="secondary" />
      <ActionButton label="Main Menu" onClick={returnToMainMenu} variant="ghost" />
    </div>
  </section>
);

const MenuRock: React.FC<{ config: any }> = ({ config }) => (
  <img
    className="menuRock"
    src={config.src}
    alt=""
    aria-hidden="true"
    style={{
      // @ts-ignore
      "--rock-left": config.left,
      "--rock-top": config.top,
      "--rock-size": config.size,
      "--rock-opacity": config.opacity,
      "--rock-duration": config.duration,
      "--rock-delay": config.delay,
      "--rock-drift-x": config.driftX,
      "--rock-drift-y": config.driftY,
    }}
  />
);

const MenuScene: React.FC = () => {
  const menuRocks = [
    { src: "/assets/asteroid1.svg", left: "8%", top: "10%", size: "11rem", opacity: "0.38", duration: "26s", delay: "-7s", driftX: "2.5rem", driftY: "1.75rem" },
    { src: "/assets/asteroid2.svg", left: "78%", top: "14%", size: "9rem", opacity: "0.28", duration: "22s", delay: "-11s", driftX: "-1.25rem", driftY: "2rem" },
    { src: "/assets/asteroid3.svg", left: "15%", top: "68%", size: "13rem", opacity: "0.2", duration: "31s", delay: "-5s", driftX: "3rem", driftY: "-2.5rem" },
    { src: "/assets/asteroid2.svg", left: "70%", top: "62%", size: "15rem", opacity: "0.18", duration: "34s", delay: "-13s", driftX: "-2.75rem", driftY: "-1.5rem" },
    { src: "/assets/asteroid1.svg", left: "47%", top: "6%", size: "7rem", opacity: "0.22", duration: "19s", delay: "-3s", driftX: "1.5rem", driftY: "2.25rem" },
  ];

  return (
    <div className="menuScene">
      <div className="menuBackdrop" aria-hidden="true" />
      <div className="menuGlow" />
      {menuRocks.map((rock, i) => (
        <MenuRock key={i} config={rock} />
      ))}
      <div className="menuScenePane" />
    </div>
  );
};

export const App: React.FC = () => {
  const [state, setState] = useState<GameState>(gameStateMachine.getState());

  useEffect(() => {
    return gameStateMachine.subscribe((newState) => {
      setState(newState);
    });
  }, []);

  const shouldShowMenu = state.scene.type === "main-menu" || state.scene.type === "result" || state.overlay !== null;
  const shouldShowDecorativeScene =
    state.scene.type === "main-menu" ||
    state.scene.type === "result" ||
    (state.overlay !== null &&
      state.overlay.type === "options" &&
      (state.overlay.returnTarget === "main-menu" || state.overlay.returnTarget === "result"));
  const shouldShowGameplayShade =
    state.overlay?.type === "pause" || (state.overlay?.type === "options" && state.overlay.returnTarget === "pause");

  useEffect(() => {
    const root = document.getElementById("menu");
    if (!root) return;

    root.classList.toggle("is-active", shouldShowMenu);
    root.classList.toggle("has-scene", shouldShowDecorativeScene);
    root.classList.toggle("has-gameplay-shade", shouldShowGameplayShade);
  }, [shouldShowMenu, shouldShowDecorativeScene, shouldShowGameplayShade]);

  if (!shouldShowMenu) {
    return null;
  }

  return (
    <>
      {shouldShowDecorativeScene && <MenuScene />}
      <div className="menuContent">
        {state.overlay?.type === "options" && <OptionsPanel state={state} />}
        {state.overlay === null && state.scene.type === "main-menu" && <MainMenuPanel state={state} />}
        {state.overlay?.type === "pause" && <PausePanel state={state} />}
        {state.scene.type === "result" && state.overlay === null && (
          <ResultPanel state={state} title={state.scene.title} subtitle={state.scene.subtitle} />
        )}
      </div>
    </>
  );
};
