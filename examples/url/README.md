# url example

Start the local example servers:

```bash
go run ./examples/url/server
```

Then compare the two JSON endpoints:

```bash
xdiff url http://127.0.0.1:18081/user.json http://127.0.0.1:18082/user.json
```
