# sugo-caller@3.0.1

Caller component of SUGOS.

+ Functions
  + [sugoCaller(config)](#sugo-caller-function-sugo-caller)
+ SugoCaller Class
  + [new SugoCaller()](#sugo-caller-classes-sugo-caller-constructor)
  + [caller.connect(key)](#sugo-caller-classes-sugo-caller-connect)
  + [caller.disconnect(key)](#sugo-caller-classes-sugo-caller-disconnect)
+ ActorAccessBundle Class
  + [new ActorAccessBundle()](#sugo-caller-classes-actor-access-bundle-constructor)
  + [bundle.get(moduleName, options)](#sugo-caller-classes-actor-access-bundle-get)
  + [bundle.has(moduleName)](#sugo-caller-classes-actor-access-bundle-has)
  + [bundle.set(moduleName, module, options)](#sugo-caller-classes-actor-access-bundle-set)
  + [bundle.del(moduleName)](#sugo-caller-classes-actor-access-bundle-del)
  + [bundle.names()](#sugo-caller-classes-actor-access-bundle-names)
+ ActorAccessModule Class
  + [new ActorAccessModule()](#sugo-caller-classes-actor-access-module-constructor)

## Functions

<a name="sugo-caller-function-sugo-caller" />
### sugoCaller(config) -> `SugoCaller`

Create a caller instance. Just an alias of `new SugoCaller(config)`

| Param | Type | Description |
| ----- | --- | -------- |
| config | Object | Sugo caller configuration |

```javascript
co(function * () {
  let caller = sugoCaller({})
  let actor01 = yield caller.connect('my-actor-01')
  let foo = actor01.get('foo') // Get a module of actor
  yield foo.sayYeah() // Call the remote function
}).catch((err) => console.error(err))
```


## SugoCaller Class




<a name="sugo-caller-classes-sugo-caller-constructor" />
### new SugoCaller()

Constructor of SugoCaller class



<a name="sugo-caller-classes-sugo-caller-connect" />
### caller.connect(key) -> `Promise.<ActorAccessBundle>`

Connect to actor

| Param | Type | Description |
| ----- | --- | -------- |
| key | string | Key of actor |


<a name="sugo-caller-classes-sugo-caller-disconnect" />
### caller.disconnect(key) -> `Promise`

Disconnect from cloud server

| Param | Type | Description |
| ----- | --- | -------- |
| key | string | Key of actor to connect |


## ActorAccessBundle Class




<a name="sugo-caller-classes-actor-access-bundle-constructor" />
### new ActorAccessBundle()

Constructor of ActorAccessBundle class



<a name="sugo-caller-classes-actor-access-bundle-get" />
### bundle.get(moduleName, options) -> `ActorAccessModule`

Get a module

| Param | Type | Description |
| ----- | --- | -------- |
| moduleName | string | Name of module |
| options | Object | Optional settings |


<a name="sugo-caller-classes-actor-access-bundle-has" />
### bundle.has(moduleName) -> `Boolean`

Check if module exists

| Param | Type | Description |
| ----- | --- | -------- |
| moduleName | string | Name of module |


<a name="sugo-caller-classes-actor-access-bundle-set" />
### bundle.set(moduleName, module, options)

Set module

| Param | Type | Description |
| ----- | --- | -------- |
| moduleName | string | Name of module |
| module | ActorAccessModule | Module to set |
| options | Object | Optional settings |


<a name="sugo-caller-classes-actor-access-bundle-del" />
### bundle.del(moduleName)

Delete module

| Param | Type | Description |
| ----- | --- | -------- |
| moduleName | string | Name of module |


<a name="sugo-caller-classes-actor-access-bundle-names" />
### bundle.names() -> `Array.<string>`

Get names of modules

## ActorAccessModule Class




<a name="sugo-caller-classes-actor-access-module-constructor" />
### new ActorAccessModule()

Constructor of ActorAccessModule class





