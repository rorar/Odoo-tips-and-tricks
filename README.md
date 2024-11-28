# Odoo-tips-and-tricks

## Import a list of Banks to Odoo:
Odoo Dashboard > Contacts > Configuration > Banks > Actions ⚙️ > Import 

### Preparations
#### Table headers
Cr

### Technical Details
#### Table Headers
##### Name-Field (data-name="name"):

```json
{
    "viewMode": "list",
    "resModel": "res.bank",
    "debug": true,
    "field": {
        "name": "name",
        "label": "Name",
        "type": "char",
        "widget": null,
        "context": "{}",
        "invisible": null,
        "column_invisible": null,
        "readonly": null,
        "required": "True",
        "changeDefault": false
    }
}
```
##### BIC-Field (data-name="bic"):

```json
{
    "viewMode": "list",
    "resModel": "res.bank",
    "debug": true,
    "field": {
        "name": "bic",
        "label": "BIC",
        "help": "Manchmal BIC oder SWIFT genannt",
        "type": "char",
        "widget": null,
        "context": "{}",
        "invisible": null,
        "column_invisible": null,
        "readonly": null,
        "required": null,
        "changeDefault": false
    }
}
```
##### Land-Field (data-name="country"):

```json
{
    "viewMode": "list",
    "resModel": "res.bank",
    "debug": true,
    "field": {
        "name": "country",
        "label": "Land",
        "type": "many2one",
        "widget": null,
        "context": "{}",
        "domain": [],
        "invisible": null,
        "column_invisible": null,
        "readonly": null,
        "required": null,
        "changeDefault": false,
        "relation": "res.country"
    }
}
```
#### Input Fields
##### Name-Field (data-name="name"):

```json
{
    "viewMode": "form",
    "resModel": "res.bank",
    "debug": true,
    "field": {
        "name": "name",
        "label": "Name",
        "type": "char",
        "widget": null,
        "context": "{}",
        "invisible": null,
        "column_invisible": null,
        "readonly": null,
        "required": "True",
        "changeDefault": false
    }
}
```
##### BIC-Field (data-name="bic"):

```json
{
    "viewMode": "form",
    "resModel": "res.bank",
    "debug": true,
    "field": {
        "name": "bic",
        "label": "BIC",
        "help": "Manchmal BIC oder SWIFT genannt",
        "type": "char",
        "widget": null,
        "context": "{}",
        "invisible": null,
        "column_invisible": null,
        "readonly": null,
        "required": null,
        "changeDefault": false
    }
}
```
##### Bankaddress-fields:

###### a. Street (data-name="street"):

```json
{
    "viewMode": "form",
    "resModel": "res.bank",
    "debug": true,
    "field": {
        "name": "street",
        "label": "Straße",
        "type": "char",
        "widget": null,
        "context": "{}",
        "invisible": null,
        "column_invisible": null,
        "readonly": null,
        "required": null,
        "changeDefault": false
    }
}
```
###### b. Street 2 (data-name="street2"):

```json
{
    "viewMode": "form",
    "resModel": "res.bank",
    "debug": true,
    "field": {
        "name": "street2",
        "label": "Straße 2",
        "type": "char",
        "widget": null,
        "context": "{}",
        "invisible": null,
        "column_invisible": null,
        "readonly": null,
        "required": null,
        "changeDefault": false
    }
}
```
###### c. City (data-name="city"):

```json
{
    "viewMode": "form",
    "resModel": "res.bank",
    "debug": true,
    "field": {
        "name": "city",
        "label": "Stadt",
        "type": "char",
        "widget": null,
        "context": "{}",
        "invisible": null,
        "column_invisible": null,
        "readonly": null,
        "required": null,
        "changeDefault": false
    }
}
```
###### d. State (data-name="state"):

```json
{
    "viewMode": "form",
    "resModel": "res.bank",
    "debug": true,
    "field": {
        "name": "state",
        "label": "Bundesland",
        "type": "many2one",
        "widget": null,
        "context": "{}",
        "domain": [],
        "invisible": null,
        "column_invisible": null,
        "readonly": null,
        "required": null,
        "changeDefault": false,
        "relation": "res.state"
    }
}
```
###### e. ZIP-Code (data-name="zip"):

```json
{
    "viewMode": "form",
    "resModel": "res.bank",
    "debug": true,
    "field": {
        "name": "zip",
        "label": "PLZ",
        "type": "char",
        "widget": null,
        "context": "{}",
        "invisible": null,
        "column_invisible": null,
        "readonly": null,
        "required": null,
        "changeDefault": false
    }
}
```
###### f. Country (data-name="country"):

```json
{
    "viewMode": "form",
    "resModel": "res.bank",
    "debug": true,
    "field": {
        "name": "country",
        "label": "Land",
        "type": "many2one",
        "widget": null,
        "context": "{}",
        "domain": [],
        "invisible": null,
        "column_invisible": null,
        "readonly": null,
        "required": null,
        "changeDefault": false,
        "relation": "res.country"
    }
}
```
###### Phone-Field (data-name="phone"):

```json
{
    "viewMode": "form",
    "resModel": "res.bank",
    "debug": true,
    "field": {
        "name": "phone",
        "label": "Telefon",
        "type": "char",
        "widget": null,
        "context": "{}",
        "invisible": null,
        "column_invisible": null,
        "readonly": null,
        "required": null,
        "changeDefault": false
    }
}
```
###### E-Mail-Field (data-name="email"):

```json
{
    "viewMode": "form",
    "resModel": "res.bank",
    "debug": true,
    "field": {
        "name": "email",
        "label": "E-Mail",
        "type": "char",
        "widget": "email",
        "widgetDescription": "E-Mail",
        "context": "{}",
        "invisible": null,
        "column_invisible": null,
        "readonly": null,
        "required": null,
        "changeDefault": false
    }
}
```
