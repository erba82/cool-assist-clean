"""
Simplified 2D Heat Transfer Solver
Uses Finite Difference Method for solving heat equation
Supports conduction and convection
"""

import numpy as np
from scipy.sparse import diags
from scipy.sparse.linalg import spsolve
import warnings

class HeatSolver2D:
    """
    2D Heat Transfer Solver using Finite Difference Method
    
    Solves: ∂T/∂t = α(∂²T/∂x² + ∂²T/∂y²) + Q
    where:
        T = temperature field
        α = thermal diffusivity (k/ρc_p)
        Q = heat source term
    """
    
    def __init__(self, nx, ny, dx, dy, alpha=1e-5):
        """
        Initialize solver
        
        Args:
            nx, ny: Number of grid points
            dx, dy: Grid spacing (meters)
            alpha: Thermal diffusivity (m²/s)
        """
        self.nx = nx
        self.ny = ny
        self.dx = dx
        self.dy = dy
        self.alpha = alpha
        
        # Total number of points
        self.N = nx * ny
        
        # Initialize temperature field
        self.T = np.zeros((ny, nx))
        
        # Heat sources
        self.Q = np.zeros((ny, nx))
        
        # Boundary conditions
        self.bc = {
            'type': 'mixed',  # dirichlet, neumann, mixed
            'top': {'type': 'dirichlet', 'value': 25.0},
            'bottom': {'type': 'dirichlet', 'value': 25.0},
            'left': {'type': 'dirichlet', 'value': 25.0},
            'right': {'type': 'dirichlet', 'value': 25.0}
        }
        
        # Material properties
        self.k = 0.026  # Thermal conductivity (W/m·K) - air
        self.rho = 1.2  # Density (kg/m³)
        self.cp = 1005  # Specific heat (J/kg·K)
        
    def set_initial_temperature(self, T_init):
        """Set initial temperature field"""
        if isinstance(T_init, (int, float)):
            self.T = np.ones((self.ny, self.nx)) * T_init
        else:
            self.T = np.array(T_init)
    
    def add_heat_source(self, x, y, power, radius=0.5):
        """
        Add heat source at position (x, y)
        
        Args:
            x, y: Position (meters)
            power: Heat power (Watts)
            radius: Source radius (meters)
        """
        # Convert to grid indices
        i = int(y / self.dy)
        j = int(x / self.dx)
        
        # Distribute heat over radius
        for di in range(-2, 3):
            for dj in range(-2, 3):
                ii = i + di
                jj = j + dj
                
                if 0 <= ii < self.ny and 0 <= jj < self.nx:
                    dist = np.sqrt((di * self.dy)**2 + (dj * self.dx)**2)
                    if dist <= radius:
                        # Gaussian distribution
                        weight = np.exp(-dist**2 / (2 * (radius/3)**2))
                        # Convert power to volumetric heat generation (W/m³)
                        cell_volume = self.dx * self.dy * 1.0  # Assume 1m depth
                        self.Q[ii, jj] += (power * weight) / cell_volume
    
    def add_cooler(self, x, y, capacity, radius=0.5):
        """Add cooling source (negative heat)"""
        self.add_heat_source(x, y, -capacity, radius)
    
    def set_boundary_condition(self, side, bc_type, value):
        """
        Set boundary condition
        
        Args:
            side: 'top', 'bottom', 'left', 'right'
            bc_type: 'dirichlet' (fixed temp) or 'neumann' (fixed flux)
            value: Temperature (°C) or heat flux (W/m²)
        """
        self.bc[side] = {'type': bc_type, 'value': value}
    
    def _apply_boundary_conditions(self, T):
        """Apply boundary conditions to temperature field"""
        # Top
        if self.bc['top']['type'] == 'dirichlet':
            T[0, :] = self.bc['top']['value']
        elif self.bc['top']['type'] == 'neumann':
            # Neumann: dT/dy = flux/k
            flux = self.bc['top']['value']
            T[0, :] = T[1, :] - flux * self.dy / self.k
        
        # Bottom
        if self.bc['bottom']['type'] == 'dirichlet':
            T[-1, :] = self.bc['bottom']['value']
        elif self.bc['bottom']['type'] == 'neumann':
            flux = self.bc['bottom']['value']
            T[-1, :] = T[-2, :] + flux * self.dy / self.k
        
        # Left
        if self.bc['left']['type'] == 'dirichlet':
            T[:, 0] = self.bc['left']['value']
        elif self.bc['left']['type'] == 'neumann':
            flux = self.bc['left']['value']
            T[:, 0] = T[:, 1] - flux * self.dx / self.k
        
        # Right
        if self.bc['right']['type'] == 'dirichlet':
            T[:, -1] = self.bc['right']['value']
        elif self.bc['right']['type'] == 'neumann':
            flux = self.bc['right']['value']
            T[:, -1] = T[:, -2] + flux * self.dx / self.k
        
        return T
    
    def solve_steady_state(self, max_iterations=10000, tolerance=1e-6):
        """
        Solve steady-state heat equation
        Uses Gauss-Seidel iteration
        
        Returns:
            T: Steady-state temperature field
            iterations: Number of iterations
            residual: Final residual
        """
        print(f"Solving steady-state heat equation...")
        print(f"  Grid: {self.nx} x {self.ny}")
        print(f"  Thermal diffusivity: {self.alpha:.2e} m²/s")
        
        # Iteration
        T_old = self.T.copy()
        
        for iteration in range(max_iterations):
            # Update internal points
            for i in range(1, self.ny-1):
                for j in range(1, self.nx-1):
                    # Finite difference stencil
                    T_new = (
                        (T_old[i, j+1] + self.T[i, j-1]) / self.dx**2 +
                        (T_old[i+1, j] + self.T[i-1, j]) / self.dy**2 +
                        self.Q[i, j] / self.k
                    ) / (2/self.dx**2 + 2/self.dy**2)
                    
                    self.T[i, j] = T_new
            
            # Apply boundary conditions
            self.T = self._apply_boundary_conditions(self.T)
            
            # Check convergence
            residual = np.max(np.abs(self.T - T_old))
            
            if iteration % 100 == 0:
                print(f"  Iteration {iteration}: residual = {residual:.2e}")
            
            if residual < tolerance:
                print(f"✅ Converged in {iteration} iterations")
                print(f"   Final residual: {residual:.2e}")
                return self.T, iteration, residual
            
            T_old = self.T.copy()
        
        print(f"⚠️  Maximum iterations ({max_iterations}) reached")
        print(f"   Final residual: {residual:.2e}")
        return self.T, max_iterations, residual
    
    def solve_transient(self, dt, total_time, output_interval=None):
        """
        Solve transient heat equation using explicit method
        
        Args:
            dt: Time step (seconds)
            total_time: Total simulation time (seconds)
            output_interval: Time interval for saving results (seconds)
        
        Returns:
            results: List of (time, T) tuples
        """
        # Stability check (CFL condition)
        cfl = self.alpha * dt * (1/self.dx**2 + 1/self.dy**2)
        if cfl > 0.5:
            raise ValueError(
                f"Time step too large for stability. "
                f"CFL = {cfl:.3f} > 0.5. "
                f"Reduce dt to < {0.5 / (self.alpha * (1/self.dx**2 + 1/self.dy**2)):.4f} s"
            )
        
        print(f"Solving transient heat equation...")
        print(f"  Time step: {dt} s (CFL = {cfl:.3f})")
        print(f"  Total time: {total_time} s")
        
        # Time stepping
        num_steps = int(total_time / dt)
        current_time = 0.0
        
        results = []
        if output_interval:
            save_interval = int(output_interval / dt)
        else:
            save_interval = num_steps  # Save only final
        
        for step in range(num_steps):
            T_new = self.T.copy()
            
            # Update internal points (explicit method)
            for i in range(1, self.ny-1):
                for j in range(1, self.nx-1):
                    # Laplacian
                    d2T_dx2 = (self.T[i, j+1] - 2*self.T[i, j] + self.T[i, j-1]) / self.dx**2
                    d2T_dy2 = (self.T[i+1, j] - 2*self.T[i, j] + self.T[i-1, j]) / self.dy**2
                    
                    # Heat source term
                    q_source = self.Q[i, j] / (self.rho * self.cp)
                    
                    # Time evolution
                    T_new[i, j] = self.T[i, j] + dt * (
                        self.alpha * (d2T_dx2 + d2T_dy2) + q_source
                    )
            
            self.T = T_new
            self.T = self._apply_boundary_conditions(self.T)
            
            current_time += dt
            
            # Save results
            if step % save_interval == 0 or step == num_steps - 1:
                results.append((current_time, self.T.copy()))
                print(f"  t = {current_time:.2f} s: T_max = {self.T.max():.2f}°C, T_min = {self.T.min():.2f}°C")
        
        print(f"✅ Transient simulation complete")
        return results
    
    def get_results(self):
        """Get simulation results"""
        return {
            'temperature': self.T,
            'max_temperature': float(np.max(self.T)),
            'min_temperature': float(np.min(self.T)),
            'mean_temperature': float(np.mean(self.T)),
            'grid': {
                'nx': self.nx,
                'ny': self.ny,
                'dx': self.dx,
                'dy': self.dy
            }
        }
    
    def find_hot_spots(self, threshold_percentile=95):
        """Find hot spots in domain"""
        threshold = np.percentile(self.T, threshold_percentile)
        hot_spots = []
        
        for i in range(self.ny):
            for j in range(self.nx):
                if self.T[i, j] >= threshold:
                    hot_spots.append({
                        'position': [j * self.dx, i * self.dy],
                        'temperature': float(self.T[i, j])
                    })
        
        return hot_spots


# Example usage
if __name__ == '__main__':
    # Create solver for 10m x 5m domain
    nx, ny = 100, 50
    dx, dy = 0.1, 0.1  # 10cm grid
    
    solver = HeatSolver2D(nx, ny, dx, dy, alpha=1e-5)
    
    # Initial temperature: 25°C
    solver.set_initial_temperature(25.0)
    
    # Add heat source at (2m, 2.5m) - 5000W
    solver.add_heat_source(2.0, 2.5, 5000, radius=0.5)
    
    # Add cooler at (8m, 2.5m) - 5000W cooling
    solver.add_cooler(8.0, 2.5, 5000, radius=0.5)
    
    # Set boundary conditions (walls at 25°C)
    for side in ['top', 'bottom', 'left', 'right']:
        solver.set_boundary_condition(side, 'dirichlet', 25.0)
    
    # Solve steady-state
    T, iterations, residual = solver.solve_steady_state()
    
    # Print results
    print(f"\nResults:")
    print(f"  Max temperature: {T.max():.2f}°C")
    print(f"  Min temperature: {T.min():.2f}°C")
    print(f"  Mean temperature: {T.mean():.2f}°C")
    
    # Find hot spots
    hot_spots = solver.find_hot_spots(threshold_percentile=90)
    print(f"  Hot spots (>90th percentile): {len(hot_spots)}")
