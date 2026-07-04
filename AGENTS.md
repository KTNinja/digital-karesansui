Project: Digital Karesansui

Objective: Real-time, multiplayer Japanese Zen Garden simulation.

Architecture: FastAPI (Python) Serverless WebSockets via AWS API Gateway, Redis for ephemeral state, React 19 Canvas frontend.

Golden Rule: Strict adherence to "Composition over Configuration." UI components must be highly isolated and reusable. Absolutely zero bloated monolithic files.

State Resolution: Last-Write-Wins (LWW) conflict strategy. The system is benchmarked strictly against a 100ms round-trip latency budget to prevent visual rubber-banding.
* Testing: End-to-end testing mimicking user experience is preferred over basic unit tests.