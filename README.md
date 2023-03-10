SSE POST endpoint with msw@0.0.0-fetch.rc-6 and Node 19 hangs jest.

How to reproduce:
- clone this repo
- make sure you are using a Node 19 (e.g. `19.7.0`)
- `yarn`
- `yarn test`

You will notice that the process never finishes. If you switch to Node 18 it does finish, as expected.
