# WPL Pipe Functions

This page describes the built-in functions that can be used in field-level pipes in WPL. These functions are used for selection, conditional checking, filtering, and transformation of parsed fields.

## Function Categories

WPL pipe functions are divided into four categories:

| Type | Prefix | Description |
|------|--------|-------------|
| **Selector Functions** | No prefix | Select a specific field as the active field |
| **Field Set Operations** | `f_` | Find and operate on specified fields in the field set |
| **Active Field Operations** | No prefix | Directly check the current active field |
| **Transform Functions** | No prefix | Transform field data |

> **Active Field Note**: Operations in the pipe act on the "active field" by default. You can use selector functions to switch the active field, or use `_` in `f_` prefix functions to represent the current active field.

---

## Function Overview

### Selector Functions

| Function Name | Parameters | Description |
|---------------|------------|-------------|
| `take` | 1 | Select specified field as active field |
| `last` | 0 | Select last field as active field |

### Field Set Operation Functions (`f_` prefix)

| Function Name | Parameters | Description |
|---------------|------------|-------------|
| `f_has` | 1 | Check if specified field exists |
| `f_chars_has` | 2 | Check if specified field value equals specified string |
| `f_chars_not_has` | 2 | Check if specified field value does not equal specified string |
| `f_chars_in` | 2 | Check if specified field value is in string list |
| `f_digit_has` | 2 | Check if specified field value equals specified number |
| `f_digit_in` | 2 | Check if specified field value is in number list |
| `f_ip_in` | 2 | Check if specified IP field is in IP list |

### Active Field Operation Functions (No Prefix)

| Function Name | Parameters | Description |
|---------------|------------|-------------|
| `has` | 0 | Check if active field exists |
| `chars_has` | 1 | Check if active field value equals specified string |
| `chars_not_has` | 1 | Check if active field value does not equal specified string |
| `chars_in` | 1 | Check if active field value is in string list |
| `digit_has` | 1 | Check if active field value equals specified number |
| `digit_in` | 1 | Check if active field value is in number list |
| `ip_in` | 1 | Check if active IP field is in IP list |

### Transform Functions

| Function Name | Parameters | Description |
|---------------|------------|-------------|
| `json_unescape` | 0 | JSON unescape for chars type fields |
| `base64_decode` | 0 | Base64 decode for chars type fields |

---

## Selector Functions Details

### `take`

Select the specified field as the active field. Subsequent operations without prefix will act on this field.

**Syntax:**
```
take(<field_name>)
```

**Parameters:**
- `field_name`: The field name to select

**Example:**
```wpl
rule select_field {
  (
    json(chars@name, digit@age)
    |take(name)
    |chars_has(admin)
  )
}
```

---

### `last`

Select the last field in the field set as the active field.

**Syntax:**
```
last()
```

**Example:**
```wpl
rule use_last {
  (
    json(chars@a, chars@b, chars@c)
    |last()
    |chars_has(value)
  )
}
```

---

## Field Existence Check Functions Details

### `has`

Check if the current active field exists.

**Syntax:**
```
has()
```

**Example:**
```wpl
rule check_active {
  (
    json(chars@name)
    |take(name)
    |has()
  )
}
```

---

### `f_has`

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

## String Operation Functions Details

### `chars_has`

Check if the current active field value equals the specified string.

**Syntax:**
```
chars_has(<value>)
```

**Parameters:**
- `value`: The string value to match

**Example:**
```wpl
rule check_value {
  (
    json(chars@status)
    |take(status)
    |chars_has(success)
  )
}
```

---

### `f_chars_has`

Check if the specified field value in the field set equals the specified string.

**Syntax:**
```
f_chars_has(<field_name>, <value>)
```

**Parameters:**
- `field_name`: The name of the field to check (use `_` for current active field)
- `value`: The string value to match

**Example:**
```wpl
rule check_message {
  (
    json |f_chars_has(message, error)
  )
}

# Using _ to represent active field
rule check_active_field {
  (
    json(chars@name)
    |take(name)
    |f_chars_has(_, admin)
  )
}
```

---

### `chars_not_has`

Check if the current active field value does not equal the specified string.

**Syntax:**
```
chars_not_has(<value>)
```

**Parameters:**
- `value`: The string value that should not match

**Example:**
```wpl
rule exclude_value {
  (
    json(chars@status)
    |take(status)
    |chars_not_has(failed)
  )
}
```

---

### `f_chars_not_has`

Check if the specified field value in the field set does not equal the specified string.

**Syntax:**
```
f_chars_not_has(<field_name>, <value>)
```

**Parameters:**
- `field_name`: The name of the field to check
- `value`: The string value that should not exist

**Example:**
```wpl
rule filter_success {
  (
    json |f_chars_not_has(status, failed)
  )
}
```

---

### `chars_in`

Check if the current active field value is in the given string list.

**Syntax:**
```
chars_in([<value1>, <value2>, ...])
```

**Parameters:**
- `[...]`: List of allowed string values

**Example:**
```wpl
rule check_method {
  (
    json(chars@method)
    |take(method)
    |chars_in([GET, POST, PUT])
  )
}
```

---

### `f_chars_in`

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

## Numeric Operation Functions Details

### `digit_has`

Check if the current active field value equals the specified number.

**Syntax:**
```
digit_has(<number>)
```

**Parameters:**
- `number`: The number to match

**Example:**
```wpl
rule check_code {
  (
    json(digit@code)
    |take(code)
    |digit_has(200)
  )
}
```

---

### `f_digit_has`

Check if the specified field value in the field set equals the specified number.

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

### `digit_in`

Check if the current active field value is in the given number list.

**Syntax:**
```
digit_in([<num1>, <num2>, ...])
```

**Parameters:**
- `[...]`: List of allowed numeric values

**Example:**
```wpl
rule check_success {
  (
    json(digit@status)
    |take(status)
    |digit_in([200, 201, 204])
  )
}
```

---

### `f_digit_in`

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

## IP Address Operation Functions Details

### `ip_in`

Check if the current active field IP address is in the given IP list. Supports IPv4 and IPv6.

**Syntax:**
```
ip_in([<ip1>, <ip2>, ...])
```

**Parameters:**
- `[...]`: List of allowed IP addresses

**Example:**
```wpl
rule check_client {
  (
    json(ip@client_ip)
    |take(client_ip)
    |ip_in([127.0.0.1, 192.168.1.1])
  )
}

# IPv6 support
rule check_ipv6 {
  (
    json(ip@src)
    |take(src)
    |ip_in([::1, 2001:db8::1])
  )
}
```

---

### `f_ip_in`

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

## Transform Functions Details

### `json_unescape`

Perform JSON unescape processing on the current active field. Converts JSON escape sequences to actual characters.

**Syntax:**
```
json_unescape()
```

**Conversion Effect:**
| Input | Output |
|-------|--------|
| `hello\\nworld` | `hello` + newline + `world` |
| `path\\\\to` | `path\to` |
| `say\\\"hi\\\"` | `say"hi"` |

**Example:**
```wpl
rule parse_json_log {
  (
    json(chars@message)
    |take(message)
    |json_unescape()
  )
}
```

---

### `base64_decode`

Perform Base64 decoding on the current active field. Decodes Base64 encoded strings to original text.

**Syntax:**
```
base64_decode()
```

**Conversion Effect:**
| Input | Output |
|-------|--------|
| `aGVsbG8=` | `hello` |
| `Zm9vYmFy` | `foobar` |

**Example:**
```wpl
rule decode_payload {
  (
    json(chars@payload)
    |take(payload)
    |base64_decode()
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

Combining selectors with non-prefix functions:

```wpl
rule mixed_style {
  (
    json(chars@name, digit@age, chars@status)
    |take(name)
    |chars_has(admin)
    |take(age)
    |digit_in([18, 19, 20])
    |take(status)
    |chars_not_has(disabled)
  )
}
```

---

## Related Documentation

- Grammar definition: [WPL Grammar (EBNF)](./03-wpl_grammar.md)
- Implementation code: `crates/wp-lang/src/parser/wpl_fun.rs`
