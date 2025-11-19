"use client";

import { useState, useEffect } from "react";
import { GridScan } from "../components/GridScan.jsx";
import ASCIIText from "../components/ASCIIText.jsx";

export default function Page() {
  const [asciiSize, setAsciiSize] = useState(100);
  const [textSize, setTextSize] = useState(100);

  useEffect(() => {
    const duration = 2500;
    const start = performance.now();

    function animate(t) {
      const raw = Math.min((t - start) / duration, 1);

      const easeOutExpo = (x) =>
        x === 1 ? 1 : 1 - Math.pow(2, -10 * x);

      const p = easeOutExpo(raw);

      const lerp = (a, b) => a + (b - a) * p;

      setAsciiSize(lerp(1000, 5));
      setTextSize(lerp(1000, 20));

      if (raw < 1) requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
  }, []);



// ------------------------- EDIT THESE FOR COLOR ------------------------------
  useEffect(() => {
    document.documentElement.style.setProperty("--lines-color", "rgb(181, 235, 247)");
    document.documentElement.style.setProperty("--scan-color", "rgb(255, 242, 52)");
    document.documentElement.style.setProperty("--text-color", "rgb(247, 54, 77)");
  }, []);
// -----------------------------------------------------------------------------
  const css = getComputedStyle(document.documentElement);

  const linesColor = css.getPropertyValue("--lines-color").trim();
  const scanColor = css.getPropertyValue("--scan-color").trim();
  const textColor = css.getPropertyValue("--text-color").trim();
  return (
    <div
      style={{
        width: "100%",
        height: "600px",
        position: "relative",
        background: "rgb(17,17,17)",
        overflow: "hidden",
      }}
    >
      <GridScan
        sensitivity={0}
        lineThickness={5}
        linesColor={linesColor}
        gridScale={0.1}
        scanColor={scanColor}
        scanOpacity={0.4}
        enablePost={true}
        bloomIntensity={0.6}
        chromaticAberration={0.002}
        noiseIntensity={0.01}
        scanDirection="backward"
        scanOnClick={true}
        scanDelay={2}
        scanDuration={2}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <ASCIIText
          text="CF '26"
          asciiFontSize={asciiSize}
          textFontSize={textSize}
          textColor={textColor}
          planeBaseHeight={8}
          enableWaves={false}
        />
        <h1
  style={{
    position: "absolute",
    bottom: "20%",
    left: "50%",
    transform: "translateX(-50%)",
    margin: 0,
    padding: "0 20px",

    fontFamily: "Consolas, monospace",
    fontWeight: 700,
    fontSize: "42px",
    letterSpacing: "1.5px",
    textTransform: "uppercase",

    color: "var(--text-color)",

    background: "rgba(0,0,0,0.30)",
    borderRadius: "10px",
    backdropFilter: "blur(6px)",
  }}
>
  Oakridge Codefest 2026
</h1>
      </div>
    </div>
  );
}
