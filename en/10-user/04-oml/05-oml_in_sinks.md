# OML Applications

## Table of Contents

1. [Core Concepts](#core-concepts)
2. [Configuration Structure](#configuration-structure)
3. [OML and Sink Group Association](#oml-and-sink-group-association)
4. [Conditional Routing](#conditional-routing)
5. [Complete Examples](#complete-examples)
6. [Workflow](#workflow)
7. [Troubleshooting](#troubleshooting)
8. [Best Practices](#best-practices)

## Core Concepts

### Role of OML in Data Flow

In the WP Engine data processing pipeline, OML serves as the **data transformation engine**:

```mermaid
graph LR
    A[Raw Data] --> B[WPL Parsing]
    B --> C[Structured Data<br/>with Rule Identifier]
    C --> D{Find Matching<br/>OML Model}
    D -->|Match Found| E[OML Transform]
    D -->|No Match| F[Data Passthrough]
    E --> G[Target Data]
    F --> G
    G --> H[Sink Output]

    style C fill:#e1f5ff
    style E fill:#fff4e1
    style G fill:#e8f5e9
```

### Key Concepts

- **WPL Rule (Rule Path)**: Identifies data source and type (e.g., `/nginx/access_log`)
- **OML Model (Object Model)**: OML configuration file defining how to transform data
- **Sink Group (Output Group)**: Defines the target collection for data output
- **Rule Matching**: Associates WPL Rules with OML Models through wildcards

## Configuration Structure

### Configuration File Relationships

```mermaid
graph TB
    subgraph Project["Project Structure"]
        OML_DIR[oml/<br/>OML Model Directory]
        TOPO_DIR[topology/sinks/<br/>Sink Config Directory]
        CONN_DIR[connectors/<br/>Connector Definitions]
    end

    subgraph OML_Files["OML Model Files"]
        OML1[nginx.oml<br/>name: nginx_access<br/>rule: /nginx/*]
        OML2[apache.oml<br/>name: apache_access<br/>rule: /apache/*]
    end

    subgraph Sink_Files["Sink Group Configuration"]
        SG["sink_group.toml<br/>name: web_logs<br/>oml: *"]
        SINK1["sink 1: normal_logs"]
        SINK2["sink 2: error_logs"]
        SINK3["sink 3: backup"]
    end


    OML_DIR --> OML1
    OML_DIR --> OML2
    TOPO_DIR --> SG
    SG --> SINK1
    SG --> SINK2
    SG --> SINK3

    SG -.References OML.-> OML1
    SG -.References OML.-> OML2


    style OML_DIR fill:#fff3e0
    style TOPO_DIR fill:#e8f5e9
    style CONN_DIR fill:#e3f2fd
    style SG fill:#c8e6c9
```

### Sink Group Configuration File

Sink Group configuration files are typically located in the `topology/sinks/` directory, using TOML format:

```toml
version = "2.0"

[sink_group]
name = "business_logs"        # Output group name
oml = ["*"]                   # Associated OML models (wildcard)
rule = []                     # Optional: Restrict WPL rules to process
parallel = 1                  # Optional: Parallelism (default 1)
tags = ["env:prod"]           # Optional: Group-level tags

[[sink_group.sinks]]
name = "error_logs"
connect = "file_json_sink"    # Connector ID
tags = ["type:error"]         # Optional: Sink-level tags

[sink_group.sinks.params]
file = "error.json"
```

### OML Model File

OML model files are typically located in the `oml/` directory, using the `.oml` extension:

```oml
name : nginx_access
rule : /nginx/*           # Matching WPL rule (wildcard)
---
# Field transformation definitions
user_id : chars = take(user_id);
occur_time : time = take(time);
status : digit = take(status_code) { _ : digit(0) };
uri : chars = take(request_uri);
```

## OML and Sink Group Association

### Association Methods

Sink Groups establish associations with OML models through the `oml` field:


#### 1. Specify Model Names

```toml
[sink_group]
name = "nginx_logs"
oml = ["nginx_access", "nginx_error"]  # Only use these OML models
```

**How it works**:
- Only searches for matches within the specified OML model list
- Suitable for scenarios where you know exactly which OML models are needed

#### 2. Empty List (Passthrough)

```toml
[sink_group]
name = "raw_logs"
oml = []  # Don't use any OML transformation
```

**How it works**:
- Data passes through without OML transformation
- Suitable for scenarios that don't require data transformation

### Matching Rules

**OML Model Matching Logic**:


**Examples**:

| OML rule Field | Data WPL Rule | Match Result |
|----------------|---------------|--------------|
| `/nginx/*` | `/nginx/access_log` | ✅ Match |
| `/nginx/*` | `/nginx/error_log` | ✅ Match |
| `/nginx/access*` | `/nginx/access_log` | ✅ Match |
| `/nginx/access*` | `/nginx/error_log` | ❌ No Match |
| `*` | Any rule | ✅ Match |
