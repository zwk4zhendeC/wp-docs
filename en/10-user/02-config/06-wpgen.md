# Wpgen Configuration

Configuration Syntax
- conf/wpgen.toml (key fields)
```toml
version = "1.0"

[generator]
mode = "sample"
count = 1000
# 0 means unlimited speed, unlimited speed is not necessarily the fastest.
speed = 1000
parallel = 1

[output]
# References connector id in connectors/sink.d; when this field exists, type/format will be ignored
connect = "file_kv_sink"
name = "gen_out"
# Can only override keys within allow_override whitelist (new version uses params; mistakenly writing params_override will cause error)
params = { base = "./src_dat", file = "gen.dat" }

[logging]
level = "warn"
output = "file"
file_path = "./data/logs/"

```

Runtime Rules
- When `wpgen` loads `conf/wpgen.toml`, if it detects `[output].connect`:
- It searches upward from `ENGINE_CONF.sink_root` for the nearest `connectors/sink.d/` directory.
- Reads the target connector and merges with `params` (only keys in `allow_override` are allowed).
