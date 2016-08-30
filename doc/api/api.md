# sugo-caller@3.0.0

Caller component of SUGOS.

+ [sugoCaller(config)](#sugo-caller-function-sugo-caller)
+ SugoCaller
  + [new SugoCaller()](#sugo-caller-classes-sugo-caller-constructor)
  + [caller.connect(key)](#sugo-caller-classes-sugo-caller-connect)
  + [caller.disconnect(key)](#sugo-caller-classes-sugo-caller-disconnect)
+ ActorAccessBundle
  + [new ActorAccessBundle()](#sugo-caller-classes-actor-access-bundle-constructor)
  + [bundle.get(moduleName, options)](#sugo-caller-classes-actor-access-bundle-get)
  + [bundle.has(moduleName)](#sugo-caller-classes-actor-access-bundle-has)
  + [bundle.describe(moduleName)](#sugo-caller-classes-actor-access-bundle-describe)
  + [bundle.set(moduleName, module, options)](#sugo-caller-classes-actor-access-bundle-set)
  + [bundle.del(moduleName)](#sugo-caller-classes-actor-access-bundle-del)
  + [bundle.names()](#sugo-caller-classes-actor-access-bundle-names)

<a name="sugo-caller-function-sugo-caller" />
## sugoCaller(config) -> `SugoCaller`

Create a caller instance. This is just an alias of `new SugoCaller(config)`

| Param | Type | Description |
| ----- | --- | -------- |
| config | Object | Sugo caller configuration |



## SugoCaller

Caller to access remote actor


<a name="sugo-caller-classes-sugo-caller-constructor" />
### new SugoCaller()

Constructor of SugoCaller class

| Param | Type | Description |
| ----- | --- | -------- |
| config | Object | Caller configuration |
| config.protocol | string | Protocol to use ( "http" or "https" ) |
| config.host | string | Hub host name. ( eg: "localhost:3000" ) |
| config.pathname | string | Hub URL path name ( eg: "/callers" ) |
| config.auth | Object | Auth data for hub |


<a name="sugo-caller-classes-sugo-caller-connect" />
### SugoCaller#connect(key) -> `Promise.<ActorAccessBundle>`

Connect to actor

| Param | Type | Description |
| ----- | --- | -------- |
| key | string | Key of actor |


<a name="sugo-caller-classes-sugo-caller-disconnect" />
### SugoCaller#disconnect(key) -> `Promise`

Disconnect from cloud server

| Param | Type | Description |
| ----- | --- | -------- |
| key | string | Key of actor to connect |


## ActorAccessBundle

Bundle for actor access.


<a name="sugo-caller-classes-actor-access-bundle-constructor" />
### new ActorAccessBundle()

Constructor of ActorAccessBundle class

| Param | Type | Description |
| ----- | --- | -------- |


<a name="sugo-caller-classes-actor-access-bundle-get" />
### ActorAccessBundle#get(moduleName, options) -> `Module`

Get a module

| Param | Type | Description |
| ----- | --- | -------- |
| moduleName | string | Name of module |
| options | Object | Optional settings |


<a name="sugo-caller-classes-actor-access-bundle-has" />
### ActorAccessBundle#has(moduleName) -> `Boolean`

Check if module exists

| Param | Type | Description |
| ----- | --- | -------- |
| moduleName | string | Name of module |


<a name="sugo-caller-classes-actor-access-bundle-describe" />
### ActorAccessBundle#describe(moduleName) -> `Object`

Describe a module

| Param | Type | Description |
| ----- | --- | -------- |
| moduleName | string | Name of module |


<a name="sugo-caller-classes-actor-access-bundle-set" />
### ActorAccessBundle#set(moduleName, module, options)

Set a module

| Param | Type | Description |
| ----- | --- | -------- |
| moduleName | string | Name of module |
| module | Object | Module to set |
| options | Object | Optional settings |


<a name="sugo-caller-classes-actor-access-bundle-del" />
### ActorAccessBundle#del(moduleName)

Delete module

| Param | Type | Description |
| ----- | --- | -------- |
| moduleName | string | Name of module |


<a name="sugo-caller-classes-actor-access-bundle-names" />
### ActorAccessBundle#names() -> `Array.<string>`

Get names of modules



