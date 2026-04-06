# 📘 SiliconMind Legacy Manual: Volume 6 — Domain Engineering (Hardware Specialist)

This volume explains the "Specialization" of SiliconMind. It is the bridge between **Software Engineering** (the AI) and **Hardware Engineering** (your career).

---

## ⚡ 1. Why 60 Nodes? (Knowledge Strategy)

The `knowledge_graph.json` contains a curated set of 60 concepts. Why these?

- **The Foundation**: Physics (Electrostatics, Electromagnetism) is where all hardware starts.
- **The Core**: Passive & Active components (Resistors, MOSFETs, Op-Amps) are the "Building Blocks".
- **The Controller**: Embedded Systems (Interrupts, DMA, SPI) are the "Software for Hardware".
- **The Layout**: PCB & VLSI (Trace Width, Verilog) are the "Physical Realization".

---

## 🧠 2. Deep Dive: Agent Intelligence Customization

Each agent in the swarm is designed to have a specific "Personality" and "Rulebook".

### **Agent: EMBEDDED_C (Software-Hardware Bridge)**
- **Rules**: 
  - Never use `printf` if it's not a debug task. Use standard HAL calls.
  - Always check for "Race Conditions" in Interrupt Service Routines (ISRs).
  - Prioritize "MISRA C" code style for safety-critical hardware.

### **Agent: PCB_DESIGN (Physical Design Specialist)**
- **Rules**: 
  - Always mention "Star Grounding" and "Bypass Capacitors".
  - If a signal is >1GHz, warn about "Microstrip" impedance matching.
  - Prioritize "Thermal Management" to prevent component burn-out.

---

## 🏗️ 3. The "Product Brief" Logic (System Decomposition)

How does SiliconMind architect a product?

1.  **Requirement Analysis**: It identifies the "Input/Output" (I/O) needs of the project.
2.  **Power Budgeting**: It estimates how many milliamps (mA) each chip will draw to ensure your battery/LDO doesn't overheat.
3.  **Communication Protocols**: It chooses between I2C, SPI, UART, or USB based on "Distance" and "Speed".
4.  **BOM (Bill of Materials)**: It searches the web for real, available microcontrollers (like STM32 or ESP32) which are "In Stock" at major distributors.

---

## 📜 4. Engineering Math (Python Integration)

SiliconMind has access to a **Python Interpreter**. 

- **How it works**: If you ask, "What is the resonance frequency for a 1uH inductor and 1uF capacitor?", SiliconMind writes a Python script using `math.sqrt` to solve the equation.
- **Why it matters**: A normal LLM (like ChatGPT) often fails at exact hardware math. SiliconMind "Solves" the math with a real calculator and only outputs the verified result.

---

## 🧭 5. The "Learning Pathway" (Prerequisite Mapping)

Inside `knowledge_graph.json`, we have defined `links`:
- **Source**: "Op-Amp"
- **Target**: "ADC / DAC"

This logic tells the AI: "If the user is struggling with Analog-to-Digital conversion, they probably need to learn about Op-Amps first." This is how SiliconMind acts as a **Mentor**, not just a tool.

---

**This concludes the technical engineering walkthrough.** You now possess the most specialized AI hardware engineering platform currently in development.
