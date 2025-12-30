# WPL Pipe Functions

This page describes the built-in functions that can be used in field-level pipes in WPL. These functions are used for conditional checking, filtering, and transformation of parsed fields.

## Function Categories

WPL pipe functions are divided into two categories:

| Type | Prefix | Description |
|------|--------|-------------|
| **Field Set Operations** | `f_` | Find and operate on specified fields in the field set |
| **Direct Functions** | No prefix | Process current data directly |

## Function Overview

### Field Set Operation Functions (`f_` prefix)

| Function Name | Parameters | Description |
|---------------|------------|-------------|
| `f_has` | 1 | Check if field exists |
| `f_chars_has` | 2 | Check if field contains specified string |
| `f_chars_not_has` | 2 | Check if field does not contain specified string |
| `f_chars_in` | 2 | Check if field value is in string list |
| `f_digit_has` | 2 | Check if field contains specified number |
| `f_digit_in` | 2 | Check if field value is in number list |
| `f_ip_in` | 2 | Check if IP address is in list |

### Direct Functions (No Prefix)

| Function Name | Parameters | Description |
|---------------|------------|-------------|
| `json_unescape` | 0 | Unescape chars type fields |
| `base64_decode` | 0 | Base64 decode chars type fields |

---

## Field Set Operation Functions Details

### 1. `f_has`

Check if the specified field exists in the field set.

**Syntax:**
```
f_has(<field_name>)
```

**Parameters:**
- `field_name`: The name of the field to check

**Example:**
```wpl
rule check_field {
  (
    json |f_has(age)
  )
}
```

---

### 2. `f_chars_has`

Check if the specified field in the field set contains the specified string.

**Syntax:**
```
f_chars_has(<field_name>, <pattern>)
```

**Parameters:**
- `field_name`: The name of the field to check
- `pattern`: The string pattern to match

**Example:**
```wpl
rule check_error {
  (
    json |f_chars_has(message, error)
  )
}
```

---

### 3. `f_chars_not_has`

Check if the specified field in the field set does not contain the specified string (negation of `f_chars_has`).

**Syntax:**
```
f_chars_not_has(<field_name>, <pattern>)
```

**Parameters:**
- `field_name`: The name of the field to check
- `pattern`: The string pattern that should not exist

**Example:**
```wpl
rule filter_success {
  (
    json |f_chars_not_has(status, failed)
  )
}
```

---

### 4. `f_chars_in`

Check if the specified field value in the field set is in the given string list.

**Syntax:**
```
f_chars_in(<field_name>, [<value1>, <value2>, ...])
```

**Parameters:**
- `field_name`: The name of the field to check
- `[...]`: List of allowed string values

**Example:**
```wpl
rule check_method {
  (
    json |f_chars_in(method, [GET, POST, PUT])
  )
}
```

---

### 5. `f_digit_has`

Check if the specified field in the field set contains the specified numeric value.

**Syntax:**
```
f_digit_has(<field_name>, <number>)
```

**Parameters:**
- `field_name`: The name of the field to check
- `number`: The number to match

**Example:**
```wpl
rule check_status {
  (
    json |f_digit_has(code, 200)
  )
}
```

---

### 6. `f_digit_in`

Check if the specified numeric field value in the field set is in the given number list.

**Syntax:**
```
f_digit_in(<field_name>, [<num1>, <num2>, ...])
```

**Parameters:**
- `field_name`: The name of the field to check
- `[...]`: List of allowed numeric values

**Example:**
```wpl
rule check_success_codes {
  (
    json |f_digit_in(status, [200, 201, 204])
  )
}
```

---

### 7. `f_ip_in`

Check if the specified IP address in the field set is in the given IP list. Supports IPv4 and IPv6.

**Syntax:**
```
f_ip_in(<field_name>, [<ip1>, <ip2>, ...])
```

**Parameters:**
- `field_name`: The name of the field to check
- `[...]`: List of allowed IP addresses

**Example:**
```wpl
rule check_trusted_ips {
  (
    json(ip@client_ip) |f_ip_in(client_ip, [127.0.0.1, 192.168.1.1])
  )
}

rule check_ipv6 {
  (
    json(ip@src) |f_ip_in(src, [::1, 2001:db8::1])
  )
}
```

---

## Direct Functions Details

### `json_unescape`

Perform unescape processing on all fields.

**Syntax:**
```
json_unescape()
```


**Conversion Effect (JSON):**
```
"hello\\nworld"  ->  "hello\nworld"
"path\\\\to"     ->  "path\to"
"say\\\"hi\\\""  ->  "say\"hi\""
```

**Example:**
```wpl
rule parse_json_log {
  (
    json(
      chars@message
    ) |json_unescape()
  )
}
```

---

## Combined Usage Examples

Multiple pipe functions can be chained:

```wpl
rule complex_filter {
  (
    json(
      chars@method,
      digit@status,
      ip@client_ip
    )
  )
  |f_has(method)
  |f_chars_in(method, [GET, POST])
  |f_digit_in(status, [200, 201, 204])
  |f_ip_in(client_ip, [10.0.0.1, 10.0.0.2])
}
```

## Related Documentation

- Grammar definition: [WPL Grammar (EBNF)](./03-wpl_grammar.md)
- Implementation code: `crates/wp-lang/src/parser/wpl_fun.rs`
