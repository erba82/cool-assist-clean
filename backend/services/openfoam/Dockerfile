# OpenFOAM Docker Service
# Based on official OpenFOAM v10 image

FROM openfoam/openfoam10-paraview510

# Install Python and required packages
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-numpy \
    && rm -rf /var/lib/apt/lists/*

# Install Flask for API
RUN pip3 install flask flask-cors

# Create working directories
WORKDIR /openfoam
RUN mkdir -p /cases /results

# Copy wrapper script
COPY openfoam_wrapper.py /openfoam/
COPY case_templates /openfoam/templates

# Source OpenFOAM environment in bashrc
RUN echo "source /opt/openfoam10/etc/bashrc" >> ~/.bashrc

# Expose Flask port
EXPOSE 5004

# Health check
HEALTHCHECK --interval=30s --timeout=3s \  CMD python3 -c "import requests; requests.get('http://localhost:5004/health')" || exit 1

# Start Flask service
CMD ["python3", "/openfoam/openfoam_wrapper.py"]
