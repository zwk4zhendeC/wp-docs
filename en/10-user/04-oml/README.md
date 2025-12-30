# OML Object Modeling Language

OML (Object Modeling Language) is used in Warp Parse to assemble and aggregate parsed records. It provides capabilities including read/take value extraction, object and array aggregation (object/collect), conditional matching (match), string formatting (fmt), pipe transformations (pipe), and SQL query construction.

Note: Starting from the current version, the engine does not enable "privacy/masking" runtime processing by default. The privacy section syntax mentioned in this chapter is only for DSL capability description. If you need data masking, please implement it in your business logic or custom plugins/pipelines.

## Table of Contents

- [OML Basics](./01-oml_basics.md)
- [OML Examples](./02-oml_examples.md)
- [OML Grammar (EBNF)](./03-oml_grammar_ebnf.md)
- [OML Functions Reference](./04-oml_functions.md)

## Feature Overview

- Value extraction with defaults: `read(...)` (non-destructive) / `take(...)` (destructive) + default body `{ _ : <value/function> }`
- Object/Array aggregation: `object { ... }`, `collect read(keys:[...])`
- Conditional matching: `match read(x) { ... }` and binary matching `match (read(a), read(b)) { ... }`
- Pipe and formatting: `read(x) | to_json | base64_encode`, `fmt("{}-{}", @a, read(b))`
- SQL: `select <cols from table> where <cond>;` (body whitelist validation, strict mode can be disabled via `OML_SQL_STRICT=0`)
- Batch targets: When target name contains `*`, batch mode evaluation is used (only supports take/read)
- Privacy section: Field privacy processor mapping declared through a second `---` at the end

## Quick Example

```oml
name : example
---
user_id        = read(user_id) ;
occur_time:time= Now::time() ;
values : obj   = object {
  cpu_free, memory_free : digit = take() ;
};
ports : array  = collect read(keys:[sport,dport]) ;
ports_json     = pipe read(ports) | to_json ;
full           = fmt("{}-{}", @user, read(city)) ;
name,pinying   = select name,pinying from example where pinying = read(py) ;
---
src_ip : privacy_ip
pos_sn : privacy_keymsg
```

## Related Documentation

- [WPL Rule Language](../06-wpl/README.md)
- [Configuration Guide Overview](../02-config/README.md)
- [Schema Reference](../../80-reference/schemas/README.md)

Tip: For the difference between read/take, see "OML Basics"; for complete grammar, see "OML Grammar (EBNF)"; for end-to-end examples, see "OML Examples".
