# Wparse 配置指南
<!-- 角色：使用配置者 | 最近验证：2025-12-11 -->

本文基于 `usecase/core/getting_started` 用例，梳理一次从初始化到运行、统计与校验的完整配置流程，适合首次接入与本地自测。

## 前置准备
- [下载 wparse](https://github.com/wp-labs/warp-parse/releases)
- copy到可执行路径下。如 /usr/local/bin 或 /${HOME}/bin

## 一、初始化工作目录
- 清理并初始化配置与模板
  ```bash
  wproj init --mode full
  wproj check 
  ```

执行完成后，工作目录将包含：
- `conf/wparse.toml` — 引擎主配置
- `conf/wpgen.toml` — 生成器配置
- `connectors/source.d/` — 源连接器模板（默认含文件源）
- `models/` 下的规则/OML/Sink 模板
- `data/` 运行目录：`in_dat/`、`out_dat/`、`rescue/`、`logs/`

> getting_started 用例中已将日志目录统一为 `./logs/`，与脚本输出一致。

## 二、生成数据与清理
```bash
# 清理输出（文件型 sink、本地数据）
wproj data clean || true
wpgen  data clean || true

# 生成样本（示例 3000 行，3 秒统计间隔）
wpgen sample -n 3000 --stat 3
```

## 三、运行解析
```bash
# 批处理（-n 指定条数，-p 打印统计；失败时查看 ./logs/ 下日志）
wparse batch --stat 3 -p  
```

## 四、统计与校验
```bash
# 同时统计源与文件型 sink
wproj stat file

```

## 常见问题与排查
- connectors/source.d not found
  - 确保使用 `wproj conf init` 初始化并在正确工作目录执行命令（或传 `-w/--work-root`）。
- 日志位置不一致
  - getting_started 用例中 `conf/wparse.toml` 已设置 `log_conf.file.path = "./logs/"`。

脚本会完成预构建 → conf/data 初始化 → 样本生成 → 解析运行 → 统计与校验的整套流程。

## 附录：最小可用示例（wpsrc.toml 与 connectors）

以下示例为“文件源”最小可用配置。目录均以工作目录为相对路径。

1) conf/wpsrc.toml（最小可用）

```toml
# 源配置：定义启用的源，并通过 connect 关联 connectors 中的某个连接器。

[[sources]]
key = "file_1"            # 源标识（唯一，用于统计与路由）
enable = true             # 是否启用该源
connect = "file_src"# 连接器 id（见 connectors/source.d/*.toml）
tags = ["env:local"]      # 可选标签（用于标识/排查）

# 可选：覆盖连接器中的部分参数；若不需要可留空表。
params= { }

# 示例：若需要在此覆盖 path/encode，可写：
# params= { base = "./data/in_dat", file = "gen.dat", encode = "text" }
```
