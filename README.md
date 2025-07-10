# ABAP Simulator Project

This project is a simple ABAP code simulator that allows you to write, run, and test basic ABAP code snippets in a web-based environment.

---

## Project Structure

- **backend/** — Node.js Express backend API that parses, checks syntax, and simulates ABAP code execution.
- **frontend/** — React-based frontend UI to input ABAP code and display output/errors.

---

## Features

- Syntax checking for basic ABAP code.
- Simulation of ABAP internal tables, loops, and writes.
- REST API backend serving code execution results.
- Simple web UI for entering and running ABAP code.

---

## Getting Started

### Prerequisites

- Node.js (v14+ recommended)
- npm (comes with Node.js)

### Setup Backend

```bash
cd backend
npm install
npm start
