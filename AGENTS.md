# Cool-Assist Engineering Standards

Status: User-approved active project instructions.
Source: pasted_content.txt supplied on 2026-08-16.

## Industrial-Refrigeration-HVAC-Expert
Refrigeration calculations, equipment selection, P and ID generation, and safety logic must remain refrigerant-specific. Use validated thermophysical-property sources and never invent properties. Identify pressure-drop assumptions explicitly, and require engineering review for construction, safety, or regulatory decisions.

## Precision-Engineering-Math-Engine
Engineering algorithms must be deterministic, isolated, typed, unit-aware, and validated for dimensions, ranges, singularities, non-finite values, and non-convergence. Use SI internally with explicit type-safe SI-to-Imperial boundary conversion. Include automated nominal, boundary, and invalid-input tests.

## Parametric-3D-CAD-Library-Engine
Every BIM CAD family must define a stable origin, dimensions, bounding box, ports, port directions, DN, service metadata, material, and deterministic mesh construction. Preserve direct P and ID to 3D instance and port mapping. Pipe routing must preserve service, DN, joint policy, insulation, supports, and topology using physical fitting primitives rather than visual approximations.

## Senior-Software-Architect-Engine
Preserve frontend, renderer, scene graph, backend calculation, and persisted-data separation. Use typed contracts, avoid unrelated workflow changes, create recoverable baselines, and run targeted tests plus a production build. Prefer shared geometry and materials, instancing or LOD, and explicit Three.js disposal for high-volume rendering.

## Operational Rules
These standards are mandatory acceptance criteria. Do not claim standards compliance without traceable verification. Do not add external packages or tools without compatibility, licensing, and impact review. Preserve the refrigerant-profile architecture as the cross-layer source of truth. Report files changed, verification, limitations, and commit identifiers for every engineering enhancement.

## Primary Production Coding Rules
All engineering calculation functions must be type-safe, modular, deterministic, and based on validated real input data. Mock data, simplified placeholder formulas, and silent fallback values are prohibited in production calculation paths.
Refrigeration properties, heat loads, and pressure drops must use traceable thermodynamic equations or validated reference data. Implement calculations with explicit physical assumptions and applicability bounds, and validate them against authoritative data when available.
Vector math, transforms, matrices, bounding boxes, port frames, and parametric CAD geometry must use numerically robust operations, finite-value guards, tolerance-aware comparisons, and explicit coordinate-system contracts.
Three-dimensional render families shall regenerate mesh, bounds, and connection ports from dimensional parameters. Each family must retain a corresponding 2D P and ID symbol contract so that 2D and 3D representations refer to the same semantic equipment definition.
Keep Math and Physics Engine, Data Store, P and ID transformation, Scene Graph, Render Logic, and UI layers separated through typed interfaces. Do not couple rendering state to engineering calculation state.
Before every delivery, run applicable unit tests, boundary and non-convergence tests, integration tests, and a production build. Investigate and repair failures before marking a change complete. Report verification evidence and known limitations.
Production-ready means no unrelated regression, no fabricated engineering output, no unhandled non-finite numerical result, and no unverified claim of code or standards compliance.
