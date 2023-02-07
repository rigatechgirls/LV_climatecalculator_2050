# 2050 CALCULATOR TOOL for LATVIA

Details on the initial project:
http://www.decc.gov.uk/2050

This is updated version for Latvia using LV related climate calculations and adjusted interface.

# How to run project

Project installation has been updated to minimaze number of manual steps.
All required commands were transferred to Dockerfile where those can be checked in case of troubleshooting.

Project is run inside Docker container.
1. Build the container

```bash
docker build -t calculator http://github.com/rigatechgirls/LV_climatecalculator_2050.git
```

2. Run the container:
```
run docker run -p 8082:8080 -d calculator
```

It should be accessible at http://localhost:8082
