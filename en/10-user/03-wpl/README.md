# WPL Rule Language

WPL (Warp Processing Language) is the rule language used by the Warp Parse parsing subsystem (warp-parse), primarily for describing field extraction, protocol parsing, and simple decision logic. The documentation in this directory is consistent with the `crates/wp-lang` parser implementation.

## Content Overview

- [WPL Language Basics](./01-wpl_basics.md)
- [WPL Grammar (EBNF)](./03-wpl_grammar.md)
- [WPL Pipe Functions](./04-wpl_pipe_functions.md)

## Quick Example

```wpl
package demo {
  rule http_access {
    |decode/base64|unquote/unescape|
    (
      digit:status,
      time_3339:recv_time,
      ip:client_ip,
      http/request<[,]>,
      http/agent"
    )
  }
}
```

## Related Documentation

- Grammar implementation reference: `crates/wp-lang/src/parser/`
- Data type definitions: `crates/wp-data-model/src/model/types/meta.rs`
