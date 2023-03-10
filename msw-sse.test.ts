import http from 'http';
import { setupServer } from 'msw/node';
import { delay, HttpResponse, rest } from 'msw';

describe(`POST to SSE endpoint hangs jest with node 19`, () => {

  const mswServer = setupServer(
    rest.post('http://example.com/sse', async () => {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          controller.enqueue(encoder.encode(`id: 11\r\nevent: a\r\ndata: a111`));
          await delay(2);
          controller.enqueue(encoder.encode(`id: 22\r\nevent: b\r\ndata: a222`));
          await delay(2);
          controller.close();
        }
      });
      return HttpResponse.plain(stream);
    })
  );

  beforeAll(() => {
    mswServer.listen();
  });
  afterEach(() => {
    mswServer.resetHandlers();
  });
  afterAll(() => mswServer.close());

  const payload = { 'some': 'payload' };
  const options: http.RequestOptions = {
    method: 'POST',
    hostname: 'example.com',
    path: `/sse`,
    headers: { Authorization: `Bearer MYKEY`, 'Content-Type': 'application/json' }
  };

  it('call POST SSE', async () => {
    const receivedData = await new Promise<any>((resolve) => {
      const received: Array<string> = [];
      const req = http.request(options, (res) => {
        console.log(`Response status code: ${res.statusCode}`);
        res.on('data', (chunk) => {
          received.push(chunk.toString());
          console.log(`Received data: ${chunk}`);
        });

        res.on('end', () => {
          console.log('Response ended');
          resolve(received);
        });
      });
      req.on('error', (error) => {
        console.error(`Request error: ${error}`);
      });
      req.write(JSON.stringify(payload));
      req.end();
    });

    expect(receivedData).toStrictEqual([
      'id: 11\r\nevent: a\r\ndata: a111',
      'id: 22\r\nevent: b\r\ndata: a222'
    ]);
  });

});
