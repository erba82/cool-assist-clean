"""
CFD Results Visualizer
Generate plots and visualizations for CFD results
"""

import matplotlib.pyplot as plt
import numpy as np
import os

class CFDVisualizer:
    """Visualization tools for CFD results"""
    
    def __init__(self, output_dir='output'):
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)
        
        # Set style
        plt.style.use('seaborn-v0_8-darkgrid')
    
    def plot_temperature_contours(self, T, X, Y, title='Temperature Distribution', filename='temperature.png'):
        """
        Plot temperature contours
        
        Args:
            T: Temperature field (2D array)
            X, Y: Mesh coordinates
            title: Plot title
            filename: Output filename
        """
        fig, ax = plt.subplots(figsize=(12, 6))
        
        # Contour plot
        levels = 20
        contour = ax.contourf(X, Y, T, levels=levels, cmap='RdYlBu_r')
        
        # Contour lines
        contour_lines = ax.contour(X, Y, T, levels=10, colors='black', alpha=0.3, linewidths=0.5)
        ax.clabel(contour_lines, inline=True, fontsize=8, fmt='%.1f°C')
        
        # Colorbar
        cbar = plt.colorbar(contour, ax=ax)
        cbar.set_label('Temperature (°C)', fontsize=12)
        
        # Labels
        ax.set_xlabel('X (m)', fontsize=12)
        ax.set_ylabel('Y (m)', fontsize=12)
        ax.set_title(title, fontsize=14, fontweight='bold')
        ax.set_aspect('equal')
        
        # Grid
        ax.grid(True, alpha=0.3)
        
        # Save
        output_path = os.path.join(self.output_dir, filename)
        plt.savefig(output_path, dpi=150, bbox_inches='tight')
        plt.close()
        
        print(f"✅ Saved temperature contours to {output_path}")
        return output_path
    
    def plot_velocity_field(self, U, V, X, Y, title='Velocity Field', filename='velocity.png'):
        """Plot velocity vector field"""
        fig, ax = plt.subplots(figsize=(12, 6))
        
        # Calculate magnitude
        magnitude = np.sqrt(U**2 + V**2)
        
        # Contour of magnitude
        contour = ax.contourf(X, Y, magnitude, levels=20, cmap='viridis')
        
        # Vector field (subsampled)
        skip = max(1, min(U.shape) // 20)
        ax.quiver(
            X[::skip, ::skip], 
            Y[::skip, ::skip],
            U[::skip, ::skip], 
            V[::skip, ::skip],
            scale=None,
            color='white',
            alpha=0.7
        )
        
        # Colorbar
        cbar = plt.colorbar(contour, ax=ax)
        cbar.set_label('Velocity Magnitude (m/s)', fontsize=12)
        
        # Labels
        ax.set_xlabel('X (m)', fontsize=12)
        ax.set_ylabel('Y (m)', fontsize=12)
        ax.set_title(title, fontsize=14, fontweight='bold')
        ax.set_aspect('equal')
        
        # Save
        output_path = os.path.join(self.output_dir, filename)
        plt.savefig(output_path, dpi=150, bbox_inches='tight')
        plt.close()
        
        print(f"✅ Saved velocity field to {output_path}")
        return output_path
    
    def plot_streamlines(self, U, V, X, Y, title='Flow Streamlines', filename='streamlines.png'):
        """Plot flow streamlines"""
        fig, ax = plt.subplots(figsize=(12, 6))
        
        # Calculate magnitude for background
        magnitude = np.sqrt(U**2 + V**2)
        
        # Contour background
        contour = ax.contourf(X, Y, magnitude, levels=20, cmap='Blues', alpha=0.6)
        
        # Streamlines
        ax.streamplot(
            X[0, :], Y[:, 0], U, V,
            color='darkblue',
            density=2,
            linewidth=1,
            arrowsize=1.5
        )
        
        # Colorbar
        cbar = plt.colorbar(contour, ax=ax)
        cbar.set_label('Velocity Magnitude (m/s)', fontsize=12)
        
        # Labels
        ax.set_xlabel('X (m)', fontsize=12)
        ax.set_ylabel('Y (m)', fontsize=12)
        ax.set_title(title, fontsize=14, fontweight='bold')
        ax.set_aspect('equal')
        
        # Save
        output_path = os.path.join(self.output_dir, filename)
        plt.savefig(output_path, dpi=150, bbox_inches='tight')
        plt.close()
        
        print(f"✅ Saved streamlines to {output_path}")
        return output_path
    
    def plot_transient_evolution(self, results, positions, filename='transient.png'):
        """
        Plot temperature evolution at specific positions
        
        Args:
            results: List of (time, T) tuples
            positions: List of (i, j, label) tuples for monitoring points
        """
        fig, ax = plt.subplots(figsize=(10, 6))
        
        for i, j, label in positions:
            times = [t for t, _ in results]
            temps = [T[i, j] for _, T in results]
            ax.plot(times, temps, marker='o', label=label, linewidth=2)
        
        ax.set_xlabel('Time (s)', fontsize=12)
        ax.set_ylabel('Temperature (°C)', fontsize=12)
        ax.set_title('Temperature Evolution', fontsize=14, fontweight='bold')
        ax.legend(fontsize=10)
        ax.grid(True, alpha=0.3)
        
        # Save
        output_path = os.path.join(self.output_dir, filename)
        plt.savefig(output_path, dpi=150, bbox_inches='tight')
        plt.close()
        
        print(f"✅ Saved transient evolution to {output_path}")
        return output_path
    
    def create_summary_figure(self, T, U, V, X, Y, solver_info, filename='summary.png'):
        """Create comprehensive summary figure"""
        fig = plt.figure(figsize=(16, 10))
        gs = fig.add_gridspec(2, 2, hspace=0.3, wspace=0.3)
        
        # Temperature contours
        ax1 = fig.add_subplot(gs[0, 0])
        contour1 = ax1.contourf(X, Y, T, levels=20, cmap='RdYlBu_r')
        ax1.set_title('Temperature Distribution', fontweight='bold')
        ax1.set_xlabel('X (m)')
        ax1.set_ylabel('Y (m)')
        ax1.set_aspect('equal')
        plt.colorbar(contour1, ax=ax1, label='T (°C)')
        
        # Velocity field
        ax2 = fig.add_subplot(gs[0, 1])
        magnitude = np.sqrt(U**2 + V**2)
        contour2 = ax2.contourf(X, Y, magnitude, levels=20, cmap='viridis')
        skip = max(1, min(U.shape) // 15)
        ax2.quiver(X[::skip, ::skip], Y[::skip, ::skip], 
                   U[::skip, ::skip], V[::skip, ::skip],
                   color='white', alpha=0.7)
        ax2.set_title('Velocity Field', fontweight='bold')
        ax2.set_xlabel('X (m)')
        ax2.set_ylabel('Y (m)')
        ax2.set_aspect('equal')
        plt.colorbar(contour2, ax=ax2, label='|V| (m/s)')
        
        # Temperature histogram
        ax3 = fig.add_subplot(gs[1, 0])
        ax3.hist(T.flatten(), bins=50, color='steelblue', edgecolor='black', alpha=0.7)
        ax3.axvline(T.mean(), color='red', linestyle='--', linewidth=2, label=f'Mean: {T.mean():.2f}°C')
        ax3.set_xlabel('Temperature (°C)')
        ax3.set_ylabel('Frequency')
        ax3.set_title('Temperature Distribution', fontweight='bold')
        ax3.legend()
        ax3.grid(True, alpha=0.3)
        
        # Statistics table
        ax4 = fig.add_subplot(gs[1, 1])
        ax4.axis('off')
        
        stats_text = f"""
        Simulation Statistics
        ══════════════════════
        
        Grid:
          • Size: {solver_info.get('nx', 0)} × {solver_info.get('ny', 0)}
          • Total cells: {solver_info.get('nx', 0) * solver_info.get('ny', 0)}
          • Cell size: {solver_info.get('dx', 0):.3f} m
        
        Temperature:
          • Maximum: {T.max():.2f} °C
          • Minimum: {T.min():.2f} °C
          • Mean: {T.mean():.2f} °C
          • Std Dev: {T.std():.2f} °C
        
        Velocity:
          • Max speed: {magnitude.max():.3f} m/s
          • Mean speed: {magnitude.mean():.3f} m/s
        
        Solver:
          • Method: {solver_info.get('method', 'FDM')}
          • Iterations: {solver_info.get('iterations', 'N/A')}
          • Residual: {solver_info.get('residual', 'N/A')}
        """
        
        ax4.text(0.1, 0.5, stats_text, fontsize=10, family='monospace',
                verticalalignment='center')
        
        # Main title
        fig.suptitle('CFD Simulation Results Summary', fontsize=16, fontweight='bold', y=0.98)
        
        # Save
        output_path = os.path.join(self.output_dir, filename)
        plt.savefig(output_path, dpi=150, bbox_inches='tight')
        plt.close()
        
        print(f"✅ Saved summary figure to {output_path}")
        return output_path


# Example usage
if __name__ == '__main__':
    # Create sample data
    nx, ny = 50, 25
    x = np.linspace(0, 10, nx)
    y = np.linspace(0, 5, ny)
    X, Y = np.meshgrid(x, y)
    
    # Temperature field (example)
    T = 25 + 50 * np.exp(-((X-2)**2 + (Y-2.5)**2) / 2)
    
    # Velocity field (example)
    U = 0.5 * np.ones_like(X)
    V = 0.1 * np.sin(2 * np.pi * X / 10)
    
    # Create visualizer
    vis = CFDVisualizer(output_dir='cfd_output')
    
    # Generate plots
    vis.plot_temperature_contours(T, X, Y)
    vis.plot_velocity_field(U, V, X, Y)
    vis.plot_streamlines(U, V, X, Y)
    
    solver_info = {
        'nx': nx,
        'ny': ny,
        'dx': 0.2,
        'method': 'Finite Difference',
        'iterations': 5000,
        'residual': '1.0e-06'
    }
    vis.create_summary_figure(T, U, V, X, Y, solver_info)
    
    print("\n✅ All visualizations generated!")
