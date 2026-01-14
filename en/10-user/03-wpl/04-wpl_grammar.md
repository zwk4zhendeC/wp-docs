# WPL Grammar

This page provides the formal grammar of WPL. The authoritative implementation is the `crates/wp-lang` parser; this document is kept in sync with the source code and includes notes where necessary.

```ebnf
; WPL Grammar (EBNF)
; Organized based on the crates/wp-lang parsing implementation (winnow)
; Note: This file provides grammar productions and necessary lexical conventions. Unless explicitly noted, optional whitespace `ws` is allowed between tokens.

wpl_document     = { package_decl } ;

package_decl     = [ annotation ] "package" ws? ident ws? "{" ws? rule_decl+ ws? "}" ;

rule_decl        = [ annotation ] "rule" ws? rule_name ws? "{" ws? statement ws? "}" ;

statement        = plg_pipe_block | express ;

plg_pipe_block   = ["@"]? "plg_pipe" ws? "(" ws? "id" ws? ":" ws? key ws? ")" ws? "{" ws? express ws? "}" ;

express          = [ preproc ] group { ws? "," ws? group } ;

preproc          = "|" ws? preproc_step { ws? "|" ws? preproc_step } ws? "|" ;   ; At least one step, must end with '|'
preproc_step     = builtin_preproc | plg_pipe_step ;
builtin_preproc  = ns "/" name ;
plg_pipe_step    = "plg_pipe" ws? "/" ws? key ;                   ; Look up custom extension via registry
ns               = "decode" | "unquote" ;                        ; Namespace whitelist
name             = ("base64" | "hex") | "unescape" ;             ; Step name whitelist

group            = [ group_meta ] ws? "(" ws? field_list_opt ws? ")" [ ws? group_len ] [ ws? group_sep ] ;
group_meta       = "alt" | "opt" | "some_of" | "seq" ;
group_len        = "[" number "]" ;
group_sep        = sep ;

; List: allows empty, allows trailing comma
field_list_opt   = [ field { ws? "," ws? field } [ ws? "," ] ] ;

field            = [ repeat ] data_type [ symbol_content ]
                   [ subfields ]
                   [ ":" ws? var_name ]
                   [ length ]
                   [ format ]
                   [ sep ]
                   { pipe } ;                              ; Allow multiple pipes

repeat           = [ number ] "*" ;                        ; "*ip" or "3*ip"
length           = "[" number "]" ;                       ; Only supported for top-level fields (not subfields)

; Subfield list for compound fields (like kv/json etc.)
subfields        = "(" ws? subfields_opt ws? ")" ;
subfields_opt    = [ subfield { ws? "," ws? subfield } [ ws? "," ] ] ;
subfield         = [ opt_datatype | data_type ]
                   [ symbol_content ]
                   [ "@" ref_path ]
                   [ ":" ws? var_name ]
                   [ format ]
                   [ sep ]
                   { pipe } ;

opt_datatype     = "opt" "(" ws? data_type ws? ")" ;     ; Declare this subfield as optional

; Field data types (corresponding to wp-data-model::DataType)
data_type        = builtin_type | ns_type | array_type ;

builtin_type     = "auto" | "bool" | "chars" | "symbol" | "peek_symbol"
                   | "digit" | "float" | "_" | "sn"
                   | "time" | "time/clf" | "time_iso" | "time_3339" | "time_2822" | "time_timestamp"
                   | "ip" | "ip_net" | "domain" | "email" | "port"
                   | "hex" | "base64"
                   | "kv" | "json" | "exact_json"
                   | "url"
                   | "proto_text" | "obj"
                   | "id_card" | "mobile_phone" ;

ns_type          = path_ident ;                               ; e.g., http/request, http/status etc.
; Note: Implementation should validate whitelist prefixes (like "http/") to avoid arbitrary path expansion.

array_type       = "array" [ "/" key ] ;                 ; e.g.: "array" or "array/ip"

; Only allowed when data_type is symbol/peek_symbol
symbol_content   = "(" symbol_chars ")" ;

; Field display/extraction format
format           = scope_fmt | quote_fmt | field_cnt ;
scope_fmt        = "<" any_chars "," any_chars ">" ;   ; Scope start/end delimiters, e.g., <[,]>
quote_fmt        = '"' ;                                ; Equivalent to '"' at both start and end
field_cnt        = "^" number ;                          ; Only valid for chars/_ (implementation constraint)

; Separator (high/medium priority, concatenated as-is). Syntax is backslash-escaped character sequence, length >= 1
sep              = sep_char , { sep_char } ;             ; e.g.: "\\," => ","; "\\!\\|" => "!|"
sep_char         = '\\' , any_char ;

; Field-level pipe: function call or nested group
pipe             = "|" ws? ( fun_call | group ) ;

; Preset functions (wpl_fun.rs):
; - Selector functions: take, last
; - f_ prefix indicates field set operations (requires field name)
; - No prefix indicates active field operations
; - Transform functions: json_unescape, base64_decode
fun_call         = selector_fun | target_fun | active_fun | transform_fun ;

; Selector functions
selector_fun     = take_fun | last_fun ;
take_fun         = "take" "(" ws? key ws? ")" ;
last_fun         = "last" "(" ws? ")" ;

; Field set operation functions (f_ prefix)
target_fun       = f_has | f_chars_has | f_chars_not_has | f_chars_in
                 | f_digit_has | f_digit_in | f_ip_in ;
f_has            = "f_has" "(" ws? key ws? ")" ;
f_chars_has      = "f_chars_has" "(" ws? key ws? "," ws? path ws? ")" ;
f_chars_not_has  = "f_chars_not_has" "(" ws? key ws? "," ws? path ws? ")" ;
f_chars_in       = "f_chars_in" "(" ws? key ws? "," ws? path_array ws? ")" ;
f_digit_has      = "f_digit_has" "(" ws? key ws? "," ws? number ws? ")" ;
f_digit_in       = "f_digit_in" "(" ws? key ws? "," ws? number_array ws? ")" ;
f_ip_in          = "f_ip_in" "(" ws? key ws? "," ws? ip_array ws? ")" ;

; Active field operation functions (no prefix)
active_fun       = has_fun | chars_has | chars_not_has | chars_in
                 | digit_has | digit_in | ip_in ;
has_fun          = "has" "(" ws? ")" ;
chars_has        = "chars_has" "(" ws? path ws? ")" ;
chars_not_has    = "chars_not_has" "(" ws? path ws? ")" ;
chars_in         = "chars_in" "(" ws? path_array ws? ")" ;
digit_has        = "digit_has" "(" ws? number ws? ")" ;
digit_in         = "digit_in" "(" ws? number_array ws? ")" ;
ip_in            = "ip_in" "(" ws? ip_array ws? ")" ;

; Transform functions
transform_fun    = json_unescape | base64_decode ;
json_unescape    = "json_unescape" "(" ws? ")" ;
base64_decode    = "base64_decode" "(" ws? ")" ;

path_array       = "[" ws? path { ws? "," ws? path } ws? "]" ;
number_array     = "[" ws? number { ws? "," ws? number } ws? "]" ;
ip_array         = "[" ws? ip_addr { ws? "," ws? ip_addr } ws? "]" ;

annotation       = "#[" ws? ann_item { ws? "," ws? ann_item } ws? "]" ;
ann_item         = tag_anno | copy_raw_anno ;
tag_anno         = "tag" "(" ws? tag_kv { ws? "," ws? tag_kv } ws? ")" ;
tag_kv           = ident ":" ( quoted_string | raw_string ) ;      ; Key is identifier; value is string
copy_raw_anno    = "copy_raw" "(" ws? "name" ws? ":" ws? ( quoted_string | raw_string ) ws? ")" ;

; Lexical and auxiliary tokens --------------------------------------------------------
field_name       = var_name ;
rule_name        = exact_path ;
key              = key_char { key_char } ;              ; [A-Za-z0-9_./-]+
var_name         = var_char { var_char } ;              ; [A-Za-z0-9_.-]+
ref_path         = ref_char { ref_char } ;              ; [A-Za-z0-9_./\-.[\]*]+
; Identifiers and path identifiers (recommended format)
ident            = ( letter | '_' ) { letter | digit | '_' | '.' | '-' } ;
path_ident       = ident { "/" ident } ;

exact_path       = exact_path_char { exact_path_char } ; ; Does not contain '[' ']' '*'
exact_path_char  = letter | digit | '_' | '.' | '/' | '-' ;
path             = key | ref_path ;

number           = digit { digit } ;
digit            = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' ;

key_char         = letter | digit | '_' | '.' | '/' | '-' ;
var_char         = letter | digit | '_' | '.' | '-' ;
ref_char         = key_char | '[' | ']' | '*' ;

letter           = 'A'..'Z' | 'a'..'z' ;

quoted_string    = '"' { escaped | char_no_quote_backslash } '"' ;
raw_string       = 'r' '#' '"' { any_char } '"' '#' ;          ; r#"..."#, no escape processing inside (content can include '"')
char_no_quote    = ? any char except '"' ? ;
escaped          = '\\' ( '"' | '\\' | 'n' | 't' | 'r' | 'x' hex hex ) ;
char_no_quote_backslash = ? any char except '"' and '\\' ? ;
hex              = '0'..'9' | 'a'..'f' | 'A'..'F' ;

free_string      = { fchar } ;                          ; Until ',' or ')' (not including)
fchar            = ? any char except ',' and ')' ? ;

symbol_chars     = { schar } ;                          ; Allows any char except ')' and '\\', or use '\)' to escape
schar            = char_no_close_paren_backslash | '\\' ')' ;
char_no_close_paren_backslash = ? any char except ')' and '\\' ? ;
any_chars        = { any_char } ;
any_char         = ? any character ? ;

ip_addr          = quoted_string | ipv4 | ipv6 ;        ; Supports IPv4/IPv6 bare literals or quoted
ipv4             = digit1 "." digit1 "." digit1 "." digit1 ;
digit1           = digit { digit } ;
ipv6             = ? valid IPv6 literal (RFC 4291), including compressed forms like "::1" ? ;

ws               = { ' ' | '\t' | '\n' | '\r' } ;

;Reserved keywords (cannot be used as identifiers; conflict checking by implementation)
ReservedKeyword  = "package" | "rule" | "alt" | "opt" | "some_of" | "seq" | "order"
                 | "tag" | "copy_raw" | "include" | "macro" ;


```
## Semantic and Implementation Notes (Non-Grammar):
 - Preproc pipeline (e.g., |decode/base64|unquote/unescape|) appears at the beginning of express, separate from field-level pipe.
 - group can be followed by [n] and separator sep: length applies to all fields within the group; sep is only stored on the group, specific combination strategy is implementation-dependent.
 - format's field_cnt (^n) only applies to chars/_ types; other types will be rejected (implementation constraint).
 - symbol/peek_symbol can carry symbol_content, e.g., symbol(boy); peek_symbol is equivalent to symbol, only changes the "peek" semantics.
 - When subfields don't explicitly have "@ref", the key defaults to "*" (wildcard key).
 - sep syntax requires backslash-escaping each character; e.g., \\!\| represents the string "!|".
 - annotation can be used on package and rule; when both exist, they are merged at the rule level (rule takes priority).
