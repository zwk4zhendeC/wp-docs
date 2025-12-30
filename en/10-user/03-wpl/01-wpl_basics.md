# WPL Language Basics

This document introduces the basic elements and common patterns of the WPL rule language in Warp Parse, consistent with the `crates/wp-lang` parser implementation.

WPL is used to define "rules", where each rule consists of one or more "groups", and each group contains several "field" extraction items.

Tip: For the complete formal grammar, see "WPL Grammar (EBNF)": `./03-wpl_grammar.md`.

## Minimal Example

```wpl
package net {
  rule nginx_access {
    (
      digit:status,
      time_3339:recv_time,
      ip:client_ip,
      http/request,
      http/agent"
    )
  }
}
```

## Basic Structure

- package: Package name serves as a scope; one package contains multiple rules
- rule: Rule names can include path separators (`/a/b`)
- Expression: May contain "preprocessing pipeline" and one or more "groups"

```wpl
package demo {
  # Optional: Tag/copy raw annotations can be added to package or rule, merged at compile time
  #[tag(sys:"ids"), copy_raw(name:"raw_payload")]
  rule /service/http {
    |decode/base64|unquote/unescape|     # Preprocessing (optional)
    (
      ip@sip:src_ip,                    # Basic field
      ip@dip:dst_ip,
      time:occur_time,
      5*_,                               # Consecutive placeholder fields (ignored)
      http/request<[,]>,                 # Range delimiter format <beg,end>
      http/agent"
    )
  }
}
```

## Group

- Format: `(<fields>)[N][SEP]`
- Meta information (optional): `alt | opt | some_of | seq`
- Length `[N]` applies to all fields within the group (equivalent to `[N]` after each field)
- Separator `SEP` is written with backslash-escaped characters: e.g., `\,` represents `,`, `\!\|` represents `!|`

Example:
```wpl
seq(ip:sip,_^2,time<[,]>,http/request",http/status,digit,chars",http/agent",_")
```

Trailing comma rules (both are allowed):
- Group field lists allow trailing commas;
- Subfield lists allow trailing commas.

```wpl
# Correct: groups allow trailing commas
rule ok_group { (ip, digit,) }

# Correct: subfields allow trailing commas
rule ok_subfields { (kv(ip@src, digit@port,)) }
```

## Group Meta Semantics (alt/opt/some_of/seq)

- seq (default): Matches each field in declared order; any field failure causes the entire group to fail. Consecutive fields (e.g., `3*ip`) will try multiple times at that position until the count is exhausted or failure occurs.
- alt (alternative): Tries each field in the group in order, stops as soon as one succeeds; if all fail, the group fails. Commonly used for "same position, different types" fallback matching, e.g., `alt(ip,digit)`.
- some_of (as many as possible): Repeatedly tries to match "any field" at the current position, consuming at most one field per iteration; stops without error when all fields fail in one iteration. Commonly used for scanning "scattered repetitions" of key-values, fragments, etc.
- opt (optional): Only attempts to match the first field in the group once; failure does not report an error, continues with subsequent groups. It is recommended to write only one field inside `opt(...)`, extra fields will be ignored.

Examples

```wpl
# seq: match all in order
rule g_seq { (ip, time_3339) }

# alt: alternative matching
rule g_alt { alt(ip, digit) }

# some_of: match as many as possible (consume at most one per round)
rule g_some_of { some_of(ip, digit) }

# opt: optional (recommend only one field)
rule g_opt { opt(ip) }
```

Notes
- Group-level `[..]` (length) and separator are injected into fields within the group (as default values) and combined with field-specific format parsing.
- The specific behavior of `some_of` and `alt` when nested in compound types like `kv/json` depends on the protocol parser implementation; common usage is to match "one of the candidate values" or "as many candidate values as possible" within key-value pairs.

## Field

General form (optional in order):

```text
[N*] DataType [ (symbol content) ] [ (subfield list) ] [:name] [ [len] ] [ format ] [ separator ] { | pipe }
```

- Repeat count: `*ip` or `3*ip` for consecutive matching items (`_` for ignored placeholder)
- Data type: Corresponds to `wp-data-model::DataType`, e.g.: `digit`/`time_3339`/`ip`/`kv`/`json`/`http/request` etc.
- Symbol content: Only for `symbol`/`peek_symbol`, e.g., `symbol(boy)`
- Subfields: For compound types like `kv/json/array/obj`, e.g., `(digit@message_type, time@access_time)`
- Naming: `:name` specifies the target field name after extraction
- Length: `[N]` limits maximum length
- Format:
  - Range delimiter: `<beg,end>`, e.g., `<[,]>`
  - Quote: `"` (equivalent to `"` at both start and end)
  - Count field: `^N` (only valid for `chars/_`)
- Separator: Use backslash to escape each character, e.g., `\\,`, `\\!\\|`
- Field-level pipe: `| exists(src)` or `| (time,ip)` (can nest a group as a pipe)

Example:
```wpl
(
  ip:sip,               # Named field
  _^2,                  # Two ignored positions (by count)
  time<[,]>,            # Range delimiter format
  http/request",
  digit[10]\\,          # With length and separator
  json(chars@key | exists(src))  # Subfield + function pipe
)
```

### SubFields

- Format: `( <sub_field> [, <sub_field>]* )`
- Subfield syntax is the same as regular fields, with additional support for `opt(DataType)` to mark as optional
- Subfield key: Default key is `*` (wildcard); explicitly use `@ref/path` to specify key

Example:
```wpl
kv(
  time@access_time,
  ip@sip,
  opt(digit)@dns_type
)
```

## Preprocessing Pipeline (Expression Level)

Written at the beginning of an expression: `|decode/base64|unquote/unescape|`. Unlike field-level `| ...` pipes, preprocessing applies to the entire rule's input text.

### Purpose and Execution Timing
- Scope: Before parsing fields, performs one or more sequential transformations on the entire raw input line; the transformed text then enters group/field parsing.
- Execution order: Left to right; each step's output becomes the next step's input.
- Failure handling: Any step failure reports an error; unknown step names will report `UnSupport(<name>)` at assembly time.

### Syntax and Available Steps
- Syntax: `'|' ws? preproc_step { ws? '|' ws? preproc_step } ws? '|'` (must end with `|`, supports whitespace).
- `preproc_step` supports two types:
  1. **Built-in steps**: Consistent with legacy syntax, tokens must satisfy `take_key` rules (letters, digits, `_`, `/`, `-`, `.`, etc.).
  2. **Custom extensions**: Written as `plg_pipe/<name>`, the parser will look up the implementation by name in the preprocessing registry.
- Built-in steps (the only supported namespace notation, implemented in `eval/builtins`):
  - `decode/base64`: Base64 decode the entire line; failure reports error.
  - `unquote/unescape`: Remove outer quotes and restore backslash escapes in text (commonly used to restore `\"` to `"` in logs).
  - `decode/hex`: Decode hexadecimal text (e.g., `48656c6c6f` -> `Hello`).
- Custom `plg_pipe/<name>`: Register via code call `register_wpl_pipe!("NAME", builder)`, where `builder` returns a handler implementing `PipeProcessor`.

### Examples
```wpl
# 1) Base64 first, then decompress/restore quotes (example step name zip is for demonstration only, not built-in)
rule r1 {
  |decode/base64|unquote/unescape|
  (json(chars@payload))
}

# 2) Hex decode only
rule r2 {
  |decode/hex|
  (chars:raw)
}
```

### Common Issues and Tips
- Preprocessing step names must end with `|`, otherwise a syntax error will occur (implementation enforces validation).
- Only `plg_pipe/<name>` can mount external extensions, registration interface is at `wpl::register_wpl_pipe!` (called directly at compile time).
- Preprocessing only affects the "entire line input", not individual field substrings; for field-level transformations, use field-level `| fun(...)` pipes.

## Field-Level Functions (Pipes)

Built-in functions (consistent with parser implementation):

- `exists(name)`
- `exists_chars(name, path)` / `chars_not_exists(name, path)` / `exists_chars_in(name, [path,...])`
- `exists_digit(name, N)` / `exists_digit_in(name, [N,...])`
- `exists_ip_in(name, [1.1.1.1, 2.2.2.2])`
- `str_mode("raw mode string")`

Example:
```wpl
(json(chars@name, chars@code) | chars_not_exists(name, a/b/c))
```

## Annotation

Annotations can be added before package or rule, merged into rule at compile time:

```wpl
#[tag(t1:"id",t2:"sn"), copy_raw(name:"raw")]
package test {
  #[tag(t3:"sub")]
  rule x { (digit,time) }
}
```

Annotation values support general quoted strings (can include spaces, Chinese characters, and escapes):

```wpl
#[tag(desc:"Chinese Tag", note:"say \"hi\"")]
package demo { rule x { (digit) } }
```

Raw strings can also be used to reduce escape burden (backslash escapes are not processed):

```wpl
#[tag(path:r#"C:\\Program Files\\App"#, note:r#"a\b\c \"quote\""#)]
package demo { rule x { (digit) } }
```

## Plugin

Use "inline code block" form, no escaping required:

```wpl
rule test_plugin {
  plg_pipe(id: dayu) {
    (json(_@_origin,_@payload/packet_data))
  }
}
```



## Common Data Types (Excerpt)

- Basic: `bool` `chars` `digit` `float` `_` `sn`
- Time: `time` `time_iso` `time_3339` `time_2822` `time_timestamp`
- Network: `ip` `ip_net` `domain` `email` `port`
- Text/Protocol: `hex` `base64` `kv` `json` `exact_json` `http/request` `http/status` `http/agent` `http/method` `url`
- Structural: `obj` `array[/subtype]` `symbol` `peek_symbol`

For more productions, refer to "WPL Grammar (EBNF)": `./02-wpl_grammar.md`.


## Array Type

- Syntax: `array[/subtype]` (e.g.: `array/digit`, `array/chars`, `array/array/digit`); defaults to `auto` when subtype is not specified.
- Purpose: Parse bracket array text (e.g., `[1,2,3]`), expand elements into independent fields, path naming as `<name>/[index]`.
- Element rules:
  - Separator: Comma `,`; trailing comma allowed (`[1,2,3,]` is valid).
  - Terminator: Right bracket `]`; empty arrays `[]` supported.
  - String elements use quotes, internal commas will not be mistakenly split (quotes are parsed first).
- Examples:
  ```wpl
  rule arr { (array/digit:nums) }
  # "[1,2,3,]" -> nums/[0]=1, nums/[1]=2, nums/[2]=3

  rule arr2 { (array/chars:items) }
  # "[\"hello\", \"_F]fe\", \"!@#$*&^\\\"123\"]" -> items/[0]="hello", items/[1]="_F]fe", items/[2]="!@#$*&^\"123"
  ```

## Separator Priority and Merging (sep)

- Sources and notation:
  - Field-level: Specified at the end of field with backslash escapes, e.g., `digit\,`, `chars\!\|` (priority 3, override).
  - Group-level: Specified after group's closing parenthesis, e.g., `(ip, digit)\,` (priority 2, default).
  - Upstream inheritance: From outer context (such as kv/json/array/pipe etc.) or default space (priority 1, inherited).
- Merging rules (combo):
  - Field-level(3) overrides Group-level(2) overrides Upstream(1); otherwise inherits upstream.
  - Special values: `\s` represents space; `\0` or `0` means read to end of line.
  - Print rules: sep markers are printed as backslash-escaped form by default; some "inferred sep" will not be repeated in formatted output (implementation-level "inference").

Examples:

```wpl
# 1) Group separator applies within group:
rule g1 { (chars:a, chars:b)\| }
# Input: "foo|bar"  => a = foo, b = bar

# 2) Field separator takes priority over group separator:
rule g2 { (chars:a, chars:b\|)\, }
# Input: "x,y|z" => a = x (uses group separator ,), b = y (uses field separator |)

# 3) Read to end of line (\0):
rule g3 { (kv, chars\0) }
# Second field captures to end of line; common for last field to absorb remainder
```
