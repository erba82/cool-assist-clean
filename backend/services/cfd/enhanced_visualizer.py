"""
Enhanced CFD Visualization - Professional ParaView-compatible Output
Advanced plotting and VTK export for engineering analysis

Features:
- ParaView-compatible VTK export
- Multi-field visualization
- Publication-quality plots
- Animation support
- Contour and streamline plots
"""

import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.animation import FuncAnimation
import seaborn as sns
from pathlib import Path
from typing import List, Optional

# Set professional style
sns.set_style("whitegrid")
plt.rcParams['figure.figsize'] = [12, 8]
plt.rcParams['figure.dpi'] = 150
plt.rcParams['font.size'] = 10
plt.rcParams['axes.labelsize'] = 11
plt.rcParams['axes.titlesize'] = 12
plt.rcParams['xtick.labelsize'] = 9
plt.rcParams['ytick.labelsize'] = 9
plt.rcParams['legend.fontsize'] = 9

class EnhancedVisualizer:
    """
    Professional visualization for Enhanced CFD Solver
    """
    
    def __init__(self, output_dir: str = './cfd_output'):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        print(f"[Visualizer] Output directory: {self.output_dir}")
    
    def plot_temperature_field(self, X, Y, T, solver_info: dict, filename='temperature.png'):
        """
        Plot temperature field with professional styling
        """
        fig, ax = plt.subplots(figsize=(14, 10))
        
        #  Contour plot
        levels = 20
        contour = ax.contourf(X, Y, T, levels=levels, cmap='RdYlBu_r')
        
        # Contour lines
        contour_lines = ax.contour(X, Y, T, levels=levels, colors='black', alpha=0.2, linewidths=0.5)
        ax.clabel(contour_lines, inline=True, fontsize=8, fmt='%.1f K')
        
        # Colorbar
        cbar = plt.colorbar(contour, ax=ax, label='Temperature (K)')
        cbar.ax.yaxis.set_label_coords(4.0, 0.5)
        
        # Labels
        ax.set_xlabel('X (m)')
        ax.set_ylabel('Y (m)')
        ax.set_title('Temperature Distribution', fontsize=14, fontweight='bold')
        
        # Grid
        ax.grid(True, alpha=0.3)
        ax.set_aspect('equal')
        
        # Add statistics box
        stats_text = f"""
        Min: {T.min():.2f} K
        Max: {T.max():.2f} K
        Mean: {T.mean():.2f} K
        Std: {T.std():.2f} K
        """
        
        props = dict(boxstyle='round', facecolor='wheat', alpha=0.8)
        ax.text(0.02, 0.98, stats_text, transform=ax.transAxes,
                fontsize=9, verticalalignment='top', bbox=props)
        
        # Save
        output_path = self.output_dir / filename
        plt.savefig(output_path, dpi=150, bbox_inches='tight')
        plt.close()
        
        print(f"✅ Saved temperature plot: {output_path}")
        return str(output_path)
    
    def plot_multi_region(self, X, Y, T, material_map, regions, filename='multi_region.png'):
        """
        Plot multi-region view with material boundaries
        """
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 7))
        
        # Temperature field
        contour = ax1.contourf(X, Y, T, levels=20, cmap='RdYlBu_r')
        plt.colorbar(contour, ax=ax1, label='Temperature (K)')
        
        # Draw region boundaries
        for idx, region in enumerate(regions, 1):
            x_min, x_max = region.x_range
            y_min, y_max = region.y_range
            
            rect = patches.Rectangle(
                (x_min, y_min), x_max - x_min, y_max - y_min,
                linewidth=2, edgecolor='black', facecolor='none',
                linestyle='--', alpha=0.7
            )
            ax1.add_patch(rect)
            
            # Label
            ax1.text((x_min + x_max)/2, (y_min + y_max)/2,
                    region.name, ha='center', va='center',
                    bbox=dict(boxstyle='round', facecolor='white', alpha=0.8))
        
        ax1.set_xlabel('X (m)')
        ax1.set_ylabel('Y (m)')
        ax1.set_title('Temperature Field with Regions')
        ax1.set_aspect('equal')
        ax1.grid(True, alpha=0.3)
        
        # Material map
        im = ax2.imshow(material_map, cmap='tab10', origin='lower',
                       extent=[X.min(), X.max(), Y.min(), Y.max()],
                       aspect='auto')
        
        cbar = plt.colorbar(im, ax=ax2, label='Region Index')
        cbar.set_ticks(range(len(regions) + 1))
        
        ax2.set_xlabel('X (m)')
        ax2.set_ylabel('Y (m)')
        ax2.set_title('Material Regions')
        ax2.grid(True, alpha=0.3)
        
        plt.tight_layout()
        
        output_path = self.output_dir / filename
        plt.savefig(output_path, dpi=150, bbox_inches='tight')
        plt.close()
        
        print(f"✅ Saved multi-region plot: {output_path}")
        return str(output_path)
    
    def plot_heat_flux(self, X, Y, T, k_field, filename='heat_flux.png'):
        """
        Plot heat flux vectors
        """
        fig, ax = plt.subplots(figsize=(14, 10))
        
        # Calculate heat flux
        q_x = np.zeros_like(T)
        q_y = np.zeros_like(T)
        
        ny, nx = T.shape
        dx = X[0, 1] - X[0, 0]
        dy = Y[1, 0] - Y[0, 0]
        
        # Central difference for interior
        q_x[:, 1:-1] = -k_field[:, 1:-1] * (T[:, 2:] - T[:, :-2]) / (2 * dx)
        q_y[1:-1, :] = -k_field[1:-1, :] * (T[2:, :] - T[:-2, :]) / (2 * dy)
        
        # Heat flux magnitude
        q_mag = np.sqrt(q_x**2 + q_y**2)
        
        # Contour of magnitude
        contour = ax.contourf(X, Y, q_mag, levels=20, cmap='viridis')
        cbar = plt.colorbar(contour, ax=ax, label='Heat Flux Magnitude (W/m²)')
        
        # Vector field (subsampled)
        skip = max(1, nx // 20)
        ax.quiver(X[::skip, ::skip], Y[::skip, ::skip],
                 q_x[::skip, ::skip], q_y[::skip, ::skip],
                 color='white', alpha=0.7, scale=1e5)
        
        ax.set_xlabel('X (m)')
        ax.set_ylabel('Y (m)')
        ax.set_title('Heat Flux Distribution', fontsize=14, fontweight='bold')
        ax.set_aspect('equal')
        ax.grid(True, alpha=0.3)
        
        output_path = self.output_dir / filename
        plt.savefig(output_path, dpi=150, bbox_inches='tight')
        plt.close()
        
        print(f"✅ Saved heat flux plot: {output_path}")
        return str(output_path)
    
    def create_animation(self, X, Y, T_history: List[np.ndarray], 
                        dt: float, filename='animation.gif'):
        """
        Create animation of transient simulation
        """
        fig, ax = plt.subplots(figsize=(12, 9))
        
        # Get temperature range for consistent color scale
        T_min = min([T.min() for T in T_history])
        T_max = max([T.max() for T in T_history])
        
        def animate(frame):
            ax.clear()
            T = T_history[frame]
            
            contour = ax.contourf(X, Y, T, levels=20, cmap='RdYlBu_r',
                                 vmin=T_min, vmax=T_max)
            ax.set_xlabel('X (m)')
            ax.set_ylabel('Y (m)')
            ax.set_title(f'Temperature at t = {frame * dt:.2f}s', 
                        fontsize=14, fontweight='bold')
            ax.set_aspect('equal')
            ax.grid(True, alpha=0.3)
            
            return contour,
        
        anim = FuncAnimation(fig, animate, frames=len(T_history),
                            interval=200, blit=False)
        
        output_path = self.output_dir / filename
        anim.save(output_path, writer='pillow', fps=5)
        plt.close()
        
        print(f"✅ Saved animation: {output_path}")
        return str(output_path)
    
    def create_comprehensive_report(self, X, Y, T, U, V, solver_info, filename='report.png'):
        """
        Create comprehensive multi-panel report
        """
        fig = plt.figure(figsize=(18, 12))
        gs = fig.add_gridspec(3, 3, hspace=0.3, wspace=0.3)
        
        # Temperature contour
        ax1 = fig.add_subplot(gs[0, :2])
        contour1 = ax1.contourf(X, Y, T, levels=20, cmap='RdYlBu_r')
        plt.colorbar(contour1, ax=ax1, label='T (K)')
        ax1.set_title('Temperature Field', fontweight='bold')
        ax1.set_xlabel('X (m)')
        ax1.set_ylabel('Y (m)')
        ax1.set_aspect('equal')
        
        # Velocity field
        ax2 = fig.add_subplot(gs[1, :2])
        V_mag = np.sqrt(U**2 + V**2)
        contour2 = ax2.contourf(X, Y, V_mag, levels=20, cmap='viridis')
        plt.colorbar(contour2, ax=ax2, label='|V| (m/s)')
        
        skip = max(1, X.shape[1] // 15)
        ax2.quiver(X[::skip, ::skip], Y[::skip, ::skip],
                  U[::skip, ::skip], V[::skip, ::skip],
                  color='white', alpha=0.7)
        
        ax2.set_title('Velocity Field', fontweight='bold')
        ax2.set_xlabel('X (m)')
        ax2.set_ylabel('Y (m)')
        ax2.set_aspect('equal')
        
        # Temperature histogram
        ax3 = fig.add_subplot(gs[0, 2])
        ax3.hist(T.flatten(), bins=50, color='steelblue', edgecolor='black', alpha=0.7)
        ax3.axvline(T.mean(), color='red', linestyle='--', linewidth=2,
                   label=f'Mean: {T.mean():.1f}K')
        ax3.set_xlabel('Temperature (K)')
        ax3.set_ylabel('Frequency')
        ax3.set_title('Temperature Distribution')
        ax3.legend()
        ax3.grid(True, alpha=0.3)
        
        # Velocity histogram
        ax4 = fig.add_subplot(gs[1, 2])
        ax4.hist(V_mag.flatten(), bins=50, color='green', edgecolor='black', alpha=0.7)
        ax4.axvline(V_mag.mean(), color='red', linestyle='--', linewidth=2,
                   label=f'Mean: {V_mag.mean():.3f}m/s')
        ax4.set_xlabel('Velocity Magnitude (m/s)')
        ax4.set_ylabel('Frequency')
        ax4.set_title('Velocity Distribution')
        ax4.legend()
        ax4.grid(True, alpha=0.3)
        
        # Statistics table
        ax5 = fig.add_subplot(gs[2, :])
        ax5.axis('off')
        
        stats_text = f"""
        CFD SIMULATION SUMMARY
        {'='*80}
        
        Grid:
          • Size: {solver_info.get('nx', 0)} × {solver_info.get('ny', 0)} cells
          • Total cells: {solver_info.get('nx', 0) * solver_info.get('ny', 0)}
          • Domain: {solver_info.get('Lx', 0):.2f}m × {solver_info.get('Ly', 0):.2f}m
        
        Temperature Field:
          • Minimum: {T.min():.2f} K ({T.min()-273.15:.2f}°C)
          • Maximum: {T.max():.2f} K ({T.max()-273.15:.2f}°C)
          • Mean: {T.mean():.2f} K
          • Std Dev: {T.std():.2f} K
        
        Velocity Field:
          • Max speed: {V_mag.max():.4f} m/s
          • Mean speed: {V_mag.mean():.4f} m/s
        
        Solver:
          • Method: {solver_info.get('method', 'FDM')}
          • Turbulence: {solver_info.get('turbulence', 'Laminar')}
          • Iterations: {solver_info.get('iterations', 'N/A')}
          • Residual: {solver_info.get('residual', 'N/A')}
        """
        
        ax5.text(0.05, 0.5, stats_text, fontsize=10, family='monospace',
                verticalalignment='center', transform=ax5.transAxes)
        
        # Main title
        fig.suptitle('Enhanced CFD Simulation Report', fontsize=16, fontweight='bold', y=0.98)
        
        # Save
        output_path = self.output_dir / filename
        plt.savefig(output_path, dpi=150, bbox_inches='tight')
        plt.close()
        
        print(f"✅ Saved comprehensive report: {output_path}")
        return str(output_path)
    
    def export_vtk(self, X, Y, T, U, V, P, filename='results.vtk'):
        """
        Export to VTK format for ParaView
        
        Legacy VTK format for compatibility
        """
        output_path = self.output_dir / filename
        
        ny, nx = T.shape
        
        with open(output_path, 'w') as f:
            # Header
            f.write("# vtk DataFile Version 3.0\n")
            f.write("Enhanced CFD Results\n")
            f.write("ASCII\n")
            f.write("DATASET STRUCTURED_GRID\n")
            f.write(f"DIMENSIONS {nx} {ny} 1\n")
            f.write(f"POINTS {nx*ny} float\n")
            
            # Points
            for j in range(ny):
                for i in range(nx):
                    f.write(f"{X[j,i]} {Y[j,i]} 0.0\n")
            
            # Point data
            f.write(f"POINT_DATA {nx*ny}\n")
            
            # Temperature
            f.write("SCALARS Temperature float 1\n")
            f.write("LOOKUP_TABLE default\n")
            for j in range(ny):
                for i in range(nx):
                    f.write(f"{T[j,i]}\n")
            
            # Velocity
            f.write("VECTORS Velocity float\n")
            for j in range(ny):
                for i in range(nx):
                    f.write(f"{U[j,i]} {V[j,i]} 0.0\n")
            
            # Pressure
            f.write("SCALARS Pressure float 1\n")
            f.write("LOOKUP_TABLE default\n")
            for j in range(ny):
                for i in range(nx):
                    f.write(f"{P[j,i]}\n")
        
        print(f"✅ Exported VTK: {output_path}")
        print(f"   Open with: paraview {output_path}")
        
        return str(output_path)
