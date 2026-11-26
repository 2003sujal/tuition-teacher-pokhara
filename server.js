// Entry point for cPanel / Phusion Passenger ("Setup Node.js App").
// Passenger does not run `next start`; it requires a startup file that
// listens on the port it provides. Not used on Vercel.
const { createServer } = require("http");
const next = require("next");

const port = parseInt(process.env.PORT || "3000", 10);
const app = next({ dev: false });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => handle(req, res)).listen(port, () => {
    console.log(`> Ready on port ${port}`);
  });
});
