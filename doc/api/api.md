## `sugoCaller(config) -> SugoCaller`

A factory method to create an sugo caller instance

| Param | Type | Description |
| ----- | --- | -------- |
| config | Object | Caller configuration |
| config.protocol | string | Protocol to use ( "http" or "https" ) |
| config.host | string | Hub host name. ( eg: "localhost:3000" ) |
| config.pathname | string | Hub URL path name ( eg: "/callers" ) |
| config.auth | Object | Auth data for hub |



## `caller.connect(key) -> Promise.<Object>`

Connect to actor

| Param | Type | Description |
| ----- | --- | -------- |
| key | string | Key of actor |


## `caller.disconnect(key) -> Promise`

Disconnect from cloud server

| Param | Type | Description |
| ----- | --- | -------- |
| key | string | Key of actor to connect |

