# Odoo-tips-and-tricks

## Import a list of Banks to Odoo:
Odoo Dashboard > Contacts > Configuration > Banks > Actions ⚙️ > Import 

### Preparations
#### Data Sources
##### Deutsche Bundesbank (German Federal Bank)
Have a look at "Bankleitzahlendateien ungepackt"
https://www.bundesbank.de/de/aufgaben/unbarer-zahlungsverkehr/serviceangebot/bankleitzahlen/download-bankleitzahlen-602592
##### European Central Bank
https://www.ecb.europa.eu/stats/financial_corporations/list_of_financial_institutions/html/daily_list-MID.en.html
#### Table headers
Create a CSV-table with the following header:
```csv
name,bic,street,street2,city,state,zip,country,phone,email
```
Example:
```csv
name,bic,street,street2,city,state,zip,country,phone,email
Deutsche Bank AG,DEUTDEFFXXX,Taunusanlage 12,,Frankfurt am Main,Hessen,60325,Germany,+49 69 91000,info@db.com
Commerzbank AG,COBADEFFXXX,Kaiserplatz,,Frankfurt am Main,Hessen,60261,Germany,+49 69 13620,info@commerzbank.com
KfW Bankengruppe,KFWIDEFFXXX,Palmengartenstraße 5-9,,Frankfurt am Main,Hessen,60325,Germany,+49 69 74310,info@kfw.de
DZ Bank AG,GENODEFFXXX,Platz der Republik,,Frankfurt am Main,Hessen,60265,Germany,+49 69 74470,info@dzbank.de
UniCredit Bank AG (HypoVereinsbank),HYVEDEMMXXX,Arabellastrasse 12,,Munich,Bavaria,81925,Germany,+49 89 3780,info@unicredit.de
Landesbank Baden-Württemberg,SOLADESTXXX,Am Hauptbahnhof 2,,Stuttgart,Baden-Württemberg,70173,Germany,+49 711 1270,info@lbbw.de
Bayerische Landesbank,BYLADEMMXXX,Brienner Straße 18,,Munich,Bavaria,80333,Germany,+49 89 21710,info@bayernlb.de
Norddeutsche Landesbank,NOLADE2HXXX,Friedrichswall 10,,Hannover,Lower Saxony,30159,Germany,+49 511 3610,info@nordlb.de
ING-DiBa AG,INGDDEFFXXX,Theodor-Heuss-Allee 2,,Frankfurt am Main,Hessen,60486,Germany,+49 69 27222000,info@ing-diba.de
Targobank AG,CMCIDEDDXXX,Kasperstraße 1,,Düsseldorf,North Rhine-Westphalia,40215,Germany,+49 211 90020,info@targobank.de
```

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
