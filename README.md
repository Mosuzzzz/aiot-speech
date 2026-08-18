# AIoT Speech Backend

A small Express.js backend for controlling and checking an AIoT device’s recording state.

## Requirements

- Node.js 18 or newer
- npm

## Setup

```bash
npm install
```

## Run

```bash
node server.js
```

The server starts at [http://localhost:3000](http://localhost:3000).

## API

### Health check

```http
GET /
```

Returns a simple message confirming that the backend is running.

### Start recording

```http
POST /api/start
```

### Stop recording

```http
POST /api/stop
```

### Check recording status

```http
GET /api/status
```

Example response:

```json
{
  "recording": true
}
```

## Example requests

```bash
curl -X POST http://localhost:3000/api/start
curl -X POST http://localhost:3000/api/stop
curl http://localhost:3000/api/status
```

## Notes

The recording state is kept in memory and resets whenever the server restarts.
