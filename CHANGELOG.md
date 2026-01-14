# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### 2025-01-14

#### Documentation Updates

**OML Documentation Sync (Chinese -> English)**
- Synced `01-oml_basics.md` - OML language basics
- Synced `02-oml_examples.md` - OML usage examples
- Synced `03-oml_functions.md` - OML function reference
- Synced `04-oml_grammar.md` - OML grammar specification
- Synced `05-oml_in_sinks.md` - OML applications in Sink Groups
- Synced `README.md` - OML overview

**WPL Documentation Sync (Chinese -> English)**
- Synced `README.md` - WPL overview with pipe functions quick reference
- Synced `01-wpl_basics.md` - WPL language basics
- Updated `02-wpl_example.md` - Updated pipe function names to match new API:
  - `exists()` -> `f_has()`
  - `exists_digit()` -> `f_digit_has()`
  - `exists_digit_in()` -> `f_digit_in()`
  - `chars_exists()` -> `f_chars_has()`
  - `chars_not_exists()` -> `f_chars_not_has()`
  - `chars_in()` -> `f_chars_in()`
  - `str_mode(decoded)` -> `json_unescape()`
- Updated `04-wpl_grammar.md` - Updated EBNF grammar with new function definitions:
  - Added selector functions: `take`, `last`
  - Added active field operations: `has`, `chars_has`, `chars_not_has`, `chars_in`, `digit_has`, `digit_in`, `ip_in`
  - Added transform functions: `json_unescape`, `base64_decode`
  - Replaced deprecated `chars_unescape` with new function structure
  - Added `time/clf` to builtin_type

**Bug Fixes**
- Identified `04-oml_in_sinks.md` contains only title, actual content is in `05-oml_in_sinks.md`
