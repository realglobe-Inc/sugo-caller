## `sugoCaller(config) -> SugoCaller`

A factory method to create an sugo caller instance

| Param | Type | Description |
| ----- | --- | -------- |
| config | Object | Caller configuration |
| config.protocol | string | Protocol to use ( "http" or "https" ) |
| config.host | string | Hub host name. ( eg: "localhost:3000" ) |
| config.pathname | string | Hub URL path name ( eg: "/callers" ) |
| config.auth | Object | Auth data for hub |



## `new SugoCaller()`

| Param | Type | Description |
| ----- | --- | -------- |
| config | Object | Caller configuration |
| config.protocol | string | Protocol to use ( "http" or "https" ) |
| config.host | string | Hub host name. ( eg: "localhost:3000" ) |
| config.pathname | string | Hub URL path name ( eg: "/callers" ) |
| config.auth | Object | Auth data for hub |


## `SugoCaller#connect(key) -> Promise.<ActorAccessBundle>`

Connect to actor

| Param | Type | Description |
| ----- | --- | -------- |
| key | string | Key of actor |


## `SugoCaller#disconnect(key) -> Promise`

Disconnect from cloud server

| Param | Type | Description |
| ----- | --- | -------- |
| key | string | Key of actor to connect |


## `new ActorAccessBundle()`

| Param | Type | Description |
| ----- | --- | -------- |


## `ActorAccessBundle#get(moduleName, options) -> Module`

Get a module

| Param | Type | Description |
| ----- | --- | -------- |
| moduleName | string | Name of module |
| options | Object | Optional settings |


## `ActorAccessBundle#has(moduleName) -> Boolean`

Check if module exists

| Param | Type | Description |
| ----- | --- | -------- |
| moduleName | string | Name of module |


## `ActorAccessBundle#describe(moduleName) -> Object`

Describe a module

| Param | Type | Description |
| ----- | --- | -------- |
| moduleName | string | Name of module |


## `ActorAccessBundle#set(moduleName, module, options)`

Set a module

| Param | Type | Description |
| ----- | --- | -------- |
| moduleName | string | Name of module |
| module | Object | Module to set |
| options | Object | Optional settings |


## `ActorAccessBundle#del(moduleName)`

Delete module

| Param | Type | Description |
| ----- | --- | -------- |
| moduleName | string | Name of module |


## `ActorAccessBundle#names() -> Array.<string>`

Get names of modules



