# 文件源配置

本文档详细介绍如何配置和使用 warp-flow 系统的文件数据源。

## 概述

文件源用于从本地文件系统读取数据，支持多种编码格式和灵活的路径配置。

## 连接器定义

### 基础文件连接器

```toml
# connectors/source.d/00-file-default.toml
[[connectors]]
id = "file_src"
type = "file"
allow_override = ["base", "file", "encode"]

[connectors.params]
base = "./data/in_dat"
file = "gen.dat"
encode = "text"
```

## 支持的参数

### 路径配置
基础目录 + 文件名 (base + file)
```toml
[[sources]]
key = "file_composed"
connect = "file_src"
[sources.params_override]
base = "/var/log"
file = "access.log"
```

### 编码格式

#### Text 编码 (默认)
```toml
[sources.params_override]
encode = "text"
```

## 配置示例

### 基础文件读取
```toml
# wpsrc.toml
[[sources]]
enable = true
key = "access_log"
connect = "file_src"

[sources.params_override]
base = "/var/log/nginx"
file = "access.log"
```

### 多文件源配置
```toml
# wpsrc.toml
[[sources]]
enable = true
key = "nginx_access"
connect = "file_src"
[sources.params]
base = "/var/log/nginx"
file = "access.log"

[[sources]]
enable = true
key = "nginx_error"
connect = "file_src"
tags = ["service:nginx", "type:error"]
[sources.params]
base = "/var/log/nginx"
file = "error.log"

```

## 数据处理特性

### 1. 逐行读取
文件源采用逐行读取模式，每行作为独立的数据包处理。


### 2. 编码处理
- **text**: 直接读取文本内容
- **base64**: 读取后进行 Base64 解码
- **hex**: 读取后进行十六进制解码
